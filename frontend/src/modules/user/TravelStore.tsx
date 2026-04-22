import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HomeHero from './components/HomeHero';
import { ChevronRight, Building2, Bus, Briefcase, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import LongWeekendDeals from './components/LongWeekendDeals';

const TravelStore: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 38, s: 16 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { h, m, s } = prev;
                if (s > 0) s--;
                else if (m > 0) { m--; s = 59; }
                else if (h > 0) { h--; m = 59; s = 59; }
                return { h, m, s };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="bg-[#f8fbff] min-h-screen pb-24">
            <HomeHero 
                activeStore="travel" 
                hideTopContent={false} 
                hideLocationBar={true}
                hideSearchBar={true}
                hideCategoryTabs={true}
            />

            <div className="px-4 pt-5 relative z-10">
                {/* Welcome Section */}
                <div className="flex justify-between items-center mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome {user?.name || user?.sellerName || 'Guest'}</h1>
                    <div className="bg-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm border border-gray-100">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                            <Zap size={12} fill="currentColor" />
                        </div>
                        <span className="font-bold text-gray-800">23</span>
                    </div>
                </div>

                {/* Main Service Tiles */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            console.log('Navigating to Hotels');
                            navigate('/store/travel/hotels');
                        }}
                        className="bg-[#fff9e6] cursor-pointer rounded-2xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden h-[145px] border border-yellow-50 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="relative w-full h-full rounded-xl bg-white shadow-sm overflow-hidden flex flex-col items-center justify-center pointer-events-none">
                            <div className="absolute top-2 left-2 z-10 flex flex-col">
                                <span className="font-bold text-gray-900 text-base leading-tight">Hotels</span>
                                <span className="text-[10px] font-bold text-gray-500">Up to 65% Off</span>
                            </div>
                            <img src="/travel_hotels.png" alt="Hotels" className="w-[85%] h-auto object-contain mt-4" />
                        </div>
                    </motion.div>

                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            console.log('Navigating to Buses');
                            navigate('/store/travel/buses');
                        }}
                        className="bg-[#f0fff4] cursor-pointer rounded-2xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden h-[145px] border border-green-50 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="relative w-full h-full rounded-xl bg-white shadow-sm overflow-hidden flex flex-col items-center justify-center pointer-events-none">
                            <div className="absolute top-2 left-2 z-10">
                                <span className="font-bold text-gray-900 text-base leading-tight">Buses</span>
                            </div>
                            <img src="/travel_buses.png" alt="Buses" className="w-[85%] h-auto object-contain mt-2" />
                        </div>
                    </motion.div>
                </div>

                {/* Vacation Sale Banner */}
                <div className="rounded-2xl overflow-hidden mb-6 shadow-md border border-blue-50 h-[140px]">
                    <img src="/travel_banner.png" alt="Nation on Vacation Sale" className="w-full h-full object-cover" />
                </div>

                {/* Bank Offer */}
                <div className="bg-white rounded-2xl p-3 flex items-center justify-between border border-gray-100 shadow-sm mb-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#861f41] rounded px-3 py-1 text-white font-bold italic text-xs">
                            AXIS BANK
                        </div>
                        <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-800">Up to 25% Off*</span>
                            <span className="text-[8px] text-gray-400">on Credit Card & EMI Trxns.</span>
                        </div>
                    </div>
                    <span className="text-[7px] text-gray-300 transform -rotate-90 origin-right whitespace-nowrap">*T&C Apply</span>
                </div>

                {/* Long Weekend Deals Section */}
                <LongWeekendDeals />

                {/* Flash Sale Section */}
                <div className="bg-[#fff9e1] rounded-3xl p-5 mb-8 border border-yellow-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-gray-900 leading-none">2-6 PM | 8-11 PM</h2>
                            <div className="bg-white rounded-full px-3 py-1 mt-2 flex items-center gap-2 w-fit shadow-sm border border-yellow-200">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Ends in:</span>
                                <span className="text-[11px] font-black text-gray-900">
                                    00d : {formatTime(timeLeft.h)}h : {formatTime(timeLeft.m)}m : {formatTime(timeLeft.s)}s
                                </span>
                            </div>
                        </div>
                        <div className="text-gray-900 flex flex-col items-end">
                            <span className="text-2xl font-black italic tracking-tighter leading-none">FLASH</span>
                            <span className="text-2xl font-black italic tracking-tighter leading-none text-yellow-500">SALE</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                            { label: 'Up to 65% Off', img: '/travel_hotels.png', color: '#ffec00' },
                            { label: 'Flat 15% Off*', img: '/travel_buses.png', color: '#ffec00' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-yellow-100">
                                <div className="p-1 aspect-square bg-blue-50 relative overflow-hidden">
                                    <img src={item.img} alt="Deal" className="w-full h-full object-contain" />
                                </div>
                                <div className="bg-[#ffec00] py-1.5 px-1 text-center">
                                    <span className="text-[9px] font-black text-gray-900 uppercase">{item.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TravelStore;
