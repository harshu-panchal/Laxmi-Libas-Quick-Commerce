import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { OrderNotificationData } from '../../../services/api/delivery/deliveryOrderNotificationService';
import {
  isOrderAlertSoundUnlocked,
  playOrderAlertSound,
  primeOrderAlertSound,
  stopOrderAlertSound,
} from '../../../utils/orderAlertSound';

interface OrderNotificationCardProps {
    notification: OrderNotificationData;
    onAccept: (orderId: string) => Promise<{ success: boolean; message: string }>;
    onReject: (orderId: string) => Promise<{ success: boolean; message: string; allRejected: boolean }>;
}

export default function OrderNotificationCard({
    notification,
    onAccept,
    onReject,
}: OrderNotificationCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const vibrationPatternRef = useRef<number[]>([200, 100, 200, 100, 200]);

    // Vibrate on notification (if supported)
    const vibrate = useCallback((pattern?: number | number[]) => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern || vibrationPatternRef.current);
            } catch (error) {
                console.log('Vibration not supported or blocked:', error);
            }
        }
    }, []);

    useEffect(() => {
        vibrate();

        if (isOrderAlertSoundUnlocked('delivery')) {
            playOrderAlertSound({ variant: 'delivery', volume: 0.85, loop: true });
            setHasUserInteracted(true);
            setAudioError(null);
        } else {
            setAudioError('Tap card to enable sound');
        }

        return () => {
            stopOrderAlertSound();
        };
    }, [vibrate]);

    const handleUserInteraction = () => {
        if (!hasUserInteracted) {
            const ok = primeOrderAlertSound('delivery');
            if (ok) {
                playOrderAlertSound({ variant: 'delivery', volume: 0.85, loop: true });
                setHasUserInteracted(true);
                setAudioError(null);
            } else {
                setAudioError('Tap to enable sound');
            }
        }
    };

    const pauseAlert = () => {
        stopOrderAlertSound();
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    };

    const resumeAlert = () => {
        if (hasUserInteracted || isOrderAlertSoundUnlocked('delivery')) {
            playOrderAlertSound({ variant: 'delivery', volume: 0.85, loop: true });
            vibrate();
        }
    };

    const handleAccept = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        pauseAlert();

        try {
            const result = await onAccept(notification.orderId);
            if (!result.success) {
                // Suppress alert for "Order notification not found" as it's handled by the hook clearing the notification
                if (result.message !== 'Order notification not found') {
                    alert(result.message || 'Failed to accept order');
                }
                setIsProcessing(false);
                resumeAlert();
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('Failed to accept order');
            setIsProcessing(false);
            resumeAlert();
        }
    };

    const handleReject = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        pauseAlert();

        try {
            const result = await onReject(notification.orderId);
            if (!result.success) {
                // Suppress alert for "Order notification not found"
                if (result.message !== 'Order notification not found') {
                    alert(result.message || 'Failed to reject order');
                }
                resumeAlert();
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            alert('Failed to reject order');
            resumeAlert();
        } finally {
            setIsProcessing(false);
        }
    };

    const formatAddress = () => {
        const { address, city, state, pincode, landmark } = notification.deliveryAddress;
        return `${address}${landmark ? `, Near ${landmark}` : ''}, ${city}${state ? `, ${state}` : ''} - ${pincode}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-4 right-4 sm:top-4 sm:left-auto sm:right-4 sm:w-auto sm:max-w-md z-50"
            onClick={handleUserInteraction}
            onMouseEnter={handleUserInteraction}
            onTouchStart={handleUserInteraction}
            style={{
                // Support for safe area insets (iOS notches, etc.)
                paddingTop: 'env(safe-area-inset-top, 0)',
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl border-2 border-teal-500 p-4 sm:p-6">
                {/* Header with pulsing indicator */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-neutral-900">New Order!</h3>
                    </div>
                    {(audioError || !hasUserInteracted) && (
                        <div className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded whitespace-nowrap">
                            {audioError || 'Tap to enable sound'}
                        </div>
                    )}
                </div>

                {/* Order Information */}
                <div className="space-y-3 mb-4">
                    <div>
                        <p className="text-xs sm:text-sm text-neutral-600">Order Number</p>
                        <p className="text-base sm:text-lg font-semibold text-neutral-900 break-all">{notification.orderNumber}</p>
                    </div>

                    <div>
                        <p className="text-xs sm:text-sm text-neutral-600">Customer</p>
                        <p className="text-sm sm:text-base font-medium text-neutral-900 break-words">{notification.customerName}</p>
                        <p className="text-xs sm:text-sm text-neutral-500 break-all">{notification.customerPhone}</p>
                    </div>

                    <div>
                        <p className="text-xs sm:text-sm text-neutral-600">Delivery Address</p>
                        <p className="text-xs sm:text-sm text-neutral-900 break-words leading-relaxed">{formatAddress()}</p>
                    </div>

                    <div>
                        <p className="text-xs sm:text-sm text-neutral-600">Order Amount</p>
                        <p className="text-lg sm:text-xl font-bold text-teal-600">₹{notification.total.toFixed(2)}</p>
                    </div>

                    {/* Delivery Boy Earning - Highlighted Section */}
                    <div className="bg-gradient-to-r from-yellow-50 to-emerald-50 border border-yellow-200 rounded-lg p-3 -mx-1">
                        <p className="text-xs sm:text-sm text-yellow-700 font-medium flex items-center gap-1">
                            <span className="text-primary-dark">💰</span> Your Earning
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-primary-dark">
                            ₹{notification.deliveryBoyEarning?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 sm:py-3 bg-neutral-100 active:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {isProcessing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 sm:py-3 bg-teal-600 active:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        {isProcessing ? 'Processing...' : 'Accept'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

