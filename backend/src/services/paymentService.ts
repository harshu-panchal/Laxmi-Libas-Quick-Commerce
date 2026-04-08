import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import Payment from '../models/Payment';
import Order from '../models/Order';
import crypto from 'crypto';

/**
 * 🎯 CLEAN REBUILD: PhonePe Production Service
 */

// Production Configuration
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID?.trim() || 'M23NFM3XGWEBP';
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const ENV_MODE = process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://laxmart.store';
const BACKEND_URL = 'https://api.laxmart.store';

// Initialize SDK Client (Singleton)
let phonePeClient: StandardCheckoutClient | null = null;

const getPhonePeClient = () => {
    if (!phonePeClient) {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('PhonePe credentials are missing in .env');
        }
        phonePeClient = StandardCheckoutClient.getInstance(
            CLIENT_ID,
            CLIENT_SECRET,
            CLIENT_VERSION,
            ENV_MODE
        );
        console.log(`[PhonePe SDK] Client initialized in ${ENV_MODE === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode`);
    }
    return phonePeClient;
};

/**
 * 1. Create Checkout Order
 */
export const createPhonePeOrder = async (orderId: string) => {
    try {
        const client = getPhonePeClient();
        
        // Fetch Order total from DB
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found in database');
        
        const amountInPaise = Math.round(order.total * 100);
        // Generate a clean MTID
        const merchantTransactionId = `MT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        // SDK Pay Request
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(amountInPaise)
            .redirectUrl(`${FRONTEND_URL}/payment/verify`)
            .build();

        console.log(`[PhonePe] Creating payment for Order: ${orderId} | Total: ${order.total} INR`);

        const response = await client.pay(request);

        // Persistent tracking in Payment model
        const payment = new Payment({
            order: order._id,
            customer: order.customer,
            paymentMethod: 'Online',
            paymentGateway: 'PhonePe',
            phonepeMerchantTransactionId: merchantTransactionId,
            amount: order.total,
            currency: 'INR',
            status: 'Pending'
        });
        await payment.save();

        return {
            success: true,
            data: {
                redirectUrl: response.redirectUrl,
                merchantTransactionId
            }
        };

    } catch (error: any) {
        console.error('[PhonePe Rebuild] Creation Error:', error.message);
        return { success: false, message: error.message || 'Payment initiation failed' };
    }
};

/**
 * 2. Get Transaction Status (Manual Poll)
 */
export const getPhonePePaymentStatus = async (merchantTransactionId: string) => {
    try {
        const client = getPhonePeClient();
        const response = await client.getOrderStatus(merchantTransactionId);

        // Fetch our record
        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantTransactionId });
        if (!payment) throw new Error('Payment reference not found');

        // Logic to update DB based on SDK response
        const state = (response as any).state || (response as any).data?.state;

        if (payment.status !== 'Completed') {
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
        console.error('[PhonePe Rebuild] Status Check Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 3. Handle Callback (Webhook)
 */
export const handlePhonePeCallback = async (body: any, xVerifyHeader?: string) => {
    try {
        const client = getPhonePeClient();
        
        // Decode the callback payload
        const responseData = typeof body === 'string' ? JSON.parse(body) : body;
        if (!responseData.response) throw new Error('Invalid callback payload format');

        const decoded = JSON.parse(Buffer.from(responseData.response, 'base64').toString('utf-8'));
        const { merchantTransactionId, state, transactionId } = decoded.data;

        console.log(`[PhonePe Webhook] Received update for ${merchantTransactionId} | State: ${state}`);

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
        console.error('[PhonePe Rebuild] Callback Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 4. Refund Process
 */
export const processPhonePeRefund = async (paymentId: string, amount?: number) => {
    try {
        const client = getPhonePeClient();
        const payment = await Payment.findById(paymentId);
        if (!payment || !payment.phonepeMerchantTransactionId) throw new Error('Payment not found');

        const refundTxnId = `RTX${Date.now()}${crypto.randomBytes(2).toString('hex')}`;
        const refundAmount = Math.round((amount || payment.amount) * 100);

        const refundResponse: any = await client.refund({
            transactionId: refundTxnId,
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount: refundAmount
        } as any);

        if (refundResponse.success) {
            payment.status = 'Refunded';
            payment.refundAmount = amount || payment.amount;
            payment.refundedAt = new Date();
            await payment.save();
            return { success: true, message: 'Refund successful' };
        }
        return { success: false, message: refundResponse.message || 'Refund failed' };
    } catch (error: any) {
        console.error('[PhonePe Rebuild] Refund Error:', error.message);
        return { success: false, message: error.message };
    }
};
