import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useDeliverySocket = (onNotification?: (notification: any) => void) => {
  useEffect(() => {
    const token = localStorage.getItem('deliveryToken');
    if (!token) return;

    // Get delivery boy ID from token or storage
    const deliveryBoyData = JSON.parse(localStorage.getItem('deliveryBoy') || '{}');
    const deliveryBoyId = deliveryBoyData._id;

    if (!deliveryBoyId) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      query: { userType: 'DeliveryBoy', userId: deliveryBoyId }
    });

    socket.on('connect', () => {
      console.log('Connected to delivery socket');
      // Join individual room
      socket.emit('join', `delivery-${deliveryBoyId}`);
      // Join general delivery room
      socket.emit('join', 'delivery-notifications');
    });

    const playNotificationSound = () => {
      try {
        const audio = new Audio('/assets/sound/delivery-alert.mp3');
        audio.play().catch(e => console.warn('🔊 Delivery sound play failed:', e.message));
      } catch (err) {
        console.error('🔊 Error playing delivery sound:', err);
      }
    };

    socket.on('new-order', (orderData) => {
      console.log('New order received:', orderData);
      
      // Play sound
      playNotificationSound();

      // Show toast notification
      toast.success(`New Delivery Request! ₹${orderData.deliveryBoyEarning}`, {
        duration: 10000,
        position: 'top-center',
        icon: '🚚',
      });

      if (onNotification) {
        onNotification({ type: 'NEW_ORDER', ...orderData });
      }
    });

    socket.on('order-accepted', (data) => {
        if (onNotification) {
            onNotification({ type: 'ORDER_ACCEPTED', ...data });
        }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from delivery socket');
    });

    return () => {
      socket.disconnect();
    };
  }, [onNotification]);
};
