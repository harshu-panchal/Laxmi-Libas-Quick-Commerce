import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { getMyBuses, getBusBookings, updateBusBookingStatus, getManifestUrl, Bus, BusBooking } from '../../../services/api/transportPartnerService';
import Skeleton from 'react-loading-skeleton';

const TransportDashboard: React.FC = () => {
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [bookings, setBookings] = React.useState<BusBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeBusId, setActiveBusId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const busRes = await getMyBuses();
        if (busRes.success && busRes.data.length > 0) {
          setBuses(busRes.data);
          setActiveBusId(busRes.data[0]._id);
          const bookingRes = await getBusBookings(busRes.data[0]._id);
          if (bookingRes.success) setBookings(bookingRes.data);
        }
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (bookingId: string, status: string) => {
     try {
        const res = await updateBusBookingStatus(bookingId, status);
        if (res.success) {
           setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: status as any } : b));
        }
     } catch (e) {
        alert("Action failed.");
     }
  };

  const handleDownloadManifest = (busId: string) => {
     const token = localStorage.getItem('token');
     window.open(getManifestUrl(busId, token), '_blank');
  };

  if (loading) return <div className="p-8">Syncing Fleet Data...</div>;

  const stats = {
    totalBuses: buses.length,
    totalBookings: bookings.length,
    revenue: bookings.reduce((acc, b) => acc + b.amount, 0),
    boardedCount: bookings.filter(b => b.status === 'Boarded').length
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Fleet Header HUD */}
      <div className="bg-[#1a1a1a] p-10 rounded-[2.5rem] text-white overflow-hidden relative border border-neutral-800">
         <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter mb-2">Fleet Management Console</h2>
            <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-[0.2em]">Route Intelligence & Tracking</p>
         </div>
         <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full"></div>
         
         <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {buses.map(bus => (
               <button 
                key={bus._id} 
                onClick={async () => {
                    setActiveBusId(bus._id);
                    const res = await getBusBookings(bus._id);
                    if (res.success) setBookings(res.data);
                }}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${activeBusId === bus._id ? 'bg-teal-500 border-teal-400 text-white shadow-xl shadow-teal-500/20' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
               >
                 {bus.busName} ({bus.busNumber})
               </button>
            ))}
         </div>
      </div>

      {/* Analytics KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Fleet Size</div>
               <div className="text-3xl font-black text-neutral-800">{stats.totalBuses}</div>
            </div>
            <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Bookings</div>
               <div className="text-3xl font-black text-neutral-800">{stats.totalBookings}</div>
            </div>
            <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Boarded Today</div>
               <div className="text-3xl font-black text-neutral-800">{stats.boardedCount}</div>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
            </div>
        </div>
        <div className="bg-neutral-900 p-6 rounded-[2rem] shadow-xl shadow-black/10 text-white flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Fleet Revenue</div>
               <div className="text-3xl font-black text-white">₹{stats.revenue.toLocaleString()}</div>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400 font-bold">₹</div>
        </div>
      </div>

      {/* Operational Manifest Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-black text-neutral-800 tracking-tighter">Passenger Manifest</h3>
            <p className="text-sm font-medium text-neutral-400">Manage boarding and seat verification</p>
          </div>
          {activeBusId && (
            <button 
              onClick={() => handleDownloadManifest(activeBusId)}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-100 test-neutral-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all border border-neutral-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download Manifest PDF
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                       <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Passenger</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Seat Nos</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Amount</th>
                       <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-50">
                    {bookings.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-neutral-400 font-bold uppercase text-xs tracking-widest">No passengers assigned to this trip</td>
                       </tr>
                    ) : (
                       bookings.map(booking => (
                          <tr key={booking._id} className="hover:bg-neutral-50/50 transition-colors group">
                             <td className="px-8 py-5">
                                <div className="font-black text-neutral-800 tracking-tight">{(booking.userId as any)?.name || "GUEST"}</div>
                                <div className="text-[10px] font-bold text-neutral-400 tracking-widest">{(booking.userId as any)?.mobile || "NO PHONE"}</div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex gap-1 flex-wrap">
                                   {booking.seats?.map(s => (
                                      <span key={s} className="px-2 py-0.5 bg-neutral-100 rounded-md text-[10px] font-black font-mono text-neutral-600 border border-neutral-200">{s}</span>
                                   ))}
                                </div>
                             </td>
                             <td className="px-6 py-5 font-black text-neutral-800">₹{booking.amount}</td>
                             <td className="px-6 py-5">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                   booking.status === 'Boarded' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
                                   booking.status === 'Completed' ? 'bg-green-100 text-green-600 border border-green-200' : 
                                   'bg-teal-100 text-teal-600 border border-teal-200'
                                }`}>
                                   {booking.status}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-right">
                                {booking.status === 'Confirmed' && (
                                   <button 
                                      onClick={() => handleStatusUpdate(booking._id, 'Boarded')}
                                      className="px-4 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
                                   >
                                      Mark Boarded
                                   </button>
                                )}
                                {booking.status === 'Boarded' && (
                                   <button 
                                      onClick={() => handleStatusUpdate(booking._id, 'Completed')}
                                      className="px-4 py-2 bg-neutral-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                                   >
                                      Trip Complete
                                   </button>
                                )}
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
