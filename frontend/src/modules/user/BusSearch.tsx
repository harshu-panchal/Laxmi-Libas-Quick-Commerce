import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, ArrowUpDown, Calendar, ChevronRight, X, Search, ShieldCheck, Zap, Star, Map as MapIcon, Clock, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusSearch: React.FC = () => {
    const navigate = useNavigate();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedDate, setSelectedDate] = useState('08 Apr');
    const [showCityOverlay, setShowCityOverlay] = useState<{ open: boolean; type: 'from' | 'to' }>({ open: false, type: 'from' });
    const [showDateSheet, setShowDateSheet] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    };

    const popularCities = [
        { name: 'Mumbai', state: 'Maharashtra' },
        { name: 'Pune', state: 'Maharashtra' },
        { name: 'Bangalore', state: 'Karnataka' },
        { name: 'Hyderabad', state: 'Telangana' },
        { name: 'Delhi', state: 'NCR' },
        { name: 'Ahmedabad', state: 'Gujarat' },
    ];

    const trendingRoutes = [
        { from: 'Mumbai', to: 'Pune', price: '₹349', img: '/bus_route_1.png' },
        { from: 'Delhi', to: 'Jaipur', price: '₹599', img: '/bus_route_2.png' },
        { from: 'Bangalore', to: 'Goa', price: '₹1,249', img: '/bus_route_1.png' },
    ];

    const quickDates = [
        { day: '08', label: 'Today', date: '08 Apr' },
        { day: '09', label: 'Thu', date: '09 Apr' },
        { day: '10', label: 'Fri', date: '10 Apr' },
        { day: '11', label: 'Sat', date: '11 Apr' },
        { day: '12', label: 'Sun', date: '12 Apr' },
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
                    <div className="space-y-0 relative">
                        <div 
                            onClick={() => setShowCityOverlay({ open: true, type: 'from' })}
                            className="relative py-4 cursor-pointer group active:scale-[0.98] transition-all"
                        >
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">From</p>
                            <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-blue-500" />
                                <span className={`text-lg font-black tracking-tight ${from ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {from || 'Leaving from'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Swap Button */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
                            <motion.button 
                                whileTap={{ scale: 0.8, rotate: 180 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={(e) => { e.stopPropagation(); handleSwap(); }}
                                className="w-10 h-10 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center shadow-lg text-blue-600 hover:border-blue-100 transition-all"
                            >
                                <ArrowUpDown size={18} strokeWidth={3} />
                            </motion.button>
                        </div>

                        <div className="h-[1px] bg-gray-100 my-1"></div>

                        <div 
                            onClick={() => setShowCityOverlay({ open: true, type: 'to' })}
                            className="relative py-4 cursor-pointer group active:scale-[0.98] transition-all"
                        >
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">To</p>
                            <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-red-500" />
                                <span className={`text-lg font-black tracking-tight ${to ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {to || 'Going to'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-gray-100 w-full mb-6 mt-2"></div>

                    {/* Departure Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Departure</p>
                                <h4 className="text-lg font-[1000] text-gray-900">{selectedDate}</h4>
                            </div>
                            <button 
                                onClick={() => setShowDateSheet(true)}
                                className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
                            >
                                <Calendar size={14} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                            </button>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 hide-scrollbar">
                            {quickDates.map((date) => {
                                const isSelected = selectedDate === date.date;
                                return (
                                    <motion.button
                                        key={date.day}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedDate(date.date)}
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
                                        {isSelected && (
                                            <motion.div 
                                                layoutId="activeDateDot"
                                                className="w-1.5 h-1.5 bg-white rounded-full mt-1"
                                            />
                                        )}
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
                        { icon: Clock, text: 'On Time', desc: 'Track Live', color: 'red' },
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
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            className="text-[10px] font-black text-blue-600 border-2 border-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            See All
                        </motion.button>
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
                                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-100/80 uppercase tracking-widest">Trending</span>
                                            <div className="flex items-center gap-1.5">
                                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-[11px] font-black text-white">4.9 (1.2k)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">FROM</p>
                                            <h4 className="text-base font-black text-gray-900 leading-tight">{route.from}</h4>
                                        </div>
                                        <div className="flex-1 px-4 flex items-center">
                                            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-gray-100 via-blue-200 to-gray-100 relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm border border-gray-50">
                                                    <Bus size={10} className="text-blue-600" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">TO</p>
                                            <h4 className="text-base font-black text-gray-900 leading-tight">{route.to}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daily 24+ Buses</p>
                                        </div>
                                        <motion.div 
                                            whileHover={{ x: 3 }}
                                            className="text-blue-600 cursor-pointer"
                                        >
                                            <ChevronRight size={18} strokeWidth={3} />
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Promo Banner Enhanced */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-[#003580] via-[#0047ab] to-[#001b3d] shadow-[0_20px_40px_-10px_rgba(0,53,128,0.3)] p-8 flex flex-col justify-between min-h-[220px] mb-12 border border-white/10"
                >
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 select-none pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#003580] z-10"></div>
                        <Bus size={180} className="text-white/20 absolute -right-10 -bottom-10 rotate-[-15deg]" />
                    </div>

                    <div className="relative z-10 max-w-[80%]">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-yellow-400 text-gray-900 font-[1000] text-[10px] px-3 py-1 rounded-lg uppercase tracking-[0.3em] w-fit mb-5 shadow-lg shadow-yellow-400/20"
                        >
                            LIMITED TIME
                        </motion.div>
                        <h4 className="text-3xl font-[1000] text-white leading-tight mb-3 italic tracking-tighter drop-shadow-md">FLASH SALE</h4>
                        <p className="text-base font-black text-blue-100/90 mb-6 tracking-tight leading-relaxed">
                            Book between <span className="text-white text-xl mx-1 underline decoration-yellow-400 decoration-4 underline-offset-4">2-3 PM</span> for <br /> 
                            <span className="text-3xl font-[1000] text-yellow-400 uppercase tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">FLAT 15% OFF</span>
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                            <motion.div 
                                whileTap={{ scale: 0.9 }}
                                className="bg-white/10 backdrop-blur-xl text-yellow-400 text-[13px] font-black px-6 py-3 rounded-2xl border border-white/20 uppercase tracking-[0.3em] shadow-inner cursor-pointer"
                            >
                                FKFLASH
                            </motion.div>
                            <motion.div 
                                whileTap={{ scale: 0.9 }}
                                className="h-12 w-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-gray-900 active:scale-90 transition-transform cursor-pointer shadow-lg shadow-yellow-400/20"
                            >
                                <Zap size={22} fill="currentColor" strokeWidth={3} />
                            </motion.div>
                        </div>
                    </div>
                    
                    {/* Decorative Blur */}
                    <div className="absolute left-[-40px] top-[-40px] w-[140px] h-[140px] bg-yellow-400/10 rounded-full blur-[80px]"></div>
                </motion.div>
            </main>

            {/* City Selection Overlay */}
            <AnimatePresence>
                {showCityOverlay.open && (
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 bg-white z-[100] flex flex-col pt-4"
                    >
                        <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-50">
                            <button 
                                onClick={() => setShowCityOverlay({ open: false, type: 'from' })}
                                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft size={24} className="text-gray-900" />
                            </button>
                            <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">
                                {showCityOverlay.type === 'from' ? 'Leaving from' : 'Going to'}
                            </h2>
                        </div>

                        <div className="p-5">
                            <div className="relative group mb-8">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                    <Search size={22} strokeWidth={3} />
                                </div>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search your city"
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] py-4.5 pl-14 pr-4 text-base font-black text-gray-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm group-focus-within:shadow-md"
                                />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6">Popular Cities</h3>
                                <div className="grid grid-cols-1 gap-1">
                                    {popularCities.map((city, idx) => (
                                        <motion.div 
                                            key={idx}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                if (showCityOverlay.type === 'from') setFrom(city.name);
                                                else setTo(city.name);
                                                setShowCityOverlay({ open: false, type: 'from' });
                                                setSearchQuery('');
                                            }}
                                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50/50 cursor-pointer group transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <MapIcon size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-gray-900 leading-none group-hover:text-blue-600 transition-colors">{city.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{city.state}</p>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-100 group-hover:text-blue-200 transition-colors" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const day = (i + 1).toString().padStart(2, '0');
                                    const dateStr = `${day} Apr`;
                                    const isSelected = selectedDate === dateStr;
                                    const isToday = day === '08';
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => { setSelectedDate(dateStr); setShowDateSheet(false); }}
                                            className={`h-12 flex flex-col items-center justify-center rounded-xl relative transition-all ${isSelected ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <span className="text-xs font-black">{day}</span>
                                            {isToday && !isSelected && <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>}
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
