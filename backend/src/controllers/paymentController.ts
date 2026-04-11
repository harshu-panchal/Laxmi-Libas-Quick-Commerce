/**
 * @file paymentController.ts
 * @description Payment Controller — PhonePe Integration
 *
 * Exposes business-level handlers for all payment-related endpoints.
 * Delegates all PhonePe-specific logic to the phonepeService.
 *
 * Routes handled:
 *   POST /api/payments/phonepe/initiate        → initiatePayment
 *   GET  /api/payments/phonepe/status/:orderId → getPaymentStatus
 *   POST /api/payments/phonepe/callback        → phonePeCallback (webhook)
 *   POST /api/payments/phonepe/refund          → processRefund  (admin only)
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
import { Server as SocketIOServer } from 'socket.io';

// ─── 1. Initiate PhonePe Payment ─────────────────────────────────────────────

/**
 * @route   POST /api/payments/phonepe/initiate
 * @access  Private (Customer)
 * @desc    Creates a PhonePe checkout session for a placed order.
 *          Expects { orderId } in the request body.
 *          Returns { success, data: { redirectUrl, merchantOrderId } }
 */
export const initiatePayment = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;

        // ── Validate orderId ────────────────────────────────────────────────
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'orderId is required',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid orderId format',
            });
        }

        // Determine dynamic FRONTEND_URL based on request origin
        // This ensures localhost redirects back to localhost, and live to live
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        try {
            const originHeader = req.headers.origin || req.headers.referer;
            if (originHeader) {
                const url = new URL(originHeader);
                frontendUrl = url.origin;
            }
        } catch (err) {
            console.warn('[PaymentController] Failed to parse origin header, falling back to ENV');
        }
        
        // Remove trailing slash if any
        frontendUrl = frontendUrl.replace(/\/$/, '');
        
        console.log(`[PaymentController] 🚀 Initiating payment for Order ${orderId}. Base Origin: ${frontendUrl}`);

        // ── Delegate to service ─────────────────────────────────────────────
        const result = await initiatePhonePePayment(orderId, frontendUrl);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[PaymentController] initiatePayment error:', error?.message || error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Internal server error during payment initiation',
        });
    }
};

// ─── 2. Get Payment Status ────────────────────────────────────────────────────

/**
 * @route   GET /api/payments/phonepe/status/:orderId
 * @access  Private
 * @desc    Checks the current PhonePe payment status for a given merchantOrderId.
 *          The :orderId param is actually the merchantOrderId returned at initiation.
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'merchantOrderId is required in path',
            });
        }

        console.log(`[PaymentController] Status check for MerchantOrderId: ${orderId}`);

        const result = await checkPhonePeStatus(orderId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        if (result.success && result.justPaid && result.order) {
            try {
                const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
                if (io) {
                    console.log(`[PaymentController] 🚀 Payment SUCCESS for Order ${result.order.orderNumber}. Triggering seller notification...`);
                    await notifySellersOfOrderUpdate(io, result.order, 'NEW_ORDER');
                    console.log(`[PaymentController] ✅ Seller notification sent for Order ${result.order.orderNumber}`);
                } else {
                    console.error('[PaymentController] ❌ Socket.io (io) not found on req.app');
                }
            } catch (err) {
                console.error('[PaymentController] ❌ Error notifying sellers on status check:', err);
            }
        }

        return res.status(200).json({
            success: true,
            status:  result.status, // 'success' | 'failed' | 'pending'
            data:    result.raw,
        });

    } catch (error: any) {
        console.error('[PaymentController] getPaymentStatus error:', error?.message || error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Internal server error during status check',
        });
    }
};

// ─── 3. PhonePe Webhook Callback ─────────────────────────────────────────────

/**
 * @route   POST /api/payments/phonepe/callback
 * @access  Public (PhonePe servers)
 * @desc    Receives server-to-server payment notifications from PhonePe.
 *          Must return HTTP 200 OK quickly to acknowledge receipt.
 */
export const phonePeCallback = async (req: Request, res: Response) => {
    try {
        console.log('[PaymentController] Webhook callback received');

        // ── Process asynchronously; respond 200 immediately ────────────────
        // (PhonePe retries if it doesn't get a quick 200)
        const result = await handlePhonePeWebhook(req.body);

        if (!result.success) {
            // Log but still 200 — prevents PhonePe from endless retries on bugs
            console.error('[PaymentController] Webhook processing error:', result.message);
        } else if (result.justPaid && result.order) {
            try {
                const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
                if (io) {
                    console.log(`[PaymentController] 🚀 Webhook Payment SUCCESS for Order ${result.order.orderNumber}. Triggering seller notification...`);
                    await notifySellersOfOrderUpdate(io, result.order, 'NEW_ORDER');
                    console.log(`[PaymentController] ✅ Seller notification sent via Webhook for Order ${result.order.orderNumber}`);
                } else {
                    console.error('[PaymentController] ❌ Socket.io (io) not found on req.app');
                }
            } catch (err) {
                console.error('[PaymentController] ❌ Error notifying sellers on webhook:', err);
            }
        }

        return res.status(200).send('OK');

    } catch (error: any) {
        console.error('[PaymentController] phonePeCallback error:', error?.message || error);
        // Return 200 even on error to prevent PhonePe retry storm
        return res.status(200).send('OK');
    }
};

// ─── 4. Initiate Refund (Admin) ───────────────────────────────────────────────

/**
 * @route   POST /api/payments/phonepe/refund
 * @access  Private (Admin only)
 * @desc    Initiates a refund for a completed PhonePe payment.
 *          Expects { paymentId, amount? } in the request body.
 */
export const processRefund = async (req: Request, res: Response) => {
    try {
        const { paymentId, amount } = req.body;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'paymentId is required',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid paymentId format',
            });
        }

        if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'amount must be a positive number',
            });
        }

        console.log(`[PaymentController] Refund request | PaymentId: ${paymentId} | Amount: ${amount || 'full'}`);

        const result = await initiatePhonePeRefund(paymentId, amount);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[PaymentController] processRefund error:', error?.message || error);
        return res.status(500).json({
            success: false,
            message: error?.message || 'Internal server error during refund',
        });
    }
};
