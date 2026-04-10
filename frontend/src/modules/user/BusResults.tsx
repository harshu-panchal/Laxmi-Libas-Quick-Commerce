import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Star, Clock, Bus, ShieldCheck, Zap, SlidersHorizontal, ChevronDown, Ticket } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BusResults: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const from = queryParams.get('from') || 'Jabalpur';
    const to = queryParams.get('to') || 'Indore';
    const initialDate = queryParams.get('date') || '08 Apr';

    const [selectedDate, setSelectedDate] = useState(initialDate);

    const dates = [
        { day: 'Wed', date: '08 Apr' },
        { day: 'Thu', date: '09 Apr' },
        { day: 'Fri', date: '10 Apr' },
        { day: 'Sat', date: '11 Apr' },
        { day: 'Sun', date: '12 Apr' },
    ];

    const results = [
        {
            id: 1,
            operator: 'Hans Travels (I) Pvt Ltd.',
            type: 'A/C, Sleeper, Deluxe',
            duration: '9h 40m',
            seats: '13 seats',
            departure: '8:00 PM',
            arrival: '5:40 AM',
            price: 815,
            rating: 4.9,
            reviews: 178,
            offers: ['Get ₹81 off with FKBUS', '10% off with Supercoins', '₹50 off with Bus pass']
        },
        {
            id: 2,
            operator: 'New LokSewa Travels',
            type: 'Non A/C, Sleeper',
            duration: '11h 25m',
            seats: '34 seats',
            departure: '7:05 PM',
            arrival: '6:30 AM',
            price: 600,
            rating: 4.5,
            reviews: 139,
            offers: ['Get ₹60 off with FKBUS', '10% off with Supercoins', '₹50 off with Bus pass']
        },
        {
            id: 3,
            operator: 'Intercity SmartBus',
            type: 'A/C, Sleeper, Premium',
            duration: '8h 15m',
            seats: '8 seats',
            departure: '10:30 PM',
            arrival: '6:45 AM',
            price: 1240,
            rating: 4.8,
            reviews: 542,
            offers: ['Free Cancellation', 'Pick-up at your doorstep']
        }
    ];

    return (
        <div className="min-h-screen bg-[#f1f3f6] font-['Inter'] pb-10">
            {/* Header */}
            <header className="bg-white px-4 py-3 sticky top-0 z-[100] shadow-sm flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-1 active:scale-90 transition-transform">
                    <ArrowLeft size={24} className="text-gray-900" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{from} to {to}</h1>
            </header>

            {/* Promo Bar */}
            <div className="bg-[#e7f9f2] px-4 py-3 flex items-center justify-between mx-3 mt-3 rounded-xl border border-[#d1f1e5]">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-full text-[#1eb27e]">
                        <Zap size={14} fill="currentColor" />
                    </div>
                    <span className="text-xs font-black text-gray-800">FKBUS | Up to 18% Off</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
            </div>

            {/* Date Selector */}
            <div className="bg-white mt-1 border-b border-gray-100 sticky top-[56px] z-[90]">
                <div className="flex overflow-x-auto hide-scrollbar">
                    {dates.map((d, index) => {
                        const isSelected = selectedDate === d.date;
                        return (
                            <button
                                key={index}
                                onClick={() => setSelectedDate(d.date)}
                                className={`flex-shrink-0 px-6 py-4 flex flex-col items-center relative transition-all ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                            >
                                <span className={`text-sm font-black ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {d.day}, {d.date}
                                </span>
                                {isSelected && (
                                    <motion.div 
                                        layoutId="activeUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Results Header & Filter */}
            <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-black text-gray-600">Showing {results.length} results</span>
                <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm active:scale-95 transition-all">
                    <span className="text-xs font-black">Sort: Top rated</span>
                    <ChevronDown size={16} strokeWidth={3} />
                </button>
            </div>

            {/* Bus Pass Banner */}
            <div className="px-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-12 -translate-y-12"></div>
                    <div className="bg-white/20 p-2.5 rounded-xl border border-white/30 backdrop-blur-md">
                        <Ticket size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-white leading-none">Bus Pass</h4>
                            <div className="h-4 w-[1px] bg-white/30 mx-1"></div>
                            <p className="text-sm font-bold text-blue-50">Get instant ₹50 off</p>
                        </div>
                        <p className="text-[11px] text-blue-100 font-medium mt-1">on your next 5 rides</p>
                    </div>
                    <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-md active:scale-90 transition-transform">
                        <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Bus Cards */}
            <div className="px-3 space-y-4">
                {results.map((bus) => (
                    <motion.div 
                        key={bus.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/store/travel/buses/seats/${bus.id}?operator=${encodeURIComponent(bus.operator)}&timing=${encodeURIComponent(bus.departure)}`)}
                        className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)] p-4 relative cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-1.5">
                            <div className="flex-1">
                                <h3 className="text-base font-black text-gray-900 leading-tight">{bus.operator}</h3>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">{bus.type}</p>
                            </div>
                            <div className="bg-[#1eb27e] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm h-fit">
                                <Star size={10} fill="currentColor" />
                                <span className="text-[10px] font-black">{bus.rating}</span>
                                <div className="h-2.5 w-[1px] bg-white/30 mx-0.5"></div>
                                <span className="text-[9px] font-bold opacity-80">{bus.reviews}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 mb-3 mt-0.5">
                            <div className="flex items-center gap-1">
                                <Clock size={10} strokeWidth={3} />
                                <span>{bus.duration}</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                            <span className={bus.seats.includes('8') ? 'text-red-500' : ''}>{bus.seats} available</span>
                        </div>

                        <div className="flex items-end justify-between border-t border-gray-50 pt-3">
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-gray-900 leading-none tracking-tight">
                                    {bus.departure} - {bus.arrival}
                                </span>
                                <div className="flex gap-1 mt-2.5">
                                    {bus.offers.slice(0, 1).map((offer, idx) => (
                                        <span key={idx} className="text-[9px] font-black text-[#1eb27e] bg-[#e7f9f2] px-2 py-0.5 rounded-md whitespace-nowrap border border-[#d1f1e5]">
                                            {offer}
                                        </span>
                                    ))}
                                    {bus.offers.length > 1 && (
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                            +{bus.offers.length - 1} more
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Total price</span>
                                <span className="text-xl font-black text-gray-900 tracking-tight leading-none">₹{bus.price}</span>
                            </div>
                        </div>

                        {/* Top Decorative Line */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-full -translate-x-[-40px] -translate-y-[40px] pointer-events-none"></div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom Nav Helper */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-3 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button className="flex-1 bg-gray-50 text-gray-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-gray-100">
                    Filters
                </button>
                <button className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-200">
                    Sort
                </button>
            </div>
        </div>
    );
};

export default BusResults;
