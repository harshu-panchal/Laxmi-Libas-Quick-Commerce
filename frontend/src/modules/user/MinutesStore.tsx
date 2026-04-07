import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Clock, Star, ChevronRight, Plus, ShoppingBag, Zap } from 'lucide-react';
import HomeHero from './components/HomeHero';

const MinutesStore = () => {
    const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 54 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { minutes: prev.minutes - 1, seconds: 59 };
                }
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const categories = [
        { name: 'Fruits', img: '/minutes_fruits.png', items: '240+ items', color: '#fff9e6', borderColor: '#ffeebd' },
        { name: 'Dairy', img: '/minutes_dairy.png', items: '180+ items', color: '#f0fff4', borderColor: '#c6f6d5' },
        { name: 'Snacks', img: '/minutes_snacks.png', items: '320+ items', color: '#fff5f5', borderColor: '#fed7d7' },
        { name: 'Home', img: '/minutes_household.png', items: '150+ items', color: '#ebf8ff', borderColor: '#bee3f8' },
        { name: 'Drinks', img: '/minutes_snacks.png', items: '210+ items', color: '#fff9db', borderColor: '#fff3bf' },
        { name: 'Instant', img: '/minutes_snacks.png', items: '120+ items', color: '#f3f0ff', borderColor: '#e5dbff' },
        { name: 'Baby', img: '/minutes_household.png', items: '80+ items', color: '#fff0f6', borderColor: '#ffdeeb' },
        { name: 'Pet Care', img: '/minutes_household.png', items: '60+ items', color: '#f8f9fa', borderColor: '#e9ecef' },
    ];

    const products = [
        { name: 'Fresh Milk', price: '₹32', weight: '500ml', img: '/minutes_dairy.png', time: '8 mins' },
        { name: 'Brown Bread', price: '₹45', weight: '400g', img: '/minutes_dairy.png', time: '10 mins' },
        { name: 'Gala Apples', price: '₹180', weight: '1kg', img: '/minutes_fruits.png', time: '12 mins' },
        { name: 'Coca Cola', price: '₹40', weight: '750ml', img: '/minutes_snacks.png', time: '9 mins' },
        { name: 'Potato Chips', price: '₹20', weight: '50g', img: '/minutes_snacks.png', time: '7 mins' },
        { name: 'Maggi Noodles', price: '₹14', weight: '70g', img: '/minutes_snacks.png', time: '11 mins' },
        { name: 'Dishwash Gel', price: '₹95', weight: '500ml', img: '/minutes_household.png', time: '15 mins' },
    ];

    return (
        <div className="bg-[#fcfdff] min-h-screen pb-24 font-sans">
            <HomeHero 
                activeStore="minutes" 
                hideTopContent={false}
                hideLocationBar={true}
                hideSearchBar={true}
                hideCategoryTabs={false}
            />

            <div className="px-4 -mt-2 relative z-10">
                {/* 10-Min Flash Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 rounded-3xl p-5 mb-6 text-white relative overflow-hidden shadow-xl"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-yellow-400">
                            <Zap size={20} fill="currentColor" />
                            <span className="font-bold text-sm uppercase tracking-wider">Fastest Delivery</span>
                        </div>
                        <h2 className="text-3xl font-extrabold mb-1">Delivering In</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-5xl font-black text-yellow-400">10</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-300 leading-tight">MINS</span>
                                <span className="text-xs font-semibold text-gray-400">Arriving Soon</span>
                            </div>
                        </div>

                        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                            <Clock size={16} className="text-yellow-400" />
                            <span className="text-sm font-bold">
                                Ends in {timeLeft.minutes}:{timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
                            </span>
                        </div>
                    </div>
                    
                    {/* Abstract Shapes/Asset */}
                    <div className="absolute top-0 right-0 h-full w-1/2 flex items-center justify-center opacity-60">
                        <img src="/minutes_banner.png" alt="Delivery" className="w-[140%] h-auto object-contain translate-x-10" />
                    </div>
                </motion.div>

                {/* Categories Grid */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-gray-900">Popular Categories</h3>
                    <button className="text-red-500 font-bold text-sm flex items-center">
                        See All <ChevronRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-y-6 gap-x-3 mb-8">
                    {categories.map((cat, idx) => (
                        <motion.div 
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div 
                                className="w-full aspect-square rounded-2xl flex items-center justify-center p-2 relative overflow-hidden border"
                                style={{ backgroundColor: cat.color, borderColor: cat.borderColor }}
                            >
                                <img src={cat.img} alt={cat.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-black text-gray-900 leading-tight">{cat.name}</p>
                                <p className="text-[9px] font-bold text-gray-500">{cat.items}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Best Sellers / Hot Picks */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-gray-900 leading-tight italic">Recommended for You <br /><span className="text-sm font-bold text-red-500 not-italic">Delivery in under 12 mins</span></h3>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {products.map((prod, idx) => (
                        <motion.div 
                            key={idx}
                            className="min-w-[160px] bg-white rounded-3xl p-3 border border-gray-100 shadow-sm relative"
                        >
                            <div className="absolute top-3 left-3 bg-neutral-900 text-white rounded-full px-2 py-1 flex items-center gap-1 z-10">
                                <Clock size={10} className="text-yellow-400" />
                                <span className="text-[9px] font-bold">{prod.time}</span>
                            </div>
                            <div className="bg-gray-50 rounded-2xl w-full h-[120px] mb-3 flex items-center justify-center overflow-hidden">
                                <img src={prod.img} alt={prod.name} className="w-[80%] h-auto object-contain" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">{prod.name}</h4>
                            <p className="text-[10px] font-bold text-gray-500 mb-2">{prod.weight}</p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-base font-black text-gray-900">{prod.price}</span>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    className="bg-red-500 text-white px-4 py-1.5 rounded-xl font-bold text-sm shadow-md"
                                >
                                    Add
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Benefits / Trust Section */}
                <div className="mt-8 grid grid-cols-2 gap-3 mb-10">
                    <div className="bg-yellow-50 rounded-2xl p-4 flex items-center gap-3 border border-yellow-100">
                        <div className="bg-yellow-400 text-black p-2 rounded-xl">
                            <Star size={18} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-900">4.8+ Rating</p>
                            <p className="text-[9px] font-bold text-gray-500">Trusted Service</p>
                        </div>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-green-100">
                        <div className="bg-green-500 text-white p-2 rounded-xl">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-900">No Min Order</p>
                            <p className="text-[9px] font-bold text-gray-500">Free Delivery*</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinutesStore;
