import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Hotel, 
  Bus, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react';
import api from '../../../services/api/config';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'overview' | 'sellers' | 'hotels' | 'buses' | 'bookings';

export default function AdminUnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // In a real app, we'd have a unified stats endpoint
      // For now, we'll simulate or fetch from multiple if needed
      const res = await api.get('/admin/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all ${
        activeTab === id 
        ? 'border-orange-600 text-orange-600 bg-orange-50/50' 
        : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Admin Command Center</h1>
          <p className="text-neutral-500 font-medium">Global system overview and partner management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all">
            <Filter size={16} /> Filter
          </button>
          <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all">
            <TrendingUp size={16} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Sellers', value: stats?.totalSellers || '128', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
          { label: 'Hotel Partners', value: stats?.totalHotels || '45', icon: Hotel, color: 'text-teal-600', bg: 'bg-teal-50', trend: '+5%' },
          { label: 'Bus Operators', value: stats?.totalBuses || '18', icon: Bus, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+2%' },
          { label: 'Total Revenue', value: '₹' + (stats?.totalRevenue?.toLocaleString() || '1.2M'), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+18%' },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label} 
            className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4 relative overflow-hidden"
          >
            <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center`}>
              <kpi.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{kpi.label}</p>
              <h3 className="text-2xl font-black text-neutral-800">{kpi.value}</h3>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{kpi.trend}</span>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-neutral-50 rounded-full -z-0 opacity-50"></div>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-neutral-100 bg-neutral-50/30 overflow-x-auto">
          <TabButton id="overview" label="System Overview" icon={TrendingUp} />
          <TabButton id="sellers" label="E-commerce Sellers" icon={ShoppingBag} />
          <TabButton id="hotels" label="Hotel Partners" icon={Hotel} />
          <TabButton id="buses" label="Bus Operators" icon={Bus} />
          <TabButton id="bookings" label="Global Bookings" icon={Clock} />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key="overview"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Approvals Queue */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-neutral-800 flex items-center gap-2">
                        <Clock className="text-orange-600" size={20} /> Pending Approvals
                      </h3>
                      <button className="text-xs font-bold text-orange-600 hover:underline">View All Queue</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Royal Residency', type: 'Hotel', date: '2 mins ago', status: 'Pending' },
                        { name: 'Swift Travels', type: 'Bus', date: '15 mins ago', status: 'Pending' },
                        { name: 'Fashion Hub', type: 'Seller', date: '1 hour ago', status: 'Pending' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-orange-200 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${item.type === 'Hotel' ? 'bg-teal-500' : item.type === 'Bus' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                              {item.type[0]}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-neutral-800">{item.name}</h4>
                              <p className="text-[10px] text-neutral-500 font-medium">{item.type} • {item.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700">Approve</button>
                            <button className="px-3 py-1 bg-white border border-red-200 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-50">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Health / Alerts */}
                  <div className="space-y-4">
                     <h3 className="font-black text-neutral-800 flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={20} /> System Alerts
                      </h3>
                      <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-4">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-red-900">Payment Gateway Latency</h4>
                            <p className="text-xs text-red-700 mt-1">Razorpay API responding with higher than normal latency in Indore region.</p>
                            <span className="text-[10px] font-black text-red-500 mt-2 block uppercase tracking-widest">Severity: High</span>
                          </div>
                        </div>
                        <div className="h-px bg-red-200/50 w-full"></div>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-orange-900">Payout Sync Pending</h4>
                            <p className="text-xs text-orange-700 mt-1">12 seller payouts are scheduled for manual review before processing.</p>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sellers' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key="sellers"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search sellers by name, email or store..." 
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                {/* Table Placeholder */}
                <div className="text-center py-20 text-neutral-400 italic">
                  Seller management table loading...
                </div>
              </motion.div>
            )}
            
            {/* Add more tab content blocks here... */}
            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key="bookings"
              >
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-400 uppercase mb-1">Hotel Bookings</p>
                      <h4 className="text-2xl font-black text-blue-900">1,204</h4>
                   </div>
                   <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                      <p className="text-xs font-bold text-purple-400 uppercase mb-1">Bus Bookings</p>
                      <h4 className="text-2xl font-black text-purple-900">856</h4>
                   </div>
                   <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                      <p className="text-xs font-bold text-orange-400 uppercase mb-1">Total Sales</p>
                      <h4 className="text-2xl font-black text-orange-900">₹45.2L</h4>
                   </div>
                 </div>
                 <div className="text-center py-20 text-neutral-400 italic">
                  Global booking ledger loading...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
