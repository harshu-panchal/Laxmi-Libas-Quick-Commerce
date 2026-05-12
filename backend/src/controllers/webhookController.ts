import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import Order from '../models/Order';
import { OrderSettlementService } from '../services/orderSettlementService';
import { notifySellersOfOrderUpdate } from '../services/sellerNotificationService';
import { createNotification } from '../utils/notificationHelper';

/**
 * Handle Delhivery Webhook Status Updates
 * 
 * Delhivery sends post-back updates to this endpoint.
 * Payload usually contains: waybill, status, status_time, location, etc.
 */
export const handleCourierWebhook = asyncHandler(
    async (req: Request, res: Response) => {
        const data = req.body;
        
        // 1. Security Check (Optional but recommended)
        const apiKey = req.headers['x-api-key'];
        if (process.env.COURIER_WEBHOOK_KEY && apiKey !== process.env.COURIER_WEBHOOK_KEY) {
            console.warn('[Webhook] Unauthorized access attempt with key:', apiKey);
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        console.log('[Webhook] Received courier update:', JSON.stringify(data));

        // 2. Extract identifiers
        // Note: Delhivery payload fields might vary depending on their specific webhook version.
        // We assume 'waybill' and 'status' are present.
        const trackingId = data.waybill || data.awb || data.tracking_id || data.trackingId;
        const courierStatus = (data.status || '').toUpperCase();

        if (!trackingId) {
            return res.status(400).json({ success: false, message: 'Missing tracking identifier' });
        }

        // 3. Find Order
        const order = await Order.findOne({ trackingId });
        if (!order) {
            console.warn('[Webhook] Order not found for tracking ID:', trackingId);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // 4. Map Status and Update History
        let systemStatus = order.status;
        
        // Delhivery common status codes:
        // DL: Delivered
        // SHP: Shipped
        // IT: In Transit
        // OFD: Out for Delivery
        // CAN: Cancelled
        // RTN: Returned
        
        switch (courierStatus) {
            case 'SHP':
            case 'SHIPPED':
                systemStatus = 'Shipped';
                break;
            case 'IT':
            case 'IN_TRANSIT':
            case 'IN-TRANSIT':
                systemStatus = 'On the way';
                break;
            case 'OFD':
            case 'OUT_FOR_DELIVERY':
                systemStatus = 'Out for Delivery';
                break;
            case 'DL':
            case 'DELIVERED':
                systemStatus = 'Delivered';
                order.paymentStatus = 'settled';
                // Attach Delivery Proof image if sent by courier partner or webhook simulator
                const podUrl = data.pod || data.pod_image || data.pod_url || data.image_url || data.podUrl;
                if (podUrl) {
                    order.deliveryProofImage = podUrl;
                    order.deliveryProofTimestamp = data.status_time || new Date();
                    console.log(`[Webhook] Captured Delivery Proof POD Image for order ${order.orderNumber}: ${podUrl}`);
                }
                break;
            case 'CAN':
            case 'CANCELLED':
                systemStatus = 'Cancelled';
                break;
            case 'RTN':
            case 'RETURNED':
                systemStatus = 'Returned';
                break;
        }

        const previousStatus = order.status;
        order.status = systemStatus as any;

        // 5. Save tracking history
        order.trackingStatus = courierStatus;
        if (!order.trackingHistory) order.trackingHistory = [];
        order.trackingHistory.push({
            status: systemStatus,
            location: data.location || 'Hub Center',
            description: data.description || `Shipment status updated to ${systemStatus}`,
            timestamp: data.status_time || new Date(),
        });

        await order.save();
        console.log(`[Webhook] Updated Order ${order.orderNumber} status: ${previousStatus} -> ${systemStatus}`);

        // Broadcast update via Socket.io for live UI syncing
        const io = (req.app as any).get("io");
        if (io) {
            io.to(`order-${order._id.toString()}`).emit("order-status-update", {
                orderId: order._id.toString(),
                status: systemStatus,
                trackingHistory: order.trackingHistory
            });
            console.log(`[Webhook] Broadcasted live socket update to order-${order._id.toString()}`);
        }

        // 6. Trigger Payment Settlement on Delivery
        if (systemStatus === 'Delivered' && previousStatus !== 'Delivered') {
            try {
                console.log(`[Webhook] Triggering settlement for Order ${order.orderNumber}`);
                await OrderSettlementService.settleOrder(order._id.toString());

                // Notify Sellers via Socket.io
                if (io) {
                    await notifySellersOfOrderUpdate(io, order, 'STATUS_UPDATE');
                }

                // Acknowledge Admin and Seller with in-app notifications
                const message = `Order #${order.orderNumber} has been successfully delivered and payment is settled!`;
                console.log(`[Webhook] Notifying admin and sellers about delivery: ${message}`);

                // Create notification for admin
                await createNotification(io, {
                    role: 'admin',
                    type: 'system',
                    message,
                    payload: { orderId: order._id.toString(), status: 'Delivered' }
                });

                // Fetch seller IDs from order items to create individual notifications
                const orderItems = await mongoose.model('OrderItem').find({ order: order._id });
                const sellerIds = [...new Set(orderItems.map((item: any) => item.seller?.toString()).filter(id => !!id))];

                for (const sellerId of sellerIds) {
                    await createNotification(io, {
                        userId: sellerId,
                        role: 'seller',
                        type: 'system',
                        message: `Congratulations! Your Order #${order.orderNumber} has been delivered and earnings are credited to your wallet.`,
                        payload: { orderId: order._id.toString(), status: 'Delivered' }
                    });
                }
            } catch (settleError: any) {
                console.error(`[Webhook] Settlement/Notification failed for Order ${order.orderNumber}:`, settleError.message);
                // We return 200 anyway so they don't retry, but we've logged the error
            }
        }

        return res.status(200).json({ success: true, message: 'Status updated' });
    }
);
