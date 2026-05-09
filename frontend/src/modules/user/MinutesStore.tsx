import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Clock, ChevronRight, Search } from 'lucide-react';
import HomeHero from './components/HomeHero';
import { getQuickProducts, getCategories } from '../../services/api/customerProductService';
import { useLocation } from '../../hooks/useLocation';
import ProductCard from './components/ProductCard';
import { Product, Category } from '../../types/domain';

const MinutesStore = () => {
    const navigate = useNavigate();
    const { location } = useLocation();
    const [products, setProducts] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Header Categories once on mount
    useEffect(() => {
        const fetchCategoriesData = async () => {
            try {
                const res = await getCategories();
                if (res.success && res.data) {
                    setAllCategories(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch category headers:', err);
            }
        };
        fetchCategoriesData();
    }, []);

    // Fetch Products whenever location or selected tab changes
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const params: any = {
                    latitude: location?.latitude, 
                    longitude: location?.longitude,
                    city: location?.city,
                    limit: 50
                };
                if (activeTab !== 'all') {
                    params.headerCategory = activeTab;
                }
                const res = await getQuickProducts(params);
                if (res.success) {
                    setProducts(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch Quick products:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [location?.latitude, location?.longitude, location?.city, activeTab]);

    return (
        <div className="bg-white min-h-screen pb-24 font-['Inter']">
            <HomeHero 
                activeStore="quick" 
                hideTopContent={false}
                hideLocationBar={true}
                hideSearchBar={true}
                hideCategoryTabs={false}
                headerCategories={allCategories}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className="px-4 pt-4">

                {/* Nearby Essentials Horizontal Scroll */}
                {!isLoading && products.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Nearby Essentials</h3>
                            <span className="text-[10px] text-neutral-400 font-bold">Quick Delivery</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar scroll-smooth">
                            {products.slice(0, 8).map((prod) => (
                                <div key={prod._id} className="w-[145px] flex-shrink-0">
                                    <ProductCard product={prod} categoryStyle={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products Grid (Compact) */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Recommended for You</h3>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {products.slice(8).map((prod) => (
                            <ProductCard key={prod._id} product={prod} categoryStyle={true} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-dashed border-neutral-200">
                        <ShoppingBag size={32} className="mx-auto text-neutral-300 mb-3" />
                        <p className="text-sm font-bold text-neutral-500">No products found in your city.</p>
                        <p className="text-[10px] text-neutral-400 mt-1">Try switching to Laxmart for standard delivery.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MinutesStore;
