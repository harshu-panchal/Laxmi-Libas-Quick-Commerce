import React, { useState, useEffect, useRef } from 'react';
import {
    Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft,
    CreditCard, Calendar, ChevronRight, DollarSign,
    Settings, Clock, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import { 
    getHotelWalletStats, 
    getHotelWalletTransactions, 
    createHotelWithdrawalRequest 
} from '../../../services/api/hotelPartnerService';
import { toast } from 'react-hot-toast';

const TransactionItem = ({ txn }) => {
    const isCredit = txn.type === 'Credit';
    const statusColor = 
        txn.status === 'Completed' ? 'text-green-600 bg-green-50' : 
        txn.status === 'Pending' ? 'text-orange-600 bg-orange-50' : 
        'text-gray-600 bg-gray-50';

    return (
        <div className="transaction-item flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl mb-3 shadow-sm active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                    <h4 className="font-bold text-[#003836] text-sm truncate max-w-[180px]">{txn.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} • {txn.reference}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <div className={`font-black text-sm ${isCredit ? 'text-green-600' : 'text-[#003836]'}`}>
                    {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString()}
                </div>
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 uppercase tracking-wide ${statusColor}`}>
                    {txn.status}
                </div>
            </div>
        </div>
    );
};

const PartnerWallet = () => {
    const listRef = useRef(null);
    const cardRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ availableBalance: 0, totalEarnings: 0, pendingSettlement: 0 });
    const [transactions, setTransactions] = useState([]);
    const [withdrawing, setWithdrawing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, txnsRes] = await Promise.all([
                getHotelWalletStats(),
                getHotelWalletTransactions()
            ]);
            
            if (statsRes.success) setStats(statsRes.data);
            if (txnsRes.success) setTransactions(txnsRes.data);
        } catch (error) {
            console.error('Wallet fetch error:', error);
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) {
            const tl = gsap.timeline();
            tl.fromTo(cardRef.current,
                { y: 20, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }
            );

            if (listRef.current) {
                tl.fromTo(listRef.current.children,
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' },
                    '-=0.3'
                );
            }
        }
    }, [loading]);

    const handleWithdraw = async () => {
        if (stats.availableBalance < 500) {
            toast.error('Minimum withdrawal amount is ₹500');
            return;
        }

        const confirm = window.confirm(`Request withdrawal for ₹${stats.availableBalance.toLocaleString()}?`);
        if (!confirm) return;

        setWithdrawing(true);
        try {
            const res = await createHotelWithdrawalRequest({
                amount: stats.availableBalance,
                paymentMethod: 'Bank Transfer',
                accountDetails: 'Default Primary Account'
            });

            if (res.success) {
                toast.success('Withdrawal request submitted!');
                fetchData();
            } else {
                toast.error(res.message || 'Withdrawal failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#004F4D]" size={40} />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PartnerHeader title="Wallet" subtitle="Earnings & Payouts" />

            <div className="max-w-3xl mx-auto px-4 pt-6">

                {/* Balance Card */}
                <div ref={cardRef} className="bg-[#004F4D] text-white rounded-[2rem] p-6 shadow-xl shadow-[#004F4D]/20 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full blur-xl -ml-5 -mb-5"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xs font-bold text-white/60 mb-1 uppercase tracking-wider">Available to Withdraw</h3>
                                <div className="text-4xl font-black tracking-tighter">
                                    ₹{stats.availableBalance.toLocaleString()}
                                    <span className="text-base text-white/40 ml-2 font-medium">.00</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                <Wallet size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={handleWithdraw}
                                disabled={withdrawing || stats.availableBalance < 500}
                                className="flex-1 bg-white text-[#003836] h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {withdrawing ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>Withdraw Now <ArrowUpRight size={16} /></>
                                )}
                            </button>
                            <button className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-colors border border-white/5">
                                <Settings size={18} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-[#004F4D]/20 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                <TrendingUp size={14} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Earnings</span>
                        </div>
                        <div className="text-xl font-black text-[#003836]">₹{stats.totalEarnings.toLocaleString()}</div>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">After 10% Platform Fee</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-orange-200 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Clock size={14} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
                        </div>
                        <div className="text-xl font-black text-orange-600">₹{stats.pendingSettlement.toLocaleString()}</div>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Settling soon</p>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-black text-[#003836] uppercase tracking-wider text-sm">Recent Activity</h3>
                    <div className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {transactions.length} Total
                    </div>
                </div>

                <div ref={listRef} className="space-y-1">
                    {transactions.length > 0 ? (
                        transactions.map((txn) => (
                            <TransactionItem key={txn._id} txn={txn} />
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-dashed border-gray-200">
                                <AlertCircle size={24} className="text-gray-300" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">No Activity Yet</h4>
                            <p className="text-xs text-gray-400 font-medium">Your booking earnings and payouts will appear here.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PartnerWallet;




export default PartnerWallet;
