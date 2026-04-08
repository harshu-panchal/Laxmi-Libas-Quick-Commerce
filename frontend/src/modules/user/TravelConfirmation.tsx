import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Calendar, MapPin, Download, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelConfirmation: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
            <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="mb-8"
                >
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                        <CheckCircle size={64} strokeWidth={1.5} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight mb-2">Booking Confirmed!</h1>
                    <p className="text-sm font-bold text-gray-500 mb-8 max-w-xs mx-auto">
                        Your stay at Foxoso LA Beach Resort is successfully booked. Confirmation details sent to your email.
                    </p>
                </motion.div>

                <motion.section 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-sm bg-gray-50 rounded-[32px] p-6 border border-gray-100 text-left mb-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Booking ID</span>
                            <span className="text-sm font-[1000] text-gray-900">LAX-77492-TRV</span>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Confirmed
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                                <img src="/hotel_resort_2.png" alt="Hotel" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-xs font-[1000] text-gray-900 leading-tight">Foxoso LA Beach Resort</h2>
                                <div className="flex items-center gap-1 text-gray-400 mt-1">
                                    <MapPin size={10} />
                                    <span className="text-[9px] font-bold">Morjim, Goa</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Check-In</span>
                                <span className="text-[11px] font-[1000] text-gray-800">08 Apr, 2024</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Guests</span>
                                <span className="text-[11px] font-[1000] text-gray-800">2 Adults, 1 Room</span>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Detailed Invoice Section */}
                <motion.section 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full max-w-sm border-t-2 border-dashed border-gray-100 mt-4 pt-6"
                >
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Payment Invoice</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-gray-600">
                            <span>Room Charges (3 Rooms)</span>
                            <span>₹94,016</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-green-600">
                            <span>Coupon (HOTEL45)</span>
                            <span>-₹35,000</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-gray-600">
                            <span>Taxes & Service Fees</span>
                            <span>₹12,045</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-100">
                            <span className="text-sm font-[1000] text-gray-900">Amount Paid</span>
                            <span className="text-sm font-[1000] text-gray-900">₹1,06,061</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 italic">
                            <span>Paid via Net Banking</span>
                            <span>08 Apr, 12:47 PM</span>
                        </div>
                    </div>
                </motion.section>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8">
                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-gray-50 active:scale-95 transition-all">
                        <Download size={20} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] border border-gray-100 bg-white hover:bg-gray-50 active:scale-95 transition-all">
                        <Share2 size={20} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Share</span>
                    </button>
                </div>
            </main>

            <footer className="p-6">
                <button 
                    onClick={() => navigate('/store/travel')}
                    className="w-full h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-3 font-bold group hover:bg-black active:scale-[0.98] transition-all"
                >
                    <span>Done</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </footer>
        </div>
    );
};

export default TravelConfirmation;
