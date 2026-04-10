import React from 'react';
import { Table } from '../components/Table';
import { mockBookings } from '../data/mockData';
import { Booking } from '../types';

const Bookings: React.FC = () => {
  const columns = [
    { header: 'ID', accessor: 'id' as keyof Booking, className: 'w-24 font-mono' },
    { header: 'Guest Name', accessor: 'guestName' as keyof Booking, className: 'font-bold' },
    { header: 'Room', accessor: 'roomType' as keyof Booking },
    { header: 'Dates', accessor: (item: Booking) => `${item.checkIn} → ${item.checkOut}` },
    { 
      header: 'Status', 
      accessor: (item: Booking) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          item.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
          'bg-red-100 text-red-700'
        }`}>
          {item.status}
        </span>
      )
    },
    { 
      header: 'Total', 
      accessor: (item: Booking) => `₹${item.totalAmount.toLocaleString()}`,
      className: 'text-right font-bold'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Bookings</h2>
        <p className="text-neutral-500 font-medium">Monitor your upcoming and past guest stays.</p>
      </div>

      <div className="flex gap-4 border-b border-neutral-100 overflow-x-auto pb-px">
        {['All Bookings', 'Upcoming', 'Active', 'Completed', 'Cancelled'].map((tab, idx) => (
          <button 
            key={tab}
            className={`px-4 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              idx === 0 ? 'border-teal-600 text-teal-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Table columns={columns} data={mockBookings} />
    </div>
  );
};

export default Bookings;
