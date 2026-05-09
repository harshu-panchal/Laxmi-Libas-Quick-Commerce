import React, { useState, useEffect } from 'react';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { SeatLayout } from '../components/SeatLayout';
import { getSellerAllBookings } from '../../../services/api/transportPartnerService';

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await getSellerAllBookings();
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch live passenger bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRowClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const columns = [
    { 
      header: 'Booking ID', 
      accessor: (item: any) => (
        <span className="font-mono font-bold text-neutral-600">
          {item._id?.substring(0, 8).toUpperCase() || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Passenger', 
      accessor: (item: any) => {
        const names = item.seats?.map((s: any) => s.passengerName).filter(Boolean);
        if (names && names.length > 0) return names.join(', ');
        return item.userId?.name || 'Guest Passenger';
      }
    },
    { 
      header: 'Bus', 
      accessor: (item: any) => item.scheduleId?.busId?.busName || 'Laxmi Travels'
    },
    { 
      header: 'Route', 
      accessor: (item: any) => {
        const route = item.scheduleId?.routeId;
        return route ? `${route.from} to ${route.to}` : 'N/A';
      }
    },
    { 
      header: 'Date', 
      accessor: (item: any) => {
        const depDate = item.scheduleId?.departureDate;
        return depDate ? new Date(depDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : 'N/A';
      }
    },
    { 
      header: 'Seats', 
      accessor: (item: any) => (
        <div className="flex flex-wrap gap-1">
          {item.seats?.map((s: any, i: number) => (
            <span key={i} className="font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 text-xs">
              {s.seatNumber}
            </span>
          )) || <span className="text-neutral-400">-</span>}
        </div>
      ) 
    },
    { 
      header: 'Status', 
      accessor: (item: any) => {
        const displayStatus = item.status === 'confirmed' || item.status === 'Confirmed' ? 'Confirmed' : 
                              item.status === 'LOCKED' ? 'Pending (Lock)' : item.status || 'Pending';
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            displayStatus === 'Confirmed' ? 'bg-green-100 text-green-700 border border-green-200' : 
            displayStatus.includes('Pending') ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
            'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {displayStatus}
          </span>
        );
      }
    },
  ];

  // Filtering based on search query
  const filteredBookings = bookings.filter((b: any) => {
    const passengerName = b.seats?.map((s: any) => s.passengerName).join(' ') || b.userId?.name || '';
    const busName = b.scheduleId?.busId?.busName || '';
    const idString = b._id || '';
    return passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           busName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           idString.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Passenger Bookings</h2>
        <p className="text-neutral-500 font-medium">View and manage all real-time bus ticket bookings. Click a row to view passenger details.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-neutral-800">Booking History</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search passenger, bus or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 outline-none w-64 font-medium text-neutral-700 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-100 rounded-2xl">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-500 font-bold mt-4">Loading real-time passenger logs...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-100 rounded-2xl">
            <svg className="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-neutral-500 font-bold mt-4">No active bookings found matching your search</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredBookings} onRowClick={handleRowClick} />
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Booking Detail - ${selectedBooking?.scheduleId?.busId?.busName || 'Laxmi Travels'}`}
      >
        <div className="space-y-6">
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Passenger(s)</p>
                <p className="text-base font-black text-neutral-800 mt-0.5">
                  {selectedBooking?.seats?.map((s: any) => s.passengerName).join(', ') || selectedBooking?.userId?.name || 'Guest Passenger'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Selected Seat(s)</p>
                <p className="text-base font-black text-teal-600 mt-0.5">
                  {selectedBooking?.seats?.map((s: any) => s.seatNumber).join(', ') || 'N/A'}
                </p>
              </div>
            </div>

            <hr className="border-neutral-200" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Boarding point</p>
                <p className="text-sm font-bold text-neutral-700 mt-0.5">{selectedBooking?.pickupPoint || 'To be specified'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Dropoff point</p>
                <p className="text-sm font-bold text-neutral-700 mt-0.5">{selectedBooking?.dropoffPoint || 'To be specified'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Amount paid</p>
                <p className="text-sm font-black text-neutral-800 mt-0.5">₹{selectedBooking?.totalAmount || '0'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</p>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full mt-1 ${
                  selectedBooking?.status === 'confirmed' || selectedBooking?.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedBooking?.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
          
          <SeatLayout 
            totalSeats={36} 
            onSeatClick={(num) => console.log('Selected seat:', num)} 
          />
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
             <svg className="text-blue-500 mt-0.5 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
             <p className="text-xs text-blue-700 font-medium leading-relaxed">
               This is a preview of the bus seat layout. Locked seats represent confirmed active passenger bookings on this schedule.
             </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingsPage;
