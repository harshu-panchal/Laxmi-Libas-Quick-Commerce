import React from 'react';
import { Card } from '../components/Card';
import { mockDashboardStats, mockMonthlyEarnings } from '../data/mockData';

const EarningsPage: React.FC = () => {
  const { revenue } = mockDashboardStats;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Earnings Report</h2>
        <p className="text-neutral-500 font-medium">Track your financial performance and monthly payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card 
          title="Total Earnings" 
          value={`₹${revenue.toLocaleString()}`} 
          trend="+12% from last month"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <Card 
          title="Pending Payout" 
          value="₹45,200" 
          trend="Next payout: May 15"
          trendColor="text-teal-600"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <Card 
          title="Average Booking" 
          value="₹1,270" 
          trend="+5% this week"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>}
        />
      </div>

      <div className="bg-white p-10 rounded-[32px] border border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-neutral-800">Monthly Revenue Growth</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Revenue</span>
            </div>
            <select className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
              <option>Year 2024</option>
              <option>Year 2023</option>
            </select>
          </div>
        </div>

        <div className="flex items-end justify-between h-64 gap-4 px-4">
          {mockMonthlyEarnings.map((data, idx) => {
            const height = (data.amount / 130000) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex flex-col items-center">
                   {/* Tooltip */}
                   <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-[10px] font-black px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                     ₹{data.amount.toLocaleString()}
                   </div>
                   {/* Bar */}
                   <div 
                     className="w-full max-w-[40px] bg-neutral-50 group-hover:bg-teal-50 rounded-xl overflow-hidden flex flex-col justify-end transition-all duration-500"
                     style={{ height: '200px' }}
                   >
                     <div 
                       className="w-full bg-teal-500 group-hover:bg-teal-400 transition-all duration-500 rounded-t-lg shadow-lg shadow-teal-500/20" 
                       style={{ height: `${height}%` }}
                     ></div>
                   </div>
                </div>
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest group-hover:text-neutral-800 transition-colors">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
