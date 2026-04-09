/**
 * @file paymentService.ts  (Frontend)
 * @description Frontend API service for PhonePe payment operations.
 *
 * Uses the LEGACY routes that are already live on the production server:
 *   POST /api/v1/payment/create              → start PhonePe checkout
 *   GET  /api/v1/payment/status/:merchantId  → check payment status
 *
 * NOTE: When the production server is redeployed with new dist/ files,
 * these can be switched to the new clean routes:
 *   POST /api/v1/payments/phonepe/initiate
 *   GET  /api/v1/payments/phonepe/status/:id
 */

import api from './config';

// ─── 1. Initiate PhonePe Payment ─────────────────────────────────────────────

/**
 * Initiates a PhonePe payment session for a given order.
 *
 * Called after createOrder() succeeds. On success, redirects the user
 * to PhonePe's hosted checkout page.
 *
 * @param orderId   MongoDB Order _id (returned by createOrder)
 * @param amount    Optional (informational only; backend uses DB total)
 * @returns         { success, data: { redirectUrl, merchantTransactionId } }
 */
export const createPhonePeOrder = async (orderId: string, amount?: number) => {
    try {
        // Uses the legacy route that exists on production server
        const response = await api.post('/payment/create', {
            orderId,
            amount, // informational only
        });
        return response.data;
    } catch (error: any) {
        console.error('[PaymentService] createPhonePeOrder error:', error?.response?.data || error?.message);
        throw error;
    }
};

// ─── 2. Check Payment Status ─────────────────────────────────────────────────

/**
 * Polls backend for confirmed payment status of a merchantOrderId / merchantTransactionId.
 *
 * Called by PaymentVerify.tsx after user returns from PhonePe.
 *
 * @param merchantOrderId   The MT... ID returned by createPhonePeOrder
 * @returns                 { success, status: 'success'|'failed'|'pending', data }
 */
export const checkPhonePePaymentStatus = async (merchantOrderId: string) => {
    try {
        // Uses the legacy status route that exists on production server
        const response = await api.get(`/payment/status/${merchantOrderId}`);
        return response.data;
    } catch (error: any) {
        console.error('[PaymentService] checkPhonePePaymentStatus error:', error?.response?.data || error?.message);
        throw error;
    }
};

// ─── 3. Get Payment History ───────────────────────────────────────────────────

/**
 * (Optional) Retrieve payment history for the current customer.
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
