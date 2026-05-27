import { io, Socket } from 'socket.io-client';
import { getSocketBaseURL } from './api/config';

type NotifyListener = (payload: Record<string, unknown>) => void;

let sharedSocket: Socket | null = null;
let boundSellerId: string | null = null;
let boundToken: string | null = null;
const listeners = new Set<NotifyListener>();

function attachSocketHandlers(socket: Socket) {
  socket.off('seller-notification');
  socket.off('order:new');

  socket.on('seller-notification', (payload: Record<string, unknown>) => {
    listeners.forEach((fn) => fn(payload));
  });

  socket.on('order:new', (payload: Record<string, unknown>) => {
    listeners.forEach((fn) => fn({ type: 'NEW_ORDER', ...payload }));
  });
}

function ensureSellerSocket(sellerId: string, token: string): Socket {
  if (
    sharedSocket &&
    boundSellerId === sellerId &&
    boundToken === token &&
    !sharedSocket.disconnected
  ) {
    return sharedSocket;
  }

  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
  }

  sharedSocket = io(getSocketBaseURL(), {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1500,
    timeout: 20000,
  });

  boundSellerId = sellerId;
  boundToken = token;
  attachSocketHandlers(sharedSocket);

  sharedSocket.on('connect', () => {
    console.log('🔌 Seller socket connected (shared)');
    sharedSocket?.emit('join-seller-room', sellerId);
  });

  sharedSocket.on('joined-seller-room', (data) => {
    console.log('📦 Joined seller room (shared):', data?.sellerId || sellerId);
  });

  sharedSocket.on('connect_error', (err) => {
    console.error('❌ Seller socket connect_error:', err.message);
  });

  return sharedSocket;
}

export function subscribeSellerNotifications(
  sellerId: string,
  token: string,
  onNotify: NotifyListener
): () => void {
  listeners.add(onNotify);
  ensureSellerSocket(sellerId, token);

  if (sharedSocket?.connected) {
    sharedSocket.emit('join-seller-room', sellerId);
  }

  return () => {
    listeners.delete(onNotify);
  };
}

export function getSellerSocket(): Socket | null {
  return sharedSocket;
}
