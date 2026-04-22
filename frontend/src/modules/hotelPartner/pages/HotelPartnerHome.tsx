import React, { useEffect } from 'react';
import { ArrowRight, TrendingUp, ShieldCheck, Star, Hotel, Zap, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HotelPartnerHome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full bg-white overflow-hidden font-['Inter']">
            {/* HERO SECTION */}
            <section className="relative min-h-[80vh] flex flex-col justify-center items-center text-center px-4 pt-20 pb-20">
                <div className="max-w-4xl mx-auto z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-hotel-light/10 text-hotel-DEFAULT rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-hotel-light/20 shadow-sm">
                            Partner with Laxmart
                        </span>
                        <h1 className="text-4xl md:text-7xl font-[1000] text-gray-900 tracking-tight leading-[1.05] mb-6">
                            Maximize Your <br /> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hotel-DEFAULT to-hotel-dark">Property Yield</span>
                        </h1>
                        <p className="text-base md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-bold leading-relaxed px-2">
                            List your hotel or vacation stay. Reach verified guests. Earn up to 30% more with Laxmart's premium distribution network.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/hotel/onboarding')}
                                className="group px-10 py-5 bg-gray-900 text-white text-lg font-black rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:bg-black"
                            >
                                List Property <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                            <Link to="/hotel/login" className="px-10 py-5 bg-white text-gray-900 text-lg font-black rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all">
                                Partner Login
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Abstract Background */}
                <div className="absolute inset-0 w-full h-full -z-0 opacity-5">
                    <div className="absolute top-1/4 left-10 w-96 h-96 bg-hotel-DEFAULT rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary-DEFAULT rounded-full blur-[128px]"></div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-20 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '500+', label: 'Registered Hotels' },
                            { value: '25k+', label: 'Verified Guests' },
                            { value: '₹50Cr+', label: 'Booking Volume' },
                            { value: '15%', label: 'Lower Commission' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <h3 className="text-3xl md:text-5xl font-[1000] text-hotel-DEFAULT mb-2">{stat.value}</h3>
                                <p className="text-xs md:text-sm font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="mb-16">
                    <span className="text-xs font-black text-hotel-DEFAULT uppercase tracking-[0.3em] mb-3 block">Simple Steps</span>
                    <h2 className="text-3xl md:text-5xl font-[1000] text-gray-900 tracking-tight">How it works</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { 
                            icon: Hotel, 
                            title: "List Details", 
                            desc: "Fill in your property information, photos, and policies in under 10 minutes." 
                        },
                        { 
                            icon: ShieldCheck, 
                            title: "Instant Verification", 
                            desc: "Our automated KYC system verifies your property and goes live instantly." 
                        },
                        { 
                            icon: Zap, 
                            title: "Receive Bookings", 
                            desc: "Start getting bookings from millions of Laxmart users with instant payouts." 
                        },
                    ].map((step, i) => (
                        <div key={i} className="relative group">
                            <div className="w-16 h-16 bg-white shadow-xl rounded-2xl flex items-center justify-center mb-8 border border-gray-50 group-hover:bg-hotel-DEFAULT group-hover:text-white transition-all duration-500">
                                <step.icon size={32} />
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-gray-900">{step.title}</h3>
                            <p className="text-gray-500 font-bold leading-relaxed">{step.desc}</p>
                            <span className="absolute -top-4 -right-4 text-8xl font-black text-gray-50/50 -z-10 group-hover:text-hotel-light/10 transition-colors">0{i+1}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* DASHBOARD PREVIEW / CTA */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="bg-hotel-DEFAULT rounded-[48px] p-8 md:p-20 text-white relative overflow-hidden shadow-[0_40px_100px_-15px_rgba(37,99,235,0.3)]">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-[1000] leading-tight mb-8">Ready to grow your hotel business?</h2>
                            <ul className="space-y-4 mb-10">
                                {[
                                    "Dedicated Partner Support",
                                    "Weekly Payouts Guaranteed",
                                    "Advanced Analytics Dashboard",
                                    "AI-Driven Dynamic Pricing"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 font-bold text-lg text-white/90">
                                        <Award size={24} className="text-white shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/hotel/onboarding')}
                                className="px-12 py-5 bg-white text-hotel-DEFAULT text-xl font-[1000] rounded-2xl hover:shadow-2xl transition-all active:scale-[0.98]"
                            >
                                Start Listing Now
                            </motion.button>
                        </div>
                        <div className="hidden lg:block relative">
                            {/* Abstract Dashboard Mockup */}
                            <div className="bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 p-6 shadow-2xl skew-x-[-10deg] rotate-[2deg]">
                                <div className="h-4 w-1/3 bg-white/20 rounded-full mb-6"></div>
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="h-16 bg-white/10 rounded-xl"></div>
                                    <div className="h-16 bg-white/10 rounded-xl"></div>
                                    <div className="h-16 bg-white/10 rounded-xl"></div>
                                </div>
                                <div className="h-32 bg-white/10 rounded-xl mb-4"></div>
                                <div className="h-4 w-full bg-white/20 rounded-full mb-2"></div>
                                <div className="h-4 w-2/3 bg-white/20 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32"></div>
                </div>
            </section>
        </div>
    );
};

export default HotelPartnerHome;
