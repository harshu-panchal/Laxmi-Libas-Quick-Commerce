import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Clock, ChevronRight, Search } from 'lucide-react';
import HomeHero from './components/HomeHero';
import { getProducts, getCategories } from '../../services/api/customerProductService';
import { useLocation } from '../../hooks/useLocation';
import ProductCard from './components/ProductCard';
import { Product, Category } from '../../types/domain';

const MinutesStore = () => {
    const { location } = useLocation();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 54 });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [pRes, cRes] = await Promise.all([
                    getProducts({ 
                        latitude: location?.latitude, 
                        longitude: location?.longitude,
                        limit: 50 
                    }),
                    getCategories()
                ]);

                if (pRes.success) {
                    // Filter products for "Quick" module: distance <= 40km (matches backend radius)
                    const quickProducts = pRes.data.filter((p: any) => {
                        const distance = p.distance || (p.seller as any)?.distance || 0;
                        return distance <= 40;
                    });
                    setProducts(quickProducts);
                }
                if (cRes.success) {
                    setCategories(cRes.data.slice(0, 8));
                }
            } catch (err) {
                console.error('Failed to fetch Quick store data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (location?.latitude) {
            fetchData();
        }
    }, [location?.latitude, location?.longitude]);

    return (
        <div className="bg-white min-h-screen pb-24 font-['Inter']">
            <HomeHero 
                activeStore="quick" 
                hideTopContent={false}
                hideLocationBar={true}
                hideSearchBar={true}
                hideCategoryTabs={false}
            />

            <div className="px-4 pt-4">
                {/* 10-Min Flash Banner (Compact) */}
                <div className="bg-neutral-900 rounded-2xl p-4 mb-6 text-white relative overflow-hidden shadow-lg">
                    <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-1 text-yellow-400">
                            <Zap size={14} fill="currentColor" />
                            <span className="font-black text-[10px] uppercase tracking-widest">Fastest Delivery</span>
                        </div>
                        <h2 className="text-xl font-black mb-0.5">Delivering In <span className="text-yellow-400">10 MINS</span></h2>
                        <div className="flex items-center gap-2 mt-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 w-fit border border-white/10">
                            <Clock size={12} className="text-yellow-400" />
                            <span className="text-[10px] font-bold">
                                Ends in {timeLeft.minutes}:{timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
                            </span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 h-full w-1/3 opacity-40">
                        <img src="/minutes_banner.png" alt="Delivery" className="h-full w-full object-cover" />
                    </div>
                </div>

                {/* Categories Row (Compact) */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tighter">Nearby Essentials</h3>
                    <button className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">See All</button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-6 -mx-4 px-4 hide-scrollbar">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
                            <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-neutral-100 p-2 flex items-center justify-center">
                                <img src={cat.imageUrl || cat.icon || '/minutes_fruits.png'} alt={cat.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] font-bold text-neutral-800 text-center line-clamp-1">{cat.name}</span>
                        </div>
                    ))}
                </div>

                {/* Products Grid (Compact) */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tighter">Recommended for You</h3>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {products.map((prod) => (
                            <ProductCard key={prod._id} product={prod} categoryStyle={true} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-dashed border-neutral-200">
                        <ShoppingBag size={32} className="mx-auto text-neutral-300 mb-3" />
                        <p className="text-sm font-bold text-neutral-500">No stores found within 40km.</p>
                        <p className="text-[10px] text-neutral-400 mt-1">Try switching to Laxmart for standard delivery.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MinutesStore;
