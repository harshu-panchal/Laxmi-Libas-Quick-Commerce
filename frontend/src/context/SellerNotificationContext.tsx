/* @refresh reset */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { getPendingOrderNotifications } from '../services/api/orderService';
import { subscribeSellerNotifications, getSellerSocket } from '../services/sellerSocketManager';
import type { SellerNotification } from '../modules/seller/hooks/useSellerSocket';
import SellerNotificationAlert from '../modules/seller/components/SellerNotificationAlert';

const POLL_MS = 6000;
const DISMISSED_KEY = 'seller_dismissed_orders';

interface NotificationState {
  current: SellerNotification | null;
  queue: SellerNotification[];
}

interface SellerNotificationContextValue {
  currentNotification: SellerNotification | null;
  isConnected: boolean;
  clearNotification: () => void;
}

const SellerNotificationContext = createContext<SellerNotificationContextValue | null>(null);

function normalizeUserId(id: unknown): string {
  if (!id) return '';
  if (typeof id === 'string') return id.trim();
  if (typeof id === 'object' && id !== null) {
    const o = id as Record<string, unknown>;
    if (typeof o.$oid === 'string') return o.$oid;
    if (o._id) return String(o._id);
  }
  return String(id).trim();
}

function loadDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

function normalizeSellerNotification(raw: Record<string, unknown>): SellerNotification | null {
  const orderId = String(raw.orderId || '');
  if (!orderId) return null;

  const customer = (raw.customer as SellerNotification['customer']) || {
    name: String(raw.customerName || 'Customer'),
    email: '',
    phone: String(raw.customerPhone || ''),
    address: { address: '', city: '', pincode: '' },
  };

  const items = Array.isArray(raw.items) ? (raw.items as SellerNotification['items']) : [];
  const status = String(raw.status || 'Received');
  let type = (raw.type as SellerNotification['type']) || 'NEW_ORDER';
  if (status === 'Received') type = 'NEW_ORDER';

  return {
    type,
    orderId,
    orderNumber: String(raw.orderNumber || orderId),
    status,
    paymentStatus: String(raw.paymentStatus || ''),
    customer,
    items,
    totalAmount: Number(raw.totalAmount ?? 0),
    timestamp: raw.timestamp ? new Date(raw.timestamp as string | Date) : new Date(),
  };
}

export function dispatchSellerNewOrderEvent(notification: SellerNotification) {
  window.dispatchEvent(new CustomEvent('seller-new-order', { detail: notification }));
}

export function SellerNotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, token } = useAuth();
  const [notifState, setNotifState] = useState<NotificationState>({
    current: null,
    queue: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const dismissedRef = useRef<Set<string>>(loadDismissed());

  const pushNotification = useCallback((raw: Record<string, unknown>) => {
    const notification = normalizeSellerNotification(raw);
    if (!notification || notification.status !== 'Received') return;
    if (dismissedRef.current.has(notification.orderId)) return;

    console.log('🔔 Seller order alert:', notification.orderNumber);
    dispatchSellerNewOrderEvent(notification);

    setNotifState((prev) => {
      const sameId = (n: SellerNotification) => n.orderId === notification.orderId;
      if (prev.current && sameId(prev.current)) {
        return { ...prev, current: notification };
      }
      if (prev.queue.some(sameId)) return prev;
      if (prev.current) {
        return { ...prev, queue: [...prev.queue, notification] };
      }
      return { ...prev, current: notification };
    });
  }, []);

  const pushRef = useRef(pushNotification);
  pushRef.current = pushNotification;

  const pollPending = useCallback(async () => {
    if (!isAuthenticated || user?.userType !== 'Seller') return;
    try {
      const res = await getPendingOrderNotifications();
      if (!res.success || !Array.isArray(res.data)) return;
      for (const raw of res.data) {
        pushRef.current(raw as Record<string, unknown>);
      }
    } catch (e) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status !== 404) {
        console.warn('[SellerNotifications] poll failed:', e);
      }
    }
  }, [isAuthenticated, user?.userType]);

  const clearNotification = useCallback(() => {
    setNotifState((prev) => {
      if (prev.current) {
        dismissedRef.current.add(prev.current.orderId);
        saveDismissed(dismissedRef.current);
      }
      const next = prev.queue[0] || null;
      return { current: next, queue: prev.queue.slice(1) };
    });
  }, []);

  useEffect(() => {
    const sellerId = normalizeUserId(user?.id);
    const authToken = token || localStorage.getItem('authToken');
    if (!isAuthenticated || user?.userType !== 'Seller' || !sellerId || !authToken) {
      setIsConnected(false);
      return;
    }

    const unsub = subscribeSellerNotifications(sellerId, authToken, (p) => pushRef.current(p));

    const sync = () => setIsConnected(!!getSellerSocket()?.connected);
    sync();
    const sock = getSellerSocket();
    sock?.on('connect', sync);
    sock?.on('disconnect', sync);

    void pollPending();
    const pollId = window.setInterval(() => void pollPending(), POLL_MS);

    return () => {
      clearInterval(pollId);
      sock?.off('connect', sync);
      sock?.off('disconnect', sync);
      unsub();
    };
  }, [isAuthenticated, user?.id, user?.userType, token, pollPending]);

  const value: SellerNotificationContextValue = {
    currentNotification: notifState.current,
    isConnected,
    clearNotification,
  };

  return (
    <SellerNotificationContext.Provider value={value}>
      <AnimatePresence>
        {notifState.current && (
          <SellerNotificationAlert
            key={notifState.current.orderId}
            notification={notifState.current}
            onClose={clearNotification}
          />
        )}
      </AnimatePresence>
      {children}
    </SellerNotificationContext.Provider>
  );
}

export function useSellerNotifications() {
  const ctx = useContext(SellerNotificationContext);
  if (!ctx) {
    throw new Error('useSellerNotifications must be used within SellerNotificationProvider');
  }
  return ctx;
}
