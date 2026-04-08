import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, MessageSquare, ChevronRight, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelCheckout: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-24 font-['Inter']">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1 active:scale-90 transition-transform"
                >
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
                <h1 className="text-lg font-[1000] text-gray-900 tracking-tight">Guest Details</h1>
            </header>

            <main className="p-4 space-y-4">
                {/* Guest Form */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-6">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Primary Guest</h3>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-1 z-10 font-['Inter']">Full Name</label>
                            <div className="flex items-center border-2 border-gray-50 bg-gray-50 rounded-2xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <div className="pl-4 text-gray-400">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Enter your full name" 
                                    className="w-full h-14 px-4 bg-transparent outline-none text-sm font-bold text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-1 z-10">Email Address</label>
                            <div className="flex items-center border-2 border-gray-50 bg-gray-50 rounded-2xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <div className="pl-4 text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="w-full h-14 px-4 bg-transparent outline-none text-sm font-bold text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-1 z-10">Mobile Number</label>
                            <div className="flex items-center border-2 border-gray-50 bg-gray-50 rounded-2xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                                <div className="pl-4 text-gray-400">
                                    <Phone size={18} />
                                </div>
                                <input 
                                    type="tel" 
                                    placeholder="Enter mobile number" 
                                    className="w-full h-14 px-4 bg-transparent outline-none text-sm font-bold text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Requirements */}
                <section className="bg-white rounded-[32px] shadow-sm border border-gray-50 p-6">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Special Requests</h3>
                    <div className="flex items-start border-2 border-gray-50 bg-gray-50 rounded-2xl p-4 focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <MessageSquare size={18} className="text-gray-400 mt-1" />
                        <textarea 
                            placeholder="Early check-in, late check-out, or any other requests..." 
                            className="w-full h-24 px-4 bg-transparent outline-none text-sm font-bold text-gray-900 resize-none"
                        ></textarea>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-3 flex items-center gap-1.5">
                        <Info size={10} />
                        Special requests are subject to availability and cannot be guaranteed.
                    </p>
                </section>

                {/* Travel Insurance Opt-in */}
                <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] shadow-lg p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={20} className="text-blue-200" />
                            <span className="text-xs font-black uppercase tracking-widest">Secure Your Trip</span>
                        </div>
                        <h4 className="text-lg font-[1000] mb-2 leading-tight">Travel Insurance for ₹199</h4>
                        <p className="text-[10px] font-bold text-blue-100 opacity-80 leading-relaxed mb-4">
                            Cover accidental damage, medical emergencies, and trip delays. Highly recommended by 92% of users.
                        </p>
                        <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all">
                            Add Insurance
                        </button>
                    </div>
                </section>
            </main>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-50">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Grand Total</span>
                    <span className="text-xl font-[1000] text-gray-900 mt-1">₹1,06,061</span>
                </div>
                <button 
                    onClick={() => {
                        // Navigate to Travel Payment Selection
                        navigate('/store/travel/payment');
                    }}
                    className="bg-yellow-400 text-gray-900 px-8 py-3.5 rounded-xl font-[1000] text-[12px] uppercase tracking-[0.1em] shadow-lg shadow-yellow-100 active:scale-95 transition-all"
                >
                    Confirm Booking
                </button>
            </div>
        </div>
    );
};

export default TravelCheckout;
