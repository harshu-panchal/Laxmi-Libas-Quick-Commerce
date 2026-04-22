import Notification from '../models/Notification';
import { Server } from 'socket.io';

export const createNotification = async (
  io: Server | any,
  data: {
    userId?: string;
    role: 'admin' | 'seller' | 'user';
    type: 'booking' | 'approval' | 'system' | 'low_inventory';
    message: string;
    payload?: any;
  }
) => {
  try {
    const notification = new Notification({
      userId: data.userId,
      role: data.role,
      type: data.type,
      message: data.message,
      data: data.payload,
    });

    await notification.save();

    // Emit via socket if io is available
    if (io) {
      if (data.userId) {
        // Targeted notification
        io.to(`user-${data.userId}`).emit('notification', notification);
        if (data.role === 'seller') {
          io.to(`seller-${data.userId}`).emit('notification', notification);
        }
      } else {
        // Role-based broadcast
        io.to(`role-${data.role}`).emit('notification', notification);
      }
      
      // Always notify admin for certain types
      if (['booking', 'approval'].includes(data.type)) {
        io.to('role-admin').emit('notification', notification);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
