import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Building2, Bus, Calendar, ChevronRight } from 'lucide-react';

const LongWeekendDeals: React.FC = () => {
    const deals = [
        {
            title: 'Hotels',
            discount: 'Flat 30% Off*',
            image: '/travel_hotels.png',
            bgColor: 'bg-white',
        },
        {
            title: 'Buses',
            discount: 'Flat ₹100 Off*',
            image: '/travel_buses.png',
            bgColor: 'bg-white',
        }
    ];

    const holidays = [
        {
            date: 'May 1st - 3rd',
            name: 'Labour day',
            color: 'bg-[#b8d94f]',
            icon: '👷',
        },
        {
            date: 'June 26th - 28th',
            name: 'Muharram',
            color: 'bg-[#a3e635]',
            icon: '🕌',
        },
        {
            date: 'May 28th - 31st',
            name: 'Bakrid',
            color: 'bg-[#bef264]',
            icon: '🤝',
        },
        {
            date: 'Aug 15th - 17th',
            name: 'Independ. Day',
            color: 'bg-[#cdf57a]',
            icon: '🇮🇳',
        }
    ];

    return (
        <div className="mb-8 overflow-hidden rounded-3xl bg-[#f0f9ff] border border-blue-100 shadow-sm">
            {/* Hero Banner Section */}
            <div className="relative h-48 w-full overflow-hidden">
                <img 
                    src="/images/long_weekend_beach_bg.png" 
                    alt="Long Weekend" 
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-3xl font-black text-[#003580] drop-shadow-sm leading-tight uppercase tracking-tighter">
                        LONG WEEKEND <br/>
                        <span className="text-[#febb02]">DEALS</span>
                    </h2>
                    <div className="mt-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1 flex items-center gap-1 shadow-sm">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Code:</span>
                        <span className="text-xs font-black text-gray-900 tracking-tight">FKWEEKEND</span>
                    </div>
                </div>
            </div>

            {/* Deal Cards Section */}
            <div className="px-4 -mt-10 relative z-10 grid grid-cols-2 gap-3 pb-4">
                {deals.map((deal, idx) => (
                    <motion.div
                        key={idx}
                        whileTap={{ scale: 0.95 }}
                        className={`${deal.bgColor} rounded-2xl p-2.5 shadow-md border border-white flex flex-col items-center text-center`}
                    >
                        <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mb-1.5 overflow-hidden flex items-center justify-center p-1">
                            <img src={deal.image} alt={deal.title} className="w-[85%] h-full object-contain" />
                        </div>
                        <span className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{deal.discount}</span>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{deal.title}</span>
                    </motion.div>
                ))}
            </div>

            {/* Holiday Scroll Section */}
            <div className="px-4 pb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <div className="bg-blue-500/10 p-1 rounded-md">
                            <Calendar size={14} className="text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Plan Ahead for Holidays</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {holidays.map((holiday, idx) => (
                        <div 
                            key={idx}
                            className={`flex-shrink-0 w-28 ${holiday.color} rounded-2xl p-2.5 relative overflow-hidden flex flex-col justify-between h-36 shadow-sm border border-black/5`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-800/60 leading-none mb-1">{holiday.date}</span>
                                <span className="text-xs font-black text-gray-900 leading-tight">{holiday.name}</span>
                            </div>
                            
                            <div className="flex justify-end">
                                <div className="text-3xl filter grayscale-[0.2] opacity-90 drop-shadow-sm">
                                    {holiday.icon}
                                </div>
                            </div>
                            
                            {/* Decorative bubbles - like in search images */}
                            <div className="absolute -top-1 left-2 flex gap-0.5">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/10" />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LongWeekendDeals;
