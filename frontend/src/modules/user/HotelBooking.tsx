import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Users, ChevronRight, Zap, Lock, Star, Clock, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HotelBooking: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#f8f9fc] min-h-screen pb-24 font-sans selection:bg-yellow-200">
            {/* Top Premium Header - Nation on Vacation */}
            <motion.div 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="w-full bg-gradient-to-r from-[#ff4b2b] to-[#ff416c] py-2.5 px-4 flex items-center justify-between text-white shadow-lg sticky top-0 z-50 overflow-hidden"
            >
                <div className="flex items-center gap-2.5 relative z-10">
                    <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                        <img src="/laxmart_logo_flat_1774950312611.png" alt="Logo" className="w-5 h-5 invert" />
                    </div>
                    <span className="font-black italic text-[11px] tracking-tight uppercase leading-none">Nation on Vacation</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/20 relative z-10">
                    <Zap size={14} fill="#ffd700" className="text-[#ffd700] animate-pulse" />
                    <span className="font-black text-[9px] uppercase tracking-wider">Sale Ends Tonight</span>
                </div>
                {/* Decorative Pattern overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            </motion.div>

            <div className="px-5 pt-6">
                {/* Section Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-[1000] text-gray-900 tracking-tighter leading-tight">Find Your <br/><span className="text-[#ff4b2b]">Dream Stay</span></h1>
                    <div className="h-1.5 w-12 bg-yellow-400 rounded-full mt-2"></div>
                </div>

                {/* Search Card - Ultra Premium */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-neutral-100 mb-8 relative"
                >
                    <div className="space-y-7">
                        {/* Destination */}
                        <div className="group">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.1em] mb-2 group-focus-within:text-[#ff4b2b] transition-colors">Where to?</p>
                            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 group-focus-within:border-[#ff4b2b]/30 group-focus-within:bg-white transition-all">
                                <MapPin size={22} className="text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="City, Hotel or Area"
                                    className="w-full bg-transparent border-none focus:outline-none text-base font-black text-gray-900 placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Check-in</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-[#ff4b2b]" />
                                    <span className="text-sm font-black text-gray-900">31 Mar, Tue</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative">
                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Check-out</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span className="text-sm font-black text-gray-900">01 Apr, Wed</span>
                                </div>
                                {/* Duration Badge */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff4b2b] text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-md uppercase">
                                    1 Night
                                </div>
                            </div>
                        </div>

                        {/* Guests & Occupancy */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-1">Rooms & Guests</p>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-400" />
                                    <span className="text-sm font-black text-gray-900">01 Room, 02 Adults</span>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>

                        {/* Search Button */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-[1000] py-5 rounded-[20px] shadow-[0_10px_30px_rgba(255,193,7,0.3)] transition-all text-base uppercase tracking-tighter flex items-center justify-center gap-2"
                        >
                            <Search size={18} strokeWidth={3} />
                            Search Luxury Hotels
                        </motion.button>
                    </div>
                </motion.div>

                {/* Trust Badges Scroll */}
                <div className="flex gap-4 overflow-x-auto pb-8 -mx-5 px-5 scrollbar-hide">
                    {[
                        { icon: ShieldCheck, text: 'Safe Stays', desc: 'Hygiene Assured' },
                        { icon: Zap, text: 'Instant Confirm', desc: 'No Wait Time' },
                        { icon: Star, text: 'Top Rated', desc: 'Verified User Stays' },
                    ].map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-neutral-100 shadow-sm min-w-[170px]">
                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                                <badge.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-gray-900">{badge.text}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Brand Offer Section */}
                <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm flex items-center gap-5 mb-8 overflow-hidden relative group"
                >
                    <div className="bg-[#861f41] rounded-[18px] w-14 h-14 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-[#861f41]/20">
                        <span className="text-[8px] font-black text-white/70 uppercase tracking-tighter">AXIS</span>
                        <Zap size={14} fill="white" className="text-white" />
                        <span className="text-[8px] font-black text-white/70 uppercase tracking-tighter">BANK</span>
                    </div>
                    <div className="flex flex-col flex-1">
                        <h4 className="text-lg font-black text-gray-900 italic tracking-tighter">Flat 30% Off*</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mt-0.5">on Credit Cards & EMI Trxns.</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                    {/* Background Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </motion.div>

                {/* Flash Sale - Video/Image Immersion */}
                <div className="bg-[#1a1a1a] rounded-[40px] p-6 text-white mb-8 relative overflow-hidden shadow-2xl">
                    <div className="relative z-20">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-4 py-1.5 border border-white/20 mb-4">
                            <Clock size={14} className="text-yellow-400 animate-spin-slow" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Limited period offer</span>
                        </div>
                        <h3 className="text-4xl font-[1000] mb-2 leading-[1.1] tracking-tighter shadow-sm">65% OFF <br/>ON <span className="text-yellow-400">RESORTS</span></h3>
                        <p className="text-gray-400 text-xs font-bold mb-6 italic">Unlock the ultimate vacation experience.</p>
                        
                        <div className="bg-yellow-400 text-gray-900 rounded-2xl px-6 py-3 border inline-block select-all cursor-copy">
                            <p className="text-[10px] font-black uppercase opacity-60">Coupon Code</p>
                            <span className="text-xl font-[1000] tracking-tighter">FKFLASH</span>
                        </div>
                    </div>

                    {/* Immersive Image */}
                    <div className="absolute inset-0 z-10">
                        <img 
                            src="/hotel_deal_3.png" 
                            alt="Luxury Resort" 
                            className="w-full h-full object-cover opacity-60 scale-110 hover:scale-100 transition-transform duration-[5s]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>
                    </div>
                    
                    {/* Animated Glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-[80px]"></div>
                </div>

                {/* Exclusive Deals Slider Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-black text-gray-900 tracking-tighter">Crazy Hour Deals</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                        </div>
                    </div>
                    <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-gray-900" />
                    </button>
                </div>

                {/* Deal Grid */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                    {[
                        { name: 'Azure Bay Resort', location: 'Maldives', img: '/hotel_deal_1.png', price: '₹12,499', rating: '4.9', locked: false, label: 'Bestseller' },
                        { name: 'Mountain Peak', location: 'Manali', img: '/hotel_deal_2.png', price: '₹4,200', rating: '4.7', locked: true, label: 'Locked' },
                    ].map((deal, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-neutral-100 group"
                        >
                            <div className="relative aspect-[4/5] bg-gray-100">
                                <img src={deal.img} alt={deal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {deal.locked ? (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
                                        <div className="bg-white/20 p-3 rounded-full border border-white/30 mb-2">
                                            <Lock size={24} className="text-white" fill="currentColor" />
                                        </div>
                                        <p className="text-[10px] font-black text-white uppercase text-center tracking-tighter">Unlocks at 8 PM</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-3 left-3 bg-white rounded-lg px-2 py-1 flex items-center gap-1 shadow-md border border-gray-100">
                                            <Star size={10} fill="#ffc107" className="text-[#ffc107]" />
                                            <span className="text-[11px] font-black text-gray-900">{deal.rating}</span>
                                        </div>
                                        <button className="absolute top-3 right-3 bg-black/20 hover:bg-[#ff4b2b]/80 backdrop-blur-md text-white p-2 rounded-full transition-colors">
                                            <Heart size={16} />
                                        </button>
                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                            <span className="bg-[#ffc107] text-gray-900 text-[9px] font-[1000] uppercase px-3 py-1 rounded-lg tracking-tighter shadow-lg shadow-yellow-400/20">{deal.label}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-4">
                                <h4 className="text-sm font-black text-gray-900 truncate leading-none">{deal.name}</h4>
                                <div className="flex items-center gap-1 text-gray-400 mt-1.5 mb-3">
                                    <MapPin size={10} />
                                    <span className="text-[10px] font-bold uppercase">{deal.location}</span>
                                </div>
                                {!deal.locked && (
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-gray-900">{deal.price}</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase">per night</span>
                                        </div>
                                        <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center text-gray-900 font-black text-sm">
                                            →
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Exclusive Membership Banner */}
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[32px] p-6 text-white mb-10 shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="bg-gradient-to-tr from-yellow-400 to-yellow-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 rotate-12 shrink-0">
                            <Star size={24} fill="currentColor" color="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black tracking-tight leading-none mb-1">VIP Stays Access</h4>
                            <p className="text-gray-400 text-[11px] font-bold">Priority support & free upgrades on every LaxMart booking.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelBooking;
