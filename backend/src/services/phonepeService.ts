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
import BusSchedule from '../models/BusSchedule';
import { InventoryService } from './inventoryService';

// ─── Environment Config ───────────────────────────────────────────────────────
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID?.trim() || '';

const ENV_MODE =
    process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION'
        ? Env.PRODUCTION
        : Env.SANDBOX;

const FRONTEND_URL = (process.env.FRONTEND_URL?.trim() || 'http://localhost:5173').replace(/\/$/, '');

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

        console.log(`[PhonePeService] DEBUG | Received paymentType: ${paymentType} | bookingId: ${bookingId}`);
        // ── Resolve booking by type ──────────────────────────────────────────
        if (paymentType === 'hotel') {
            console.log('[PhonePeService] Branch: HOTEL');
            bookingRef = await HotelBooking.findById(bookingId);
            if (!bookingRef) return { success: false, message: `Hotel booking ${bookingId} not found` };
            if (bookingRef.paymentStatus === 'Success') return { success: false, message: 'Booking already paid' };
            amountInPaise = Math.round(bookingRef.totalAmount * 100);
            customerId = bookingRef.userId;
            const unique = `${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            merchantOrderId = `MTH${unique}`;
            await HotelBooking.findByIdAndUpdate(bookingId, { merchantOrderId });

        } else if (paymentType === 'bus') {
            console.log('[PhonePeService] Branch: BUS');
            bookingRef = await BusBooking.findById(bookingId);
            if (!bookingRef) return { success: false, message: `Bus booking ${bookingId} not found` };
            if (bookingRef.paymentStatus === 'Success') return { success: false, message: 'Booking already paid' };

            // Log the bookingRef to see what fields it has
            console.log('[PhonePeService] Bus booking found keys:', Object.keys(bookingRef.toObject ? bookingRef.toObject() : bookingRef));
            console.log('[PhonePeService] Bus booking totalAmount:', bookingRef.totalAmount);

            amountInPaise = Math.round((bookingRef.totalAmount || bookingRef.amount || 0) * 100);
            customerId = bookingRef.userId;
            const unique = `${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            merchantOrderId = `MTB${unique}`;
            await BusBooking.findByIdAndUpdate(bookingId, { merchantOrderId });

        } else {
            console.log(`[PhonePeService] Branch: PRODUCT (type=${paymentType})`);
            
            // Check if bookingId is a merchantOrderId or a MongoDB ID
            if (typeof bookingId === 'string' && bookingId.startsWith('MT')) {
                const intent = await (mongoose.models.PaymentIntent || mongoose.model('PaymentIntent')).findOne({ merchantOrderId: bookingId });
                if (!intent) return { success: false, message: `Payment intent ${bookingId} not found` };
                
                amountInPaise = Math.round(intent.total * 100);
                customerId = intent.userId;
                merchantOrderId = bookingId;
            } else {
                bookingRef = await Order.findById(bookingId);
                if (!bookingRef) return { success: false, message: `Order ${bookingId} not found` };
                if (bookingRef.paymentStatus === 'Paid') return { success: false, message: 'Order is already paid' };
                amountInPaise = Math.round(bookingRef.total * 100);
                customerId = bookingRef.customer;
                const unique = `${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
                merchantOrderId = `MT${unique}`;
                await Order.findByIdAndUpdate(bookingId, { paymentStatus: 'Pending', merchantOrderId });
            }
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
            paymentMethod: 'PhonePe',
            paymentGateway: 'PhonePe',
            phonePeOrderId: merchantOrderId,
            status: 'PENDING',
            paymentType: ['hotel', 'bus'].includes(paymentType) ? paymentType : (bookingRef.orderType || 'quick'),
            userId: customerId,
        };

        if (paymentType === 'hotel') {
            paymentDoc.hotelBookingId = bookingId;
        } else if (paymentType === 'bus') {
            paymentDoc.busBookingId = bookingId;
        } else {
            paymentDoc.orderId = bookingId;
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
            return {
                success: true,
                status: (result.justPaid || result.order || result.booking) ? 'success' : 'failed',
                data: response,
                justPaid: result.justPaid,
                order: result.order,
                booking: result.booking
            };
        }

        if (state === 'FAILED' || state === 'CANCELLED') {
            return {
                success: true,
                status: 'failed',
                data: response,
            };
        }

        return {
            success: true,
            status: 'pending',
            data: response,
        };
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
        const { merchantTransactionId, state, transactionId } = decoded.data;
        console.log(`[PhonePeService] Webhook | MT: ${merchantTransactionId} | State: ${state}`);

        const payment = await (Payment as any).findOne({ phonePeOrderId: merchantTransactionId });
        if (!payment || payment.status === 'SUCCESS') return { success: true };

        const paymentType = decodePaymentType(merchantTransactionId);

        if (state === 'COMPLETED') {
            await _markBookingPaid(merchantTransactionId, transactionId, paymentType);
            return { success: true };
        }

        if (state === 'FAILED') {
            await _markBookingFailed(merchantTransactionId, paymentType);
            return { success: true };
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
    // ── Update Payment record ──────────────────────────────────────────
    // Use the core field name phonePeOrderId for merchantOrderId
    const existingPayment = await (Payment as any).findOne({ phonePeOrderId: merchantOrderId });
    if (!existingPayment) {
        console.error(`[PhonePeService] Payment record NOT FOUND for merchantOrderId: ${merchantOrderId}`);
        // We still continue to mark the booking paid if we found it, but log the error
    } else {
        existingPayment.status = 'SUCCESS';
        existingPayment.transactionId = transactionId || 'webhook';
        existingPayment.paidAt = new Date();
        await existingPayment.save();
        let primaryOrder: any;
        if (paymentType === 'hotel') {
            primaryOrder = await HotelBooking.findOneAndUpdate(
                { merchantOrderId },
                { paymentStatus: 'Success', bookingStatus: 'Confirmed', transactionId },
                { new: true }
            ).populate('hotelId').lean();

            if (primaryOrder) {
                // Decrement availableRooms in the room model
                await HotelRoom.findByIdAndUpdate(primaryOrder.roomId, {
                    $inc: { availableRooms: -1 }
                });
                console.log(`[PhonePeService] Hotel booking ${primaryOrder._id} confirmed & room inventory decremented`);
            }
        } else if (paymentType === 'bus') {
            primaryOrder = await BusBooking.findOneAndUpdate(
                { merchantOrderId },
                { paymentStatus: 'Success', status: 'confirmed', transactionId },
                { new: true }
            ).lean();

            if (primaryOrder) {
                // Mark seats as booked in the schedule
                const schedule = await BusSchedule.findById(primaryOrder.scheduleId);
                if (schedule) {
                    primaryOrder.seats.forEach((bookedSeat: any) => {
                        const seatIndex = schedule.seats.findIndex((s: any) => s.seatNumber === bookedSeat.seatNumber);
                        if (seatIndex !== -1) {
                            schedule.seats[seatIndex].isBooked = true;
                            schedule.seats[seatIndex].bookedFor = bookedSeat.passengerGender?.toLowerCase().startsWith('f') ? 'female' : 'male';
                        }
                    });
                    await schedule.save();
                }
                console.log(`[PhonePeService] Bus booking ${primaryOrder._id} seats marked PAID and BOOKED in schedule`);
            }
        } else {
            // Product order (quick or ecommerce)
            
            // Check for PaymentIntent first (New flow)
            const intent = await (mongoose.models.PaymentIntent || mongoose.model('PaymentIntent')).findOne({ merchantOrderId });
            if (intent && intent.status === 'Pending') {
                const { finalizeOrderCreation } = require('./orderService');
                const io = (global as any).io; // We'll need a way to get IO, maybe global for now or pass it down
                
                const createdOrders = await finalizeOrderCreation(intent.userId.toString(), {
                    items: intent.items,
                    address: intent.address,
                    paymentMethod: 'Online',
                    fees: intent.fees,
                    deliveryInstructions: intent.deliveryInstructions,
                    tip: intent.tip
                }, io, 'Paid');

                intent.status = 'Completed';
                await intent.save();

                primaryOrder = createdOrders[0];
                let allAffectedOrders = createdOrders;

                console.log(`[PhonePeService] Order created from PaymentIntent | Parent: ${primaryOrder.parentOrderId}`);

                return {
                    booking: null,
                    order: primaryOrder.toObject ? primaryOrder.toObject() : primaryOrder,
                    allOrders: allAffectedOrders.map(o => o.toObject ? o.toObject() : o),
                    justPaid: true
                };
            }

            // Legacy flow (order already exists)
            primaryOrder = await Order.findOneAndUpdate(
                { merchantOrderId },
                { paymentStatus: 'Paid', status: 'Received', transactionId },
                { new: true }
            );

            let allAffectedOrders: any[] = [];
            if (primaryOrder) {
                allAffectedOrders.push(primaryOrder);
                // Mark ALL split siblings paid via parentOrderId
                if (primaryOrder.parentOrderId) {
                    const siblings = await Order.find({
                        parentOrderId: primaryOrder.parentOrderId,
                        _id: { $ne: primaryOrder._id },
                        paymentStatus: { $ne: 'Paid' }
                    });

                    if (siblings.length > 0) {
                        await Order.updateMany(
                            { _id: { $in: siblings.map(s => s._id) } },
                            { paymentStatus: 'Paid', status: 'Received', transactionId }
                        );
                        allAffectedOrders.push(...siblings);
                        console.log(`[PhonePeService] Marked ${siblings.length} sibling order(s) paid for parent ${primaryOrder.parentOrderId}`);
                    }
                }

                // Confirm inventory lock (reduce actual stock permanently)
                try {
                    await InventoryService.confirmProductLocks(primaryOrder.customer.toString());
                } catch (invErr) {
                    console.warn('[PhonePeService] Inventory confirm warning:', (invErr as any).message);
                }

                console.log(`[PhonePeService] Order ${primaryOrder.orderNumber} marked PAID and RECEIVED`);
            }
            
            const primaryOrderObj = primaryOrder?.toObject() || primaryOrder;

            return { 
                booking: (paymentType === 'hotel' || paymentType === 'bus') ? primaryOrderObj : null,
                order: paymentType === 'product' ? primaryOrderObj : null,
                allOrders: paymentType === 'product' ? allAffectedOrders : [primaryOrderObj],
                justPaid: !!primaryOrder 
            };
        }
    }
}

// ─── Internal: Mark Booking Failed ───────────────────────────────────────────

async function _markBookingFailed(merchantOrderId: string, paymentType: string = 'product') {
    // Update Payment audit record
    const payment = await (Payment as any).findOne({ phonePeOrderId: merchantOrderId });
    if (payment && payment.status !== 'FAILED') {
        payment.status = 'FAILED';
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
        if (!payment.phonePeOrderId) return { success: false, message: 'No PhonePe transaction ID on this payment' };
        if (payment.status !== 'SUCCESS') return { success: false, message: 'Only successful payments can be refunded' };

        const refundAmountPaise = Math.round((amount || payment.amount) * 100);
        const refundTxnId = `RTX${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        console.log(`[PhonePeService] Initiating refund | Payment: ${paymentId} | Amount: ₹${amount || payment.amount}`);

        const refundResponse: any = await client.refund({
            transactionId: refundTxnId,
            originalTransactionId: payment.phonepeMerchantTransactionId,
            amount: refundAmountPaise,
        } as any);

        if (refundResponse?.success) {
            payment.status = 'FAILED'; // Using FAILED for refunded in this simple schema
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
