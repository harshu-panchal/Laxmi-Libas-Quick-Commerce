import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../../../context/AuthContext';
import DashboardCard from '../components/DashboardCard';
import OrderChart from '../components/OrderChart';
import AlertCard from '../components/AlertCard';
import { getSellerDashboardStats, DashboardStats, NewOrder } from '../../../services/api/dashboardService';
import { getInventoryInsights, InventoryInsights } from '../../../services/api/productService';
import { getSellerProfile, toggleShopStatus } from '../../../services/api/auth/sellerAuthService';
import { getSellerAnalytics } from '../../../services/api/analyticsService';
import Chart from 'react-apexcharts';
import { 
  ShoppingBag, 
  Hotel, 
  Bus, 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSellerSocket } from '../hooks/useSellerSocket';
import { toast } from 'react-hot-toast';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [inventoryInsights, setInventoryInsights] = useState<InventoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for real-time notifications
  useSellerSocket((notification) => {
    if (notification.type === 'NEW_ORDER') {
      toast.success(`New Order Received! #${notification.orderNumber || notification.orderId}`, {
        duration: 5000,
        position: 'top-right',
      });
      setRefreshTrigger(prev => prev + 1);
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeBusinessTab, setActiveBusinessTab] = useState<'commerce' | 'hotel' | 'bus'>(
    user?.businessTypes?.[0] || 'commerce'
  );

  const [analyticsPeriod, setAnalyticsPeriod] = useState("7days");
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const profileResponse = await getSellerProfile();
        if (profileResponse.success) {
          const fetchedProfile = profileResponse.data;
          const updatedUser: User = { ...user, ...fetchedProfile, id: fetchedProfile._id, status: fetchedProfile.status || 'Pending' } as User;
          if (JSON.stringify(user?.businessTypes) !== JSON.stringify(fetchedProfile.businessTypes) || user?.status !== fetchedProfile.status) {
            updateUser(updatedUser);
          }
          setIsShopOpen(fetchedProfile.isShopOpen ?? true);
          if (fetchedProfile.status !== 'Approved') {
            setLoading(false);
            return;
          }
        }

        if (user?.status === 'Approved') {
          const [statsResponse, inventoryRes, analyticsRes] = await Promise.all([
            getSellerDashboardStats(),
            getInventoryInsights(),
            getSellerAnalytics(analyticsPeriod)
          ]);

          if (statsResponse.success) {
            setStats(statsResponse.data.stats);
            setNewOrders(statsResponse.data.newOrders);
          }
          if (inventoryRes.success) setInventoryInsights(inventoryRes.data);
          if (analyticsRes.success) setAdvancedAnalytics(analyticsRes.data);
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.response?.data?.message || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.status, analyticsPeriod, refreshTrigger]);

  const handleToggleShop = async () => {
    try {
      setStatusLoading(true);
      const response = await toggleShopStatus();
      if (response.success) setIsShopOpen(response.data.isShopOpen);
    } catch (error: any) {
      console.error(error);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-teal-600">
        <RefreshCw size={48} />
      </motion.div>
    </div>
  );

  if (user?.status !== 'Approved') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-10">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-neutral-200/50 border border-neutral-100 text-center relative overflow-hidden">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center text-teal-600 mx-auto mb-8"
          >
            <Clock size={48} />
          </motion.div>
          <h1 className="text-4xl font-black text-neutral-900 mb-4 tracking-tight">Onboarding in Progress</h1>
          <p className="text-neutral-500 font-medium max-w-lg mx-auto mb-12">
            Welcome to LaxMart! Our administration team is currently verifying your profile and business details.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {[
              { step: 1, label: 'Profile Review', status: 'Completed', color: 'bg-green-500' },
              { step: 2, label: 'Document Verification', status: 'In Progress', color: 'bg-teal-500', active: true },
              { step: 3, label: 'Account Activation', status: 'Pending', color: 'bg-neutral-200' },
            ].map((s) => (
              <div key={s.step} className={`p-6 rounded-3xl border transition-all ${s.active ? 'bg-white border-teal-500 shadow-xl scale-105' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                <div className={`${s.active ? 'text-teal-600' : 'text-neutral-400'} font-black text-lg mb-1`}>Step {s.step}</div>
                <div className="text-sm font-bold text-neutral-800 mb-2">{s.label}</div>
                <div className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white ${s.color} ${s.active ? 'animate-pulse' : ''}`}>
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-neutral-100 gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-teal-600/20">
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Operational Hub</h1>
            <p className="text-neutral-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-time store performance overview
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-neutral-50 p-3 rounded-3xl border border-neutral-100 w-full lg:w-auto">
          <div className="px-4">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Shop Status</p>
            <p className={`text-sm font-black ${isShopOpen ? 'text-teal-600' : 'text-red-500'}`}>
              {isShopOpen ? 'ACTIVE & LIVE' : 'CURRENTLY CLOSED'}
            </p>
          </div>
          <button
            onClick={handleToggleShop}
            disabled={statusLoading}
            className={`relative inline-flex h-10 w-20 items-center rounded-2xl transition-all ${
              isShopOpen ? 'bg-teal-600' : 'bg-neutral-300'
            }`}
          >
            <motion.span
              animate={{ x: isShopOpen ? 44 : 4 }}
              className="inline-block h-8 w-8 transform rounded-xl bg-white shadow-md"
            />
          </button>
        </div>
      </div>

      {/* Multi-Vertical Navigation */}
      {(() => {
        const types = user?.businessTypes || [];
        if (types.length <= 1) return null;
        return (
          <div className="flex gap-4 p-2 bg-neutral-100 rounded-[2rem]">
            {types.map((type: any) => (
              <button
                key={type}
                onClick={() => setActiveBusinessTab(type)}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                  activeBusinessTab === type 
                  ? 'bg-white text-neutral-900 shadow-xl scale-[1.02]' 
                  : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {type === 'commerce' ? <ShoppingBag size={18} /> : type === 'hotel' ? <Hotel size={18} /> : <Bus size={18} />}
                {type} Console
              </button>
            ))}
          </div>
        );
      })()}

      <AnimatePresence mode="wait">
        {activeBusinessTab === 'commerce' ? (
          <motion.div 
            key="commerce"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Orders', value: stats?.totalOrders || 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Total Revenue', value: '₹' + (stats?.totalRevenue?.toLocaleString() || 0), icon: TrendingUp, color: 'text-teal-500', bg: 'bg-teal-50' },
                { label: 'Pending', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Completed', value: stats?.completedOrders || 0, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-neutral-800 tracking-tight">{s.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                {/* Revenue & Orders Chart */}
                <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight">Performance Trends</h2>
                    <div className="flex gap-2 bg-neutral-50 p-1 rounded-2xl border border-neutral-100">
                      {["7days", "30days"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setAnalyticsPeriod(p)}
                          className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            analyticsPeriod === p ? "bg-white text-teal-600 shadow-md" : "text-neutral-400"
                          }`}
                        >
                          {p === "7days" ? "7D" : "30D"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    {advancedAnalytics?.charts && (
                      <Chart
                        type="area"
                        series={[
                          { name: 'Revenue', data: advancedAnalytics.charts.map((d: any) => d.revenue) },
                          { name: 'Orders', data: advancedAnalytics.charts.map((d: any) => d.orders) }
                        ]}
                        options={{
                          chart: { toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                          colors: ['#0d9488', '#a855f7'],
                          stroke: { curve: 'smooth', width: 3 },
                          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
                          xaxis: { categories: advancedAnalytics.charts.map((d: any) => d._id), labels: { style: { colors: '#94a3b8' } } },
                          yaxis: { labels: { style: { colors: '#94a3b8' } } },
                          grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
                          dataLabels: { enabled: false }
                        }}
                        width="100%"
                        height="100%"
                      />
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-neutral-50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight">Recent Orders</h2>
                    <button onClick={() => navigate('/seller/orders')} className="text-xs font-black text-teal-600 hover:underline uppercase tracking-widest">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-neutral-50/50">
                          <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Order ID</th>
                          <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Amount</th>
                          <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Status</th>
                          <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {newOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-8 py-5 font-bold text-neutral-700">#{order.orderId || order.id}</td>
                            <td className="px-8 py-5 font-black text-neutral-900">₹{order.amount}</td>
                            <td className="px-8 py-5">
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {order.status}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <button onClick={() => navigate(`/seller/orders/${order.id}`)} className="p-2 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all">
                                <ArrowRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#1a1a1a] text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                  <h3 className="text-lg font-black tracking-tight">Stock Insights</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-400">Low Stock Alert</span>
                      <span className="text-orange-500 font-black">{stats?.lowStockProducts || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-400">Sold Out Items</span>
                      <span className="text-red-500 font-black">{stats?.soldOutProducts || 0}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate('/seller/stock-management')} className="w-full py-4 bg-teal-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all">Manage Inventory</button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeBusinessTab === 'hotel' ? (
          <motion.div 
            key="hotel-hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                  <Hotel size={24} />
                </div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Bookings</p>
                <h3 className="text-3xl font-black text-neutral-900">{advancedAnalytics?.hotel?.roomsBooked || 0}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Hotel Earnings</p>
                <h3 className="text-3xl font-black text-neutral-900">₹{(advancedAnalytics?.hotel?.totalEarnings || 0).toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white p-12 rounded-[3rem] text-center border border-neutral-100 shadow-xl">
              <h2 className="text-3xl font-black text-neutral-900 mb-4">Property Management</h2>
              <p className="text-neutral-500 font-medium mb-10">Access your properties, room availability, and guest check-ins.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button onClick={() => navigate('/seller/hotel/dashboard')} className="p-8 bg-neutral-900 text-white rounded-3xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-neutral-900/20">Open Operations</button>
                <button onClick={() => navigate('/seller/hotel/add')} className="p-8 bg-teal-600 text-white rounded-3xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-teal-600/20">Add Property</button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="bus-hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <Bus size={24} />
                </div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Tickets Sold</p>
                <h3 className="text-3xl font-black text-neutral-900">{advancedAnalytics?.bus?.ticketsSold || 0}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Trip Revenue</p>
                <h3 className="text-3xl font-black text-neutral-900">₹{(advancedAnalytics?.bus?.revenue || 0).toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white p-12 rounded-[3rem] text-center border border-neutral-100 shadow-xl">
              <h2 className="text-3xl font-black text-neutral-900 mb-4">Fleet Operations</h2>
              <p className="text-neutral-500 font-medium mb-10">Manage your fleet, routes, and real-time trip tracking.</p>
              <button onClick={() => navigate('/seller/transport')} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-blue-600/20">Manage Fleet</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
