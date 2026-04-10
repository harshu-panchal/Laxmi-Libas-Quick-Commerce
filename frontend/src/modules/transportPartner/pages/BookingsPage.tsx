import React, { useState } from 'react';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { SeatLayout } from '../components/SeatLayout';
import { Booking } from '../types';
import { mockBookings } from '../data/mockData';

const BookingsPage: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Booking ID', accessor: 'id' as keyof Booking },
    { header: 'Passenger', accessor: 'passengerName' as keyof Booking },
    { header: 'Bus', accessor: 'busName' as keyof Booking },
    { header: 'Route', accessor: 'route' as keyof Booking },
    { header: 'Date', accessor: 'date' as keyof Booking },
    { 
      header: 'Seat', 
      accessor: (item: Booking) => (
        <span className="font-black text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100">{item.seatNumber}</span>
      ) 
    },
    { 
      header: 'Status', 
      accessor: (item: Booking) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          item.status === 'Confirmed' ? 'bg-green-100 text-green-700 border border-green-200' : 
          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
          'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {item.status}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Passenger Bookings</h2>
        <p className="text-neutral-500 font-medium">View and manage all bus ticket bookings. Click a row to view seat layout.</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-neutral-800">Booking History</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search passenger..." 
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
            />
          </div>
        </div>
        <Table columns={columns} data={mockBookings} onRowClick={handleRowClick} />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Seat Layout - ${selectedBooking?.busName}`}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Passenger</p>
              <p className="text-lg font-black text-neutral-800">{selectedBooking?.passengerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Seat Number</p>
              <p className="text-lg font-black text-teal-600">{selectedBooking?.seatNumber}</p>
            </div>
          </div>
          
          <SeatLayout 
            totalSeats={36} 
            onSeatClick={(num) => console.log('Selected seat:', num)} 
          />
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
             <svg className="text-blue-500 mt-0.5 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
             <p className="text-xs text-blue-700 font-medium leading-relaxed">
               This is a preview of the bus seat layout. You can view which seats are booked and which are still available for this journey.
             </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingsPage;
