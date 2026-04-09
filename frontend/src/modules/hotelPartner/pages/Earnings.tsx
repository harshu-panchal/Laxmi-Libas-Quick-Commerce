import React from 'react';
import { Card } from '../components/Card';
import { mockMonthlyEarnings } from '../data/mockData';

const Earnings: React.FC = () => {
  const totalBalance = 245800;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Earnings</h2>
        <p className="text-neutral-500 font-medium">Track your revenue and payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div>
              <p className="text-teal-400 font-bold uppercase tracking-widest text-xs">Total Balance</p>
              <h3 className="text-4xl font-black mt-2">₹{totalBalance.toLocaleString()}</h3>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 bg-white text-neutral-900 font-black py-4 rounded-2xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l5 5-5 5" /><path d="M13 7l5 5-5 5" /></svg>
                Withdraw Funds
              </button>
              <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </button>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-teal-600/10 rounded-full blur-2xl"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card 
            title="Monthly Sales" 
            value="₹75,000" 
            trend="+15%"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
          />
          <Card 
            title="Avg. Booking" 
            value="₹4,200" 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
          />
          <Card 
            title="Room Density" 
            value="84%" 
            trend="+2%"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21H3V3" /><path d="M7 11v5" /><path d="M11 7v9" /><path d="M15 13v3" /><path d="M19 5v11" /></svg>}
          />
          <Card 
            title="Payouts" 
            value="12" 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
        <h3 className="text-xl font-bold text-neutral-800 mb-6">Monthly Breakdown</h3>
        <div className="space-y-6">
          {mockMonthlyEarnings.reverse().map((item) => (
            <div key={item.month} className="flex items-center gap-6">
              <div className="w-12 text-sm font-bold text-neutral-400">{item.month}</div>
              <div className="flex-1 h-3 bg-neutral-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ width: `${(item.amount / 80000) * 100}%` }}
                />
              </div>
              <div className="w-24 text-right text-sm font-black text-neutral-800">
                ₹{item.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Earnings;
