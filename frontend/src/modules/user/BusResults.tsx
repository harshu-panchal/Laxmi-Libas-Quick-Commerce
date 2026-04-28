import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, ChevronRight, ChevronDown, Star, Clock, Bus } from 'lucide-react';
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
            }
        } catch (error) {
            console.error('Failed to fetch buses:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchBusesList();
    }, [from, to, selectedDate]);

    // Generate dynamic 5-day window starting from the selected date (or today if selected is in the past)
    const dates = Array.from({ length: 5 }, (_, i) => {
        const baseDate = new Date(initialDate);
        // Ensure we don't start before today
         const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        
        // Format for display
        const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        return { day, date: dateStr };
    });

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
                <span className="text-sm font-black text-gray-600">Showing {fetchedBuses.length} results</span>
                <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full flex items-center gap-2 border border-blue-100 shadow-sm active:scale-95 transition-all">
                    <span className="text-xs font-black">Sort: Top rated</span>
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
                ) : fetchedBuses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <Bus size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">No Buses Found</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6">We couldn't find any buses for this route on the selected date.</p>
                        <button 
                            onClick={() => navigate(-1)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                        >
                            Change Search
                        </button>
                    </div>
                ) : fetchedBuses.map((bus) => {
                    const busId = bus._id;
                    const operator = bus.operatorName;
                    const busType = bus.busType;
                    const rating = bus.rating || 4.2;
                    const reviews = bus.reviewsCount || 0;
                    const price = bus.basePrice; // Changed from bus.price to bus.basePrice
                    const departure = bus.departureTime;
                    const arrival = bus.arrivalTime;
                    const duration = bus.duration || '07h 30m'; // Default duration if missing
                    const seatsLeft = bus.availableSeats;
                    const offers = bus.offers || ['FKBUS10 - 10% Off']; 

                    return (
                        <motion.div 
                            key={busId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/store/travel/buses/seats/${busId}?operator=${encodeURIComponent(operator)}&timing=${encodeURIComponent(departure)}`)}
                            className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)] p-4 relative cursor-pointer"
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
                                <span className={seatsLeft < 10 ? 'text-red-500' : ''}>{seatsLeft} left</span>
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

                            {/* Top Decorative Line */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-full -translate-x-[-40px] -translate-y-[40px] pointer-events-none"></div>
                        </motion.div>
                    );
                })}
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
