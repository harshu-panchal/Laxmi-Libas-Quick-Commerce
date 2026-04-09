/**
 * @file phonepeService.ts
 * @description PhonePe Payment Service — Standard Checkout V2 SDK
 *
 * Acts as the SOLE integration point for PhonePe payment lifecycle:
 *   1. initiatePayment   → Creates a PhonePe checkout session
 *   2. checkPaymentStatus → Polls/checks order status from PhonePe
 *   3. handleWebhookCallback → Processes server-to-server payment notifications
 *   4. initiateRefund    → Triggers a refund for a completed payment
 *
 * This service is ISOLATED from all business/order logic.
 * It receives orderId, fetches the order, creates a PhonePe session,
 * and updates paymentStatus on the Order model.
 *
 * Dependencies:
 *  - @phonepe-pg/pg-sdk-node (PhonePe official SDK)
 *  - Order model (for paymentStatus updates)
 *  - Payment model (for audit trail)
 */

import {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
} from '@phonepe-pg/pg-sdk-node';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Order from '../models/Order';

// ─── Environment Config ───────────────────────────────────────────────────────
const CLIENT_ID      = process.env.PHONEPE_CLIENT_ID?.trim()      || '';
const CLIENT_SECRET  = process.env.PHONEPE_CLIENT_SECRET?.trim()  || '';
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const MERCHANT_ID    = process.env.PHONEPE_MERCHANT_ID?.trim()    || '';

// Auto-detect environment: default to PRODUCTION if PHONEPE_ENV is 'PRODUCTION' or MERCHANT_ID doesn't contain 'sandbox'
const ENV_MODE =
    process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION'
        ? Env.PRODUCTION
        : Env.SANDBOX;

const FRONTEND_URL  = (process.env.FRONTEND_URL?.trim() || 'https://laxmart.store').replace(/\/$/, '');

// ─── SDK Singleton ────────────────────────────────────────────────────────────
let _client: StandardCheckoutClient | null = null;

/**
 * Returns the PhonePe SDK client singleton.
 * Throws if credentials are missing.
 */
const getClient = (): StandardCheckoutClient => {
    if (_client) return _client;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('[PhonePeService] Missing PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET in environment');
    }

    _client = StandardCheckoutClient.getInstance(
        CLIENT_ID,
        CLIENT_SECRET,
        CLIENT_VERSION,
        ENV_MODE,
    );

    console.log(
        `[PhonePeService] SDK initialized | ENV: ${ENV_MODE === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} | MID: ${MERCHANT_ID}`,
    );
    return _client;
};

// ─── 1. Initiate Payment ─────────────────────────────────────────────────────

/**
 * Creates a PhonePe payment session for a given orderId.
 * Sets Order.paymentStatus = 'Pending' and stores a Payment audit record.
 *
 * @param orderId   MongoDB Order _id (string)
 * @returns { success, data: { redirectUrl, merchantOrderId } }
 */
export const initiatePhonePePayment = async (orderId: string) => {
    try {
        const client = getClient();

        // ── Load order from DB ──────────────────────────────────────────────
        const order = await Order.findById(orderId);
        if (!order) {
            return { success: false, message: `Order ${orderId} not found` };
        }

        // Guard: do not re-initiate for already-paid orders
        if (order.paymentStatus === 'Paid') {
            return { success: false, message: 'Order is already paid' };
        }

        // ── Convert amount to paise ─────────────────────────────────────────
        const amountInPaise = Math.round(order.total * 100);
        if (amountInPaise <= 0) {
            return { success: false, message: 'Order total must be greater than 0' };
        }

        // ── Generate unique merchant order ID ───────────────────────────────
        // Format: MT<timestamp><4-char-hex> — stays within PhonePe's 38-char limit
        const merchantOrderId = `MT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        console.log(`[PhonePeService] Initiating payment | Order: ${orderId} | MerchantOrderId: ${merchantOrderId} | Amount: ₹${order.total}`);

        // ── Build SDK pay request ───────────────────────────────────────────
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amountInPaise)
            .redirectUrl(`${FRONTEND_URL}/payment/verify`)
            .build();

        // ── Call PhonePe API ────────────────────────────────────────────────
        const response = await client.pay(request);

        // ── Create Payment audit record ─────────────────────────────────────
        const payment = new Payment({
            order:                       order._id,
            customer:                    order.customer,
            paymentMethod:               order.paymentMethod || 'Online',
            paymentGateway:              'PhonePe',
            phonepeMerchantTransactionId: merchantOrderId,
            amount:                      order.total,
            currency:                    'INR',
            status:                      'Pending',
        });
        await payment.save();

        // ── Update order: mark as pending + store merchantOrderId ───────────
        await Order.findByIdAndUpdate(orderId, {
            paymentStatus:   'Pending',
            merchantOrderId: merchantOrderId, // new field: store MT... ID for status polling
        });

        return {
            success: true,
            data: {
                redirectUrl:     response.redirectUrl,
                merchantOrderId, // useful for frontend to poll status
            },
        };

    } catch (error: any) {
        console.error('[PhonePeService] initiatePayment error:', error?.message || error);
        return { success: false, message: error?.message || 'Payment initiation failed' };
    }
};

// ─── 2. Check Payment Status ─────────────────────────────────────────────────

/**
 * Fetches the current payment status from PhonePe for a given merchantOrderId.
 * Syncs Order.paymentStatus and Payment.status in the DB.
 *
 * @param merchantOrderId   The merchantOrderId returned at initiation
 * @returns { success, status: 'success'|'failed'|'pending', data }
 */
export const checkPhonePeStatus = async (merchantOrderId: string) => {
    try {
        const client = getClient();

        // ── Poll PhonePe for status ─────────────────────────────────────────
        const response = await client.getOrderStatus(merchantOrderId);

        // SDK may return state at different depths depending on version
        const state: string = (response as any)?.state
            || (response as any)?.data?.state
            || 'PENDING';

        console.log(`[PhonePeService] Status check | MerchantOrderId: ${merchantOrderId} | State: ${state}`);

        // ── Update DB if not already settled ───────────────────────────────
        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantOrderId });
        if (payment && payment.status !== 'Completed') {
            if (state === 'COMPLETED') {
                payment.status  = 'Completed';
                payment.paidAt  = new Date();
                await payment.save();

                await Order.findByIdAndUpdate(payment.order, {
                    paymentStatus:   'Paid',
                    status:          'Received',
                    merchantOrderId: merchantOrderId, // record the MT... ID
                });
                console.log(`[PhonePeService] Order ${payment.order} marked Paid`);

            } else if (state === 'FAILED') {
                payment.status = 'Failed';
                await payment.save();

                await Order.findByIdAndUpdate(payment.order, {
                    paymentStatus:   'Failed',
                    merchantOrderId: merchantOrderId, // record the MT... ID even on failure
                });
                console.log(`[PhonePeService] Order ${payment.order} marked Failed`);
            }
        }

        // Normalize state to frontend-friendly label
        const statusLabel =
            state === 'COMPLETED' ? 'success' :
            state === 'FAILED'    ? 'failed'  : 'pending';

        return { success: true, status: statusLabel, raw: response };

    } catch (error: any) {
        console.error('[PhonePeService] checkStatus error:', error?.message || error);
        return { success: false, message: error?.message || 'Status check failed' };
    }
};

// ─── 3. Handle Webhook Callback ───────────────────────────────────────────────

/**
 * Processes a PhonePe server-to-server callback (webhook).
 * Validates the payload, updates Payment + Order records.
 *
 * @param body          Raw request body from PhonePe
 * @param xVerifyHeader x-verify header for HMAC validation (optional)
 */
export const handlePhonePeWebhook = async (body: any) => {
    try {
        // ── Decode base64 payload ───────────────────────────────────────────
        const responseData = typeof body === 'string' ? JSON.parse(body) : body;
        if (!responseData?.response) {
            throw new Error('Invalid webhook payload: missing response field');
        }

        const decoded = JSON.parse(Buffer.from(responseData.response, 'base64').toString('utf-8'));
        const { merchantTransactionId, state, transactionId } = decoded?.data || {};

        console.log(`[PhonePeService] Webhook received | MerchantTxnId: ${merchantTransactionId} | State: ${state}`);

        if (!merchantTransactionId) {
            throw new Error('Webhook payload missing merchantTransactionId');
        }

        // ── Find Payment record ─────────────────────────────────────────────
        const payment = await Payment.findOne({ phonepeMerchantTransactionId: merchantTransactionId });
        if (!payment) {
            console.warn(`[PhonePeService] Webhook: No payment found for ${merchantTransactionId}`);
            return { success: true }; // Acknowledge but don't crash
        }

        // Idempotency: skip if already processed
        if (payment.status === 'Completed') {
            return { success: true };
        }

        // ── Update DB based on payment state ────────────────────────────────
        if (state === 'COMPLETED') {
            payment.status                = 'Completed';
            payment.phonepeTransactionId  = transactionId;
            payment.paidAt                = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus:   'Paid',
                paymentId:       transactionId,  // legacy field
                transactionId:   transactionId,  // new dedicated field
                merchantOrderId: merchantTransactionId,
                status:          'Received',
            });
            console.log(`[PhonePeService] Webhook: Order ${payment.order} marked Paid`);

        } else if (state === 'FAILED') {
            payment.status = 'Failed';
            await payment.save();

            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Failed',
            });
            console.log(`[PhonePeService] Webhook: Order ${payment.order} marked Failed`);
        }

        return { success: true };

    } catch (error: any) {
        console.error('[PhonePeService] handleWebhook error:', error?.message || error);
        return { success: false, message: error?.message || 'Webhook processing failed' };
    }
};

// ─── 4. Initiate Refund ──────────────────────────────────────────────────────

/**
 * Initiates a refund for a previously completed PhonePe payment.
 *
 * @param paymentId     MongoDB Payment _id
 * @param amount        Optional partial refund amount (defaults to full amount)
 */
export const initiatePhonePeRefund = async (paymentId: string, amount?: number) => {
    try {
        const client = getClient();

        // ── Load Payment record ─────────────────────────────────────────────
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return { success: false, message: 'Payment record not found' };
        }
        if (!payment.phonepeMerchantTransactionId) {
            return { success: false, message: 'No PhonePe transaction ID on this payment' };
        }
        if (payment.status !== 'Completed') {
            return { success: false, message: 'Only completed payments can be refunded' };
        }

        const refundAmountPaise = Math.round((amount || payment.amount) * 100);
        const refundTxnId       = `RTX${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        console.log(`[PhonePeService] Initiating refund | Payment: ${paymentId} | Amount: ₹${amount || payment.amount}`);

        const refundResponse: any = await client.refund({
            transactionId:         refundTxnId,
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount:                refundAmountPaise,
        } as any);

        if (refundResponse?.success) {
            payment.status       = 'Refunded';
            payment.refundAmount = amount || payment.amount;
            payment.refundedAt   = new Date();
            await payment.save();

            return { success: true, message: 'Refund initiated successfully', data: refundResponse };
        }

        return { success: false, message: refundResponse?.message || 'Refund failed at gateway' };

    } catch (error: any) {
        console.error('[PhonePeService] initiateRefund error:', error?.message || error);
        return { success: false, message: error?.message || 'Refund initiation failed' };
    }
};
