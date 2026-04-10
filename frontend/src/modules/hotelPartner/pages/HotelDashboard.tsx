import React from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { mockDashboardStats } from '../data/mockData';
import { Booking } from '../types';

const HotelDashboard: React.FC = () => {
  const { totalHotels, totalBookings, totalRevenue, recentBookings } = mockDashboardStats;

  const columns = [
    { header: 'Booking ID', accessor: 'id' as keyof Booking },
    { header: 'Guest', accessor: 'guestName' as keyof Booking },
    { header: 'Room', accessor: 'roomType' as keyof Booking },
    { header: 'Check In', accessor: 'checkIn' as keyof Booking },
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
      header: 'Amount', 
      accessor: (item: Booking) => `₹${item.totalAmount.toLocaleString()}` 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Dashboard Overview</h2>
        <p className="text-neutral-500 font-medium">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Total Hotels" 
          value={totalHotels} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v14M19 7v14M4 4h16M2 7h20M8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 4h2v2H8v-2zm6 0h2v2h-2v-2z" /></svg>}
        />
        <Card 
          title="Total Bookings" 
          value={totalBookings} 
          trend="+12% this month"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <Card 
          title="Revenue" 
          value={`₹${totalRevenue.toLocaleString()}`} 
          trend="+8% this month"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-neutral-800">Recent Bookings</h3>
          <button className="text-teal-600 font-bold text-sm hover:underline">View All</button>
        </div>
        <Table columns={columns} data={recentBookings} />
      </div>
    </div>
  );
};

export default HotelDashboard;
