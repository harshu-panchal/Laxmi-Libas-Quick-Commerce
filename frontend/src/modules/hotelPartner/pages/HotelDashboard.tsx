import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { getMyHotels, getHotelBookings, updateHotelBookingStatus, getStayInvoiceUrl, Hotel, HotelBooking } from '../../../services/api/hotelPartnerService';
import Skeleton from 'react-loading-skeleton';

const HotelDashboard: React.FC = () => {
  const [hotels, setHotels] = React.useState<Hotel[]>([]);
  const [bookings, setBookings] = React.useState<HotelBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeHotelId, setActiveHotelId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelRes = await getMyHotels();
        if (hotelRes.success && hotelRes.data.length > 0) {
          setHotels(hotelRes.data);
          setActiveHotelId(hotelRes.data[0]._id);
          const bookingRes = await getHotelBookings(hotelRes.data[0]._id);
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
        const res = await updateHotelBookingStatus(bookingId, status);
        if (res.success) {
           setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, bookingStatus: status as any } : b));
        }
     } catch (e) {
        alert("Action failed. Please check status transition.");
     }
  };

  const handleDownloadInvoice = (bookingId: string) => {
     const token = localStorage.getItem('token');
     window.open(getStayInvoiceUrl(bookingId, token), '_blank');
  };

  if (loading) return <div className="p-8">Loading Professional Console...</div>;

  const stats = {
    totalHotels: hotels.length,
    totalBookings: bookings.length,
    revenue: bookings.reduce((acc, b) => acc + b.totalAmount, 0),
    activeStays: bookings.filter(b => b.bookingStatus === 'CheckedIn').length
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header HUD */}
      <div className="bg-[#121212] p-8 rounded-[2rem] text-white overflow-hidden relative">
         <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tighter mb-2">Hotel Partner Console</h2>
            <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-[0.2em]">Operational Dashboard v4.0</p>
         </div>
         <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-teal-500/20 to-transparent"></div>
         <div className="mt-8 flex gap-4">
            {hotels.map(h => (
               <button 
                key={h._id} 
                onClick={async () => {
                    setActiveHotelId(h._id);
                    const res = await getHotelBookings(h._id);
                    if (res.success) setBookings(res.data);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeHotelId === h._id ? 'bg-teal-500 text-white shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
               >
                 {h.name}
               </button>
            ))}
         </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
           <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Properties</div>
           <div className="text-3xl font-black text-neutral-800">{stats.totalHotels}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
           <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Bookings</div>
           <div className="text-3xl font-black text-neutral-800">{stats.totalBookings}</div>
        </div>
        <div className="bg-teal-500 p-6 rounded-3xl shadow-lg shadow-teal-500/20 text-white">
           <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Revenue</div>
           <div className="text-3xl font-black">₹{stats.revenue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
           <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Active Guests</div>
           <div className="text-3xl font-black text-neutral-800">{stats.activeStays}</div>
        </div>
      </div>

      {/* Stay Management Center */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-neutral-800 tracking-tighter">Stay Management Center</h3>
          <div className="text-xs font-bold text-neutral-400">Showing all activity for {hotels.find(h => h._id === activeHotelId)?.name}</div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
           {bookings.length === 0 ? (
             <div className="bg-neutral-50 p-20 rounded-[2rem] text-center border-2 border-dashed border-neutral-200">
                <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">No Bookings Found</p>
             </div>
           ) : (
             bookings.map(booking => (
               <div key={booking._id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                     <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center overflow-hidden">
                        {(booking.userId as any)?.profileImage ? (
                           <img src={(booking.userId as any).profileImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                           <div className="text-xl font-black text-neutral-300">{(booking.userId as any)?.name?.charAt(0) || "G"}</div>
                        )}
                     </div>
                     <div>
                        <div className="text-lg font-black text-neutral-800 tracking-tight">{(booking.userId as any)?.name}</div>
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                           {new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}
                        </div>
                        <div className="mt-1">
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                              booking.bookingStatus === 'CheckedIn' ? 'bg-green-500 text-white' : 
                              booking.bookingStatus === 'CheckedOut' ? 'bg-neutral-100 text-neutral-400' : 
                              'bg-teal-100 text-teal-600'
                           }`}>
                              {booking.bookingStatus}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                     {booking.bookingStatus === 'Confirmed' && (
                        <button 
                           onClick={() => handleStatusUpdate(booking._id, 'CheckedIn')}
                           className="flex-1 md:flex-none px-6 py-3 bg-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
                        >
                           Check In
                        </button>
                     )}
                     {booking.bookingStatus === 'CheckedIn' && (
                        <button 
                           onClick={() => handleStatusUpdate(booking._id, 'CheckedOut')}
                           className="flex-1 md:flex-none px-6 py-3 bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                        >
                           Check Out
                        </button>
                     )}
                     <button 
                        onClick={() => handleDownloadInvoice(booking._id)}
                        className="p-3 bg-neutral-100 text-neutral-600 rounded-2xl hover:bg-neutral-200 transition-all"
                        title="Download Stay Invoice"
                     >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default HotelDashboard;
