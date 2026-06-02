import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getSocketBaseURL } from '../services/api/config';

function resolveUserId(user: { id?: string; userId?: string } | null): string {
  if (!user) return '';
  return String(user.id || user.userId || '').trim();
}

export const useSocket = () => {
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const userId = resolveUserId(user);
    const socketInstance = io(getSocketBaseURL(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      if (userId) {
        socketInstance.emit('join-user-room', userId);
      }
      if (user?.userType === 'Admin') {
        socketInstance.emit('join-admin-room');
      } else if (user?.userType === 'Seller' && userId) {
        socketInstance.emit('join-seller-room', userId);
      } else if (user?.userType === 'Delivery' && userId) {
        socketInstance.emit('join-delivery-notifications', userId);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, isAuthenticated, user?.userType, user?.id, user?.userId]);

  return {
    socket,
    isConnected,
  };
};
