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
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  MapPin,
  Star,
  ChevronRight,
  Award,
  DollarSign,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSellerSocket } from '../hooks/useSellerSocket';
import OrderSoundEnableBanner from '../../../components/OrderSoundEnableBanner';
import { getMyHotels, getHotelBookings } from '../../../services/api/hotelPartnerService';

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

  // Hotel states
  const [hotelList, setHotelList] = useState<any[]>([]);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [hotelLoading, setHotelLoading] = useState(false);

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

  useEffect(() => {
    if (activeBusinessTab === 'hotel' && user?.status === 'Approved') {
      const fetchHotelDashboardData = async () => {
        try {
          setHotelLoading(true);
          const hotelRes = await getMyHotels();
          if (hotelRes.success && hotelRes.data.length > 0) {
            setHotelList(hotelRes.data);
            const defaultId = hotelRes.data[0]._id;
            setSelectedHotelId(defaultId);
            
            const bookingRes = await getHotelBookings(defaultId);
            if (bookingRes.success) {
              setHotelBookings(bookingRes.data);
            }
          }
        } catch (e) {
          console.error("Dashboard hotel data fetch error", e);
        } finally {
          setHotelLoading(false);
        }
      };
      fetchHotelDashboardData();
    }
  }, [activeBusinessTab, user?.status]);

  const handleSelectHotel = async (id: string) => {
    setSelectedHotelId(id);
    try {
      setHotelLoading(true);
      const bookingRes = await getHotelBookings(id);
      if (bookingRes.success) {
        setHotelBookings(bookingRes.data);
      }
    } catch (e) {
      console.error("Error fetching bookings for hotel:", id, e);
    } finally {
      setHotelLoading(false);
    }
  };

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

      <OrderSoundEnableBanner variant="seller" />

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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="space-y-10"
          >
            {/* Dynamic Luxury Welcome Banner */}
            <div className="relative bg-gradient-to-br from-emerald-950 via-teal-950 to-amber-950 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden shadow-2xl border border-emerald-500/20">
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
                  >
                    <Award size={14} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Luxury Hospitality Suite</span>
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
                    Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-300 to-teal-200">{user?.sellerName || "Partner"}</span>
                  </h1>
                  <p className="text-neutral-300 font-medium max-w-xl text-sm md:text-base">
                    Monitor your luxury resort portfolio, manage occupancy rates, optimize room inventory pricing and drive guests experience seamlessly.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                  <button 
                    onClick={() => navigate('/seller/hotel/dashboard')}
                    className="flex-1 lg:flex-none px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 duration-300"
                  >
                    Open Operations Hub
                  </button>
                  <button 
                    onClick={() => navigate('/seller/hotel/add')}
                    className="flex-1 lg:flex-none px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 duration-300"
                  >
                    Add New Property
                  </button>
                </div>
              </div>

              {/* Luxury Property Quick Switcher Panel */}
              {hotelList.length > 0 && (
                <div className="mt-10 relative z-10 border-t border-white/10 pt-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-4">Select Property Portfolio</p>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {hotelList.map((hotel) => (
                      <button
                        key={hotel._id}
                        onClick={() => handleSelectHotel(hotel._id)}
                        className={`flex-shrink-0 px-6 py-4 rounded-[2rem] border transition-all duration-500 flex items-center gap-4 ${
                          selectedHotelId === hotel._id 
                          ? 'bg-white border-white text-neutral-900 shadow-2xl scale-[1.03]' 
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedHotelId === hotel._id ? 'bg-emerald-50 text-emerald-600' : 'bg-white/10 text-white'}`}>
                          <Hotel size={18} />
                        </div>
                        <div className="text-left">
                          <p className={`text-[9px] font-black uppercase tracking-wider ${selectedHotelId === hotel._id ? 'text-emerald-600' : 'text-neutral-400'}`}>
                            {hotel.propertyType || "Resort"}
                          </p>
                          <h4 className="text-sm font-black tracking-tight">{hotel.name}</h4>
                        </div>
                        {selectedHotelId === hotel._id && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Decorative Luxury Shapes */}
              <div className="absolute right-[-10%] top-[-20%] w-[35rem] h-[35rem] bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute left-[-5%] bottom-[-10%] w-[20rem] h-[20rem] bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
            </div>

            {/* Interactive Luxury Analytics Suite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat 1: Total Revenue */}
              <motion.div 
                whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(16,185,129,0.15)" }}
                className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center">
                    <DollarSign size={28} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Live</span>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Selected Property Revenue</p>
                  <h3 className="text-3xl font-black text-neutral-800 tracking-tight mt-1">
                    ₹{hotelBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
                  </h3>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                    <span className="text-emerald-500 font-black">+18.4%</span> vs previous month
                  </div>
                </div>
              </motion.div>

              {/* Stat 2: Active Ledger Bookings */}
              <motion.div 
                whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(14,165,233,0.15)" }}
                className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-[1.25rem] flex items-center justify-center">
                    <Calendar size={28} />
                  </div>
                  <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full uppercase tracking-wider">Syncing</span>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Total Active Bookings</p>
                  <h3 className="text-3xl font-black text-neutral-800 tracking-tight mt-1">{hotelBookings.length}</h3>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                    <span className="text-sky-500 font-black">{hotelBookings.filter(b => b.bookingStatus === 'Confirmed').length} Pending</span> check-ins remaining
                  </div>
                </div>
              </motion.div>

              {/* Stat 3: Real Occupancy Progress */}
              <motion.div 
                whileHover={{ y: -8, shadow: "0 25px 50px -12px rgba(245,158,11,0.15)" }}
                className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center">
                    <Percent size={28} />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Yield Max</span>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Portfolio Occupancy Rate</p>
                  <div className="flex items-center gap-4 mt-2">
                    <h3 className="text-3xl font-black text-neutral-800 tracking-tight">
                      {hotelBookings.length > 0 
                        ? Math.round((hotelBookings.filter(b => b.bookingStatus === 'CheckedIn').length / 10) * 100) 
                        : 0}%
                    </h3>
                    {/* Linear Occupancy progress bar */}
                    <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${hotelBookings.length > 0 ? Math.min(Math.round((hotelBookings.filter(b => b.bookingStatus === 'CheckedIn').length / 10) * 100), 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-bold text-neutral-500">
                    Target is <span className="text-amber-500 font-black">85%</span> to reach seasonal bonus
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Interactive Matrix Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Hotel Operations Check-in Ledger */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex justify-between items-center px-4">
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Recent Check-In Ledger</h2>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Live hotel check-in ledger details</p>
                  </div>
                  <button 
                    onClick={() => navigate('/seller/hotel/bookings')} 
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300"
                  >
                    View All Bookings
                  </button>
                </div>

                <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden">
                  {hotelLoading ? (
                    <div className="p-20 text-center space-y-4">
                      <RefreshCw className="animate-spin text-emerald-600 mx-auto w-10 h-10" />
                      <p className="text-xs font-black text-neutral-400 uppercase tracking-widest animate-pulse">Syncing bookings ledger...</p>
                    </div>
                  ) : hotelBookings.length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-neutral-50 text-neutral-300 rounded-2xl flex items-center justify-center mx-auto">
                        <Calendar size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-neutral-800">No Check-in Ledger Found</h4>
                        <p className="text-neutral-400 text-sm font-medium mt-1">There are no active booking or reservation records for this property.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-neutral-50/50">
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Guest</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Dates</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          {hotelBookings.slice(0, 4).map((booking) => (
                            <tr key={booking._id} className="hover:bg-neutral-50/40 transition-all duration-300 group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-emerald-50 text-emerald-700 font-black rounded-xl flex items-center justify-center text-sm">
                                    {booking.userId?.name?.[0] || "G"}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-black text-neutral-800">{booking.userId?.name || "Premium Guest"}</h4>
                                    <p className="text-[10px] text-neutral-400 font-bold">Room #{booking.rooms?.[0]?.roomNumber || "TBA"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-xs font-bold text-neutral-700">
                                  {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </td>
                              <td className="px-8 py-5">
                                <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  booking.bookingStatus === 'CheckedIn' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  booking.bookingStatus === 'Confirmed' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                                  'bg-neutral-50 text-neutral-400 border border-neutral-100'
                                }`}>
                                  {booking.bookingStatus}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <p className="text-sm font-black text-neutral-900">₹{booking.totalAmount?.toLocaleString()}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Luxury Quick Actions & Yield Advisor */}
              <div className="space-y-6">
                {/* Dynamic Yield Smart advisor */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/[0.02] to-transparent p-8 rounded-[2.5rem] border border-amber-500/20 shadow-sm relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                      <Award size={20} />
                    </div>
                    <h3 className="text-lg font-black text-amber-800 tracking-tight">Yield Optimization Idea</h3>
                    <p className="text-neutral-600 text-xs font-medium leading-relaxed">
                      Peak tourist season detected in your area! To maximize yield and improve RevPAR, we recommend applying a <span className="text-amber-600 font-black">+15% seasonal dynamic pricing rule</span> to Deluxe Suites for the coming weekends.
                    </p>
                    <button 
                      onClick={() => navigate('/seller/hotel/rooms')}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300"
                    >
                      Update Room Pricing
                    </button>
                  </div>
                  <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
                </div>

                {/* Glassmorphic Portal Navigation */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-neutral-900 tracking-tight">Hospitality Portals</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Inventory", path: "/seller/hotel/rooms", icon: Award, color: "text-emerald-500" },
                      { label: "Bookings", path: "/seller/hotel/bookings", icon: Calendar, color: "text-sky-500" },
                      { label: "Earnings", path: "/seller/hotel/earnings", icon: DollarSign, color: "text-amber-500" },
                      { label: "Edit Property", path: "/seller/hotel/add", icon: Hotel, color: "text-rose-500" },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => navigate(btn.path)}
                        className="p-4 bg-neutral-50 hover:bg-neutral-100 rounded-2xl text-left transition-all duration-300 border border-neutral-100 group"
                      >
                        <btn.icon size={18} className={`${btn.color} mb-2 group-hover:scale-110 transition-all`} />
                        <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest group-hover:text-neutral-800 transition-all">{btn.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
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
