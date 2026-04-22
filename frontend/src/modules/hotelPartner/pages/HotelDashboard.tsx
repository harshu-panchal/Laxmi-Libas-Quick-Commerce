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
  IndianRupee
} from 'lucide-react';
import { 
  getMyHotels, 
  getHotelBookings, 
  updateHotelBookingStatus, 
  getStayInvoiceUrl, 
  Hotel, 
  HotelBooking 
} from '../../../services/api/hotelPartnerService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const HotelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const hotelRes = await getMyHotels();
      if (hotelRes.success && hotelRes.data.length > 0) {
        setHotels(hotelRes.data);
        const currentHotelId = activeHotelId || hotelRes.data[0]._id;
        if (!activeHotelId) setActiveHotelId(currentHotelId);
        
        const bookingRes = await getHotelBookings(currentHotelId);
        if (bookingRes.success) setBookings(bookingRes.data);
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
    if (!bookings.length) return 0;
    const active = bookings.filter(b => b.bookingStatus === 'CheckedIn').length;
    return Math.round((active / (hotels.length * 10)) * 100); // Mock total capacity for now
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 text-teal-600 mb-4"
      >
        <RefreshCw size={48} />
      </motion.div>
      <p className="text-sm font-black text-neutral-400 uppercase tracking-widest animate-pulse">Syncing Property Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      {/* Dynamic Hero Section */}
      <div className="relative bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden shadow-2xl shadow-teal-900/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full"
            >
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Live Operations Panel</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Property Command <span className="text-teal-500">Center</span></h1>
            <p className="text-neutral-400 font-medium max-w-md">Manage your inventory, optimize occupancy, and track revenue for all your properties in real-time.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => fetchData(false)}
              className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => navigate('/seller/hotel/add')}
              className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Building2 size={20} />
              Add Property
            </button>
          </div>
        </div>

        {/* Property Selector Hub */}
        <div className="mt-12 flex gap-4 overflow-x-auto pb-4 scrollbar-hide relative z-10">
          {hotels.map(h => (
            <button
              key={h._id}
              onClick={() => setActiveHotelId(h._id)}
              className={`flex-shrink-0 px-6 py-4 rounded-3xl border-2 transition-all flex flex-col items-start gap-1 group ${
                activeHotelId === h._id 
                ? 'bg-white border-white text-neutral-900 shadow-xl' 
                : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Property</span>
              <span className="text-lg font-black tracking-tight">{h.name}</span>
              <div className={`mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                h.status === 'Approved' ? 'bg-teal-500/10 text-teal-500' : 'bg-orange-500/10 text-orange-500'
              }`}>
                {h.status}
              </div>
            </button>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-[-50%] left-[-10%] w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Analytics Suite */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Occupancy', value: getOccupancyRate() + '%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Bookings', value: bookings.length, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Monthly Revenue', value: '₹' + bookings.reduce((a, b) => a + b.totalAmount, 0).toLocaleString(), icon: IndianRupee, color: 'text-teal-500', bg: 'bg-teal-50' },
          { label: 'Guest Feedback', value: '4.8', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm group hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12.5%</span>
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-neutral-800 tracking-tighter mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Bookings Ledger */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
              <Clock className="text-teal-500" size={24} />
              Operational Ledger
            </h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-bold hover:bg-neutral-200 transition-all">Today</button>
              <button className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold hover:bg-neutral-50 transition-all">Weekly</button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {bookings.length === 0 ? (
                <div className="p-20 bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-neutral-200 text-center">
                  <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">No activity records found</p>
                </div>
              ) : (
                bookings.map((booking, i) => (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all group flex flex-col sm:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl font-black text-neutral-300 relative overflow-hidden">
                        {(booking.userId as any)?.name?.[0] || 'G'}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-neutral-800">{(booking.userId as any)?.name || 'Guest'}</h4>
                        <p className="text-xs font-bold text-neutral-400 flex items-center gap-2">
                          <Calendar size={12} />
                          {format(new Date(booking.checkIn), 'MMM dd')} - {format(new Date(booking.checkOut), 'MMM dd, yyyy')}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            booking.bookingStatus === 'CheckedIn' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 
                            booking.bookingStatus === 'Confirmed' ? 'bg-blue-100 text-blue-600' :
                            'bg-neutral-100 text-neutral-400'
                          }`}>
                            {booking.bookingStatus}
                          </span>
                          <span className="px-2.5 py-0.5 bg-neutral-50 rounded-full text-[9px] font-black text-neutral-500 uppercase">
                            Room {booking.rooms?.[0]?.roomNumber || 'TBA'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Amount</p>
                        <p className="text-lg font-black text-neutral-800">₹{booking.totalAmount.toLocaleString()}</p>
                      </div>
                      
                      {booking.bookingStatus === 'Confirmed' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking._id, 'CheckedIn')}
                          className="flex-1 sm:flex-none px-6 py-3 bg-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Check In
                        </button>
                      )}
                      
                      {booking.bookingStatus === 'CheckedIn' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking._id, 'CheckedOut')}
                          className="flex-1 sm:flex-none px-6 py-3 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          Check Out
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDownloadInvoice(booking._id)}
                          className="p-3 bg-neutral-50 text-neutral-600 rounded-2xl hover:bg-neutral-100 transition-all border border-neutral-200"
                        >
                          <Download size={18} />
                        </button>
                        <button className="p-3 bg-neutral-50 text-neutral-600 rounded-2xl hover:bg-neutral-100 transition-all border border-neutral-200">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Side Panel: Insights & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-neutral-900 tracking-tight">Property Yield</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-500 font-bold">Today's Revenue</span>
                <span className="font-black text-neutral-900">₹12,450</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="w-[65%] h-full bg-teal-500 rounded-full" />
              </div>
              <p className="text-[10px] text-neutral-400 font-medium italic">65% of monthly target achieved</p>
            </div>
            
            <div className="pt-6 border-t border-neutral-50 space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-teal-50 text-teal-700 rounded-2xl font-bold text-sm hover:bg-teal-100 transition-all group">
                Manage Inventory
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-neutral-50 text-neutral-700 rounded-2xl font-bold text-sm hover:bg-neutral-100 transition-all group">
                Pricing Settings
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-orange-500 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black">Need Assistance?</h3>
                <p className="text-orange-100 text-sm font-medium">Get 24/7 priority support for all your property operations.</p>
                <button className="px-6 py-3 bg-white text-orange-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl">Contact Support</button>
             </div>
             <div className="absolute right-[-20%] bottom-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDashboard;
