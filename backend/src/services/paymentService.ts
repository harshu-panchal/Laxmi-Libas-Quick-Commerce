import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import Payment from '../models/Payment';
import Order from '../models/Order';
import crypto from 'crypto';
import { InventoryService } from './inventoryService';
// import { Request, Response } from 'express'; // unused

/**
 * 🎯 FINAL PRODUCTION: PhonePe Service
 */

// Production Configuration
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const ENV_MODE = process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://laxmart.store';
// const BACKEND_URL = 'https://api.laxmart.store/'; // reserved for future use

// Initialize SDK Client (Singleton)
let phonePeClient: StandardCheckoutClient | null = null;

const getPhonePeClient = () => {
    if (!phonePeClient) {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('PhonePe credentials are missing in .env');
        }
        phonePeClient = StandardCheckoutClient.getInstance(
            CLIENT_ID,
            CLIENT_SECRET,
            CLIENT_VERSION,
            ENV_MODE
        );
        console.log(`[PhonePe SDK] Client initialized in ${ENV_MODE === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'} mode`);
    }
    return phonePeClient;
};

import HotelBooking from '../models/HotelBooking';
import BusBooking from '../models/BusBooking';

/**
 * 1. Create Checkout Order (Unified)
 */
export const createPhonePeOrder = async (
    orderId: string, 
    customFrontendUrl?: string,
    paymentType: 'quick' | 'ecommerce' | 'hotel' | 'bus' = 'quick'
) => {
    try {
        const client = getPhonePeClient();
        let amount = 0;
        let userId: any;

        // Fetch total from correct model
        if (paymentType === 'quick' || paymentType === 'ecommerce') {
            if (typeof orderId === 'string' && orderId.startsWith('MT')) {
                const mongoose = require('mongoose');
                const PaymentIntent = mongoose.models.PaymentIntent || mongoose.model('PaymentIntent');
                const intent = await PaymentIntent.findOne({ merchantOrderId: orderId });
                if (!intent) throw new Error('Payment intent not found');
                amount = intent.total;
                userId = intent.userId;
            } else {
                const order = await Order.findById(orderId);
                if (!order) throw new Error('Order not found');
                
                // Check if it's a parent link
                if (order.parentOrderId) {
                    const siblingOrders = await Order.find({ parentOrderId: order.parentOrderId });
                    amount = siblingOrders.reduce((sum, o) => sum + o.total, 0);
                } else {
                    amount = order.total;
                }
                userId = order.customer;
            }
        } else if (paymentType === 'hotel') {
            const booking = await HotelBooking.findById(orderId);
            if (!booking) throw new Error('Hotel booking not found');
            amount = booking.totalAmount; // Fixed field name
            userId = booking.userId;
        } else if (paymentType === 'bus') {
            const booking = await BusBooking.findById(orderId);
            if (!booking) throw new Error('Bus booking not found');
            amount = booking.totalAmount; // FIXED field name (was totalPrice)
            userId = booking.userId;
        }

        const amountInPaise = Math.round(amount * 100);
        const merchantTransactionId = (typeof orderId === 'string' && orderId.startsWith('MT')) 
            ? orderId 
            : `MT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        const baseFrontendUrl = customFrontendUrl || FRONTEND_URL;
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(amountInPaise)
            .redirectUrl(`${baseFrontendUrl}/payment/verify?merchantOrderId=${merchantTransactionId}`)
            .build();

        console.log(`[PhonePe] Multi-Order Payment | Ref: ${orderId} | Total: ${amount} INR`);

        const response = await client.pay(request);

        const isMT = typeof orderId === 'string' && orderId.startsWith('MT');
        const payment = new Payment({
            orderId: isMT ? undefined : orderId as any, 
            userId,
            paymentType,
            paymentMethod: 'Online',
            paymentGateway: 'PhonePe',
            phonePeOrderId: merchantTransactionId,
            amount,
            currency: 'INR',
            status: 'PENDING'
        });
        
        try {
            await payment.save();
        } catch (saveErr: any) {
            console.warn('[PaymentService] Non-fatal error saving payment audit:', saveErr.message);
        }

        return {
            success: true,
            data: {
                redirectUrl: response.redirectUrl,
                merchantTransactionId
            }
        };

    } catch (error: any) {
        console.error('[PhonePe] Creation Error:', error.message);
        return { success: false, message: error.message || 'Payment initiation failed' };
    }
};

/**
 * 2. Get Transaction Status (Manual Poll)
 */
export const getPhonePePaymentStatus = async (merchantTransactionId: string) => {
    try {
        const client = getPhonePeClient();
        const response = await client.getOrderStatus(merchantTransactionId);

        const payment = await Payment.findOne({ phonePeOrderId: merchantTransactionId });
        if (!payment) throw new Error('Payment reference not found');

        const state = (response as any).state || (response as any).data?.state;

        if (payment.status !== 'SUCCESS') {
            if (state === 'COMPLETED') {
                payment.status = 'SUCCESS';
                payment.paidAt = new Date();
                payment.transactionId = (response as any).transactionId || (response as any).data?.transactionId;
                await payment.save();

                let updatedRecord: any;

                if (payment.paymentType === 'quick' || payment.paymentType === 'ecommerce') {
                    // Update main order and all its split siblings
                    const mainOrder = await Order.findById(payment.orderId);
                    if (mainOrder?.parentOrderId) {
                        await Order.updateMany({ parentOrderId: mainOrder.parentOrderId }, {
                            paymentStatus: 'Paid',
                            status: 'Received',
                            paymentId: payment.transactionId
                        });
                    } else {
                        await Order.findByIdAndUpdate(payment.orderId, {
                            paymentStatus: 'Paid',
                            status: 'Received',
                            paymentId: payment.transactionId
                        });
                    }
                    
                    // CONFIRM STOCK LOCKS
                    await InventoryService.confirmProductLocks(payment.userId.toString());
                    updatedRecord = await Order.findById(payment.orderId).lean();

                } else if (payment.paymentType === 'hotel') {
                    updatedRecord = await HotelBooking.findByIdAndUpdate(payment.orderId, {
                        bookingStatus: 'Confirmed',
                    }, { new: true }).lean();
                    await commitBookingResources(payment); // COMMIT HOTEL ROOMS
                } else if (payment.paymentType === 'bus') {
                    updatedRecord = await BusBooking.findByIdAndUpdate(payment.orderId, {
                        status: 'confirmed'
                    }, { new: true }).lean();
                    await commitBookingResources(payment); // COMMIT BUS SEATS
                }

                return {
                    success: true,
                    status: 'COMPLETED',
                    data: response,
                    order: updatedRecord,
                    justPaid: true
                };
            } else if (state === 'FAILED') {
                payment.status = 'FAILED';
                await payment.save();
                
                if (payment.paymentType === 'quick' || payment.paymentType === 'ecommerce') {
                    const mainOrder = await Order.findById(payment.orderId);
                    if (mainOrder?.parentOrderId) {
                        await Order.updateMany({ parentOrderId: mainOrder.parentOrderId }, { paymentStatus: 'Failed' });
                    } else {
                        await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'Failed' });
                    }
                    // RELEASE STOCK LOCKS
                    await InventoryService.releaseProductLocks(payment.userId.toString());
                } else if (payment.paymentType === 'hotel') {
                    await HotelBooking.findByIdAndUpdate(payment.orderId, { bookingStatus: 'Cancelled', paymentStatus: 'Failed' });
                } else if (payment.paymentType === 'bus') {
                    await BusBooking.findByIdAndUpdate(payment.orderId, { status: 'cancelled' });
                    // RELEASE SEAT LOCKS
                    await InventoryService.releaseSeatLocks(payment.userId.toString());
                }
            }
        }

        return {
            success: true,
            status: state,
            data: response
        };

    } catch (error: any) {
        console.error('[PhonePe] Status Check Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 3. Handle Callback (Webhook)
 */
export const handlePhonePeCallback = async (body: any) => {
    try {
        const responseData = typeof body === 'string' ? JSON.parse(body) : body;
        if (!responseData.response) throw new Error('Invalid callback payload format');

        const decoded = JSON.parse(Buffer.from(responseData.response, 'base64').toString('utf-8'));
        const { merchantTransactionId, state, transactionId } = decoded.data;

        const payment = await Payment.findOne({ phonePeOrderId: merchantTransactionId });
        if (!payment || payment.status !== 'PENDING') return { success: true };

        if (state === 'COMPLETED') {
            payment.status = 'SUCCESS';
            payment.transactionId = transactionId;
            payment.paidAt = new Date();
            await payment.save();

            let updatedRecord: any;

            if (payment.paymentType === 'quick' || payment.paymentType === 'ecommerce') {
                const mainOrder = await Order.findById(payment.orderId);
                if (mainOrder?.parentOrderId) {
                    await Order.updateMany({ parentOrderId: mainOrder.parentOrderId }, {
                        paymentStatus: 'Paid',
                        paymentId: transactionId,
                        status: 'Received'
                    });
                } else {
                    await Order.findByIdAndUpdate(payment.orderId, {
                        paymentStatus: 'Paid',
                        paymentId: transactionId,
                        status: 'Received'
                    });
                }
                await InventoryService.confirmProductLocks(payment.userId.toString());
                updatedRecord = await Order.findById(payment.orderId).lean();
            } else if (payment.paymentType === 'hotel') {
                updatedRecord = await HotelBooking.findByIdAndUpdate(payment.orderId, {
                    bookingStatus: 'Confirmed',
                }, { new: true }).lean();
                await commitBookingResources(payment);
            } else if (payment.paymentType === 'bus') {
                updatedRecord = await BusBooking.findByIdAndUpdate(payment.orderId, {
                    status: 'confirmed'
                }, { new: true }).lean();
                await commitBookingResources(payment);
            }

            return { success: true, order: updatedRecord, justPaid: true };
        } else if (state === 'FAILED') {
            payment.status = 'FAILED';
            await payment.save();
            
            if (payment.paymentType === 'quick' || payment.paymentType === 'ecommerce') {
                const mainOrder = await Order.findById(payment.orderId);
                if (mainOrder?.parentOrderId) {
                    await Order.updateMany({ parentOrderId: mainOrder.parentOrderId }, { paymentStatus: 'Failed' });
                } else {
                    await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'Failed' });
                }
                await InventoryService.releaseProductLocks(payment.userId.toString());
            } else if (payment.paymentType === 'hotel') {
                await HotelBooking.findByIdAndUpdate(payment.orderId, { bookingStatus: 'Cancelled', paymentStatus: 'Failed' });
            } else if (payment.paymentType === 'bus') {
                await BusBooking.findByIdAndUpdate(payment.orderId, { status: 'cancelled' });
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('[PhonePe] Callback Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 4. Process Refund
 */
export const processPhonePeRefund = async (paymentId: string, amount?: number) => {
    try {
        const client = getPhonePeClient();
        const payment = await Payment.findById(paymentId);
        if (!payment || !payment.phonePeOrderId) throw new Error('Payment not found');

        const refundTxnId = `RTX${Date.now()}${crypto.randomBytes(2).toString('hex')}`;
        const refundAmount = Math.round((amount || payment.amount) * 100);

        const refundResponse: any = await client.refund({
            transactionId: refundTxnId,
            originalTransactionId: payment.phonePeOrderId,
            amount: refundAmount
        } as any);

        if (((refundResponse as any).success)) {
            payment.status = 'FAILED'; // Marking as failed in the new simplified schema if it was refunded? 
            // Actually, the user's schema only has PENDING, SUCCESS, FAILED. 
            // I'll stick to those. FAILED seems most appropriate for a reversed transaction if we can't have 'REFUNDED'.
            // Alternatively, I should have kept REFUNDED.
            // But I'll follow the user's explicit status list.
            payment.status = 'FAILED'; 
            payment.refundAmount = amount || payment.amount;
            payment.refundedAt = new Date();
            await payment.save();
            return { success: true, message: 'Refund successful' };
        }
        return { success: false, message: (refundResponse as any).message || 'Refund failed' };
    } catch (error: any) {
        console.error('[PhonePe] Refund Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * 5. Commit Resources (Private Helper)
 * Locks seats for bus or decrements availability for hotel
 */
import HotelRoom from '../models/HotelRoom';
import BusSchedule from '../models/BusSchedule';

async function commitBookingResources(payment: any) {
    try {
        console.log(`[PaymentService] Committing resources for type: ${payment.paymentType}, ID: ${payment.orderId}`);
        
        if (payment.paymentType === 'hotel') {
            const booking = await HotelBooking.findById(payment.orderId);
            if (!booking) return;

            // --- NEW: ROOM AVAILABILITY LAYER ---
            await InventoryService.confirmRoomBooking(
                booking.hotelId.toString(),
                booking.roomId.toString(),
                booking.checkIn,
                booking.checkOut,
                1 // Assuming 1 room per booking for now or update booking schema
            );
            // ------------------------------------

            // Decrement rooms for each room type booked
            const room = await HotelRoom.findById(booking.roomId);
            if (room) {
                room.availableRooms = Math.max(0, room.availableRooms - 1);
                if (room.availableRooms === 0) {
                    room.status = 'Full';
                }
                await room.save();
                console.log(`[Hotel] Room ${room.roomType} availability reduced. Remaining: ${room.availableRooms}`);
            }

        } else if (payment.paymentType === 'bus') {
            const booking = await BusBooking.findById(payment.orderId);
            if (!booking) return;

            const schedule = await BusSchedule.findById(booking.scheduleId);
            if (!schedule) return;

            const seatNums = booking.seats.map(s => s.seatNumber);
            
            // Mark seats as booked
            schedule.seats = schedule.seats.map(s => {
                if (seatNums.includes(s.seatNumber)) {
                    return { ...s, isBooked: true };
                }
                return s;
            });

            await schedule.save();
            
            // --- NEW: SEAT LOCKING LAYER ---
            await InventoryService.releaseSeatLocks(payment.userId.toString());
            // -------------------------------

            console.log(`[Bus] Schedule ${booking.scheduleId} seats locked: ${seatNums.join(', ')}`);
        }
    } catch (err) {
        console.error('[PaymentService] Resource Commitment Failed:', err);
    }
}
