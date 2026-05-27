import { Server as SocketIOServer } from 'socket.io';
import OrderItem from '../models/OrderItem';
import mongoose from 'mongoose';

function sellerIdFromItem(item: any): string {
    if (!item?.seller) return '';
    if (typeof item.seller === 'object' && item.seller._id) {
        return item.seller._id.toString();
    }
    return String(item.seller);
}

/** Build seller popup payload (socket + polling fallback). */
export function buildSellerNotificationPayload(
    order: any,
    sellerId: string,
    orderItems: any[],
    type: 'NEW_ORDER' | 'STATUS_UPDATE' | 'ORDER_CANCELLED' | 'BROADCAST_FAILED' = 'NEW_ORDER'
) {
    const sellerSpecificItems = orderItems.filter(
        (item: any) => sellerIdFromItem(item) === sellerId
    );

    return {
        type,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customer: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone,
            address: order.deliveryAddress,
        },
        items: sellerSpecificItems.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.total,
            variation: item.variation,
        })),
        totalAmount: sellerSpecificItems.reduce((acc: number, item: any) => acc + item.total, 0),
        timestamp: new Date(),
    };
}

/**
 * Notify all sellers involved in an order about a new order or status change
 */
export async function notifySellersOfOrderUpdate(
    io: SocketIOServer,
    order: any,
    type: 'NEW_ORDER' | 'STATUS_UPDATE' | 'ORDER_CANCELLED' | 'BROADCAST_FAILED'
): Promise<void> {
    try {
        if (!io) {
            console.error('Socket.io server not provided to notifySellersOfOrderUpdate');
            return;
        }

        // Get all unique seller IDs from order items
        // If items are populated, we can get them directly, otherwise we need to query
        let orderItems = order.items;

        // If items are just IDs or strings, fetch the full OrderItem details to get seller IDs
        if (orderItems.length > 0 && (typeof orderItems[0] === 'string' || orderItems[0] instanceof mongoose.Types.ObjectId || !orderItems[0].seller)) {
            console.log(`📦 Fetching full items for order ${order.orderNumber} to notify sellers`);
            orderItems = await OrderItem.find({ order: order._id });
        }

        const sellerIds = [...new Set(
            orderItems.map(sellerIdFromItem).filter((idStr: string) => !!idStr)
        )];

        console.log(`🔔 Notifying ${sellerIds.length} sellers about ${type} for order ${order.orderNumber}`);

        for (const _sid of sellerIds) {
            const sellerId = _sid as string;
            // Get only items belonging to this seller
            const notificationData = buildSellerNotificationPayload(
                order,
                sellerId,
                orderItems,
                type
            );

            // Emit to seller-specific room
            io.to(`seller:${sellerId}`).emit('seller-notification', notificationData);
            
            // Send real Push Notification via FCM
            try {
                const { sendNotificationToUser } = await import('./firebaseAdmin');
                if (type === 'NEW_ORDER') {
                    sendNotificationToUser(sellerId, 'Seller', {
                        title: '🛍️ New Order Received!',
                        body: `You have a new order #${order.orderNumber}. Open the app to accept it.`,
                        data: { type: 'NEW_ORDER', orderId: order._id.toString() }
                    });
                } else if (type === 'ORDER_CANCELLED') {
                    sendNotificationToUser(sellerId, 'Seller', {
                        title: '❌ Order Cancelled',
                        body: `Order #${order.orderNumber} has been cancelled by the customer.`,
                        data: { type: 'ORDER_CANCELLED', orderId: order._id.toString() }
                    });
                }
            } catch (fcmError) {
                console.error(`Error sending FCM to seller ${sellerId}:`, fcmError);
            }
            
            // For new orders, emit 'order:new' specifically as requested
            if (type === 'NEW_ORDER') {
                io.to(`seller:${sellerId}`).emit('order:new', notificationData);
            }
            
            console.log(`📤 Emitted notification to seller:${sellerId}`);
        }
    } catch (error) {
        console.error('Error in notifySellersOfOrderUpdate:', error);
    }
}
