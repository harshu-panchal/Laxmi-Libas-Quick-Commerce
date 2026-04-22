import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, MapPin, Clock, Users, ChevronRight,
    CheckCircle, XCircle, AlertCircle, Ticket,
    Bus, Hotel, ArrowLeft, Download, Home
} from 'lucide-react';
import { getMyHotelBookings } from '../../services/api/customerHotelService';
import { getMyBusBookings } from '../../services/api/customerBusService';

const TravelBookings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    const [activeType, setActiveType] = useState<'all' | 'hotel' | 'bus'>('all');
    const [bookings, setBookings] = useState<{
        upcoming: any[];
        completed: any[];
        cancelled: any[];
    }>({ upcoming: [], completed: [], cancelled: [] });
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
                    displayDate: new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                    displayEndDate: new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                }));

                const busBookings = (busRes.data || []).map((b: any) => ({
                    ...b,
                    travelType: 'bus',
                    displayStatus: b.status?.toLowerCase() || 'pending',
                    displayDate: new Date(b.scheduleId?.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                    displayEndDate: b.scheduleId?.departureTime
                }));

                const all = [...hotelBookings, ...busBookings].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                const categorized = {
                    upcoming: all.filter(b => ['confirmed', 'pending', 'locked'].includes(b.displayStatus)),
                    completed: all.filter(b => b.displayStatus === 'completed'),
                    cancelled: all.filter(b => ['cancelled', 'failed'].includes(b.displayStatus))
                };

                setBookings(categorized);
            } catch (err) {
                console.error("Failed to fetch travel bookings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllBookings();
    }, []);

    const filteredBookings = bookings[activeTab].filter(b => 
        activeType === 'all' ? true : b.travelType === activeType
    );

    const getStatusBadge = (status: string, paymentStatus: string) => {
        const s = status.toLowerCase();
        const p = paymentStatus?.toLowerCase();

        if (s === 'confirmed' || s === 'locked' || s === 'pending') {
            if (p === 'paid' || p === 'completed' || p === 'success') {
                return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Paid</span>;
            }
            return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle size={10} /> Pending</span>;
        }
        if (s === 'completed') {
            return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Completed</span>;
        }
        if (s === 'cancelled' || s === 'failed') {
            return <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><XCircle size={10} /> Cancelled</span>;
        }
        return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">{status}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-primary-dark text-white px-5 pt-12 pb-6 sticky top-0 z-30 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate('/account')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black">My Bookings</h1>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Hotels & Buses</p>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    {['all', 'hotel', 'bus'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type as any)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                activeType === type 
                                ? 'bg-white text-primary-dark shadow-md' 
                                : 'bg-white/10 text-white/80 border border-white/10'
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow-sm border-b border-gray-100 sticky top-[148px] z-20">
                <div className="flex">
                    {[
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'completed', label: 'Past' },
                        { id: 'cancelled', label: 'Cancelled' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 text-sm font-bold relative transition-colors ${activeTab === tab.id ? 'text-primary-dark' : 'text-gray-400'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTravelTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary-dark"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-6">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-gray-400">Fetching your trips...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <Ticket size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No {activeTab} bookings</h3>
                            <p className="text-sm text-gray-500 max-w-[280px] mb-8 font-medium">
                                {activeTab === 'upcoming' ? "Ready for a new adventure? Your upcoming trips will appear here." : "Your booking history will be displayed here."}
                            </p>
                            <button
                                onClick={() => navigate('/store/travel')}
                                className="bg-primary-dark text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-primary-dark/20 active:scale-95 transition-transform"
                            >
                                Plan a Trip
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab + activeType}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {filteredBookings.map((booking, index) => (
                                <motion.div
                                    key={booking._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative"
                                >
                                    <div 
                                        className="cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                                    >
                                        <div className={`absolute top-4 left-4 z-10 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${
                                            booking.travelType === 'hotel' ? 'bg-indigo-500' : 'bg-blue-500'
                                        }`}>
                                            {booking.travelType === 'hotel' ? <Hotel size={16} /> : <Bus size={16} />}
                                        </div>

                                        <div className="p-4 pl-16">
                                            <div className="flex justify-between items-start mb-3">
                                                {getStatusBadge(booking.displayStatus, booking.paymentStatus)}
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">#{booking._id.slice(-8)}</span>
                                            </div>

                                            <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">
                                                {booking.travelType === 'hotel' 
                                                    ? (booking.hotelId?.name || 'Hotel Booking') 
                                                    : (booking.scheduleId?.busId?.operatorName || 'Bus Trip')}
                                            </h3>

                                            <p className="text-xs text-gray-500 font-bold flex items-center gap-1 mb-4">
                                                <MapPin size={12} className="text-primary-dark" /> 
                                                {booking.travelType === 'hotel' 
                                                    ? (booking.hotelId?.city || booking.hotelId?.address || 'Location')
                                                    : `${booking.scheduleId?.routeId?.from} to ${booking.scheduleId?.routeId?.to}`}
                                            </p>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                            {booking.travelType === 'hotel' ? 'Check In' : 'Departure'}
                                                        </span>
                                                        <Calendar size={10} className="text-gray-400" />
                                                    </div>
                                                    <p className="text-xs font-black text-gray-900">{booking.displayDate}</p>
                                                </div>
                                                
                                                <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                            {booking.travelType === 'hotel' ? 'Check Out' : 'Time'}
                                                        </span>
                                                        <Clock size={10} className="text-gray-400" />
                                                    </div>
                                                    <p className="text-xs font-black text-gray-900">{booking.displayEndDate}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedId === booking._id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-6 pb-6 pt-2 border-t border-gray-50 overflow-hidden"
                                                >
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Information</h4>
                                                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Transaction ID</p>
                                                                    <p className="text-xs font-black text-gray-900">{booking.transactionId || 'Pending'}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Payment Mode</p>
                                                                    <p className="text-xs font-black text-gray-900">{booking.paymentMethod || 'Online'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {booking.travelType === 'hotel' && booking.roomId && (
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Room Details</h4>
                                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                                    <p className="text-sm font-black text-gray-900">{booking.roomId.roomType || 'Standard Room'}</p>
                                                                    <div className="flex gap-4 mt-2">
                                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
                                                                            <Users size={10} /> {booking.guests || '2'} Guests
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
                                                                            <Home size={10} /> {booking.rooms || '1'} Room
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {booking.travelType === 'bus' && booking.seats && (
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Seat Details</h4>
                                                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {booking.seats.map((s: any) => (
                                                                            <span key={s.seatNumber} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-900">
                                                                                Seat {s.seatNumber}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-3">Boarding Point: {booking.pickupPoint || 'Main Stand'}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Amount Paid</p>
                                            <p className="text-xl font-black text-gray-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {(booking.displayStatus === 'confirmed' || booking.displayStatus === 'completed') && (
                                                <button 
                                                    className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-dark shadow-sm border border-gray-200 active:scale-90 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        alert('Downloading ticket/invoice...');
                                                    }}
                                                >
                                                    <Download size={20} />
                                                </button>
                                            )}
                                            <button 
                                                className="h-12 px-4 bg-primary-dark text-white rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-primary-dark/20 active:scale-95 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedId(expandedId === booking._id ? null : booking._id);
                                                }}
                                            >
                                                {expandedId === booking._id ? 'Close' : 'Details'}
                                                <ChevronRight size={16} className={`transition-transform ${expandedId === booking._id ? 'rotate-90' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TravelBookings;
