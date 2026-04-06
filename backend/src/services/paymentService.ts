import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import Payment from '../models/Payment';
import Order from '../models/Order';
import crypto from 'crypto';

let phonePeClient: StandardCheckoutClient | null = null;

const getPhonePeClient = () => {
    if (!phonePeClient) {
        const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || '';
        const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
        const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
        // PhonePe SDK usually uses SANDBOX for non-production
        const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : (Env as any).SANDBOX || (Env as any).UAT;

        if (!clientId || !clientSecret) {
            console.error('[PhonePe] Missing configuration');
            throw new Error('PhonePe configuration missing');
        }

        phonePeClient = StandardCheckoutClient.getInstance(
            clientId,
            clientSecret,
            clientVersion,
            env
        );
    }
    return phonePeClient;
};

export const createPhonePeOrder = async (
    orderId: string,
    amount: number,
    userId: string
) => {
    try {
        const client = getPhonePeClient();
        const amountInPaise = Math.round(amount * 100);

        if (isNaN(amountInPaise) || amountInPaise < 100) {
            return {
                success: false,
                message: `Invalid payment amount: Rs.${amount || 0}. Minimum amount required is Rs.1.`,
            };
        }

        const merchantTransactionId = `T${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const merchantUserId = `U${userId}`;

        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId) // The unique transaction ID
            .amount(amountInPaise)
            .redirectUrl(`${process.env.FRONTEND_URL}/payment/verify`)
            .build();

        const response = await client.pay(request);

        return {
            success: true,
            data: {
                redirectUrl: response.redirectUrl,
                merchantTransactionId: merchantTransactionId,
                amount: amount,
            },
        };
    } catch (error: any) {
        console.error('[PhonePe] Order creation failed', error);
        return {
            success: false,
            message: error.message || 'Failed to create PhonePe payment',
        };
    }
};

export const handlePhonePeCallback = async (body: any, xVerify?: string) => {
    try {
        if (!body || !body.response) {
            throw new Error('Invalid callback payload');
        }

        const client = getPhonePeClient();
        
        // Checklist 4: Use validateCallback if authorization header is present
        // The SDK's validateCallback expects (username, password, authorizationHeader, body)
        // Since we are in development, use placeholder username/password if not provided in .env
        if (xVerify) {
            try {
                const username = process.env.PHONEPE_WEBHOOK_USERNAME || 'test';
                const password = process.env.PHONEPE_WEBHOOK_PASSWORD || 'test';
                
                // The SDK will throw if invalid
                client.validateCallback(username, password, xVerify, JSON.stringify(body));
            } catch (err) {
                console.error('[PhonePe] Validation Error:', err);
                throw new Error('Callback authenticity could not be verified');
            }
        }

        const payload = JSON.parse(Buffer.from(body.response, 'base64').toString('utf8'));
        const { merchantTransactionId, transactionId, state } = payload.data;

        // Skip orders from Delivery Wallet Payouts since they are handled synchronously on redirect
        if (merchantTransactionId.startsWith('PAYOUT-ADMIN-')) {
            return { success: true, message: 'Admin payout callback received and safely ignored' };
        }

        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantTransactionId });
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.status === 'Completed') {
            return { success: true, message: 'Payment already processed' };
        }

        if (payload.success && state === 'COMPLETED') {
            payment.status = 'Completed';
            payment.phonepeTransactionId = transactionId;
            payment.paidAt = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Paid',
                paymentId: transactionId,
                status: 'Received' // Depending on business logic, moving order to Received
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
            payment.gatewayResponse = {
                success: false,
                message: payload.message || 'Payment failed',
                rawResponse: payload,
            };
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Failed',
            });
        }

        return { success: true, message: 'Callback processed completely' };
    } catch (error: any) {
        console.error('Error handling PhonePe callback:', error);
        return {
            success: false,
            message: error.message || 'Failed to process callback',
        };
    }
};

export const getPhonePePaymentStatus = async (merchantTransactionId: string) => {
    try {
        const client = getPhonePeClient();
        const response = await client.getOrderStatus(merchantTransactionId);

        const state = (response as any).state || (response as any).data?.state;
        return {
            success: true,
            status: state,
            data: (response as any).data || response
        };
    } catch (error: any) {
        console.error('Error fetching PhonePe status:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch status',
        };
    }
};

export const processPhonePeRefund = async (
    paymentId: string,
    amount?: number,
    reason?: string
) => {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment || !payment.phonepeTransactionId || !payment.phonepeMerchantTransactionId) {
            throw new Error('Valid PhonePe payment not found');
        }

        const client = getPhonePeClient();
        const refundAmount = amount || payment.amount;

        const refundResponse: any = await client.refund({
            transactionId: `R${Date.now()}`, // Changed from merchantTransactionId
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount: Math.round(refundAmount * 100),
            providerReferenceId: payment.phonepeTransactionId
        } as any);

        if (refundResponse.success) {
            payment.status = 'Refunded';
            payment.refundAmount = refundAmount;
            payment.refundedAt = new Date();
            payment.refundReason = reason;
            await payment.save();

            return {
                success: true,
                message: 'Refund initiated successfully',
            };
        } else {
            return {
                success: false,
                message: (refundResponse as any).message || 'Refund failed'
            };
        }
    } catch (error: any) {
        console.error('Error processing PhonePe refund:', error);
        return {
            success: false,
            message: error.message || 'Failed to process refund',
        };
    }
};
