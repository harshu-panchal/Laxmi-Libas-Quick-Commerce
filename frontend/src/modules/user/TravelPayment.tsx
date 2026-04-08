import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Landmark, Check, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelPayment: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const paymentMethods = [
        { id: 'upi', name: 'UPI (GPay, PhonePe)', icon: <Smartphone className="text-purple-600" />, sub: 'Pay via any UPI App' },
        { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard className="text-blue-600" />, sub: 'Visa, Mastercard, RuPay' },
        { id: 'netbanking', name: 'Net Banking', icon: <Landmark className="text-emerald-600" />, sub: 'All major banks available' }
    ];

    const majorBanks = [
        { name: 'HDFC Bank', icon: '🏦' },
        { name: 'ICICI Bank', icon: '🏦' },
        { name: 'SBI', icon: '🏦' },
        { name: 'Axis Bank', icon: '🏦' }
    ];

    const handlePayment = () => {
        if (!selectedMethod) return;
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            navigate('/store/travel/confirmation');
        }, 3000);
    };

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
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Step 3 of 3</span>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {/* Total Summary */}
                <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total to Pay</span>
                        <span className="text-2xl font-[1000] text-gray-900 mt-1">₹1,06,061</span>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={12} />
                        Secure Checkout
                    </div>
                </section>

                {/* Payment Methods */}
                <section className="space-y-3">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-1">Select Payment Method</h3>
                    
                    {/* UPI Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedMethod(selectedMethod === 'upi' ? null : 'upi')}
                            className={`w-full text-left bg-white rounded-[28px] p-5 border-2 transition-all flex items-center gap-4 ${selectedMethod === 'upi' ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-50 shadow-sm'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedMethod === 'upi' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                <Smartphone className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-[1000] text-gray-900">UPI (GPay, PhonePe, Paytm)</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Instant pay via any UPI App</p>
                            </div>
                            {selectedMethod === 'upi' && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {selectedMethod === 'upi' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white rounded-[24px] p-4 border border-blue-100 mx-2 overflow-hidden shadow-sm space-y-3"
                                >
                                    <div className="grid grid-cols-3 gap-3">
                                        <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 border border-transparent hover:border-blue-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_Logo.svg" alt="GPay" className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">GPay</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 border border-transparent hover:border-blue-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 shadow-sm text-blue-600">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1200px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Paytm</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 border border-transparent hover:border-blue-200">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">PhonePe</span>
                                        </button>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <input type="text" placeholder="Enter UPI ID (e.g. user@okaxis)" className="flex-1 bg-transparent outline-none text-[11px] font-bold text-gray-900" />
                                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verify</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Card Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedMethod(selectedMethod === 'card' ? null : 'card')}
                            className={`w-full text-left bg-white rounded-[28px] p-5 border-2 transition-all flex items-center gap-4 ${selectedMethod === 'card' ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-50 shadow-sm'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedMethod === 'card' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                <CreditCard className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-[1000] text-gray-900">Credit/Debit Card</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Visa, Mastercard, RuPay, Amex</p>
                            </div>
                            {selectedMethod === 'card' && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {selectedMethod === 'card' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white rounded-[24px] p-5 border border-blue-100 mx-2 overflow-hidden shadow-sm space-y-4"
                                >
                                    <div className="space-y-3">
                                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Card Number</span>
                                            <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full bg-transparent outline-none text-xs font-[1000] text-gray-900 tracking-[0.1em]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Expiry</span>
                                                <input type="text" placeholder="MM/YY" className="w-full bg-transparent outline-none text-xs font-[1000] text-gray-900 tracking-widest" />
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">CVV</span>
                                                <input type="password" placeholder="***" className="w-full bg-transparent outline-none text-xs font-[1000] text-gray-900 tracking-[0.3em]" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded border-2 border-blue-500 flex items-center justify-center bg-blue-500">
                                            <Check size={10} className="text-white" strokeWidth={4} />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500">Securely save this card for future bookings</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Net Banking Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setSelectedMethod(selectedMethod === 'netbanking' ? null : 'netbanking')}
                            className={`w-full text-left bg-white rounded-[28px] p-5 border-2 transition-all flex items-center gap-4 ${selectedMethod === 'netbanking' ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-50 shadow-sm'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedMethod === 'netbanking' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                <Landmark className="text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-[1000] text-gray-900">Net Banking</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Select from over 50+ banks</p>
                            </div>
                            {selectedMethod === 'netbanking' && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {selectedMethod === 'netbanking' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white rounded-[24px] p-5 border border-emerald-100 mx-2 overflow-hidden shadow-sm"
                                >
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Popular Banks</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {majorBanks.map((bank) => (
                                            <button key={bank.name} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-emerald-200 transition-all active:scale-95 bg-gray-50/50">
                                                <span className="text-xl">{bank.icon}</span>
                                                <span className="text-[11px] font-bold text-gray-700">{bank.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button className="w-full mt-4 flex items-center justify-between p-3 rounded-2xl bg-gray-50 text-gray-500 border border-transparent hover:border-emerald-200">
                                        <span className="text-[11px] font-bold">Select from list of all banks</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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

            {/* Simulated Processing Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="text-blue-600 mb-6"
                        >
                            <Loader2 size={64} strokeWidth={2.5} />
                        </motion.div>
                        <h2 className="text-2xl font-[1000] text-gray-900 mb-2">Processing Payment</h2>
                        <p className="text-sm font-bold text-gray-400">Please do not refresh or close this page. Securing your booking with Foxoso Hotels...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <button 
                    disabled={!selectedMethod || isProcessing}
                    onClick={handlePayment}
                    className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-[1000] text-sm uppercase tracking-[0.15em] transition-all shadow-lg ${!selectedMethod ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed' : 'bg-gray-900 text-white shadow-gray-200 active:scale-95'}`}
                >
                    <span>Pay ₹1,06,061</span>
                    {!isProcessing && <ChevronRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default TravelPayment;
