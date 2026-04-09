/**
 * @file phonePeRoutes.ts (mounted at /api/payments)
 * @description PhonePe Payment Gateway Routes — Standard Checkout V2
 *
 * ROUTE MAP:
 * ──────────────────────────────────────────────────────────────────────────────
 *  POST /api/payments/phonepe/initiate         → Initiate PhonePe checkout session
 *  GET  /api/payments/phonepe/status/:orderId  → Check payment status by merchantOrderId
 *  POST /api/payments/phonepe/callback         → Server-to-server webhook from PhonePe
 *  POST /api/payments/phonepe/refund           → Admin-initiated refund
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Integration note:
 *  - COD flow is NOT touched by this file; it remains unchanged in customerOrderController.
 *  - This module only activates when paymentMethod === 'Online' / 'PhonePe'
 *  - Auth middleware from the parent router (index.ts) is NOT used here to keep
 *    the callback route public. Auth is applied per-route where needed.
 */

import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import {
    initiatePayment,
    getPaymentStatus,
    phonePeCallback,
    processRefund,
} from '../controllers/paymentController';

const router = Router();

// ─── POST /api/payments/phonepe/initiate ─────────────────────────────────────
/**
 * Initiate a PhonePe payment session.
 * The frontend calls this after creating the order (with paymentStatus = Pending).
 * Returns a redirectUrl to send the user to PhonePe's hosted checkout page.
 *
 * Body: { orderId: string }
 * Response: { success: boolean, data: { redirectUrl: string, merchantOrderId: string } }
 */
router.post(
    '/phonepe/initiate',
    authenticate,
    requireUserType('Customer'),
    initiatePayment,
);

// ─── GET /api/payments/phonepe/status/:orderId ────────────────────────────────
/**
 * Poll PhonePe for current payment status.
 * :orderId here is the merchantOrderId returned at initiation.
 * Used by the frontend PaymentVerify page to confirm payment result.
 *
 * Params: { orderId: merchantOrderId }
 * Response: { success: boolean, status: 'success'|'failed'|'pending', data: any }
 */
router.get(
    '/phonepe/status/:orderId',
    authenticate,
    getPaymentStatus,
);

// ─── POST /api/payments/phonepe/callback ─────────────────────────────────────
/**
 * Public webhook endpoint for PhonePe server-to-server callbacks.
 * PhonePe calls this URL after a payment is completed/failed.
 * No authentication required — PhonePe's x-verify header is used for security.
 *
 * Headers: x-verify (HMAC from PhonePe)
 * Body: { response: base64EncodedPayload }
 * Response: 200 OK (always — to prevent PhonePe retry storms)
 */
// GET /api/payments/phonepe/callback — for browser verification / PhonePe dashboard check
// PhonePe always uses POST; this GET just confirms the endpoint exists
router.get('/phonepe/callback', (_req, res) => {
    return res.status(200).json({
        success: true,
        message: 'PhonePe callback endpoint is active. PhonePe uses POST to this URL.',
        endpoint: 'POST /api/v1/payments/phonepe/callback',
    });
});

// POST /api/payments/phonepe/callback — actual webhook from PhonePe servers
router.post('/phonepe/callback', phonePeCallback);

// ─── POST /api/payments/phonepe/refund ───────────────────────────────────────
/**
 * Admin-triggered refund for a specific payment.
 * Partial refunds are supported via the optional amount field.
 *
 * Body: { paymentId: string, amount?: number }
 * Response: { success: boolean, message: string }
 */
router.post(
    '/phonepe/refund',
    authenticate,
    requireUserType('Admin'),
    processRefund,
);

export default router;
