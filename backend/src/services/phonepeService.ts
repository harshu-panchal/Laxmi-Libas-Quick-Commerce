/**
 * @file phonepeService.ts
 * @description PhonePe Payment Service — Standard Checkout V2 SDK
 *
 * Handles payment lifecycle for ALL booking types:
 *   - product orders (quick + ecommerce, including split/parent orders)
 *   - hotel bookings
 *   - bus bookings
 *
 * Routes handled:
 *   1. initiatePhonePePayment   → Creates a PhonePe checkout session
 *   2. checkPhonePeStatus       → Polls order status from PhonePe
 *   3. handlePhonePeWebhook     → Processes server-to-server payment notifications
 *   4. initiatePhonePeRefund    → Triggers a refund for a completed payment
 */

import {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
} from '@phonepe-pg/pg-sdk-node';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Order from '../models/Order';
import HotelBooking from '../models/HotelBooking';
import BusBooking from '../models/BusBooking';
import { InventoryService } from './inventoryService';

// ─── Environment Config ───────────────────────────────────────────────────────
const CLIENT_ID      = process.env.PHONEPE_CLIENT_ID?.trim()      || '';
const CLIENT_SECRET  = process.env.PHONEPE_CLIENT_SECRET?.trim()  || '';
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const MERCHANT_ID    = process.env.PHONEPE_MERCHANT_ID?.trim()    || '';

const ENV_MODE =
    process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION'
        ? Env.PRODUCTION
        : Env.SANDBOX;

const FRONTEND_URL  = (process.env.FRONTEND_URL?.trim() || 'http://localhost:5173').replace(/\/$/, '');

// ─── SDK Singleton ────────────────────────────────────────────────────────────
let _client: StandardCheckoutClient | null = null;

const getClient = (): StandardCheckoutClient => {
    if (_client) return _client;
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('[PhonePeService] Missing PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET in environment');
    }
    _client = StandardCheckoutClient.getInstance(CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION, ENV_MODE);
    console.log(`[PhonePeService] SDK initialized | ENV: ${ENV_MODE === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} | MID: ${MERCHANT_ID}`);
    return _client;
};

// ─── Helpers: Detect payment type from merchantOrderId prefix ─────────────────
// Format: MT_HOTEL_<timestamp><hex>  |  MT_BUS_<timestamp><hex>  |  MT<timestamp><hex>
const encodePaymentType = (type: string, merchantId: string) =>
    type === 'hotel' ? `MTH${merchantId}` : type === 'bus' ? `MTB${merchantId}` : merchantId;

const decodePaymentType = (merchantOrderId: string): 'hotel' | 'bus' | 'product' => {
    if (merchantOrderId.startsWith('MTH')) return 'hotel';
    if (merchantOrderId.startsWith('MTB')) return 'bus';
    return 'product';
};

// ─── 1. Initiate Payment ─────────────────────────────────────────────────────

/**
 * Creates a PhonePe payment session for Order / HotelBooking / BusBooking.
 *
 * @param bookingId     MongoDB _id of the Order/HotelBooking/BusBooking
 * @param paymentType   'quick' | 'ecommerce' | 'hotel' | 'bus'
 * @param customFrontendUrl  Override for redirect base URL
 */
export const initiatePhonePePayment = async (
    bookingId: string,
    customFrontendUrl?: string,
    paymentType: string = 'product'
) => {
    try {
        const client = getClient();
        const baseFrontendUrl = customFrontendUrl || FRONTEND_URL;

        let amountInPaise = 0;
        let customerId: any;
        let merchantOrderId = '';
        let bookingRef: any = null;

        // ── Resolve booking by type ──────────────────────────────────────────
        if (paymentType === 'hotel') {
            bookingRef = await HotelBooking.findById(bookingId);
            if (!bookingRef) return { success: false, message: `Hotel booking ${bookingId} not found` };
            if (bookingRef.paymentStatus === 'Success') return { success: false, message: 'Booking already paid' };
            amountInPaise = Math.round(bookingRef.totalAmount * 100);
            customerId = bookingRef.userId;
            const unique = `${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            merchantOrderId = `MTH${unique}`;
            // Store merchantOrderId on booking for callback lookup
            await HotelBooking.findByIdAndUpdate(bookingId, { merchantOrderId });

        } else if (paymentType === 'bus') {
            bookingRef = await BusBooking.findById(bookingId);
            if (!bookingRef) return { success: false, message: `Bus booking ${bookingId} not found` };
            if (bookingRef.paymentStatus === 'Success') return { success: false, message: 'Booking already paid' };
            amountInPaise = Math.round((bookingRef.totalPrice || bookingRef.amount || 0) * 100);
            customerId = bookingRef.userId;
            const unique = `${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            merchantOrderId = `MTB${unique}`;
            await BusBooking.findByIdAndUpdate(bookingId, { merchantOrderId });

        } else {
            // Product order (quick or ecommerce)
            bookingRef = await Order.findById(bookingId);
            if (!bookingRef) return { success: false, message: `Order ${bookingId} not found` };
            if (bookingRef.paymentStatus === 'Paid') return { success: false, message: 'Order is already paid' };
            amountInPaise = Math.round(bookingRef.total * 100);
            customerId = bookingRef.customer;
            const unique = `${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            merchantOrderId = `MT${unique}`;
            await Order.findByIdAndUpdate(bookingId, { paymentStatus: 'Pending', merchantOrderId });
        }

        if (amountInPaise <= 0) {
            return { success: false, message: 'Amount must be greater than 0' };
        }

        console.log(`[PhonePeService] Initiating | Type: ${paymentType} | ID: ${bookingId} | MT: ${merchantOrderId} | ₹${amountInPaise / 100}`);

        // ── Build SDK pay request ────────────────────────────────────────────
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amountInPaise)
            .redirectUrl(`${baseFrontendUrl}/payment/verify?merchantOrderId=${merchantOrderId}&type=${paymentType}`)
            .build();

        const response = await client.pay(request);

        // ── Store Payment audit record ───────────────────────────────────────
        const paymentDoc: any = {
            amount: amountInPaise / 100,
            currency: 'INR',
            paymentGateway: 'PhonePe',
            phonepeMerchantTransactionId: merchantOrderId,
            status: 'Pending',
            paymentType: ['hotel', 'bus'].includes(paymentType) ? paymentType : (bookingRef.orderType || 'quick'),
        };
        // Store the right reference
        if (paymentType === 'hotel') {
            paymentDoc.hotelBookingId = bookingId;
            paymentDoc.customer = customerId;
        } else if (paymentType === 'bus') {
            paymentDoc.busBookingId = bookingId;
            paymentDoc.customer = customerId;
        } else {
            paymentDoc.order = bookingId;
            paymentDoc.customer = customerId;
        }

        // Save leniently — Payment model may have required fields; wrap to avoid crash
        try {
            const payment = new (Payment as any)(paymentDoc);
            await payment.save();
        } catch (payErr) {
            console.warn('[PhonePeService] Could not save Payment audit record:', (payErr as any).message);
        }

        return {
            success: true,
            data: {
                redirectUrl: response.redirectUrl,
                merchantOrderId,
            },
        };

    } catch (error: any) {
        console.error('[PhonePeService] initiatePayment error:', error?.message || error);
        return { success: false, message: error?.message || 'Payment initiation failed' };
    }
};

// ─── 2. Check Payment Status ─────────────────────────────────────────────────

/**
 * Fetches status from PhonePe and syncs all related models.
 * Handles split orders (all orders with same parentOrderId get marked Paid).
 * Handles Hotel/Bus bookings.
 * Releases inventory on failure.
 */
export const checkPhonePeStatus = async (merchantOrderId: string) => {
    try {
        const client = getClient();
        const response = await client.getOrderStatus(merchantOrderId);

        const state: string = (response as any)?.state
            || (response as any)?.data?.state
            || 'PENDING';

        console.log(`[PhonePeService] Status | MT: ${merchantOrderId} | State: ${state}`);

        const paymentType = decodePaymentType(merchantOrderId);

        if (state === 'COMPLETED') {
            const result = await _markBookingPaid(merchantOrderId, undefined, paymentType);
            return { success: true, status: 'success', raw: response, ...result };
        }

        if (state === 'FAILED') {
            await _markBookingFailed(merchantOrderId, paymentType);
            return { success: true, status: 'failed', raw: response };
        }

        return { success: true, status: 'pending', raw: response };

    } catch (error: any) {
        console.error('[PhonePeService] checkStatus error:', error?.message || error);
        return { success: false, message: error?.message || 'Status check failed' };
    }
};

// ─── 3. Handle Webhook Callback ───────────────────────────────────────────────

/**
 * Processes a PhonePe server-to-server callback (webhook).
 * Routes to the correct model based on merchantTransactionId prefix.
 */
export const handlePhonePeWebhook = async (body: any) => {
    try {
        const responseData = typeof body === 'string' ? JSON.parse(body) : body;
        if (!responseData?.response) {
            throw new Error('Invalid webhook payload: missing response field');
        }

        const decoded = JSON.parse(Buffer.from(responseData.response, 'base64').toString('utf-8'));
        const { merchantTransactionId, state, transactionId } = decoded?.data || {};

        console.log(`[PhonePeService] Webhook | MT: ${merchantTransactionId} | State: ${state}`);

        if (!merchantTransactionId) {
            throw new Error('Webhook payload missing merchantTransactionId');
        }

        const paymentType = decodePaymentType(merchantTransactionId);

        if (state === 'COMPLETED') {
            const result = await _markBookingPaid(merchantTransactionId, transactionId, paymentType);
            return { success: true, justPaid: true, ...result };
        }

        if (state === 'FAILED') {
            await _markBookingFailed(merchantTransactionId, paymentType);
        }

        return { success: true };

    } catch (error: any) {
        console.error('[PhonePeService] handleWebhook error:', error?.message || error);
        return { success: false, message: error?.message || 'Webhook processing failed' };
    }
};

// ─── Internal: Mark Booking Paid ─────────────────────────────────────────────

async function _markBookingPaid(
    merchantOrderId: string,
    transactionId?: string,
    paymentType: string = 'product'
) {
    // Idempotency: check Payment audit record
    const existingPayment = await (Payment as any).findOne({ phonepeMerchantTransactionId: merchantOrderId });
    if (existingPayment?.status === 'Completed') {
        console.log(`[PhonePeService] Already processed: ${merchantOrderId}`);
        return {};
    }

    // Update Payment audit record
    if (existingPayment) {
        existingPayment.status = 'Completed';
        existingPayment.paidAt = new Date();
        if (transactionId) existingPayment.phonepeTransactionId = transactionId;
        await existingPayment.save();
    }

    if (paymentType === 'hotel') {
        const booking = await HotelBooking.findOneAndUpdate(
            { merchantOrderId },
            { paymentStatus: 'Success', bookingStatus: 'Confirmed', transactionId },
            { new: true }
        );
        console.log(`[PhonePeService] Hotel booking ${booking?._id} marked PAID`);
        return { booking };
    }

    if (paymentType === 'bus') {
        const booking = await BusBooking.findOneAndUpdate(
            { merchantOrderId },
            { paymentStatus: 'Success', status: 'confirmed', transactionId },
            { new: true }
        );
        console.log(`[PhonePeService] Bus booking ${booking?._id} marked PAID`);
        return { booking };
    }

    // Product order (quick/ecommerce) — handle split orders via parentOrderId
    const primaryOrder = await Order.findOneAndUpdate(
        { merchantOrderId },
        {
            paymentStatus: 'Paid',
            status: 'Received',
            transactionId,
            merchantOrderId,
        },
        { new: true }
    );

    let paidOrders: any[] = [];
    if (primaryOrder) {
        paidOrders.push(primaryOrder);

        // Mark ALL split siblings paid via parentOrderId
        if (primaryOrder.parentOrderId) {
            const siblings = await Order.updateMany(
                {
                    parentOrderId: primaryOrder.parentOrderId,
                    _id: { $ne: primaryOrder._id },
                    paymentStatus: { $ne: 'Paid' }
                },
                { paymentStatus: 'Paid', status: 'Received', transactionId }
            );
            console.log(`[PhonePeService] Marked ${siblings.modifiedCount} sibling order(s) paid for parent ${primaryOrder.parentOrderId}`);
        }

        // Confirm inventory lock (reduce actual stock permanently)
        try {
            await InventoryService.confirmProductLocks(primaryOrder.customer.toString());
        } catch (invErr) {
            console.warn('[PhonePeService] Inventory confirm warning:', (invErr as any).message);
        }

        console.log(`[PhonePeService] Order ${primaryOrder.orderNumber} marked PAID and RECEIVED`);
    }

    return { order: primaryOrder, justPaid: !!primaryOrder };
}

// ─── Internal: Mark Booking Failed ───────────────────────────────────────────

async function _markBookingFailed(merchantOrderId: string, paymentType: string = 'product') {
    // Update Payment audit record
    const payment = await (Payment as any).findOne({ phonepeMerchantTransactionId: merchantOrderId });
    if (payment && payment.status !== 'Failed') {
        payment.status = 'Failed';
        await payment.save();
    }

    if (paymentType === 'hotel') {
        await HotelBooking.findOneAndUpdate({ merchantOrderId }, { paymentStatus: 'Failed' });
        return;
    }

    if (paymentType === 'bus') {
        await BusBooking.findOneAndUpdate({ merchantOrderId }, { paymentStatus: 'Failed' });
        return;
    }

    // Product order — mark failed + release inventory
    const order = await Order.findOneAndUpdate(
        { merchantOrderId },
        { paymentStatus: 'Failed' },
        { new: true }
    );

    if (order) {
        console.log(`[PhonePeService] Order ${order.orderNumber} marked FAILED — releasing inventory`);
        try {
            await InventoryService.releaseProductLocks(order.customer.toString());
        } catch (invErr) {
            console.warn('[PhonePeService] Inventory release warning:', (invErr as any).message);
        }
    }
}

// ─── 4. Initiate Refund ──────────────────────────────────────────────────────

export const initiatePhonePeRefund = async (paymentId: string, amount?: number) => {
    try {
        const client = getClient();

        const payment = await (Payment as any).findById(paymentId);
        if (!payment) return { success: false, message: 'Payment record not found' };
        if (!payment.phonepeMerchantTransactionId) return { success: false, message: 'No PhonePe transaction ID on this payment' };
        if (payment.status !== 'Completed') return { success: false, message: 'Only completed payments can be refunded' };

        const refundAmountPaise = Math.round((amount || payment.amount) * 100);
        const refundTxnId = `RTX${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        console.log(`[PhonePeService] Initiating refund | Payment: ${paymentId} | Amount: ₹${amount || payment.amount}`);

        const refundResponse: any = await client.refund({
            transactionId: refundTxnId,
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount: refundAmountPaise,
        } as any);

        if (refundResponse?.success) {
            payment.status = 'Refunded';
            payment.refundAmount = amount || payment.amount;
            payment.refundedAt = new Date();
            await payment.save();
            return { success: true, message: 'Refund initiated successfully', data: refundResponse };
        }

        return { success: false, message: refundResponse?.message || 'Refund failed at gateway' };

    } catch (error: any) {
        console.error('[PhonePeService] initiateRefund error:', error?.message || error);
        return { success: false, message: error?.message || 'Refund initiation failed' };
    }
};
