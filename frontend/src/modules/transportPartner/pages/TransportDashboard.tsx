import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bus as BusIcon, 
  Users, 
  MapPin, 
  TrendingUp, 
  Download, 
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
  IndianRupee,
  Navigation
} from 'lucide-react';
import { 
  getMyBuses, 
  getBusBookings, 
  updateBusBookingStatus, 
  getManifestUrl, 
  Bus, 
  BusBooking 
} from '../../../services/api/transportPartnerService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const TransportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [bookings, setBookings] = useState<BusBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBusId, setActiveBusId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);

    try {
      const busRes = await getMyBuses();
      if (busRes.success && busRes.data.length > 0) {
        setBuses(busRes.data);
        const currentBusId = activeBusId || busRes.data[0]._id;
        if (!activeBusId) setActiveBusId(currentBusId);
        
        const bookingRes = await getBusBookings(currentBusId);
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
        const res = await updateBusBookingStatus(bookingId, status);
        if (res.success) {
           setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: status as any } : b));
        }
     } catch (e) {
        console.error("Status update error", e);
     }
  };

  const handleDownloadManifest = (busId: string) => {
     const token = localStorage.getItem('token');
     window.open(getManifestUrl(busId, token), '_blank');
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 text-blue-600 mb-4"
      >
        <RefreshCw size={48} />
      </motion.div>
      <p className="text-sm font-black text-neutral-400 uppercase tracking-widest animate-pulse">Syncing Fleet Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      {/* Fleet Command HUD */}
      <div className="relative bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Route Monitoring Active</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Fleet Operations <span className="text-blue-500">Console</span></h1>
            <p className="text-neutral-400 font-medium max-w-md">Track your routes, manage passenger boarding, and optimize fleet performance across all active routes.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => fetchData(false)}
              className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => navigate('/seller/transport/add')}
              className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <BusIcon size={20} />
              Register New Bus
            </button>
          </div>
        </div>

        {/* Fleet Selector */}
        <div className="mt-12 flex gap-4 overflow-x-auto pb-4 scrollbar-hide relative z-10">
          {buses.map(b => (
            <button
              key={b._id}
              onClick={() => setActiveBusId(b._id)}
              className={`flex-shrink-0 px-6 py-4 rounded-3xl border-2 transition-all flex flex-col items-start gap-1 group ${
                activeBusId === b._id 
                ? 'bg-white border-white text-neutral-900 shadow-xl' 
                : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-widest opacity-60">{b.busNumber}</span>
              <span className="text-lg font-black tracking-tight">{b.busName}</span>
              <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/10 text-blue-500">
                Active Route
              </div>
            </button>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Fleet KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Routes', value: buses.length, icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total Passengers', value: bookings.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Fleet Revenue', value: '₹' + bookings.reduce((a, b) => a + b.amount, 0).toLocaleString(), icon: IndianRupee, color: 'text-teal-500', bg: 'bg-teal-50' },
          { label: 'On-Time Performance', value: '94%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
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
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+5.2%</span>
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-neutral-800 tracking-tighter mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Operational Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Passenger Manifest */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                <Users className="text-blue-500" size={24} />
                Passenger Manifest
              </h2>
              <p className="text-sm font-medium text-neutral-400">Boarding & seating verification for current trip</p>
            </div>
            {activeBusId && (
              <button 
                onClick={() => handleDownloadManifest(activeBusId)}
                className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-neutral-900/20"
              >
                <Download size={16} />
                Download PDF
              </button>
            )}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {bookings.length === 0 ? (
                <div className="p-20 bg-neutral-50 rounded-[2.5rem] border-2 border-dashed border-neutral-200 text-center">
                  <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">No passenger records for this trip</p>
                </div>
              ) : (
                bookings.map((booking, i) => (
                  <motion.div
                    key={booking._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col sm:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl font-black text-neutral-300 relative overflow-hidden">
                        {(booking.userId as any)?.name?.[0] || 'G'}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-neutral-800">{(booking.userId as any)?.name || 'Guest'}</h4>
                        <div className="flex gap-1 mt-1">
                          {booking.seats?.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-neutral-50 border border-neutral-100 rounded-md text-[10px] font-black font-mono text-neutral-500">{s}</span>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            booking.status === 'Boarded' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 
                            booking.status === 'Completed' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Fare Paid</p>
                        <p className="text-lg font-black text-neutral-800">₹{booking.amount.toLocaleString()}</p>
                      </div>
                      
                      {booking.status === 'Confirmed' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking._id, 'Boarded')}
                          className="flex-1 sm:flex-none px-6 py-3 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Mark Boarded
                        </button>
                      )}
                      
                      {booking.status === 'Boarded' && (
                        <button 
                          onClick={() => handleStatusUpdate(booking._id, 'Completed')}
                          className="flex-1 sm:flex-none px-6 py-3 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          Trip Ended
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button className="p-3 bg-neutral-50 text-neutral-600 rounded-2xl hover:bg-neutral-100 transition-all border border-neutral-200">
                          <MapPin size={18} />
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

        {/* Fleet Insights */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-neutral-900 tracking-tight">Route Efficiency</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-neutral-400">
                  <span>Occupancy</span>
                  <span className="text-blue-600">82%</span>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5">
                  <div className="w-[82%] h-full bg-blue-500 rounded-full" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-neutral-400">
                  <span>Fuel Efficiency</span>
                  <span className="text-teal-600">92%</span>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5">
                  <div className="w-[92%] h-full bg-teal-500 rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-neutral-50 space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm hover:bg-blue-100 transition-all group">
                Optimize Schedule
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-neutral-50 text-neutral-700 rounded-2xl font-bold text-sm hover:bg-neutral-100 transition-all group">
                Fleet Tracking
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black">Route Assistance</h3>
                <p className="text-blue-100 text-sm font-medium">Real-time GPS tracking and route optimization support.</p>
                <button className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl">SOS Support</button>
             </div>
             <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
