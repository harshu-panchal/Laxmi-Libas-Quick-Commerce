import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getBusWalletStats, createBusWithdrawalRequest } from '../../../services/api/transportPartnerService';
import { toast } from 'react-hot-toast';
import { Loader2, DollarSign, Calendar, TrendingUp, Clock, CreditCard } from 'lucide-react';

const EarningsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    availableBalance: 0, 
    totalEarnings: 0, 
    pendingSettlement: 0,
    totalBookings: 0,
    commissionRate: 10
  });
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getBusWalletStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdrawRequest = async () => {
    if (stats.availableBalance < 500) {
        toast.error('Minimum withdrawal is ₹500');
        return;
    }

    const confirm = window.confirm(`Request payout for ₹${stats.availableBalance.toLocaleString()}?`);
    if (!confirm) return;

    setWithdrawing(true);
    try {
        const res = await createBusWithdrawalRequest({
            amount: stats.availableBalance,
            accountDetails: 'Registered Settlement Account',
            paymentMethod: 'Bank Transfer'
        });

        if (res.success) {
            toast.success('Payout request sent successfully!');
            fetchData();
        } else {
            toast.error(res.message || 'Payout failed');
        }
    } catch (error) {
        toast.error('Something went wrong');
    } finally {
        setWithdrawing(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Financial Overview</h2>
        <p className="text-neutral-500 font-medium text-sm">Monitor your booking revenues, platform fees, and withdrawal history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real Balance & Withdraw Card */}
        <div className="lg:col-span-1 bg-[#121212] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[300px]">
          <div className="relative z-10">
            <p className="text-teal-400 font-black uppercase tracking-[0.2em] text-[10px] mb-3">Available for Payout</p>
            <h3 className="text-5xl font-black tracking-tighter">
                ₹{stats.availableBalance.toLocaleString()}
                <span className="text-base text-neutral-500 font-medium ml-2">.00</span>
            </h3>
          </div>
          
          <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-neutral-400 text-xs font-bold bg-white/5 p-3 rounded-2xl border border-white/5">
                  <CreditCard size={14} className="text-teal-500" />
                  <span>Settling to Primary Account</span>
              </div>
              <button 
                onClick={handleWithdrawRequest}
                disabled={withdrawing || stats.availableBalance < 500}
                className="w-full bg-teal-500 text-white font-black py-5 rounded-2xl hover:bg-teal-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:grayscale active:scale-95"
              >
                {withdrawing ? <Loader2 className="animate-spin" size={20} /> : 'Request Payout Now'}
              </button>
          </div>
          <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Card 
            title="Total Net Earnings" 
            value={`₹${stats.totalEarnings.toLocaleString()}`} 
            trend={`${stats.commissionRate}% platform fee applied`}
            trendColor="text-neutral-400"
            icon={<TrendingUp className="text-teal-600" />}
          />
          <Card 
            title="Pending Settlement" 
            value={`₹${stats.pendingSettlement.toLocaleString()}`} 
            trend="Processing bookings"
            trendColor="text-orange-500"
            icon={<Clock className="text-orange-500" />}
          />
          <Card 
            title="Total Successful Bookings" 
            value={stats.totalBookings.toString()} 
            trend="Lifetime activity"
            icon={<Calendar className="text-teal-600" />}
          />
          <Card 
            title="Avg. Ticket Revenue" 
            value={`₹${stats.totalBookings > 0 ? Math.round(stats.totalEarnings / stats.totalBookings).toLocaleString() : 0}`} 
            trend="Per booking average"
            icon={<DollarSign className="text-teal-600" />}
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-teal-50 border border-teal-100 p-6 rounded-[32px] flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Clock size={24} />
          </div>
          <div>
              <h4 className="text-neutral-800 font-black text-sm uppercase tracking-wider">Settlement Policy</h4>
              <p className="text-neutral-600 text-xs font-medium mt-0.5">Earnings from bus bookings are settled to your available balance within 24 hours of successful trip completion.</p>
          </div>
      </div>
    </div>
  );
};

export default EarningsPage;

