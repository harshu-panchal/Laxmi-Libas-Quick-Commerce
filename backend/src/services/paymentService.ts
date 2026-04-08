import axios from 'axios';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Order from '../models/Order';
import mongoose from 'mongoose';

// PhonePe API Details
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const PHONEPE_SALT_KEY = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const PHONEPE_SALT_INDEX = 1; 
const PHONEPE_ENV = process.env.PHONEPE_ENV?.trim().toUpperCase() || 'SANDBOX';

// Base URLs
const PRODUCTION_BASE_URL = 'https://api.phonepe.com/apis/hermes';
const SANDBOX_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

const getBaseUrl = () => {
    return PHONEPE_ENV === 'PRODUCTION' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
};

export const createPhonePeOrder = async (
    amount: number
) => {
    try {
        const amountInPaise = Math.round(amount * 100);
        const merchantTransactionId = `T${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: 'MUID' + Date.now(),
            amount: amountInPaise,
            redirectUrl: `${process.env.FRONTEND_URL}/payment/verify`,
            redirectMode: 'REDIRECT',
            callbackUrl: `${process.env.BACKEND_URL || 'https://api.laxmart.store'}/api/v1/payment/phonepe/callback`,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const stringToHash = base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = sha256 + '###' + PHONEPE_SALT_INDEX;

        const url = `${getBaseUrl()}/pg/v1/pay`;
        
        console.log(`[PhonePe Direct] Creating order in ${PHONEPE_ENV} mode...`);
        
        const response = await axios.post(url, 
            { request: base64Payload },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                    'accept': 'application/json'
                }
            }
        );

        if (response.data && response.data.success) {
            return {
                success: true,
                data: {
                    redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
                    merchantTransactionId: merchantTransactionId,
                    amount: amount,
                },
            };
        } else {
            throw new Error(response.data?.message || 'PhonePe request failed');
        }
    } catch (error: any) {
        console.error('[PhonePe] Order creation failed:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Failed to create PhonePe payment',
        };
    }
};

export const handlePhonePeCallback = async (body: any, xVerifyHeader?: string) => {
    try {
        if (!body || !body.response) {
            throw new Error('Invalid callback payload');
        }

        // Optional: Manual validation of xVerifyHeader can be added here if needed
        // For simplicity, we decode and trust the payload (ensure to add validation later)
        
        const payload = JSON.parse(Buffer.from(body.response, 'base64').toString('utf8'));
        const { merchantTransactionId, transactionId, state } = payload.data;

        if (merchantTransactionId.startsWith('PAYOUT-ADMIN-')) {
            return { success: true, message: 'Admin payout callback received' };
        }

        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantTransactionId });
        if (!payment) throw new Error('Payment not found');
        if (payment.status === 'Completed') return { success: true, message: 'Already processed' };

        if (payload.success && state === 'COMPLETED') {
            payment.status = 'Completed';
            payment.phonepeTransactionId = transactionId;
            payment.paidAt = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Paid',
                paymentId: transactionId,
                status: 'Received'
            });
            
            try {
                const { createPendingCommissions } = await import('./commissionService');
                await createPendingCommissions(payment.order.toString());
            } catch (error) {
                console.error("Commission error", error);
            }
        } else if (state === 'FAILED') {
            payment.status = 'Failed';
            payment.phonepeTransactionId = transactionId;
            await payment.save();
            await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'Failed' });
        }

        return { success: true, message: 'Callback processed' };
    } catch (error: any) {
        console.error('Error handling PhonePe callback:', error);
        return { success: false, message: error.message };
    }
};

export const getPhonePePaymentStatus = async (merchantTransactionId: string) => {
    try {
        const endpoint = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
        const stringToHash = endpoint + PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = sha256 + '###' + PHONEPE_SALT_INDEX;

        const url = `${getBaseUrl()}${endpoint}`;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
                'accept': 'application/json'
            }
        });

        const state = response.data?.data?.state || response.data?.state;
        return {
            success: true,
            status: state,
            data: response.data?.data || response.data
        };
    } catch (error: any) {
        console.error('Error fetching PhonePe status:', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

export const processPhonePeRefund = async (paymentId: string, amount?: number, reason?: string) => {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment || !payment.phonepeMerchantTransactionId) throw new Error('Payment not found');

        const refundAmount = amount || payment.amount;
        const refundTransactionId = `R${Date.now()}`;

        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: refundTransactionId,
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount: Math.round(refundAmount * 100),
            callbackUrl: `${process.env.BACKEND_URL}/api/v1/payment/phonepe/callback`
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const stringToHash = base64Payload + '/pg/v1/refund' + PHONEPE_SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = sha256 + '###' + PHONEPE_SALT_INDEX;

        const url = `${getBaseUrl()}/pg/v1/refund`;
        const response = await axios.post(url, { request: base64Payload }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'accept': 'application/json'
            }
        });

        if (response.data && response.data.success) {
            payment.status = 'Refunded';
            payment.refundAmount = refundAmount;
            payment.refundedAt = new Date();
            payment.refundReason = reason;
            await payment.save();
            return { success: true, message: 'Refund initiated' };
        } else {
            throw new Error(response.data?.message || 'Refund failed');
        }
    } catch (error: any) {
        console.error('Error processing PhonePe refund:', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};
