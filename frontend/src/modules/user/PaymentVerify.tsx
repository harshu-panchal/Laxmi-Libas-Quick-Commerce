/**
 * @file PaymentVerify.tsx
 * @description Payment Verification Page — shown after user returns from PhonePe
 *
 * Flow:
 *  1. User lands here after PhonePe redirects back (redirectUrl from initiation)
 *  2. We read `merchantOrderId` from URL query params (PhonePe appends this)
 *  3. We call the backend to confirm payment status (prevents URL tampering)
 *  4. On SUCCESS → clear cart → redirect to /orders
 *  5. On FAILURE  → redirect back to /checkout
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { checkPhonePePaymentStatus } from '../../services/api/paymentService';

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifyStatus = 'verifying' | 'success' | 'failed';

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS  = 3000;

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentVerify: React.FC = () => {
    const [searchParams]        = useSearchParams();
    const navigate               = useNavigate();
    const { clearCart }          = useCart();

    const [status, setStatus]   = useState<VerifyStatus>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const [attempt, setAttempt] = useState(0);

    // ── Extract params PhonePe appends to the redirect URL ────────────────────
    // Old /payment/create returns merchantTransactionId; new returns merchantOrderId
    // Accept both for backward compat
    const merchantOrderId = searchParams.get('merchantOrderId')
        || searchParams.get('merchantTransactionId')
        || searchParams.get('transactionId')
        || searchParams.get('orderId')
        || localStorage.getItem('laxmart_pending_payment_id');

    const transactionId   = searchParams.get('transactionId');
    const amount          = searchParams.get('amount');

    // ─── Main Verification Effect ─────────────────────────────────────────────

    useEffect(() => {
        let isCancelled = false;

        const verifyPayment = async () => {
            // ── If no merchantOrderId, we cannot verify securely ────────────
            if (!merchantOrderId) {
                console.warn('[PaymentVerify] No merchantOrderId found in URL params or localStorage. SearchParams:', Object.fromEntries(searchParams.entries()));
                
                setMessage('Payment record not found. Redirecting to your orders...');
                await sleep(4000);
                if (!isCancelled) {
                    navigate('/orders');
                }
                return;
            }

            // ── Poll backend for confirmed status ────────────────────────────
            for (let i = 1; i <= MAX_POLL_ATTEMPTS; i++) {
                if (isCancelled) return;

                try {
                    setAttempt(i);
                    console.log(`[PaymentVerify] Poll attempt ${i}/${MAX_POLL_ATTEMPTS} for ${merchantOrderId}`);

                    const result = await checkPhonePePaymentStatus(merchantOrderId);

                    if (result?.success) {
                        if (result.status === 'success') {
                            // ── SUCCESS ──────────────────────────────────────
                            if (!isCancelled) {
                                const travelBooking = localStorage.getItem('activeTravelBooking');
                                if (travelBooking) {
                                    const data = JSON.parse(travelBooking);
                                    localStorage.removeItem('activeTravelBooking');
                                    setStatus('success');
                                    setMessage('Booking Confirmed! 🎉');
                                    
                                    const params = new URLSearchParams({
                                        type: data.type || 'hotel',
                                        operator: data.hotelName || data.operatorName || 'Travel Partner',
                                        total: data.totalAmount?.toString() || '0',
                                        seats: data.seats?.join(',') || '',
                                        id: data.bookingId
                                    });
                                    setTimeout(() => navigate(`/store/travel/confirmation?${params.toString()}`), 2500);
                                } else {
                                    clearCart();
                                    localStorage.removeItem('laxmart_pending_payment_id');
                                    setStatus('success');
                                    setMessage('Payment Successful! 🎉');
                                    const targetPath = result.order?._id 
                                        ? `/order/${result.order._id}` 
                                        : '/orders';
                                    setTimeout(() => navigate(targetPath), 2500);
                                }
                            }
                            return;
                        }

                        if (result.status === 'failed') {
                            // ── FAILED ───────────────────────────────────────
                            if (!isCancelled) {
                                const isTravel = !!localStorage.getItem('activeTravelBooking');
                                localStorage.removeItem('laxmart_pending_payment_id');
                                setStatus('failed');
                                setMessage('Payment failed or was cancelled.');
                                setTimeout(() => navigate(isTravel ? '/store/travel/payment' : '/checkout'), 3000);
                            }
                            return;
                        }

                        // status === 'pending' → keep polling
                    }

                    // Wait before next poll (except on last attempt)
                    if (i < MAX_POLL_ATTEMPTS) {
                        await sleep(POLL_INTERVAL_MS);
                    }

                } catch (err: any) {
                    console.error(`[PaymentVerify] Poll ${i} error:`, err?.message || err);
                    if (i === MAX_POLL_ATTEMPTS) break;
                    await sleep(POLL_INTERVAL_MS);
                }
            }

            // ── Max attempts reached; still pending ──────────────────────────
            if (!isCancelled) {
                const isTravel = !!localStorage.getItem('activeTravelBooking');
                setStatus('failed');
                setMessage('Payment verification timed out. Check your bookings.');
                setTimeout(() => navigate(isTravel ? '/store/travel' : '/orders'), 4000);
            }
        };

        verifyPayment();

        return () => { isCancelled = true; };
    }, [merchantOrderId]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-50 border border-gray-100 rounded-3xl p-8 max-w-sm w-full shadow-xl"
            >
                {/* ── Loading spinner ─────────────────────────────────────── */}
                {status === 'verifying' && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="mb-4 inline-block text-primary-dark"
                    >
                        <Loader2 size={64} />
                    </motion.div>
                )}

                {/* ── Success icon ────────────────────────────────────────── */}
                {status === 'success' && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-4 inline-block text-green-500"
                    >
                        <CheckCircle size={80} />
                    </motion.div>
                )}

                {/* ── Failure icon ────────────────────────────────────────── */}
                {status === 'failed' && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-4 inline-block text-red-500"
                    >
                        <XCircle size={80} />
                    </motion.div>
                )}

                <h1 className="text-2xl font-black text-gray-900 mb-2">{message}</h1>

                <p className="text-sm text-gray-500 mb-6 font-medium">
                    {status === 'verifying'
                        ? `Confirming with PhonePe... (attempt ${attempt}/${MAX_POLL_ATTEMPTS})`
                        : 'Redirecting you shortly...'}
                </p>

                {/* Transaction details row */}
                {(transactionId || merchantOrderId) && (
                    <div className="bg-white rounded-xl p-3 border border-gray-200 text-left">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
                            <span>Order Ref</span>
                            {amount && <span>Amount (₹)</span>}
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span className="truncate mr-4">{transactionId || merchantOrderId}</span>
                            {amount && <span>{amount}</span>}
                        </div>
                    </div>
                )}

                {/* Retry hint */}
                {status === 'failed' && (
                    <button
                        onClick={() => navigate('/orders')}
                        className="mt-4 flex items-center gap-2 mx-auto text-xs font-semibold text-primary-dark hover:underline"
                    >
                        <RefreshCw size={14} /> View My Orders
                    </button>
                )}
            </motion.div>

            <p className="mt-8 text-xs font-bold text-primary-dark uppercase tracking-widest opacity-50">
                LaxMart Secure Payments · Powered by PhonePe
            </p>
        </div>
    );
};

export default PaymentVerify;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
