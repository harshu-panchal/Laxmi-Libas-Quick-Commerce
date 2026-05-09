import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, MapPin, Clock, Users, ChevronRight,
    CheckCircle, XCircle, AlertCircle, Ticket,
    Bus, Hotel, ArrowLeft, Download, Home, Star
} from 'lucide-react';
import { getMyHotelBookings } from '../../services/api/customerHotelService';
import { getMyBusBookings } from '../../services/api/customerBusService';

interface TravelBookingsProps {
    type?: 'all' | 'hotel' | 'bus';
}

const TravelBookings: React.FC<TravelBookingsProps> = ({ type }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    const [activeType, setActiveType] = useState<'all' | 'hotel' | 'bus'>(type || 'all');
    const [bookings, setBookings] = useState<{
        upcoming: any[];
        completed: any[];
        cancelled: any[];
    }>({ upcoming: [], completed: [], cancelled: [] });
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const isSpecialized = type === 'hotel' || type === 'bus';
    const pageTitle = type === 'hotel' 
        ? 'My Hotel Bookings' 
        : type === 'bus' 
            ? 'My Bus Tickets' 
            : 'My Bookings';
    const pageSubtitle = type === 'hotel'
        ? 'Stays & Vacation history'
        : type === 'bus'
            ? 'Bus Travel History'
            : 'Hotels & Buses';

    useEffect(() => {
        const fetchAllBookings = async () => {
            try {
                setLoading(true);
                const [hotelRes, busRes] = await Promise.all([
                    getMyHotelBookings(),
                    getMyBusBookings()
                ]);

                const hotelBookings = (hotelRes.data || []).map((b: any) => ({
                    ...b,
                    travelType: 'hotel',
                    displayStatus: b.bookingStatus?.toLowerCase() || 'pending',
                    displayDate: new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    displayEndDate: new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                }));

                const busBookings = (busRes.data || []).map((b: any) => ({
                    ...b,
                    travelType: 'bus',
                    displayStatus: b.status?.toLowerCase() || 'pending',
                    displayDate: new Date(b.scheduleId?.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    displayEndDate: b.scheduleId?.departureTime || 'N/A'
                }));

                const all = [...hotelBookings, ...busBookings].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Filter out standard orders or keep only corresponding types if specialized
                const filteredAll = all.filter(b => {
                    if (type === 'hotel') return b.travelType === 'hotel';
                    if (type === 'bus') return b.travelType === 'bus';
                    return true;
                });

                const categorized = {
                    upcoming: filteredAll.filter(b => ['confirmed', 'pending', 'locked'].includes(b.displayStatus)),
                    completed: filteredAll.filter(b => b.displayStatus === 'completed'),
                    cancelled: filteredAll.filter(b => ['cancelled', 'failed'].includes(b.displayStatus))
                };

                setBookings(categorized);
            } catch (err) {
                console.error("Failed to fetch travel bookings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllBookings();
    }, [type]);

    const filteredBookings = bookings[activeTab].filter(b => 
        activeType === 'all' ? true : b.travelType === activeType
    );

    const getStatusBadge = (status: string, paymentStatus: string) => {
        const s = status.toLowerCase();
        const p = paymentStatus?.toLowerCase();

        if (s === 'confirmed' || s === 'locked' || s === 'pending') {
            if (p === 'paid' || p === 'completed' || p === 'success') {
                return <span className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-green-100 uppercase tracking-wider"><CheckCircle size={10} /> Paid</span>;
            }
            return <span className="bg-yellow-50 text-yellow-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-yellow-100 uppercase tracking-wider"><AlertCircle size={10} /> Pending</span>;
        }
        if (s === 'completed') {
            return <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-100 uppercase tracking-wider"><CheckCircle size={10} /> Completed</span>;
        }
        if (s === 'cancelled' || s === 'failed') {
            return <span className="bg-red-50 text-red-600 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-red-100 uppercase tracking-wider"><XCircle size={10} /> Cancelled</span>;
        }
        return <span className="bg-neutral-50 text-neutral-600 text-[10px] font-black px-2.5 py-1 rounded-full border border-neutral-150 uppercase tracking-wider">{status}</span>;
    };

    return (
        <div className="min-h-screen bg-neutral-50 pb-24 font-['Inter']">
            {/* Header */}
            <div className="bg-[#0f172a] text-white px-5 pt-12 pb-6 sticky top-0 z-30 shadow-md border-b border-neutral-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/account')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">{pageTitle}</h1>
                        <p className="text-[9px] text-teal-400 uppercase tracking-widest font-black mt-0.5">{pageSubtitle}</p>
                    </div>
                </div>

                {!isSpecialized && (
                    <div className="flex gap-2 mt-5">
                        {['all', 'hotel', 'bus'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveType(t as any)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                                    activeType === t 
                                    ? 'bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-500/10' 
                                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {t === 'all' ? 'All Bookings' : t === 'hotel' ? 'Hotels Only' : 'Buses Only'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Tabs */}
            <div className="bg-white shadow-sm border-b border-neutral-100 sticky top-[104px] md:top-[124px] z-20">
                <div className="flex">
                    {[
                        { id: 'upcoming', label: 'Upcoming Trips' },
                        { id: 'completed', label: 'Past Stays' },
                        { id: 'cancelled', label: 'Cancelled' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider relative transition-colors ${activeTab === tab.id ? 'text-teal-600' : 'text-neutral-400'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTravelTab"
                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-teal-500"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="px-4 py-5 max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-24 gap-3">
                            <div className="w-10 h-10 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Searching records...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm"
                        >
                            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-5 text-teal-600 shadow-inner">
                                <Ticket size={36} />
                            </div>
                            <h3 className="text-lg font-black text-neutral-900 mb-1">No {activeTab} Bookings</h3>
                            <p className="text-xs text-neutral-500 max-w-[260px] mb-6 font-semibold leading-relaxed">
                                {activeTab === 'upcoming' 
                                    ? `Ready to travel? Discover stunning destinations and book your next ${type === 'hotel' ? 'hotel stay' : type === 'bus' ? 'bus trip' : 'adventure'} now.` 
                                    : "No bookings found under this tab."}
                            </p>
                            <button
                                onClick={() => navigate(type === 'bus' ? '/travel/buses' : '/travel/hotels')}
                                className="bg-teal-600 text-white font-black py-3.5 px-8 rounded-2xl shadow-lg shadow-teal-600/10 active:scale-95 transition-transform uppercase tracking-wider text-xs"
                            >
                                Book Now
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab + activeType}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {filteredBookings.map((booking, index) => {
                                const isHotel = booking.travelType === 'hotel';
                                const hotelThumb = booking.hotelId?.mainImage || 
                                                   (Array.isArray(booking.hotelId?.images) && booking.hotelId.images[0]) || 
                                                   booking.hotelId?.image || 
                                                   '/hotel_resort_1.png';

                                return (
                                    <motion.div
                                        key={booking._id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-md transition-all relative"
                                    >
                                        <div className="p-4 flex gap-4">
                                            {/* Thumbnail / Left Section */}
                                            {isHotel ? (
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-100 relative">
                                                    <img 
                                                        src={hotelThumb} 
                                                        alt={booking.hotelId?.name || 'Hotel'} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                                                        <Star size={7} className="fill-yellow-400 text-yellow-400" />
                                                        {booking.hotelId?.rating || '4.5'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-teal-50 border border-teal-100 flex flex-col items-center justify-center text-teal-600 relative">
                                                    <Bus size={24} className="stroke-[2.5]" />
                                                    <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-teal-700">TICKET</span>
                                                </div>
                                            )}

                                            {/* Info Section / Right Section */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                                    {getStatusBadge(booking.displayStatus, booking.paymentStatus)}
                                                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                                                        ID: {booking._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </div>

                                                <h3 className="font-black text-neutral-900 text-[15px] leading-snug line-clamp-1 mb-1">
                                                    {isHotel 
                                                        ? (booking.hotelId?.name || 'Premium Hotel Stay') 
                                                        : (booking.scheduleId?.busId?.operatorName || 'Express Travels')}
                                                </h3>

                                                <p className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1 truncate">
                                                    <MapPin size={11} className="text-teal-600 flex-shrink-0" /> 
                                                    {isHotel 
                                                        ? (booking.hotelId?.city || booking.hotelId?.address || 'Indore')
                                                        : `${booking.scheduleId?.routeId?.from || 'Indore'} to ${booking.scheduleId?.routeId?.to || 'Bhopal'}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Dynamic Core Fields Grid */}
                                        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                                            <div className="bg-neutral-50 rounded-2xl p-2.5 border border-neutral-100">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                                                        {isHotel ? 'Check-In' : 'Departure Date'}
                                                    </span>
                                                    <Calendar size={9} className="text-neutral-400" />
                                                </div>
                                                <p className="text-[11px] font-black text-neutral-800 leading-none">{booking.displayDate}</p>
                                            </div>

                                            <div className="bg-neutral-50 rounded-2xl p-2.5 border border-neutral-100">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                                                        {isHotel ? 'Check-Out' : 'Timings'}
                                                    </span>
                                                    <Clock size={9} className="text-neutral-400" />
                                                </div>
                                                <p className="text-[11px] font-black text-neutral-800 leading-none">{booking.displayEndDate}</p>
                                            </div>
                                        </div>

                                        {/* Details Accordion Panel */}
                                        <AnimatePresence>
                                            {expandedId === booking._id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-4 pb-4 pt-1 border-t border-neutral-100 overflow-hidden bg-neutral-50/40"
                                                >
                                                    <div className="space-y-3 pt-2">
                                                        <div>
                                                            <h4 className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Trip Summary</h4>
                                                            <div className="bg-white rounded-2xl p-3 border border-neutral-100 flex items-center justify-between shadow-sm">
                                                                <div>
                                                                    <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Transaction Reference</p>
                                                                    <p className="text-[11px] font-black text-neutral-800 font-mono select-all uppercase">{booking.transactionId || 'TXN-PENDING'}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider">Payment Mode</p>
                                                                    <p className="text-[11px] font-black text-neutral-800 uppercase">{booking.paymentMethod || 'Online Payment'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isHotel ? (
                                                            <div>
                                                                <h4 className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Room & Guest Configuration</h4>
                                                                <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm">
                                                                    <p className="text-xs font-black text-neutral-900">{booking.roomId?.roomType || 'Deluxe Room'}</p>
                                                                    <div className="flex gap-4 mt-1.5">
                                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-500 uppercase">
                                                                            <Users size={10} className="text-neutral-400" /> {booking.guests || '2'} Guests
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-500 uppercase">
                                                                            <Home size={10} className="text-neutral-400" /> {booking.rooms || '1'} Room
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <h4 className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Seat Assignments & Boarding</h4>
                                                                <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm space-y-2">
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {Array.isArray(booking.seats) && booking.seats.length > 0 ? (
                                                                            booking.seats.map((s: any) => (
                                                                                <span key={s.seatNumber} className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-lg text-[9px] font-black text-neutral-800">
                                                                                    Seat {s.seatNumber}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded-lg text-[9px] font-black text-neutral-800">
                                                                                Seat {booking.seatNumber || 'S1'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[9px] font-bold text-neutral-500 uppercase mt-2">Boarding Location: <span className="text-neutral-800 font-black">{booking.pickupPoint || 'Main Depot Stand'}</span></p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Bottom Action Footer */}
                                        <div className="bg-neutral-50 px-4 py-3.5 flex justify-between items-center border-t border-neutral-100">
                                            <div>
                                                <p className="text-[8px] text-neutral-400 font-black uppercase tracking-widest">Total Amount Paid</p>
                                                <p className="text-lg font-black text-neutral-900 leading-none mt-0.5">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {(booking.displayStatus === 'confirmed' || booking.displayStatus === 'completed') && (
                                                    <button 
                                                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm border border-neutral-200 active:scale-90 transition-all hover:bg-neutral-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            alert('Downloading ticket/invoice PDF successfully!');
                                                        }}
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    className="h-10 px-4 bg-neutral-900 text-white rounded-xl flex items-center gap-1.5 font-black text-xs uppercase tracking-tight shadow-sm active:scale-95 transition-all hover:bg-neutral-800"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedId(expandedId === booking._id ? null : booking._id);
                                                    }}
                                                >
                                                    {expandedId === booking._id ? 'Close' : 'Details'}
                                                    <ChevronRight size={14} className={`transition-transform duration-200 ${expandedId === booking._id ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TravelBookings;
