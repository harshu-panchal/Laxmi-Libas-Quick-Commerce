import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Download,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Shield,
  Sparkles,
  Award,
  Activity,
  Percent
} from 'lucide-react';
import { 
  getMyHotels, 
  getHotelBookings, 
  updateHotelBookingStatus, 
  getStayInvoiceUrl, 
  getHotelRooms,
  Hotel, 
  HotelBooking,
  HotelRoom
} from '../../../services/api/hotelPartnerService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const HotelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHotelDetails = async (hotelId: string) => {
    try {
      const [bookingRes, roomRes] = await Promise.all([
        getHotelBookings(hotelId),
        getHotelRooms(hotelId)
      ]);
      if (bookingRes.success) setBookings(bookingRes.data);
      if (roomRes.success) setRooms(roomRes.data);
    } catch (e) {
      console.error("Error fetching hotel details in dashboard:", e);
    }
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const hotelRes = await getMyHotels();
      if (hotelRes.success && hotelRes.data.length > 0) {
        setHotels(hotelRes.data);
        const currentHotelId = activeHotelId || hotelRes.data[0]._id;
        if (!activeHotelId) setActiveHotelId(currentHotelId);
        await fetchHotelDetails(currentHotelId);
      }
    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeHotelId) {
      fetchHotelDetails(activeHotelId);
    }
  }, [activeHotelId]);

  const handleStatusUpdate = async (bookingId: string, status: string) => {
     try {
        const res = await updateHotelBookingStatus(bookingId, status);
        if (res.success) {
           setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, bookingStatus: status as any } : b));
        }
     } catch (e) {
        console.error("Status update error", e);
     }
  };

  const handleDownloadInvoice = (bookingId: string) => {
     const token = localStorage.getItem('token');
     window.open(getStayInvoiceUrl(bookingId, token), '_blank');
  };

  const getOccupancyRate = () => {
    if (!bookings.length || !rooms.length) return 0;
    const active = bookings.filter(b => b.bookingStatus === 'CheckedIn').length;
    const totalAllotedRooms = rooms.reduce((sum, r) => sum + (r.totalRooms || 5), 0);
    return Math.min(Math.round((active / (totalAllotedRooms || 20)) * 100), 100);
  };

  const getActiveHotel = () => {
    return hotels.find(h => h._id === activeHotelId);
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[70vh] bg-neutral-50/50 rounded-[3rem]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 text-emerald-600 mb-6 flex items-center justify-center"
      >
        <RefreshCw size={54} />
      </motion.div>
      <h3 className="text-xl font-black text-neutral-800 tracking-tight">Syncing Hospitality Systems...</h3>
      <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mt-2 animate-pulse">Fetching hotel and bookings ledger</p>
    </div>
  );

  const activeHotel = getActiveHotel();

  return (
    <div className="space-y-10 pb-12 max-w-[1600px] mx-auto font-['Inter']">
      {/* Dynamic Hero Section */}
      <div className="relative bg-gradient-to-br from-neutral-950 via-emerald-950 to-neutral-950 rounded-[3rem] p-8 md:p-14 text-white overflow-hidden shadow-2xl border border-emerald-500/10">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Grand Operations Center</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Property Management <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-teal-300">HQ</span>
            </h1>
            <p className="text-neutral-400 font-medium max-w-lg text-sm md:text-base">
              Optimize yield values, manage physical check-ins, oversee live inventory allotments, and analyze luxury earnings in real-time.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full lg:w-auto relative z-20">
            <button 
              onClick={() => fetchData(false)}
              className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-white'}`}
            >
              <RefreshCw size={22} />
            </button>
            <button 
              onClick={() => navigate('/seller/wallet')}
              className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2.5 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <IndianRupee size={18} className="text-emerald-400" />
              Main Wallet
            </button>
            <button 
              onClick={() => navigate('/seller/hotel/add')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2.5 shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Building2 size={18} />
              Add Property
            </button>
          </div>
        </div>

        {/* Dynamic Property Selector Carousel */}
        {hotels.length > 0 && (
          <div className="mt-12 relative z-10 border-t border-white/10 pt-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-4">Switch Properties</p>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {hotels.map(h => (
                <button
                  key={h._id}
                  onClick={() => setActiveHotelId(h._id)}
                  className={`flex-shrink-0 px-6 py-5 rounded-[2.25rem] border-2 transition-all duration-500 flex flex-col items-start gap-1 group relative overflow-hidden ${
                    activeHotelId === h._id 
                    ? 'bg-white border-white text-neutral-900 shadow-2xl scale-[1.03]' 
                    : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-widest ${activeHotelId === h._id ? 'text-emerald-600' : 'text-neutral-400'}`}>
                    {h.propertyType || "Resort"}
                  </span>
                  <span className="text-base font-black tracking-tight">{h.name}</span>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      h.status === 'Approved' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {h.status}
                    </span>
                    {h.rating && (
                      <span className="text-[10px] font-black flex items-center gap-0.5 text-amber-500">
                        ★ {h.rating}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Decorative Art Backgrounds */}
        <div className="absolute top-0 right-0 w-[45%] h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[-5%] w-96 h-96 bg-emerald-500/15 rounded-full blur-[130px] pointer-events-none" />
      </div>

      {/* Analytics Suite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Occupancy', value: getOccupancyRate() + '%', icon: Percent, color: 'text-emerald-500', bg: 'bg-emerald-50', change: '+8.3%' },
          { label: 'Active Bookings', value: bookings.length, icon: Calendar, color: 'text-sky-500', bg: 'bg-sky-50', change: '+12.5%' },
          { label: 'Monthly Revenue', value: '₹' + bookings.reduce((a, b) => a + (b.totalAmount || 0), 0).toLocaleString(), icon: IndianRupee, color: 'text-amber-500', bg: 'bg-amber-50', change: '+19.2%' },
          { label: 'Hotel Star Rating', value: activeHotel?.stars ? activeHotel.stars + ' Star' : '4.8', icon: Award, color: 'text-rose-500', bg: 'bg-rose-50', change: 'Top Tier' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm group hover:shadow-2xl hover:border-emerald-500/10 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-[1.25rem] flex items-center justify-center`}>
                <stat.icon size={26} />
              </div>
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                stat.change.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-neutral-800 tracking-tight mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Bookings Ledger Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-4">
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                <Clock className="text-emerald-500 animate-pulse" size={26} />
                Property Ledger
              </h2>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">Live guests arrivals & checkout transactions</p>
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-neutral-900/10 transition-all">Live</button>
              <button 
                onClick={() => navigate('/seller/hotel/bookings')}
                className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                All
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
            <AnimatePresence mode="popLayout">
              {bookings.length === 0 ? (
                <div className="p-24 text-center space-y-4">
                  <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-2xl flex items-center justify-center mx-auto">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-800">No Booking Records</h3>
                    <p className="text-neutral-400 text-sm font-medium mt-1">Guests bookings and operational check-ins will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-neutral-50/50">
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Guest Info</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Check-In / Out</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {bookings.map((booking, i) => (
                        <motion.tr
                          key={booking._id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-neutral-50/40 transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-black rounded-2xl flex items-center justify-center text-base relative overflow-hidden">
                                {(booking.userId as any)?.name?.[0] || 'G'}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500" />
                              </div>
                              <div>
                                <h4 className="font-black text-neutral-800">{(booking.userId as any)?.name || 'Valued Guest'}</h4>
                                <p className="text-xs font-bold text-neutral-400">
                                  Room {booking.rooms?.[0]?.roomNumber || 'TBA'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                                <Calendar size={12} className="text-neutral-400" />
                                {format(new Date(booking.checkIn), 'MMM dd')} - {format(new Date(booking.checkOut), 'MMM dd')}
                              </p>
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                {format(new Date(booking.checkOut), 'yyyy')}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              booking.bookingStatus === 'CheckedIn' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-md shadow-emerald-500/5' : 
                              booking.bookingStatus === 'Confirmed' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                              'bg-neutral-50 text-neutral-400 border border-neutral-100'
                            }`}>
                              {booking.bookingStatus}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-end gap-3">
                              <div className="text-right mr-3 hidden sm:block">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Amount Paid</p>
                                <p className="text-sm font-black text-neutral-800">₹{booking.totalAmount.toLocaleString()}</p>
                              </div>
                              
                              {booking.bookingStatus === 'Confirmed' && (
                                <button 
                                  onClick={() => handleStatusUpdate(booking._id, 'CheckedIn')}
                                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 active:scale-95 transition-all duration-300"
                                >
                                  Check In
                                </button>
                              )}
                              
                              {booking.bookingStatus === 'CheckedIn' && (
                                <button 
                                  onClick={() => handleStatusUpdate(booking._id, 'CheckedOut')}
                                  className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all duration-300"
                                >
                                  Check Out
                                </button>
                              )}

                              <button 
                                onClick={() => handleDownloadInvoice(booking._id)}
                                className="p-3 bg-neutral-50 text-neutral-600 rounded-xl hover:bg-neutral-100 transition-all border border-neutral-100"
                                title="Download Stay Invoice"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Side Panel: Inventory Allocation & Yield Advice */}
        <div className="space-y-6">
          {/* Real-time Room Inventory Matrix */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-emerald-500 animate-pulse" />
                Inventory Matrix
              </h3>
              <button 
                onClick={() => navigate('/seller/hotel/rooms')}
                className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-wider"
              >
                Manage
              </button>
            </div>

            <div className="space-y-4">
              {rooms.length === 0 ? (
                <div className="p-6 bg-neutral-50 rounded-2xl text-center">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">No room classes defined</p>
                </div>
              ) : (
                rooms.map(room => {
                  const bookedCount = bookings.filter(b => b.bookingStatus === 'CheckedIn' && b.rooms?.[0]?.roomType === room.roomType).length;
                  const vacancyPercent = Math.max(0, Math.round(((room.totalRooms - bookedCount) / room.totalRooms) * 100));
                  
                  return (
                    <div key={room._id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-neutral-800">{room.roomType}</h4>
                          <p className="text-[10px] text-neutral-400 font-bold">Base: ₹{room.pricePerNight}/night</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          vacancyPercent > 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {room.availabilityStatus || "Available"}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                          <span>Vacant</span>
                          <span>{room.totalRooms - bookedCount} / {room.totalRooms} Rooms</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              vacancyPercent > 40 ? 'bg-emerald-500' : vacancyPercent > 15 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${vacancyPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Administrative Rules & Policies governed by Platform Admin */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <Shield size={18} className="text-emerald-500" />
                Property Policies
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full">
                Admin Managed
              </span>
            </div>

            {activeHotel?.policies ? (
              <div className="space-y-4 text-xs font-semibold text-neutral-600">
                <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                  <span className="text-neutral-400">Check-In Time</span>
                  <span className="font-black text-neutral-800">{activeHotel.policies.checkInTime || '12:00 PM'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                  <span className="text-neutral-400">Check-Out Time</span>
                  <span className="font-black text-neutral-800">{activeHotel.policies.checkOutTime || '11:00 AM'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { label: 'Couple Friendly', val: activeHotel.policies.coupleFriendly },
                    { label: 'Pets Allowed', val: activeHotel.policies.petsAllowed },
                    { label: 'Smoking Allowed', val: activeHotel.policies.smokingAllowed },
                    { label: 'Local IDs Allowed', val: activeHotel.policies.localIdsAllowed },
                    { label: 'Alcohol Allowed', val: activeHotel.policies.alcoholAllowed },
                    { label: 'Events Allowed', val: activeHotel.policies.forEvents },
                    { label: 'Outside Food', val: activeHotel.policies.outsideFoodAllowed },
                  ].map((policy) => (
                    <div 
                      key={policy.label} 
                      className={`flex items-center gap-1.5 p-2 rounded-xl border ${
                        policy.val 
                          ? 'bg-emerald-50/30 border-emerald-100/60 text-emerald-700' 
                          : 'bg-neutral-50/50 border-neutral-100 text-neutral-400'
                      }`}
                    >
                      {policy.val ? <CheckCircle2 size={13} className="text-emerald-500" /> : <XCircle size={13} className="text-neutral-300" />}
                      <span className="text-[10px] font-bold truncate">{policy.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No policies configured. Contact platform admin.</p>
            )}
          </div>

          {/* AI Yield Smart advisor */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/[0.02] to-transparent p-8 rounded-[2.5rem] border border-amber-500/20 shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-black text-amber-800 tracking-tight">RevPAR Advisor</h3>
              <p className="text-neutral-600 text-xs font-medium leading-relaxed">
                Manali peak snowfall period is starting. Increase weekend rates for your Deluxe Suite rooms by <span className="text-amber-600 font-black">20%</span> to capture tourist high-demand premium margins.
              </p>
              <button 
                onClick={() => navigate('/seller/hotel/rooms')}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300"
              >
                Open Pricing Portal
              </button>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
          </div>

          {/* Luxury Support Banner */}
          <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-emerald-500/20">
             <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Need Operations Help?</h3>
                <p className="text-emerald-100 text-xs font-medium leading-relaxed">Get 24/7 dedicated support priority queue assistance for hotel room check-in or booking invoice generation issues.</p>
                <button className="px-5 py-2.5 bg-white text-emerald-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl">Call Concierge</button>
             </div>
             <div className="absolute right-[-20%] bottom-[-20%] w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDashboard;
