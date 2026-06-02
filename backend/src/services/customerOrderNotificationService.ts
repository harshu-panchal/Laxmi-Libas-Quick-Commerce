import { Server as SocketIOServer } from 'socket.io';
import { sendNotification } from './notificationService';

/**
 * Notify customer via socket (order room + user room) and FCM/in-app notification.
 */
export async function notifyCustomerOrderUpdate(
  io: SocketIOServer | null | undefined,
  order: {
    _id: { toString(): string } | string;
    orderNumber?: string;
    status?: string;
    customer?: { toString(): string } | string;
    trackingHistory?: unknown[];
  },
  title: string,
  message: string
): Promise<void> {
  const orderId =
    typeof order._id === 'string' ? order._id : order._id.toString();
  const customerId = order.customer
    ? typeof order.customer === 'string'
      ? order.customer
      : order.customer.toString()
    : '';

  if (io) {
    const payload = {
      orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingHistory: order.trackingHistory,
    };
    io.to(`order-${orderId}`).emit('order-status-update', payload);
    if (customerId) {
      io.to(`user-${customerId}`).emit('order-status-update', payload);
    }
  }

  if (customerId) {
    await sendNotification('Customer', customerId, title, message, {
      type: 'Order',
      link: `/orders/${orderId}`,
      priority: 'High',
    });
  }
}
