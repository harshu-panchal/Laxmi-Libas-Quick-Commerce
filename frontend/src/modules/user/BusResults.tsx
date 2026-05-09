import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, ChevronRight, ChevronDown, Star, Clock, Bus, X, Check, Filter as FilterIcon, ArrowUpDown } from 'lucide-react';
import { searchBuses } from '../../services/api/customerBusService';

const BusResults: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const from = queryParams.get('from') || 'Jabalpur';
    const to = queryParams.get('to') || 'Indore';
    const initialDate = queryParams.get('date') || new Date().toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [fetchedBuses, setFetchedBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter/Sort Modal State
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [showSortSheet, setShowSortSheet] = useState(false);

    // Selected Filters State
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState<number>(3000);
    const [sortBy, setSortBy] = useState<string>('rating'); // 'rating', 'price-low', 'price-high', 'duration', 'departure'

    const fetchBusesList = async () => {
        setLoading(true);
        try {
            const response = await searchBuses({
                from,
                to,
                date: selectedDate
            });
            if (response.success) {
                setFetchedBuses(response.data);
                // Dynamically find maximum price to initialize filter slider correctly
                if (response.data.length > 0) {
                    const highestPrice = Math.max(...response.data.map((b: any) => b.basePrice || 0));
                    setMaxPrice(highestPrice > 0 ? highestPrice : 3000);
                }
            }
        } catch (error) {
            console.error('Failed to fetch buses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusesList();
    }, [from, to, selectedDate]);

    // Extract dynamic filter values from actual fetched buses
    const uniqueBusTypes = Array.from(new Set(fetchedBuses.map((b: any) => b.busType).filter(Boolean))) as string[];
    const uniqueOperators = Array.from(new Set(fetchedBuses.map((b: any) => b.operatorName).filter(Boolean))) as string[];

    // Reset filters helper
    const handleResetFilters = () => {
        setSelectedTypes([]);
        setSelectedOperators([]);
        if (fetchedBuses.length > 0) {
            const highestPrice = Math.max(...fetchedBuses.map((b: any) => b.basePrice || 0));
            setMaxPrice(highestPrice > 0 ? highestPrice : 3000);
        } else {
            setMaxPrice(3000);
        }
    };

    // Client-side dynamic filter & sort
    const processedBuses = fetchedBuses
        .filter((bus: any) => {
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(bus.busType);
            const matchesOperator = selectedOperators.length === 0 || selectedOperators.includes(bus.operatorName);
            const busPrice = bus.basePrice || 0;
            const matchesPrice = busPrice <= maxPrice;
            return matchesType && matchesOperator && matchesPrice;
        })
        .sort((a: any, b: any) => {
            if (sortBy === 'rating') {
                return (b.rating || 4.2) - (a.rating || 4.2);
            }
            if (sortBy === 'price-low') {
                return (a.basePrice || 0) - (b.basePrice || 0);
            }
            if (sortBy === 'price-high') {
                return (b.basePrice || 0) - (a.basePrice || 0);
            }
            if (sortBy === 'departure') {
                return (a.departureTime || '').localeCompare(b.departureTime || '');
            }
            return 0;
        });

    // Generate dynamic 5-day window starting from the selected date (or today if selected is in the past)
    const dates = Array.from({ length: 5 }, (_, i) => {
        const baseDate = new Date(initialDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        
        const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        return { day, date: dateStr };
    });

    const getSortByLabel = () => {
        switch (sortBy) {
            case 'rating': return 'Top Rated';
            case 'price-low': return 'Price: Low to High';
            case 'price-high': return 'Price: High to Low';
            case 'departure': return 'Departure Time';
            default: return 'Top Rated';
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f3f6] font-['Inter'] pb-28">
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
                    <span className="text-xs font-black text-gray-800">LAXMART | Flat 15% Off on Travel Bookings</span>
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

            {/* Results Header & Filter Info */}
            <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-black text-gray-600">Showing {processedBuses.length} results</span>
                <button 
                    onClick={() => setShowSortSheet(true)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm active:scale-95 transition-all"
                >
                    <span className="text-xs font-black">Sort: {getSortByLabel()}</span>
                    <ChevronDown size={16} strokeWidth={3} />
                </button>
            </div>

            {/* Bus Cards */}
            <div className="px-3 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm font-bold text-gray-500">Searching buses...</p>
                    </div>
                ) : processedBuses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <Bus size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">No Buses Found</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6">We couldn't find any buses matching your active filters.</p>
                        <button 
                            onClick={handleResetFilters}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : processedBuses.map((bus) => {
                    const busId = bus._id;
                    const operator = bus.operatorName;
                    const busType = bus.busType;
                    const rating = bus.rating || 4.2;
                    const price = bus.basePrice;
                    const departure = bus.departureTime;
                    const arrival = bus.arrivalTime;
                    const duration = bus.duration || '07h 30m';
                    const seatsLeft = bus.availableSeats;
                    const offers = bus.offers || ['LXM15 - 15% Off']; 

                    return (
                        <motion.div 
                            key={busId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/store/travel/buses/seats/${busId}?operator=${encodeURIComponent(operator)}&timing=${encodeURIComponent(departure)}`)}
                            className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)] p-4 relative cursor-pointer hover:border-blue-200 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-gray-900 leading-tight">{operator}</h3>
                                    <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">{busType}</p>
                                </div>
                                <div className="bg-[#1eb27e] text-white px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm h-fit">
                                    <Star size={8} fill="currentColor" />
                                    <span className="text-[9px] font-black">{rating}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 mb-2 mt-0.5">
                                <div className="flex items-center gap-1">
                                    <Clock size={8} strokeWidth={3} />
                                    <span>{duration}</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                <span className={seatsLeft < 10 ? 'text-red-500 font-bold animate-pulse' : ''}>{seatsLeft} left</span>
                            </div>

                            <div className="flex items-end justify-between border-t border-gray-50 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-base font-black text-gray-900 leading-none tracking-tight">
                                        {departure} - {arrival}
                                    </span>
                                    <div className="flex gap-1 mt-2">
                                        {offers.slice(0, 1).map((offer: string, idx: number) => (
                                            <span key={idx} className="text-[8px] font-black text-[#1eb27e] bg-[#e7f9f2] px-1.5 py-0.5 rounded-md whitespace-nowrap border border-[#d1f1e5]">
                                                {offer}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-lg font-black text-gray-900 tracking-tight leading-none">₹{price}</span>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-full -translate-x-[-40px] -translate-y-[40px] pointer-events-none"></div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom Nav Helper */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-3 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={() => setShowFilterSheet(true)}
                    className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border flex items-center justify-center gap-2 transition-all ${
                        selectedTypes.length > 0 || selectedOperators.length > 0 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                        : 'bg-gray-50 text-gray-900 border-gray-100'
                    }`}
                >
                    <FilterIcon size={14} />
                    Filters {(selectedTypes.length + selectedOperators.length) > 0 && `(${(selectedTypes.length + selectedOperators.length)})`}
                </button>
                <button 
                    onClick={() => setShowSortSheet(true)}
                    className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                    <ArrowUpDown size={14} />
                    Sort
                </button>
            </div>

            {/* Dynamic Filters Bottom Sheet */}
            <AnimatePresence>
                {showFilterSheet && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end"
                        onClick={() => setShowFilterSheet(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[40px] px-6 pt-8 pb-10 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">Filters</h2>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Refine Your Travel Options</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handleResetFilters}
                                        className="text-xs font-black uppercase text-red-500 tracking-wider hover:underline"
                                    >
                                        Clear All
                                    </button>
                                    <button 
                                        onClick={() => setShowFilterSheet(false)}
                                        className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 border border-gray-100 transition-colors"
                                    >
                                        <X size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Coach Types (Dynamic) */}
                            {uniqueBusTypes.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Coach Type</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueBusTypes.map((type) => {
                                            const isSelected = selectedTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setSelectedTypes(prev => 
                                                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                                        );
                                                    }}
                                                    className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center gap-2 ${
                                                        isSelected 
                                                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Operators (Dynamic) */}
                            {uniqueOperators.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Operators</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueOperators.map((operator) => {
                                            const isSelected = selectedOperators.includes(operator);
                                            return (
                                                <button
                                                    key={operator}
                                                    onClick={() => {
                                                        setSelectedOperators(prev => 
                                                            prev.includes(operator) ? prev.filter(o => o !== operator) : [...prev, operator]
                                                        );
                                                    }}
                                                    className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center gap-2 ${
                                                        isSelected 
                                                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                                                    }`}
                                                >
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                    {operator}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Price Slider */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Max Price</h3>
                                    <span className="text-sm font-black text-blue-600">₹{maxPrice}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="5000" 
                                    step="100"
                                    value={maxPrice} 
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full accent-blue-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                                />
                                <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mt-2">
                                    <span>₹0</span>
                                    <span>₹5,000</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowFilterSheet(false)}
                                className="w-full bg-blue-600 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-blue-100"
                            >
                                Apply Filters
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sorting Bottom Sheet */}
            <AnimatePresence>
                {showSortSheet && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end"
                        onClick={() => setShowSortSheet(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full bg-white rounded-t-[40px] px-6 pt-8 pb-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-[1000] text-gray-900 tracking-tight">Sort By</h2>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Order Journey Options</span>
                                </div>
                                <button 
                                    onClick={() => setShowSortSheet(false)}
                                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 border border-gray-100 transition-colors"
                                >
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="space-y-2 mb-6">
                                {[
                                    { id: 'rating', label: 'Customer Rating (High to Low)' },
                                    { id: 'price-low', label: 'Price (Low to High)' },
                                    { id: 'price-high', label: 'Price (High to Low)' },
                                    { id: 'departure', label: 'Departure Time (Earliest First)' }
                                ].map((option) => {
                                    const isSelected = sortBy === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setSortBy(option.id);
                                                setShowSortSheet(false);
                                            }}
                                            className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                                                isSelected 
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-black' 
                                                : 'border-transparent hover:bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{option.label}</span>
                                            {isSelected && <Check size={16} strokeWidth={3} className="text-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BusResults;

