/**
 * @file paymentController.ts
 * @description Payment Controller — PhonePe Integration
 *
 * Routes handled:
 *   POST /api/payments/phonepe/initiate        → initiatePayment
 *   GET  /api/payments/phonepe/status/:orderId → getPaymentStatus
 *   POST /api/payments/phonepe/callback        → phonePeCallback (webhook)
 *   POST /api/payments/phonepe/refund          → processRefund (admin only)
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
    initiatePhonePePayment,
    checkPhonePeStatus,
    handlePhonePeWebhook,
    initiatePhonePeRefund,
} from '../services/phonepeService';
import { notifySellersOfOrderUpdate } from '../services/sellerNotificationService';
import { sendNotification } from '../services/notificationService';
import { Server as SocketIOServer } from 'socket.io';

// ─── 1. Initiate PhonePe Payment ─────────────────────────────────────────────

/**
 * @route   POST /api/payments/phonepe/initiate
 * @access  Private (Customer)
 * @body    { orderId, paymentType?: 'quick'|'ecommerce'|'hotel'|'bus' }
 * @desc    Creates a PhonePe checkout session for placed order/booking.
 */
export const initiatePayment = async (req: Request, res: Response) => {
    try {
        console.log('[PaymentController] BODY:', req.body);
        const { orderId, paymentType = 'product' } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'orderId is required' });
        }

        // For product orders validate ObjectId format; hotel/bus may use same format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid orderId format' });
        }

        // Determine dynamic FRONTEND_URL based on request origin
        let frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        try {
            const originHeader = req.headers.origin || req.headers.referer;
            if (originHeader) {
                const url = new URL(originHeader);
                const originBase = `${url.protocol}//${url.host}`;
                const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', frontendUrl];
                if (allowedOrigins.some(o => originBase.toLowerCase().startsWith(o.toLowerCase()))) {
                    frontendUrl = originBase;
                }
            }
        } catch { /* fall back to ENV */ }

        console.log(`[PaymentController] Initiating | Type: ${paymentType} | ID: ${orderId}`);

        const result = await initiatePhonePePayment(orderId, frontendUrl, paymentType);

        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[PaymentController] initiatePayment error:', error?.message || error);
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
};

// ─── 2. Get Payment Status ────────────────────────────────────────────────────

/**
 * @route   GET /api/payments/phonepe/status/:orderId
 * @access  Private
 * @desc    Checks PhonePe payment status for a merchantOrderId.
 *          Triggers seller notification & customer notification on first paid confirmation.
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'merchantOrderId is required in path' });
        }

        console.log(`[PaymentController] Status check: ${orderId}`);

        const result = await checkPhonePeStatus(orderId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Trigger downstream actions on first successful payment confirmation
        if (result.justPaid) {
            try {
                const io: SocketIOServer = req.app.get('io') as SocketIOServer;

                // Product orders
                if (result.order) {
                    if (io) await notifySellersOfOrderUpdate(io, result.order, 'NEW_ORDER');
                    const custId = result.order.customer?.toString();
                    if (custId) {
                        await sendNotification(
                            'Customer', custId,
                            '✅ Payment Confirmed!',
                            `Your order ${result.order.orderNumber} has been placed successfully.`,
                            { type: 'Order', link: `/orders/${result.order._id}` }
                        );
                    }
                }

                // Hotel bookings
                if (result.booking && (result.booking as any).hotelId) {
                    console.log(`[PaymentController] Hotel booking ${(result.booking as any)._id} payment confirmed`);
                }

                // Bus bookings
                if (result.booking && (result.booking as any).busId) {
                    console.log(`[PaymentController] Bus booking ${(result.booking as any)._id} payment confirmed`);
                }
            } catch (notifErr) {
                console.error('[PaymentController] Notification error (non-fatal):', notifErr);
            }
        }

        return res.status(200).json({
            success: true,
            status: result.status,   // 'success' | 'failed' | 'pending'
            data: result.raw,
        });

    } catch (error: any) {
        console.error('[PaymentController] getPaymentStatus error:', error?.message || error);
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
};

// ─── 3. PhonePe Webhook Callback ─────────────────────────────────────────────

/**
 * @route   POST /api/payments/phonepe/callback
 * @access  Public (PhonePe servers)
 * @desc    Server-to-server payment notification. Always returns 200 OK.
 */
export const phonePeCallback = async (req: Request, res: Response) => {
    try {
        console.log('[PaymentController] Webhook callback received');

        const result = await handlePhonePeWebhook(req.body);

        if (!result.success) {
            console.error('[PaymentController] Webhook processing error:', result.message);
        } else if (result.justPaid) {
            try {
                const io: SocketIOServer = req.app.get('io') as SocketIOServer;

                if (result.order && io) {
                    await notifySellersOfOrderUpdate(io, result.order, 'NEW_ORDER');
                    io.to(`order-${result.order._id}`).emit('payment-confirmed', {
                        orderId: result.order._id,
                        status: 'Paid',
                    });
                }

                if (result.booking) {
                    console.log(`[PaymentController] Webhook: booking ${(result.booking as any)._id} confirmed`);
                }
            } catch (notifErr) {
                console.error('[PaymentController] Webhook notification error:', notifErr);
            }
        }

        // Always 200 to prevent PhonePe retry storm
        return res.status(200).send('OK');

    } catch (error: any) {
        console.error('[PaymentController] phonePeCallback error:', error?.message || error);
        return res.status(200).send('OK');
    }
};

// ─── 4. Initiate Refund (Admin) ───────────────────────────────────────────────

/**
 * @route   POST /api/payments/phonepe/refund
 * @access  Private (Admin only)
 */
export const processRefund = async (req: Request, res: Response) => {
    try {
        const { paymentId, amount } = req.body;

        if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId is required' });
        if (!mongoose.Types.ObjectId.isValid(paymentId)) return res.status(400).json({ success: false, message: 'Invalid paymentId format' });
        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            return res.status(400).json({ success: false, message: 'amount must be a positive number' });
        }

        console.log(`[PaymentController] Refund | PaymentId: ${paymentId} | Amount: ${amount || 'full'}`);

        const result = await initiatePhonePeRefund(paymentId, amount);

        if (!result.success) return res.status(400).json(result);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[PaymentController] processRefund error:', error?.message || error);
        return res.status(500).json({ success: false, message: error?.message || 'Internal server error' });
    }
};
