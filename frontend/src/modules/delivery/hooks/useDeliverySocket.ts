import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketBaseURL } from '../../../services/api/config';

export const useDeliverySocket = (onNotification?: (notification: any) => void) => {
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Get delivery boy ID from token or storage
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;
    
    let deliveryBoyId = '';
    try {
      const userData = JSON.parse(userDataStr);
      deliveryBoyId = userData.id || userData._id;
    } catch (e) {
      console.error('Failed to parse userData in useDeliverySocket:', e);
      return;
    }

    if (!deliveryBoyId) return;

    const socketUrl = getSocketBaseURL();
    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to delivery socket');
      // Join general and individual delivery rooms
      socket.emit('join-delivery-notifications', deliveryBoyId);
    });

    socket.on('new-order', (orderData) => {
      console.log('New order received on local page listener:', orderData);
      
      // We do not play sound or show Toast here, because the main DeliveryLayout
      // (useDeliveryOrderNotifications) already manages the global order queue,
      // displaying the OrderNotificationCard which plays the ringtone.
      // We only notify the component so it can auto-refresh lists/counters.
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
