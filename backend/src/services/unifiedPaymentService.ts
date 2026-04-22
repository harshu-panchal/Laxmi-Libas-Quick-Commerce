import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from '@phonepe-pg/pg-sdk-node';
import Payment from '../models/Payment';
import Order from '../models/Order';
import crypto from 'crypto';
import mongoose from 'mongoose';
import BusBooking from '../models/BusBooking';
import HotelBooking from '../models/HotelBooking';
import Hotel from '../models/Hotel';
import Bus from '../models/Bus';
import { sendNotification } from './notificationService';
import { processBookingSettlement } from './settlementService';

const CLIENT_ID = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const CLIENT_VERSION = Number(process.env.PHONEPE_CLIENT_VERSION?.trim()) || 1;
const ENV_MODE = process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

let _client: StandardCheckoutClient | null = null;

export const getPhonePeClient = (): StandardCheckoutClient => {
    if (_client) return _client;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('[UnifiedPaymentService] Missing PhonePe credentials');
    }

    _client = StandardCheckoutClient.getInstance(
        CLIENT_ID,
        CLIENT_SECRET,
        CLIENT_VERSION,
        ENV_MODE
    );
    return _client;
};

/**
 * Create Payment Session
 */
export const createUnifiedPayment = async (orderId: string, paymentType: 'quick' | 'ecommerce' | 'hotel' | 'bus', userId: string, frontendUrl: string) => {
    try {
        const client = getPhonePeClient();

        let amountAmount = 0;
        let customerId = userId;
        let modelName = 'Order';

        if (paymentType === 'quick' || paymentType === 'ecommerce') {
            const order = await Order.findById(orderId);
            if (!order) throw new Error('Order not found');
            amountAmount = order.total;
            customerId = order.customer.toString();
        } else if (paymentType === 'hotel') {
            const booking = await HotelBooking.findById(orderId);
            if (!booking) throw new Error('Hotel booking not found');
            amountAmount = booking.totalAmount;
            customerId = booking.userId.toString();
            modelName = 'HotelBooking';
        } else if (paymentType === 'bus') {
            const booking = await BusBooking.findById(orderId);
            if (!booking) throw new Error('Bus booking not found');
            amountAmount = booking.totalAmount;
            customerId = booking.userId.toString();
            modelName = 'BusBooking';
        }

        const amountInPaise = Math.round(amountAmount * 100);
        const merchantOrderId = `MT${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(amountInPaise)
            .redirectUrl(`${frontendUrl}/payment/verify?merchantOrderId=${merchantOrderId}&paymentType=${paymentType}`)
            .build();

        const response = await client.pay(request);

        const payment = new Payment({
            orderId: new mongoose.Types.ObjectId(orderId),
            userId: new mongoose.Types.ObjectId(customerId),
            paymentType,
            amount: amountAmount,
            currency: 'INR',
            status: 'PENDING',
            phonePeOrderId: merchantOrderId,
            paymentMethod: 'Online',
            paymentGateway: 'PhonePe'
        });
        await payment.save();

        return {
            success: true,
            data: {
                redirectUrl: response.redirectUrl,
                merchantOrderId
            }
        };

    } catch (error: any) {
        console.error('[UnifiedPaymentService] create Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Verify Payment Status (Poll)
 */
export const verifyUnifiedPaymentStatus = async (merchantOrderId: string) => {
    try {
        const client = getPhonePeClient();
        const response = await client.getOrderStatus(merchantOrderId);
        const state = (response as any).state || (response as any).data?.state;

        const payment = await Payment.findOne({ phonePeOrderId: merchantOrderId });
        if (!payment) throw new Error('Payment record not found');

        if (payment.status === 'PENDING') {
            if (state === 'COMPLETED') {
                await updatePaymentSuccess(payment, (response as any).transactionId || (response as any).data?.transactionId);
                return { success: true, status: 'SUCCESS', data: response };
            } else if (state === 'FAILED') {
                payment.status = 'FAILED';
                await payment.save();
                
                // Send Failure Notification
                await sendNotification(
                    'Customer',
                    payment.userId.toString(),
                    'Payment Failed',
                    `Your payment of ₹${payment.amount} for order ${payment.phonePeOrderId} has failed.`,
                    { type: 'Payment', priority: 'High' }
                );
                
                return { success: true, status: 'FAILED', data: response };
            }
        }

        return { 
            success: true, 
            status: payment.status === 'SUCCESS' ? 'SUCCESS' : (payment.status === 'FAILED' ? 'FAILED' : 'PENDING'), 
            data: response 
        };
    } catch (error: any) {
        console.error('[UnifiedPaymentService] verify Error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Update Progress on Success
 */
const updatePaymentSuccess = async (payment: any, transactionId: string) => {
    payment.status = 'SUCCESS';
    payment.transactionId = transactionId;
    payment.paidAt = new Date();
    await payment.save();

    if (payment.paymentType === 'quick' || payment.paymentType === 'ecommerce') {
        const order = await Order.findById(payment.orderId);
        if (order) {
            order.paymentStatus = 'Paid';
            if (payment.paymentType === 'quick') {
                order.status = 'Received';
            } else {
                order.status = 'Accepted'; // 'CONFIRMED' for ecommerce
            }
            await order.save();

            // Send Success Notification
            await sendNotification(
                'Customer',
                payment.userId.toString(),
                'Payment Successful',
                `Your payment of ₹${payment.amount} was successful. Our team is preparing your order.`,
                { type: 'Payment', link: `/orders/${payment.orderId}`, priority: 'Medium' }
            );
        }
    } else if (payment.paymentType === 'hotel') {
        const booking = await HotelBooking.findById(payment.orderId);
        if (booking) {
            booking.paymentStatus = 'Success';
            booking.bookingStatus = 'Confirmed';
            booking.transactionId = transactionId;
            await booking.save();

            // Settlement Logic for Hotel Partner
            try {
                const hotel = await Hotel.findById(booking.hotelId);
                if (hotel && hotel.sellerId) {
                    await processBookingSettlement(
                        booking._id.toString(),
                        'hotel',
                        booking.totalAmount,
                        hotel.sellerId.toString()
                    );
                }
            } catch (settleError) {
                console.error('❌ [Settlement] Hotel Settlement Failed:', settleError);
            }

            await sendNotification(
                'Customer',
                payment.userId.toString(),
                'Booking Confirmed',
                `Your payment of ₹${payment.amount} was successful. Your hotel booking is now confirmed.`,
                { type: 'Payment', link: `/account`, priority: 'Medium' }
            );
        }
    } else if (payment.paymentType === 'bus') {
        const booking = await BusBooking.findById(payment.orderId);
        if (booking) {
            booking.paymentStatus = 'Success';
            booking.status = 'confirmed';
            booking.transactionId = transactionId;
            await booking.save();

            // Settlement Logic for Bus Partner
            try {
                const { default: BusSchedule } = await import('../models/BusSchedule');
                const schedule = await BusSchedule.findById(booking.scheduleId);
                const bus = schedule ? await Bus.findById(schedule.busId) : null;
                
                if (bus && bus.sellerId) {
                    await processBookingSettlement(
                        booking._id.toString(),
                        'bus',
                        booking.totalAmount,
                        bus.sellerId.toString()
                    );
                }
            } catch (settleError) {
                console.error('❌ [Settlement] Bus Settlement Failed:', settleError);
            }

            await sendNotification(
                'Customer',
                payment.userId.toString(),
                'Ticket Confirmed',
                `Your payment for the bus ticket was successful. Your journey is confirmed.`,
                { type: 'Order', link: `/store/travel/confirmation?type=bus&id=${booking._id}`, priority: 'High' }
            );
        }
    }
};

/**
 * Handle Webhook
 */
export const handleUnifiedWebhook = async (body: any) => {
    try {
        const responseData = typeof body === 'string' ? JSON.parse(body) : body;
        if (!responseData.response) throw new Error('Invalid payload');

        const decoded = JSON.parse(Buffer.from(responseData.response, 'base64').toString('utf-8'));
        const { merchantTransactionId, state, transactionId } = decoded.data;

        const payment = await Payment.findOne({ phonePeOrderId: merchantTransactionId });
        if (!payment || payment.status !== 'PENDING') return { success: true };

        if (state === 'COMPLETED') {
            await updatePaymentSuccess(payment, transactionId);
        } else if (state === 'FAILED') {
            payment.status = 'FAILED';
            await payment.save();

            await sendNotification(
                'Customer',
                payment.userId.toString(),
                'Payment Failed',
                `Your payment of ₹${payment.amount} has failed. Please try again or use a different method.`,
                { type: 'Payment', priority: 'High' }
            );
        }

        return { success: true };
    } catch (error: any) {
        console.error('[UnifiedPaymentService] Webhook Error:', error.message);
        return { success: false, message: error.message };
    }
};
