import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, ArrowUpDown, Calendar, ChevronRight, X, Search, ShieldCheck, Zap, Star, Map as MapIcon, Clock, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBusCities } from '../../services/api/customerBusService';
import { toast } from 'react-hot-toast';

import { useLocation } from '../../hooks/useLocation';
import GenericLocationAutocomplete from '../../components/GenericLocationAutocomplete';

const BusSearch: React.FC = () => {
    const navigate = useNavigate();
    const { location: userLocation } = useLocation();
    const [from, setFrom] = useState(userLocation?.city || '');

    // Keep source in sync with real-time location city if not manually overridden
    React.useEffect(() => {
        if (userLocation?.city && !from) {
            setFrom(userLocation.city);
        }
    }, [userLocation?.city]);

    const [to, setTo] = useState('');
    const generateQuickDates = () => {
        const dates = [];
        const today = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            dates.push({
                day: d.getDate().toString().padStart(2, '0'),
                label: i === 0 ? 'Today' : days[d.getDay()],
                date: `${d.getDate()} ${months[d.getMonth()]}`,
                isoDate: d.toISOString().split('T')[0]
            });
        }
        return dates;
    };

    const quickDates = generateQuickDates();
    const [selectedDate, setSelectedDate] = useState(quickDates[0].isoDate);
    const [displayDate, setDisplayDate] = useState(quickDates[0].date);
    const [showCityOverlay, setShowCityOverlay] = useState<{ open: boolean; type: 'from' | 'to' }>({ open: false, type: 'from' });
    const [showDateSheet, setShowDateSheet] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    React.useEffect(() => {
        const fetchCities = async () => {
            setIsLoadingCities(true);
            try {
                const response = await getBusCities();
                if (response.success) {
                    setAvailableCities(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch bus cities:', error);
            } finally {
                setIsLoadingCities(false);
            }
        };
        fetchCities();
    }, []);

    const filteredCities = searchQuery 
        ? availableCities.filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
        : availableCities;

    const handleSwap = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    const trendingRoutes = [
        { from: 'Indore', to: 'Ujjain', price: '₹150', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800' },
        { from: 'Ujjain', to: 'Dewas', price: '₹800', img: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800' },
        { from: 'Indore', to: 'Bhopal', price: '₹350', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800' },
    ];

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-['Inter'] pb-20 overflow-x-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-b from-[#b5e431] to-[#d8f07c] px-4 pt-4 pb-16 relative">
                <div className="flex items-center gap-4 mb-2">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-1 active:scale-90 transition-transform"
                    >
                        <ArrowLeft size={24} className="text-gray-900" />
                    </button>
                    <h1 className="text-xl font-[1000] text-gray-900 tracking-tight">Buses</h1>
                </div>
            </div>

            {/* Main Content */}
            <main className="px-5 -mt-10 relative z-10">
                {/* Search Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1),0_0_1px_rgba(0,0,0,0.1)] border border-gray-200 mb-8 relative">
                    <div className="space-y-4 relative">
                        <div className="relative group transition-all">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 ml-1">From</p>
                            <GenericLocationAutocomplete 
                                value={from}
                                onSelect={(data) => setFrom(data.placeName || data.city || '')}
                                placeholder="Leaving from"
                                hideFindButton={true}
                                suggestions={availableCities}
                            />
                        </div>
                        
                        {/* Swap Button */}
                        <div className="absolute right-0 top-[45%] -translate-y-1/2 z-20">
                            <motion.button 
                                whileTap={{ scale: 0.8, rotate: 180 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={(e) => { e.stopPropagation(); handleSwap(); }}
                                className="w-10 h-10 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-lg text-blue-600 hover:border-blue-100 transition-all"
                            >
                                <ArrowUpDown size={18} strokeWidth={3} />
                            </motion.button>
                        </div>

                        <div className="relative group transition-all">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 ml-1">To</p>
                            <GenericLocationAutocomplete 
                                value={to}
                                onSelect={(data) => setTo(data.placeName || data.city || '')}
                                placeholder="Going to"
                                hideFindButton={true}
                                suggestions={availableCities}
                            />
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-100 w-full mb-6 mt-2"></div>

                    {/* Date Selector */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Journey Date</p>
                            <button 
                                onClick={() => setShowDateSheet(true)}
                                className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all border border-transparent hover:border-blue-100"
                            >
                                <Calendar size={14} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                            </button>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 hide-scrollbar">
                            {quickDates.map((date) => {
                                const isSelected = selectedDate === date.isoDate;
                                return (
                                    <motion.button
                                        key={date.day}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedDate(date.isoDate)}
                                        className={`flex-shrink-0 w-[72px] h-[84px] rounded-[24px] border-2 flex flex-col items-center justify-center transition-all ${
                                            isSelected 
                                            ? 'border-blue-600 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200' 
                                            : 'border-neutral-200 bg-white text-neutral-900 hover:border-blue-200'
                                        }`}
                                    >
                                        <span className={`text-xl font-black leading-none ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                                            {date.day}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter mt-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-400'}`}>
                                            {date.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    <motion.button 
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                            if (!from || !to) {
                                alert('Please select source and destination');
                                return;
                            }
                            navigate(`/store/travel/buses/results?from=${from}&to=${to}&date=${selectedDate}`);
                        }}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-4 rounded-[12px] font-[1000] text-base shadow-xl shadow-yellow-100 active:shadow-none transition-all border-b-4 border-yellow-600/30"
                    >
                        Search buses
                    </motion.button>
                </div>

                {/* Trust Badges */}
                <div className="flex gap-3 overflow-x-auto pb-6 -mx-5 px-5 hide-scrollbar mt-2">
                    {[
                        { icon: ShieldCheck, text: 'Clean Buses', desc: 'Verified Hygiene', color: 'green' },
                        { icon: Zap, text: 'Instant Refund', desc: 'Secure Payments', color: 'blue' },
                        { icon: Bus, text: 'On Time', desc: 'Track Live', color: 'red' },
                    ].map((badge, idx) => (
                        <div key={idx} className="flex-shrink-0 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 min-w-[170px]">
                            <div className={`p-2 rounded-xl bg-${badge.color}-50 text-${badge.color}-600`}>
                                <badge.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[11px] font-[1000] text-gray-900 whitespace-nowrap">{badge.text}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trending Routes */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h3 className="text-xl font-[1000] text-gray-900 tracking-tight">Trending Routes</h3>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar -mx-5 px-5">
                        {trendingRoutes.map((route, i) => (
                            <motion.div 
                                key={i}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setFrom(route.from);
                                    setTo(route.to);
                                    navigate(`/store/travel/buses/results?from=${route.from}&to=${route.to}&date=${selectedDate}`);
                                }}
                                className="flex-shrink-0 w-[260px] bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] relative group border-b-4 border-b-gray-50 cursor-pointer"
                            >
                                <div className="h-[150px] relative overflow-hidden">
                                    <img src={route.img} alt={route.from} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-blue-700 shadow-sm border border-white/50">
                                        {route.price} onwards
                                    </div>
                                </div>
                                
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-base font-black text-gray-900">{route.from} → {route.to}</h4>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Date Bottom Sheet (Simplified) */}
            <AnimatePresence>
                {showDateSheet && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end"
                        onClick={() => setShowDateSheet(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[40px] px-6 pt-8 pb-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">Select Date</h2>
                                <button 
                                    onClick={() => setShowDateSheet(false)}
                                    className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-all border border-gray-100"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center mb-6">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <span key={i} className="text-[10px] font-black text-gray-400 uppercase">{d}</span>
                                ))}
                                {Array.from({ length: 30 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    const day = d.getDate().toString().padStart(2, '0');
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;
                                    const isoStr = d.toISOString().split('T')[0];
                                    const isSelected = selectedDate === isoStr;
                                    const isToday = i === 0;
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => { 
                                                setSelectedDate(isoStr); 
                                                setDisplayDate(dateStr);
                                                setShowDateSheet(false); 
                                            }}
                                            className={`h-12 flex flex-col items-center justify-center rounded-xl relative transition-all ${isSelected ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <span className="text-xs font-black">{day}</span>
                                            {isToday && !isSelected && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></div>}
                                        </button>
                                    );
                                })}
                            </div>

                            <button 
                                onClick={() => setShowDateSheet(false)}
                                className="w-full bg-gray-900 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BusSearch;
