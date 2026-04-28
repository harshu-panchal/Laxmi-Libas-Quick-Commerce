import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HomeHero from './components/HomeHero';
import { Building2, Bus, MapPin, Calendar, Users, Search, ArrowRight, Zap, Star, ShieldCheck, Clock, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHotelCities } from '../../services/api/customerHotelService';
import { getBusCities } from '../../services/api/customerBusService';
import LongWeekendDeals from './components/LongWeekendDeals';

const TravelStore: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'hotels' | 'buses'>('hotels');
    const [timeLeft, setTimeLeft] = useState({ h: 2, m: 38, s: 16 });

    // Hotel Search State
    const [hotelLocation, setHotelLocation] = useState('Indore');
    const [hotelCities, setHotelCities] = useState<string[]>([]);
    
    // Bus Search State
    const [busFrom, setBusFrom] = useState('Indore');
    const [busTo, setBusTo] = useState('Ujjain');
    const [busCities, setBusCities] = useState<string[]>([]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const [hRes, bRes] = await Promise.all([getHotelCities(), getBusCities()]);
                if (hRes.success) setHotelCities(hRes.data);
                if (bRes.success) setBusCities(bRes.data);
            } catch (err) {
                console.error('Failed to fetch cities:', err);
            }
        };
        fetchCities();

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { h, m, s } = prev;
                if (s > 0) s--;
                else if (m > 0) { m--; s = 59; }
                else if (h > 0) { h--; m = 59; s = 59; }
                return { h, m, s };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="bg-white min-h-screen pb-24 font-['Inter']">
            <HomeHero 
                activeStore="travel" 
                hideTopContent={false} 
                hideLocationBar={true}
                hideSearchBar={true}
                hideCategoryTabs={true}
            />

            <div className="px-4 pt-4">
                {/* Compact Tab Switcher */}
                <div className="bg-neutral-100 p-1 rounded-xl flex gap-1 mb-5">
                    <button 
                        onClick={() => setActiveTab('hotels')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'hotels' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500'}`}
                    >
                        <Building2 size={14} />
                        Hotels
                    </button>
                    <button 
                        onClick={() => setActiveTab('buses')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${activeTab === 'buses' ? 'bg-white text-green-600 shadow-sm' : 'text-neutral-500'}`}
                    >
                        <Bus size={14} />
                        Buses
                    </button>
                </div>

                {/* Unified Search Section (Extremely Compact) */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 shadow-sm mb-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'hotels' ? (
                            <motion.div 
                                key="hotels"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Destination</span>
                                    <div 
                                        onClick={() => navigate('/store/travel/hotels')}
                                        className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-3 cursor-pointer"
                                    >
                                        <MapPin size={16} className="text-blue-500" />
                                        <span className="text-sm font-bold text-neutral-900">{hotelLocation || 'Where to?'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Dates</span>
                                        <div 
                                            onClick={() => navigate('/store/travel/hotels')}
                                            className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-3 cursor-pointer"
                                        >
                                            <Calendar size={16} className="text-neutral-400" />
                                            <span className="text-xs font-bold">31 Mar - 01 Apr</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Guests</span>
                                        <div 
                                            onClick={() => navigate('/store/travel/hotels')}
                                            className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-3 cursor-pointer"
                                        >
                                            <Users size={16} className="text-neutral-400" />
                                            <span className="text-xs font-bold">2 Adults</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate('/store/travel/hotels/list')}
                                    className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-sm tracking-tight active:scale-95 transition-all"
                                >
                                    <Search size={18} />
                                    Search Hotels
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="buses"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                <div className="grid grid-cols-2 gap-2 relative">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">From</span>
                                        <div 
                                            onClick={() => navigate('/store/travel/buses')}
                                            className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-2 cursor-pointer"
                                        >
                                            <MapPin size={14} className="text-green-500" />
                                            <span className="text-xs font-bold truncate">{busFrom}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">To</span>
                                        <div 
                                            onClick={() => navigate('/store/travel/buses')}
                                            className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-2 cursor-pointer"
                                        >
                                            <MapPin size={14} className="text-red-500" />
                                            <span className="text-xs font-bold truncate">{busTo}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">Journey Date</span>
                                    <div 
                                        onClick={() => navigate('/store/travel/buses')}
                                        className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center gap-3 cursor-pointer"
                                    >
                                        <Calendar size={16} className="text-neutral-400" />
                                        <span className="text-xs font-bold">Tomorrow, 31 Mar</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/store/travel/buses/results?from=${busFrom}&to=${busTo}&date=2026-03-31`)}
                                    className="w-full bg-green-600 text-white font-black py-3 rounded-xl shadow-lg shadow-green-100 flex items-center justify-center gap-2 text-sm tracking-tight active:scale-95 transition-all"
                                >
                                    <Search size={18} />
                                    Search Buses
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div 
                        onClick={() => navigate('/bookings')}
                        className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm">
                                <Ticket size={16} />
                            </div>
                            <span className="text-[11px] font-black text-indigo-900 uppercase tracking-tighter">My Bookings</span>
                        </div>
                        <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div 
                        className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white rounded-lg text-orange-600 shadow-sm">
                                <Zap size={16} />
                            </div>
                            <span className="text-[11px] font-black text-orange-900 uppercase tracking-tighter">Deals</span>
                        </div>
                        <ArrowRight size={14} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* Long Weekend Deals Section */}
                <LongWeekendDeals />

                {/* Flash Sale Banner (Compact) */}
                <div className="bg-[#fff9e1] rounded-2xl p-4 mb-6 border border-yellow-200">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-neutral-900 leading-none">Travel Flash Sale</h2>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase mt-1">Ends in: {formatTime(timeLeft.h)}h {formatTime(timeLeft.m)}m {formatTime(timeLeft.s)}s</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded-xl border border-yellow-100 shadow-sm flex flex-col items-center">
                            <img src="/travel_hotels.png" alt="Hotels" className="w-12 h-12 object-contain mb-1" />
                            <span className="text-[9px] font-black text-neutral-900 uppercase tracking-tighter text-center">Hotels @ 65% OFF</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-yellow-100 shadow-sm flex flex-col items-center">
                            <img src="/travel_buses.png" alt="Buses" className="w-12 h-12 object-contain mb-1" />
                            <span className="text-[9px] font-black text-neutral-900 uppercase tracking-tighter text-center">Buses @ Flat 15% OFF</span>
                        </div>
                    </div>
                </div>

                {/* Vacation Sale Banner */}
                <div className="rounded-2xl overflow-hidden mb-6 shadow-sm border border-neutral-100 h-28">
                    <img src="/travel_banner.png" alt="Nation on Vacation Sale" className="w-full h-full object-cover" />
                </div>

                {/* Trust Badges */}
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
                    {[
                        { icon: ShieldCheck, text: 'Safe Stays', color: 'text-green-600', bg: 'bg-green-50' },
                        { icon: Clock, text: '24/7 Help', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Star, text: 'Top Rated', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    ].map((badge, idx) => (
                        <div key={idx} className="flex-shrink-0 flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100 shadow-sm">
                            <div className={`${badge.bg} ${badge.color} p-1.5 rounded-lg`}>
                                <badge.icon size={14} />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-900 whitespace-nowrap">{badge.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TravelStore;
