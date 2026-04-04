import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import { Request, Response } from 'express';
import { createRazorpayOrder, capturePayment, handleWebhook, logRazorpayConfigStatus } from '../services/paymentService';
import Order from '../models/Order';

const router = Router();

router.post('/create-order', authenticate, requireUserType('Customer'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        const requestedAmount = Number(req.body.amount);

        console.log('[PaymentRoute] create-order request received', {
            orderId,
            requestedAmount: Number.isFinite(requestedAmount) ? requestedAmount : undefined,
            userId: req.user?.userId,
            origin: req.headers.origin,
            host: req.headers.host,
            protocol: req.protocol,
            forwardedProto: req.headers['x-forwarded-proto'],
        });
        logRazorpayConfigStatus('create-order-route');

        if (typeof orderId === 'string' && orderId.startsWith('mock-ord-')) {
            const amount = req.body.amount || 100;
            const result = await createRazorpayOrder(orderId, amount);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    errorCode: (result.error as any)?.code || 'RAZORPAY_ERROR'
                });
            }
            return res.status(200).json(result);
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.customer.toString() !== req.user!.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to order',
            });
        }

        const result = await createRazorpayOrder(orderId, order.total);

        if (!result.success) {
            console.error('[PaymentRoute] create-order failed', {
                orderId,
                userId: req.user?.userId,
                message: result.message,
                errorCode: (result.error as any)?.code || 'RAZORPAY_ERROR',
            });
            return res.status(400).json({
                success: false,
                message: result.message,
                errorCode: (result.error as any)?.code || 'RAZORPAY_ERROR'
            });
        }

        console.log('[PaymentRoute] create-order success', {
            orderId,
            razorpayOrderId: result.data?.id || result.data?.razorpayOrderId,
            amount: result.data?.amount,
            currency: result.data?.currency,
        });

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[PaymentRoute] Error creating Razorpay order:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment order',
        });
    }
});

router.post('/verify', authenticate, requireUserType('Customer'), async (req: Request, res: Response) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment verification parameters',
            });
        }

        if (typeof orderId === 'string' && orderId.startsWith('mock-ord-')) {
            return res.status(200).json({
                success: true,
                message: 'Mock payment verified successfully',
                data: { paymentId: `mock-pay-${Date.now()}`, orderId }
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.customer.toString() !== req.user!.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to order',
            });
        }

        const result = await capturePayment(
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify payment',
        });
    }
});

router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing webhook signature',
            });
        }

        const result = await handleWebhook(req.body, signature);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to handle webhook',
        });
    }
});

export default router;
