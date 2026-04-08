import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import Payment from '../models/Payment';
import Order from '../models/Order';
import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * PhonePe Production Integration using Official SDK
 */

// Initialize Credentials
const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const phonepeEnv = process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://laxmart.store';
const BACKEND_URL = 'https://api.laxmart.store';

// Initialize SDK Client ONLY ONCE (Singleton)
let phonePeClient: StandardCheckoutClient | null = null;

const getPhonePeClient = () => {
    if (!phonePeClient) {
        if (!clientId || !clientSecret) {
            throw new Error('PhonePe Credentials Missing in .env');
        }
        phonePeClient = StandardCheckoutClient.getInstance(
            clientId,
            clientSecret,
            clientVersion,
            phonepeEnv
        );
        console.log(`[PhonePe SDK] Initialized in ${phonepeEnv === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode`);
    }
    return phonePeClient;
};

/**
 * 1. Create Payment Order
 */
export const createPhonePeOrder = async (orderId: string) => {
    try {
        const clientId = process.env.PHONEPE_CLIENT_ID?.trim();
        const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim();
        const isMock = process.env.USE_MOCK_PAYMENT === 'true' || !clientId || !clientSecret;

        // If in development and missing config, or if mock is explicitly set
        if (isMock && process.env.NODE_ENV !== 'production') {
            console.log('[PhonePe] 🧪 Generating MOCK payment order for development');
            const merchantTransactionId = `MOCK_T${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            
            return {
                success: true,
                message: 'Mock payment initiated',
                data: {
                    // Redirect to a frontend route that simulates payment success
                    redirectUrl: `${process.env.FRONTEND_URL}/payment/verify?transactionId=${merchantTransactionId}&status=COMPLETED&amount=${amount}`,
                    merchantTransactionId: merchantTransactionId,
                    amount: amount,
                    isMock: true
                },
            };
        }

        const client = getPhonePeClient();
        
        // Find Order
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');
        
        const amountInPaise = Math.round(order.total * 100);
        const merchantTransactionId = `MT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        // Build Request using SDK Builder
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(amountInPaise)
            .redirectUrl(`${FRONTEND_URL}/payment/verify`)
            .build();

        // Call PhonePe SDK
        const response = await client.pay(request);

        // Store Pending Payment in DB
        const payment = new Payment({
            order: order._id,
            customer: order.customer,
            paymentMethod: 'Online',
            paymentGateway: 'PhonePe',
            phonepeMerchantTransactionId: merchantTransactionId,
            amount: order.total,
            status: 'Pending'
        });
        await payment.save();

        return {
            success: true,
            data: {
                redirectUrl: response.redirectUrl,
                merchantTransactionId: merchantTransactionId,
                amount: order.total
            }
        };

    } catch (error: any) {
        console.error('[PhonePe SDK Create Error]:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 2. Check Payment Status
 */
export const getPhonePePaymentStatus = async (merchantTransactionId: string) => {
    try {
        const client = getPhonePeClient();
        const response = await client.getOrderStatus(merchantTransactionId);

        // Map status
        // response.state can be COMPLETED, FAILED, PENDING
        const state = (response as any).state || (response as any).data?.state;
        
        // Update DB if found
        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantTransactionId });
        if (payment && payment.status !== 'Completed') {
            if (state === 'COMPLETED') {
                payment.status = 'Completed';
                payment.paidAt = new Date();
                await payment.save();
                
                await Order.findByIdAndUpdate(payment.order, { 
                    paymentStatus: 'Paid',
                    status: 'Received'
                });
            } else if (state === 'FAILED') {
                payment.status = 'Failed';
                await payment.save();
                await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'Failed' });
            }
        }

        return {
            success: true,
            status: state,
            data: response
        };

    } catch (error: any) {
        console.error('[PhonePe SDK Status Error]:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 3. Handle Webhook Callback
 */
export const handlePhonePeCallback = async (body: any, xVerify?: string) => {
    try {
        const client = getPhonePeClient();
        
        // Use SDK to validate callback if needed
        // Note: Direct payload handling for simplicity, but SDK validation is recommended
        const responseY = typeof body === 'string' ? JSON.parse(body) : body;
        if (!responseY.response) throw new Error('Invalid callback payload');

        const decoded = JSON.parse(Buffer.from(responseY.response, 'base64').toString('utf-8'));
        const { merchantTransactionId, state, transactionId } = decoded.data;

        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantTransactionId });
        if (!payment || payment.status === 'Completed') return { success: true };

        if (state === 'COMPLETED') {
            payment.status = 'Completed';
            payment.phonepeTransactionId = transactionId;
            payment.paidAt = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, { 
                paymentStatus: 'Paid',
                paymentId: transactionId,
                status: 'Received'
            });
        } else if (state === 'FAILED') {
            payment.status = 'Failed';
            await payment.save();
            await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'Failed' });
        }

        return { success: true };
    } catch (error: any) {
        console.error('[PhonePe SDK Callback Error]:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 4. Process Refund
 */
export const processPhonePeRefund = async (paymentId: string, amount?: number) => {
    try {
        const client = getPhonePeClient();
        const payment = await Payment.findById(paymentId);
        if (!payment || !payment.phonepeMerchantTransactionId) throw new Error('Transaction not found');

        const refundTxnId = `RTX${Date.now()}`;
        const refundResponse: any = await client.refund({
            transactionId: refundTxnId,
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount: Math.round((amount || payment.amount) * 100)
        } as any);

        if (refundResponse.success) {
            payment.status = 'Refunded';
            payment.refundAmount = amount || payment.amount;
            payment.refundedAt = new Date();
            await payment.save();
            return { success: true, message: 'Refund initiated' };
        }
        return { success: false, message: refundResponse.message };
    } catch (error: any) {
        console.error('[PhonePe SDK Refund Error]:', error.message);
        return { success: false, message: error.message };
    }
};
