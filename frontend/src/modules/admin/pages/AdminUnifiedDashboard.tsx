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
  Search,
  Check,
  X,
  Lock,
  Unlock,
  Shield,
  Building,
  Navigation,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../../../services/api/config';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'overview' | 'sellers' | 'hotels' | 'buses' | 'bookings';

export default function AdminUnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Data Lists
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // List Loading States
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchPendingSellers();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
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

  const fetchPendingSellers = async () => {
    try {
      const res = await api.get('/admin/sellers/pending');
      if (res.data.success) {
        setPendingSellers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending sellers:', err);
    }
  };

  const fetchTabData = async () => {
    if (activeTab === 'overview') {
      fetchPendingSellers();
      return;
    }

    try {
      setListLoading(true);
      if (activeTab === 'sellers') {
        const res = await api.get('/admin/sellers?type=product');
        if (res.data.success) setSellers(res.data.data || []);
      } else if (activeTab === 'hotels') {
        const res = await api.get('/admin/sellers?type=hotel');
        if (res.data.success) setHotels(res.data.data || []);
      } else if (activeTab === 'buses') {
        const res = await api.get('/admin/sellers?type=bus');
        if (res.data.success) setBuses(res.data.data || []);
      } else if (activeTab === 'bookings') {
        const res = await api.get('/admin/orders');
        if (res.data.success) setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${activeTab} data:`, err);
    } finally {
      setListLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionInProgress(id);
      const res = await api.post(`/admin/sellers/${id}/approve`);
      if (res.data.success) {
        // Refresh local lists
        fetchStats();
        fetchPendingSellers();
        fetchTabData();
      }
    } catch (err) {
      console.error('Failed to approve seller:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please specify a rejection reason:') || 'Application rejected';
    try {
      setActionInProgress(id);
      const res = await api.post(`/admin/sellers/${id}/reject`, { reason });
      if (res.data.success) {
        fetchStats();
        fetchPendingSellers();
        fetchTabData();
      }
    } catch (err) {
      console.error('Failed to reject seller:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBlock = async (id: string) => {
    const reason = prompt('Please specify block reason:') || 'Account blocked by administrator';
    try {
      setActionInProgress(id);
      const res = await api.post(`/admin/sellers/${id}/block`, { reason });
      if (res.data.success) {
        fetchStats();
        fetchTabData();
      }
    } catch (err) {
      console.error('Failed to block seller:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      setActionInProgress(id);
      const res = await api.post(`/admin/sellers/${id}/unblock`);
      if (res.data.success) {
        fetchStats();
        fetchTabData();
      }
    } catch (err) {
      console.error('Failed to unblock seller:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Safe local search and filters
  const getFilteredSellers = () => {
    return sellers.filter(s => 
      s.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredHotels = () => {
    return hotels.filter(h => 
      h.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredBuses = () => {
    return buses.filter(b => 
      b.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredBookings = () => {
    return bookings.filter(b => 
      b.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setSearchQuery('');
      }}
      className={`flex items-center gap-2.5 px-6 py-4 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
        activeTab === id 
        ? 'border-orange-600 text-orange-600 bg-orange-500/5 font-black' 
        : 'border-transparent text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50/50 font-black'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Admin Command Center</h1>
          <p className="text-neutral-400 text-sm font-semibold">Global system overview and real-time partner management</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              fetchStats();
              fetchPendingSellers();
              fetchTabData();
            }} 
            className="flex items-center gap-2 px-5 py-3 bg-neutral-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-neutral-850 shadow-xl shadow-neutral-900/10 hover:shadow-neutral-900/20 active:scale-[0.98] transition-all"
          >
            <TrendingUp size={14} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Sellers', value: stats?.totalSellers || '0', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+12%', sub: 'Product Outlets' },
          { label: 'Hotel Partners', value: stats?.totalHotels || '0', icon: Hotel, color: 'text-teal-500', bg: 'bg-teal-500/10', trend: '+5%', sub: 'Verified Hotels' },
          { label: 'Bus Operators', value: stats?.totalBuses || '0', icon: Bus, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: '+2%', sub: 'Fleet Providers' },
          { label: 'Total Revenue', value: '₹' + (stats?.totalRevenue?.toLocaleString('en-IN') || '0'), icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-500/10', trend: '+18%', sub: 'Processed Gross' },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            key={kpi.label} 
            className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="space-y-2">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-3xl font-black text-neutral-800 font-mono tracking-tight">{kpi.value}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{kpi.trend}</span>
                <span className="text-[10px] font-semibold text-neutral-400">{kpi.sub}</span>
              </div>
            </div>
            <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center`}>
              <kpi.icon size={26} />
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-neutral-50 rounded-full -z-0 opacity-50"></div>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="flex border-b border-neutral-100 bg-neutral-50/50 overflow-x-auto scrollbar-none">
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
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                key="overview"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Approvals Queue */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                        <Clock className="text-orange-500" size={18} /> Pending Approvals ({pendingSellers.length})
                      </h3>
                      <button onClick={() => setActiveTab('sellers')} className="text-xs font-black uppercase tracking-wider text-orange-600 hover:underline flex items-center gap-1">
                        View All Queue <ArrowRight size={12} />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                      {pendingSellers.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-neutral-100/60 text-neutral-400 font-semibold text-sm">
                          ✨ All caught up! No pending approvals.
                        </div>
                      ) : (
                        pendingSellers.map((item) => (
                          <div key={item._id} className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/40 rounded-2xl border border-neutral-100 hover:border-orange-200/60 active:scale-[0.99] transition-all">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm ${
                                item.businessType === 'hotel' ? 'bg-teal-500 shadow-teal-500/10' : 
                                item.businessType === 'bus' ? 'bg-purple-500 shadow-purple-500/10' : 
                                'bg-blue-500 shadow-blue-500/10'
                              }`}>
                                {(item.storeName || item.sellerName || 'S')[0].toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-neutral-800">{item.storeName || item.sellerName}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                                    item.businessType === 'hotel' ? 'bg-teal-50 text-teal-600' :
                                    item.businessType === 'bus' ? 'bg-purple-50 text-purple-600' :
                                    'bg-blue-50 text-blue-600'
                                  }`}>{item.businessType}</span>
                                  <span className="text-[10px] text-neutral-400 font-bold">•</span>
                                  <span className="text-[10px] text-neutral-400 font-semibold">Registered {new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                disabled={actionInProgress !== null}
                                onClick={() => handleApprove(item._id)}
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/10 active:scale-95 transition-all"
                                title="Approve application"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                disabled={actionInProgress !== null}
                                onClick={() => handleReject(item._id)}
                                className="p-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl active:scale-95 transition-all"
                                title="Reject application"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* System Health / Alerts */}
                  <div className="space-y-4">
                     <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={18} /> System Monitoring
                      </h3>
                      <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 space-y-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-red-900">Payment Gateway Latency</h4>
                            <p className="text-xs text-red-700/80 mt-1 font-semibold">Razorpay integration reporting 15% packet drop in Indore/Bhopal regions.</p>
                            <span className="text-[9px] font-black text-red-500 mt-2.5 inline-block uppercase tracking-widest bg-red-100/50 px-2 py-0.5 rounded-full">Severity: High</span>
                          </div>
                        </div>
                        <div className="h-px bg-red-200/30 w-full"></div>
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Clock size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-orange-900">Payout Sync Pending</h4>
                            <p className="text-xs text-orange-700/80 mt-1 font-semibold">12 seller payout batches are scheduled for automated reconciliation next cycle.</p>
                            <span className="text-[9px] font-black text-orange-500 mt-2.5 inline-block uppercase tracking-widest bg-orange-100/50 px-2 py-0.5 rounded-full">Automated Sync</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab !== 'overview' && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                key={activeTab}
                className="space-y-6"
              >
                {/* Search Bar */}
                <div className="flex justify-between items-center gap-4">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${activeTab} by name, store, or email...`} 
                      className="w-full pl-11 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Table Data Viewport */}
                {listLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <div className="w-10 h-10 border-4 border-orange-500/10 border-t-orange-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Fetching dynamic records...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-neutral-100 rounded-3xl">
                    <table className="w-full text-left border-collapse bg-white">
                      {activeTab === 'bookings' ? (
                        <>
                          <thead>
                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Order ID</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Customer</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Date</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Total Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getFilteredBookings().length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-12 text-center text-neutral-400 font-semibold text-xs italic">
                                  No transaction records found matching search query.
                                </td>
                              </tr>
                            ) : (
                              getFilteredBookings().map((booking) => (
                                <tr key={booking._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all">
                                  <td className="p-4 font-black font-mono text-xs text-neutral-800">#{booking.orderNumber || booking._id}</td>
                                  <td className="p-4">
                                    <p className="text-sm font-black text-neutral-800">{booking.customerName || booking.customer?.name || 'Guest User'}</p>
                                    <p className="text-[10px] font-semibold text-neutral-400 mt-0.5">{booking.customerPhone || booking.customer?.phone || 'No phone'}</p>
                                  </td>
                                  <td className="p-4 text-xs font-semibold text-neutral-500">
                                    {new Date(booking.orderDate || booking.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                                      booking.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                                      booking.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                      'bg-amber-50 text-amber-600 animate-pulse'
                                    }`}>{booking.status}</span>
                                  </td>
                                  <td className="p-4 text-sm font-black text-neutral-800 font-mono">₹{booking.total?.toLocaleString('en-IN') || 0}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </>
                      ) : (
                        <>
                          <thead>
                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Business Outlets</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Identity Details</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Contact Details</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const activeList = activeTab === 'sellers' ? getFilteredSellers() : activeTab === 'hotels' ? getFilteredHotels() : getFilteredBuses();
                              if (activeList.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={5} className="p-12 text-center text-neutral-400 font-semibold text-xs italic">
                                      No business operators found matching search query.
                                    </td>
                                  </tr>
                                );
                              }
                              return activeList.map((partner) => (
                                <tr key={partner._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm ${
                                        activeTab === 'hotels' ? 'bg-teal-500 shadow-teal-500/10' : 
                                        activeTab === 'buses' ? 'bg-purple-500 shadow-purple-500/10' : 
                                        'bg-blue-500 shadow-blue-500/10'
                                      }`}>
                                        {(partner.storeName || partner.sellerName || 'S')[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-neutral-800">{partner.storeName || 'Unnamed Outlet'}</p>
                                        <p className="text-[10px] font-semibold text-neutral-400 mt-0.5">{partner.sellerName || 'Owner name empty'}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-xs font-semibold text-neutral-700 capitalize">Type: {partner.businessType}</p>
                                    <p className="text-[9px] font-black font-mono text-neutral-400 mt-0.5">{partner._id}</p>
                                  </td>
                                  <td className="p-4 space-y-1">
                                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-medium">
                                      <Mail size={12} className="text-neutral-400" /> {partner.email}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-medium">
                                      <Phone size={12} className="text-neutral-400" /> {partner.mobile}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                                      partner.status === 'Approved' ? 'bg-green-50 text-green-600 shadow-sm shadow-green-500/5' :
                                      partner.status === 'Blocked' ? 'bg-neutral-100 text-neutral-500' :
                                      partner.status === 'Pending' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                                      'bg-red-50 text-red-500'
                                    }`}>{partner.status}</span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      {partner.status === 'Pending' && (
                                        <button 
                                          disabled={actionInProgress !== null}
                                          onClick={() => handleApprove(partner._id)}
                                          className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all"
                                          title="Approve"
                                        >
                                          <Check size={14} />
                                        </button>
                                      )}
                                      {partner.status === 'Approved' ? (
                                        <button 
                                          disabled={actionInProgress !== null}
                                          onClick={() => handleBlock(partner._id)}
                                          className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 rounded-xl transition-all"
                                          title="Block Seller"
                                        >
                                          <Lock size={14} />
                                        </button>
                                      ) : partner.status === 'Blocked' ? (
                                        <button 
                                          disabled={actionInProgress !== null}
                                          onClick={() => handleUnblock(partner._id)}
                                          className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all"
                                          title="Unblock Seller"
                                        >
                                          <Unlock size={14} />
                                        </button>
                                      ) : null}
                                      {partner.status === 'Pending' && (
                                        <button 
                                          disabled={actionInProgress !== null}
                                          onClick={() => handleReject(partner._id)}
                                          className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all"
                                          title="Reject"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </>
                      )}
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
