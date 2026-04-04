import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Order from '../models/Order';
import mongoose from 'mongoose';

type RazorpayEnvStatus = {
    hasKeyId: boolean;
    hasKeySecret: boolean;
    keyIdPrefix: string;
    keySecretPrefix: string;
    keyIdMasked: string;
    keySecretMasked: string;
    mode: 'test' | 'live' | 'unknown';
    modeMismatch: boolean;
};

const maskEnvValue = (value?: string) => {
    if (!value) {
        return 'missing';
    }

    if (value.length <= 8) {
        return `${value.slice(0, 2)}***${value.slice(-2)}`;
    }

    return `${value.slice(0, 6)}***${value.slice(-4)}`;
};

const getRazorpayEnvStatus = (): RazorpayEnvStatus => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
    const keyIdPrefix = keyId.startsWith('rzp_test_') ? 'rzp_test_' : keyId.startsWith('rzp_live_') ? 'rzp_live_' : 'unknown';
    const keySecretPrefix = keySecret.startsWith('rzp_test_') ? 'rzp_test_' : keySecret.startsWith('rzp_live_') ? 'rzp_live_' : 'unknown';
    const mode =
        keyIdPrefix === 'rzp_test_' ? 'test' :
        keyIdPrefix === 'rzp_live_' ? 'live' :
        'unknown';

    return {
        hasKeyId: Boolean(keyId),
        hasKeySecret: Boolean(keySecret),
        keyIdPrefix,
        keySecretPrefix,
        keyIdMasked: maskEnvValue(keyId),
        keySecretMasked: maskEnvValue(keySecret),
        mode,
        modeMismatch:
            Boolean(keyId && keySecret) &&
            keyIdPrefix !== 'unknown' &&
            keySecretPrefix !== 'unknown' &&
            keyIdPrefix !== keySecretPrefix,
    };
};

export const logRazorpayConfigStatus = (context: string) => {
    const status = getRazorpayEnvStatus();

    console.log(`[Razorpay][${context}] configuration`, {
        hasKeyId: status.hasKeyId,
        hasKeySecret: status.hasKeySecret,
        keyId: status.keyIdMasked,
        keySecret: status.keySecretMasked,
        keyIdPrefix: status.keyIdPrefix,
        keySecretPrefix: status.keySecretPrefix,
        mode: status.mode,
        modeMismatch: status.modeMismatch,
        nodeEnv: process.env.NODE_ENV || 'development',
        cwd: process.cwd(),
    });

    return status;
};

const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const status = logRazorpayConfigStatus('get-instance');

    if (!keyId || !keySecret) {
        console.error('[Razorpay] Configuration error: missing credentials', {
            hasKeyId: status.hasKeyId,
            hasKeySecret: status.hasKeySecret,
        });
        throw new Error('Razorpay credentials not configured or empty');
    }

    if (status.modeMismatch) {
        throw new Error(
            `Razorpay key mismatch detected: key id is ${status.keyIdPrefix} but key secret is ${status.keySecretPrefix}`
        );
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

export const createRazorpayOrder = async (
    orderId: string,
    amount: number,
    currency: string = 'INR'
) => {
    try {
        const razorpay = getRazorpayInstance();
        const amountInPaise = Math.round(amount * 100);

        if (isNaN(amountInPaise) || amountInPaise < 100) {
            console.error('[Razorpay] Invalid amount for order creation', { amount, amountInPaise, orderId });
            return {
                success: false,
                message: `Invalid payment amount: Rs.${amount || 0}. Minimum amount required is Rs.1.`,
            };
        }

        const options = {
            amount: amountInPaise,
            currency,
            receipt: orderId,
            notes: {
                orderId,
            },
        };

        console.log('[Razorpay] Creating order', { orderId, amountInPaise, currency });
        const razorpayOrder = await razorpay.orders.create(options);

        console.log('[Razorpay] Order created successfully', {
            orderId,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        });

        return {
            success: true,
            data: {
                id: razorpayOrder.id,
                razorpayOrderId: razorpayOrder.id,
                razorpayKey: process.env.RAZORPAY_KEY_ID?.trim(),
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
            },
        };
    } catch (error: any) {
        console.error('[Razorpay] Order creation failed', {
            message: error.message,
            description: error.description,
            code: error.code,
            metadata: error.metadata,
            rawError: error,
            orderId,
            amountPaise: Math.round(amount * 100),
        });

        const errorMessage = error.description ||
            (error.error && error.error.description) ||
            error.message ||
            'Failed to create Razorpay order';

        return {
            success: false,
            message: errorMessage,
            error,
        };
    }
};

export const verifyPaymentSignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): boolean => {
    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

        if (!keySecret) {
            throw new Error('Razorpay key secret not configured');
        }

        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        return expectedSignature === razorpaySignature;
    } catch (error) {
        console.error('[Razorpay] Error verifying payment signature:', error);
        return false;
    }
};

export const capturePayment = async (
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const isValid = verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            throw new Error('Invalid payment signature');
        }

        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Order not found');
        }

        const payment = new Payment({
            order: orderId,
            customer: order.customer,
            paymentMethod: 'Online',
            paymentGateway: 'Razorpay',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            amount: order.total,
            currency: 'INR',
            status: 'Completed',
            paidAt: new Date(),
            gatewayResponse: {
                success: true,
                message: 'Payment captured successfully',
            },
        });

        await payment.save({ session });

        order.paymentStatus = 'Paid';
        order.paymentId = razorpayPaymentId;
        if (order.status === 'Pending') {
            order.status = 'Received';
        }
        await order.save({ session });

        await session.commitTransaction();

        try {
            const { createPendingCommissions } = await import('./commissionService');
            await createPendingCommissions(orderId);
        } catch (commError) {
            console.error('Failed to create pending commissions after payment:', commError);
        }

        return {
            success: true,
            message: 'Payment captured successfully',
            data: {
                paymentId: payment._id,
                orderId: order._id,
            },
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error capturing payment:', error);
        return {
            success: false,
            message: error.message || 'Failed to capture payment',
        };
    } finally {
        session.endSession();
    }
};

export const processRefund = async (
    paymentId: string,
    amount?: number,
    reason?: string
) => {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (!payment.razorpayPaymentId) {
            throw new Error('Razorpay payment ID not found');
        }

        const razorpay = getRazorpayInstance();
        const refundAmount = amount || payment.amount;

        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
                reason: reason || 'Order cancelled',
            },
        });

        payment.status = 'Refunded';
        payment.refundAmount = refundAmount;
        payment.refundedAt = new Date();
        payment.refundReason = reason;
        await payment.save();

        return {
            success: true,
            message: 'Refund processed successfully',
            data: {
                refundId: refund.id,
                amount: refundAmount,
            },
        };
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return {
            success: false,
            message: error.message || 'Failed to process refund',
        };
    }
};

export const handleWebhook = async (
    body: any,
    signature: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

        if (!webhookSecret) {
            throw new Error('Razorpay webhook secret not configured');
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new Error('Invalid webhook signature');
        }

        const event = body.event;
        const payload = body.payload.payment.entity;

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;

            case 'refund.created':
                await handleRefundCreated(body.payload.refund.entity);
                break;

            default:
                console.log('Unhandled webhook event:', event);
        }

        return {
            success: true,
            message: 'Webhook processed successfully',
        };
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return {
            success: false,
            message: error.message || 'Failed to process webhook',
        };
    }
};

const handlePaymentCaptured = async (payload: any) => {
    try {
        const razorpayPaymentId = payload.id;
        const razorpayOrderId = payload.order_id;
        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment) {
            payment.status = 'Completed';
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.paidAt = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Paid',
                paymentId: razorpayPaymentId,
            });
        }
    } catch (error) {
        console.error('Error handling payment captured:', error);
    }
};

const handlePaymentFailed = async (payload: any) => {
    try {
        const razorpayOrderId = payload.order_id;
        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment) {
            payment.status = 'Failed';
            payment.gatewayResponse = {
                success: false,
                message: payload.error_description || 'Payment failed',
                rawResponse: payload,
            };
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Failed',
            });
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
};

const handleRefundCreated = async (payload: any) => {
    try {
        const razorpayPaymentId = payload.payment_id;
        const payment = await Payment.findOne({ razorpayPaymentId });

        if (payment) {
            payment.status = 'Refunded';
            payment.refundAmount = payload.amount / 100;
            payment.refundedAt = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Refunded',
            });
        }
    } catch (error) {
        console.error('Error handling refund created:', error);
    }
};
