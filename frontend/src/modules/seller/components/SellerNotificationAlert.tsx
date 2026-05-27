import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { SellerNotification } from '../hooks/useSellerSocket';
import { updateOrderStatus } from '../../../services/api/orderService';
import { useNavigate } from 'react-router-dom';
import {
  isOrderAlertSoundUnlocked,
  playOrderAlertSound,
  primeOrderAlertSound,
  stopOrderAlertSound,
} from '../../../utils/orderAlertSound';

interface SellerNotificationAlertProps {
  notification: SellerNotification;
  onClose: () => void;
}

const SellerNotificationAlert: React.FC<SellerNotificationAlertProps> = ({ notification, onClose }) => {
  const [volume] = useState(0.85);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const vibrationPatternRef = useRef<number[]>([200, 100, 200, 100, 200]);

  const vibrate = useCallback((pattern?: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern || vibrationPatternRef.current);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const shouldPlayRing = notification.type === 'NEW_ORDER';
  const showSellerActions = notification.status === 'Received';

  useEffect(() => {
    if (!shouldPlayRing) return;

    vibrate();
    playOrderAlertSound({ variant: 'seller', volume, loop: true });
    if (isOrderAlertSoundUnlocked('seller')) {
      setHasUserInteracted(true);
      setAudioError(null);
    } else {
      setAudioError('Tap popup to enable sound');
    }

    return () => {
      stopOrderAlertSound();
    };
  }, [notification.orderId, shouldPlayRing, vibrate, volume]);

  const handleUserInteraction = () => {
    if (!hasUserInteracted) {
      const ok = primeOrderAlertSound('seller');
      if (ok) {
        playOrderAlertSound({ variant: 'seller', volume, loop: true });
        setHasUserInteracted(true);
        setAudioError(null);
      } else {
        setAudioError('Tap to enable sound');
      }
    }
  };

  const handleClose = () => {
    stopOrderAlertSound();
    if ('vibrate' in navigator) navigator.vibrate(0);
    onClose();
  };

  const handleStatusUpdate = async (status: string) => {
    setLoading(true);
    stopOrderAlertSound();
    if ('vibrate' in navigator) navigator.vibrate(0);
    try {
      await updateOrderStatus(notification.orderId, { status: status as 'Accepted' | 'Rejected' });
      onClose();
      if (status === 'Accepted') {
        navigate(`/seller/orders/${notification.orderId}`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const customer = notification.customer || {
    name: 'Customer',
    email: '',
    phone: '',
    address: { address: '', city: '', pincode: '' },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-teal-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            showSellerActions ? 'bg-teal-600' : 'bg-blue-600'
          } text-white`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {showSellerActions ? 'New Order Received!' : 'Order Status Updated'}
              </h2>
              <p className="text-sm opacity-90">#{notification.orderNumber}</p>
            </div>
          </div>
          {(audioError || !hasUserInteracted) && shouldPlayRing && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded">{audioError || 'Tap for sound'}</span>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:bg-white/10 p-1 rounded-full ml-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {showSellerActions && (
            <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Agar aap 2 minute ke andar accept nahi karte, order automatically accept ho jayega.
            </p>
          )}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Customer Information
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="font-bold text-neutral-800 text-lg">{customer.name}</p>
              {customer.phone && (
                <p className="text-neutral-600 mt-1">📞 {customer.phone}</p>
              )}
              {customer.address?.address && (
                <p className="text-neutral-600 mt-2 text-sm">
                  📍 {customer.address.address}, {customer.address.city}, {customer.address.pincode}
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Order Details
            </h3>
            <div className="space-y-3">
              {(notification.items || []).map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start py-2 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-800">{item.productName}</p>
                    <p className="text-sm text-neutral-500">
                      Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-neutral-800">₹{Number(item.total).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t-2 border-neutral-100">
                <span className="text-lg font-bold text-neutral-800">Total (Your Items)</span>
                <span className="text-2xl font-black text-teal-600">
                  ₹{Number(notification.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-200">
          {showSellerActions ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleStatusUpdate('Accepted')}
                disabled={loading}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : 'Accept Order'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reject this order?')) {
                    void handleStatusUpdate('Rejected');
                  }
                }}
                disabled={loading}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : 'Reject Order'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700"
            >
              Acknowledge & Dismiss
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SellerNotificationAlert;
