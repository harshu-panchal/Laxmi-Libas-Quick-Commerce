import React from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { mockDashboardStats } from '../data/mockData';
import { Booking } from '../types';

const TransportDashboard: React.FC = () => {
  const { totalBuses, totalBookings, activeRoutes, revenue, recentBookings } = mockDashboardStats;

  const columns = [
    { header: 'Booking ID', accessor: 'id' as keyof Booking },
    { header: 'Passenger', accessor: 'passengerName' as keyof Booking },
    { header: 'Bus', accessor: 'busName' as keyof Booking },
    { header: 'Route', accessor: 'route' as keyof Booking },
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
    { 
      header: 'Amount', 
      accessor: (item: Booking) => `₹${item.amount.toLocaleString()}` 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Dashboard Overview</h2>
        <p className="text-neutral-500 font-medium">Manage your fleet and track bookings in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Buses" 
          value={totalBuses} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M13 17h2" /><path d="M7 12h5" /></svg>}
        />
        <Card 
          title="Total Bookings" 
          value={totalBookings} 
          trend="+18% this week"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
        />
        <Card 
          title="Active Routes" 
          value={activeRoutes} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M20 12h2" /><path d="M2 12h2" /><path d="M19.07 4.93l-1.41 1.41" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M4.93 4.93l1.41 1.41" /></svg>}
        />
        <Card 
          title="Revenue" 
          value={`₹${revenue.toLocaleString()}`} 
          trend="+12% this month"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-neutral-800 tracking-tight">Recent Bookings</h3>
          <button className="text-teal-600 font-black text-sm hover:underline tracking-tight uppercase">View All Activity</button>
        </div>
        <Table columns={columns} data={recentBookings} />
      </div>
    </div>
  );
};

export default TransportDashboard;
