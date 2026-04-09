/**
 * @file paymentService.ts  (Frontend)
 * @description Frontend API service for PhonePe payment operations.
 *
 * Integrates with the backend payment module at:
 *   POST /api/payments/phonepe/initiate   → start PhonePe checkout
 *   GET  /api/payments/phonepe/status/:id → check payment status
 *
 * Legacy route /api/v1/payment/... is also preserved for backward compat.
 */

import api from './config';

// ─── 1. Initiate PhonePe Payment ─────────────────────────────────────────────

/**
 * Initiates a PhonePe payment session for a given order.
 *
 * Called by Checkout.tsx after the order is successfully created in the DB
 * (with paymentStatus = Pending). On success, redirects the user to PhonePe
 * hosted checkout page.
 *
 * @param orderId   MongoDB Order _id (returned from createOrder)
 * @param amount    Optional: expected amount (informational, backend uses DB value)
 * @returns         { success, data: { redirectUrl, merchantOrderId } }
 */
export const createPhonePeOrder = async (orderId: string, amount?: number) => {
    try {
        // ── NEW: uses the clean /api/payments/phonepe/initiate endpoint ──────
        const response = await api.post('/payments/phonepe/initiate', {
            orderId,
            amount, // informational only; backend uses Order.total
        });
        return response.data;
    } catch (error: any) {
        console.error('[PaymentService] createPhonePeOrder error:', error?.response?.data || error?.message);
        throw error;
    }
};

// ─── 2. Check Payment Status ─────────────────────────────────────────────────

/**
 * Polls PhonePe for the current payment status of a merchantOrderId.
 *
 * Called by PaymentVerify.tsx after user returns from PhonePe.
 * Also used for manual status polling if needed.
 *
 * @param merchantOrderId   The MT... ID returned by createPhonePeOrder
 * @returns                 { success, status: 'success'|'failed'|'pending', data }
 */
export const checkPhonePePaymentStatus = async (merchantOrderId: string) => {
    try {
        // ── NEW: uses the clean /api/payments/phonepe/status/:id endpoint ───
        const response = await api.get(`/payments/phonepe/status/${merchantOrderId}`);
        return response.data;
    } catch (error: any) {
        console.error('[PaymentService] checkPhonePePaymentStatus error:', error?.response?.data || error?.message);
        throw error;
    }
};

// ─── 3. Get Payment History ───────────────────────────────────────────────────

/**
 * (Optional) Retrieve payment history for the current customer.
 * Useful for the Orders / Account pages.
 */
export const getPaymentHistory = async () => {
    try {
        const response = await api.get('/customer/payments');
        return response.data;
    } catch (error: any) {
        console.error('[PaymentService] getPaymentHistory error:', error?.response?.data || error?.message);
        throw error;
    }
};
