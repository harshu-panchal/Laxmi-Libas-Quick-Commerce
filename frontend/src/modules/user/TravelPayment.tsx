import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Check, ChevronRight, Loader2 } from 'lucide-react';
import { handlePayment as initiatePhonePePayment } from '../../services/api/paymentService';

const TravelPayment: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        const saved = localStorage.getItem('activeTravelBooking');
        if (saved) {
            setBookingData(JSON.parse(saved));
        }
    }, []);

    const processPayment = async () => {
        console.log('[TravelPayment] Booking Data:', bookingData);
        if (!selectedMethod || !bookingData?.bookingId) {
            alert('No booking found. Please go back and try again.');
            return;
        }

        setIsProcessing(true);
        try {
            const paymentType = bookingData.paymentType || 'hotel';
            const redirectUrl = await initiatePhonePePayment(paymentType, bookingData.bookingId);

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                throw new Error('Failed to get payment URL from gateway');
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            alert(error?.response?.data?.message || 'Failed to initiate payment. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!bookingData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center p-8">
                    <p className="text-gray-500 font-bold mb-4">No active booking found.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const totalAmount = bookingData.totalAmount || 0;

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24 font-['Inter']">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 active:scale-90 transition-transform"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg font-[1000] text-gray-900 tracking-tight leading-none">Payment Methods</h1>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Final Step</span>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {/* Total Summary */}
                <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total to Pay</span>
                        <span className="text-2xl font-[1000] text-gray-900 mt-1">₹{Math.round(totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={12} />
                        Secure Checkout
                    </div>
                </section>

                {/* Payment Methods */}
                <section className="space-y-3">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-1">Select Payment Method</h3>

                    <button
                        onClick={() => setSelectedMethod('phonepe')}
                        className={`w-full text-left bg-white rounded-[28px] p-5 border-2 transition-all flex items-center gap-4 ${selectedMethod === 'phonepe' ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-50 shadow-sm'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedMethod === 'phonepe' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" className="w-8 h-8 object-contain" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-[1000] text-gray-900">PhonePe / UPI / Cards</h4>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">Secure payment via PhonePe gateway</p>
                        </div>
                        {selectedMethod === 'phonepe' && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                <Check size={14} strokeWidth={3} />
                            </div>
                        )}
                    </button>

                    <p className="text-center text-[10px] font-bold text-gray-400 px-8">
                        By clicking pay, you agree to the cancellation policies and terms of service.
                    </p>
                </section>

                {/* Trust Badges */}
                <div className="pt-4 flex flex-col items-center gap-4 opacity-40">
                    <div className="flex items-center gap-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Visa_Logo.png/640px-Visa_Logo.png" alt="Visa" className="h-4 object-contain grayscale" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 object-contain grayscale" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/1200px-UPI-Logo.png" alt="UPI" className="h-4 object-contain grayscale" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">100% Encrypted Payments</p>
                </div>
            </main>

            {/* Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            className="text-blue-600 mb-6"
                        >
                            <Loader2 size={64} strokeWidth={2.5} />
                        </motion.div>
                        <h2 className="text-2xl font-[1000] text-gray-900 mb-2">Redirecting to PhonePe</h2>
                        <p className="text-sm font-bold text-gray-400">Please do not refresh or close this page. Securing your booking...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <button
                    disabled={!selectedMethod || isProcessing}
                    onClick={processPayment}
                    className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-[1000] text-sm uppercase tracking-[0.15em] transition-all shadow-lg ${!selectedMethod ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed' : 'bg-gray-900 text-white shadow-gray-200 active:scale-95'}`}
                >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <span>Pay ₹{Math.round(totalAmount).toLocaleString()}</span>}
                    {!isProcessing && <ChevronRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default TravelPayment;
