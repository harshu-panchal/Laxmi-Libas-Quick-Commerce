import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, CustomerProfile } from '../../services/api/customerService';

export default function ReferEarn() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.success) {
        setProfile(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (profile?.refCode) {
      navigator.clipboard.writeText(profile.refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferral = () => {
    const text = `Hey! Use my referral code ${profile?.refCode} on LaxMart and get ₹100 instant cashback on your first order! Download now: https://laxmart.app`;
    if (navigator.share) {
      navigator.share({
        title: 'LaxMart Referral',
        text: text,
        url: 'https://laxmart.app'
      });
    } else {
      copyCode();
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-white">
      {/* Premium Gradient Header */}
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 p-8 pt-12 md:pt-16 rounded-b-[3rem] shadow-xl shadow-yellow-200">
        <button onClick={() => navigate(-1)} className="mb-6 bg-white/30 backdrop-blur-md p-2 rounded-full text-white">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex flex-col items-center">
           <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border-4 border-white/50">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
           </div>
           <h1 className="text-3xl font-black text-white tracking-tighter text-center leading-none">REFER & EARN <br/> ₹100 CASHBACK</h1>
           <p className="mt-4 text-white/90 text-sm font-bold uppercase tracking-[0.2em]">Share the joy of LaxMart</p>
        </div>
      </div>

      <div className="px-6 -mt-8">
        {/* Referral Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/5 border border-neutral-100 flex flex-col items-center">
           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-4">Your Invitation Code</p>
           
           {loading ? (
             <div className="h-12 w-48 bg-neutral-50 animate-pulse rounded-xl mb-6" />
           ) : (
             <div 
               onClick={copyCode}
               className="bg-neutral-50 px-8 py-5 rounded-2xl border-2 border-dashed border-neutral-200 flex items-center justify-center gap-4 cursor-pointer hover:border-yellow-400 transition-all active:scale-95 group w-full"
             >
                <span className="text-3xl font-black text-neutral-800 tracking-widest">{profile?.refCode || 'LAXMART100'}</span>
                <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-500 group-hover:bg-yellow-400 group-hover:text-white transition-all">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                </div>
             </div>
           )}
           
           {copied && <p className="text-[10px] font-bold text-teal-600 mt-2 uppercase animate-bounce">Code Copied!</p>}

           <button 
             onClick={shareReferral}
             className="w-full mt-8 py-5 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
           >
             Share with Friends
           </button>
        </div>

        {/* How it works */}
        <div className="mt-12 space-y-8">
           <h2 className="text-xl font-black text-neutral-800 tracking-tight">How it works?</h2>
           
           <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 font-black shrink-0">1</div>
                 <div>
                    <h3 className="text-sm font-black text-neutral-800 tracking-tight">Invite your friends</h3>
                    <p className="text-xs text-neutral-500 font-medium">Share your unique code with your friends and family.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 font-black shrink-0">2</div>
                 <div>
                    <h3 className="text-sm font-black text-neutral-800 tracking-tight">They make their first purchase</h3>
                    <p className="text-xs text-neutral-500 font-medium">When they register using your code and place their first order.</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 font-black shrink-0">3</div>
                 <div>
                    <h3 className="text-sm font-black text-neutral-800 tracking-tight">You both get rewarded</h3>
                    <p className="text-xs text-neutral-500 font-medium">₹100 is credited to your LaxMart Wallet instantly!</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
