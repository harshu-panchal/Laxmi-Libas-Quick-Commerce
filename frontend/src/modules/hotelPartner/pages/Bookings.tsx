import React, { useState, useEffect } from 'react';
import { Table } from '../components/Table';
import { getMyHotels, getHotelBookings, updateHotelBookingStatus, Hotel, HotelBooking } from '../../../services/api/hotelPartnerService';

const Bookings: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await getMyHotels();
        if (res.success && res.data.length > 0) {
          setHotels(res.data);
          setActiveHotelId(res.data[0]._id);
          fetchBookings(res.data[0]._id);
        }
      } catch (e) {
        console.error("Failed to fetch hotels", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const fetchBookings = async (hotelId: string) => {
    setLoading(true);
    try {
      const res = await getHotelBookings(hotelId);
      if (res.success) setBookings(res.data);
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      const res = await updateHotelBookingStatus(bookingId, status);
      if (res.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, bookingStatus: status as any } : b));
      }
    } catch (e) {
      alert("Status update failed");
    }
  };

  const columns = [
    { header: 'Guest', accessor: (item: HotelBooking) => (item.userId as any)?.name || 'Guest', className: 'font-bold' },
    { header: 'Room', accessor: (item: HotelBooking) => (item.roomId as any)?.roomType || 'Standard' },
    { header: 'Check In', accessor: (item: HotelBooking) => new Date(item.checkIn).toLocaleDateString() },
    { header: 'Check Out', accessor: (item: HotelBooking) => new Date(item.checkOut).toLocaleDateString() },
    { 
      header: 'Status', 
      accessor: (item: HotelBooking) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
          item.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-700' : 
          item.bookingStatus === 'CheckedIn' ? 'bg-teal-500 text-white' :
          item.bookingStatus === 'CheckedOut' ? 'bg-neutral-100 text-neutral-400' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {item.bookingStatus}
        </span>
      )
    },
    { 
      header: 'Action', 
      accessor: (item: HotelBooking) => (
        <div className="flex gap-2">
           {item.bookingStatus === 'Confirmed' && (
             <button onClick={() => handleStatusUpdate(item._id, 'CheckedIn')} className="text-[10px] font-black text-teal-600 hover:underline">Check In</button>
           )}
           {item.bookingStatus === 'CheckedIn' && (
             <button onClick={() => handleStatusUpdate(item._id, 'CheckedOut')} className="text-[10px] font-black text-neutral-600 hover:underline">Check Out</button>
           )}
        </div>
      )
    },
    { 
      header: 'Total', 
      accessor: (item: HotelBooking) => `₹${item.totalAmount.toLocaleString()}`,
      className: 'text-right font-bold'
    },
  ];

  if (loading && hotels.length === 0) return <div className="p-8">Loading Bookings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Booking Management</h2>
            <p className="text-neutral-500 font-medium">Monitor your guest activity across all properties.</p>
        </div>
        <div className="flex gap-2">
            {hotels.map(h => (
                <button 
                    key={h._id} 
                    onClick={() => {
                        setActiveHotelId(h._id);
                        fetchBookings(h._id);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeHotelId === h._id ? 'bg-teal-600 text-white shadow-lg' : 'bg-neutral-100 text-neutral-400'}`}
                >
                    {h.name}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <Table columns={columns} data={bookings} />
      </div>
    </div>
  );
};

export default Bookings;
