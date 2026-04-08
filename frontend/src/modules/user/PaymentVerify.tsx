import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const PaymentVerify: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    
    // Get parameters from URL
    const transactionId = searchParams.get('transactionId');
    const paymentStatus = searchParams.get('status');
    const amount = searchParams.get('amount');

    useEffect(() => {
        const verifyPayment = async () => {
            // Give a realistic delay for "verification"
            await new Promise(resolve => setTimeout(resolve, 2500));

            if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCESS') {
                setStatus('success');
                setMessage('Payment Successful!');
                clearCart();
                
                // Final redirect after showing success
                setTimeout(() => {
                    navigate('/orders');
                }, 2000);
            } else {
                setStatus('failed');
                setMessage('Payment Failed or Cancelled');
                
                // Final redirect after showing failure
                setTimeout(() => {
                    navigate('/checkout');
                }, 2000);
            }
        };

        verifyPayment();
    }, [paymentStatus, navigate, clearCart]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-50 border border-gray-100 rounded-3xl p-8 max-w-sm w-full shadow-xl"
            >
                {status === 'verifying' && (
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="mb-4 inline-block text-primary-dark"
                    >
                        <Loader2 size={64} />
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-4 inline-block text-green-500"
                    >
                        <CheckCircle size={80} />
                    </motion.div>
                )}

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
                    {status === 'verifying' ? 'Please do not close this window or use the back button.' : 'Redirecting you shortly...'}
                </p>

                {transactionId && (
                    <div className="bg-white rounded-xl p-3 border border-gray-200 text-left">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
                            <span>Transaction ID</span>
                            <span>Amount (₹)</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span className="truncate mr-4">{transactionId}</span>
                            <span>{amount || '0.00'}</span>
                        </div>
                    </div>
                )}
            </motion.div>

            <p className="mt-8 text-xs font-bold text-primary-dark uppercase tracking-widest opacity-50">LaxMart Payments</p>
        </div>
    );
};

export default PaymentVerify;
