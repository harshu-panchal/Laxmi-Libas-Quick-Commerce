import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Category {
    id: string;
    name: string;
    icon: string;
    slug: string;
    color?: string;
}

interface CategoryTabBarProps {
    activeCategory?: string;
    onCategoryChange?: (categorySlug: string) => void;
    onTabClick?: (tabId: string) => void;
    isLightMode?: boolean;
}

const CATEGORIES: Category[] = [
    { id: '1', name: 'Fast Fashion', icon: '👗', slug: 'fast-fashion', color: 'from-pink-500 to-rose-600' },
    { id: '2', name: 'Footwear', icon: '👟', slug: 'footwear', color: 'from-blue-500 to-indigo-600' },
    { id: '3', name: 'Grocery', icon: '🛒', slug: 'grocery', color: 'from-green-500 to-emerald-600' },
    { id: '4', name: 'Food', icon: '🍔', slug: 'food', color: 'from-orange-500 to-red-600' },
    { id: '5', name: 'Beauty', icon: '💄', slug: 'beauty', color: 'from-purple-500 to-fuchsia-600' },
    { id: '6', name: 'Electronics', icon: '📱', slug: 'electronics', color: 'from-cyan-500 to-blue-600' },
    { id: '7', name: 'Toys', icon: '🧸', slug: 'toys', color: 'from-yellow-400 to-orange-500' },
    { id: '8', name: 'Home & Furniture', icon: '🛋️', slug: 'home-furniture', color: 'from-amber-600 to-orange-700' },
    { id: '9', name: 'Eyeglasses', icon: '👓', slug: 'eyeglasses', color: 'from-indigo-500 to-purple-600' },
    { id: '10', name: 'Room Rent', icon: '🏠', slug: 'room-rent', color: 'from-teal-500 to-emerald-600' },
    { id: '11', name: 'Automotive Parts', icon: '🚗', slug: 'automotive-parts', color: 'from-slate-600 to-gray-800' },
    { id: '12', name: 'Services', icon: '🔧', slug: 'services', color: 'from-rose-500 to-pink-600' },
];

export default function CategoryTabBar({ activeCategory, onCategoryChange, onTabClick, isLightMode = false }: CategoryTabBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Auto-scroll to active category on mount
    useEffect(() => {
        if (activeCategory && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector(`[data-category="${activeCategory}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeCategory]);

    const handleCategoryChange = (categorySlug: string) => {
        if (onTabClick) {
            onTabClick(categorySlug);
        }
        if (onCategoryChange) {
            onCategoryChange(categorySlug);
        }
    };

    return (
        <div className="w-full pb-2">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-5 md:gap-8"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* 'All' option */}
                <button
                    onClick={() => handleCategoryChange('all')}
                    data-category="all"
                    className={`flex flex-col items-center justify-center min-w-[64px] transition-all duration-300 ${activeCategory === 'all' ? 'scale-110' : 'opacity-90 hover:opacity-100'
                        }`}
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-1.5 transition-all duration-300 shadow-sm border ${activeCategory === 'all'
                        ? isLightMode ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg' : 'bg-white text-neutral-900 border-white shadow-lg'
                        : isLightMode ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'bg-white/20 text-white border-white/30 backdrop-blur-sm'
                        }`}>
                        🏠
                    </div>
                    <span className={`text-[11px] font-bold text-center leading-tight whitespace-nowrap drop-shadow-sm ${activeCategory === 'all' ? (isLightMode ? 'text-neutral-900' : 'text-white') : (isLightMode ? 'text-neutral-500' : 'text-white/90')
                        }`}>
                        All
                    </span>
                </button>

                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.slug;

                    return (
                        <button
                            key={category.id}
                            data-category={category.slug}
                            onClick={() => handleCategoryChange(category.slug)}
                            className={`flex flex-col items-center justify-center min-w-[64px] transition-all duration-300 ${isActive
                                ? 'scale-110'
                                : 'opacity-90 hover:opacity-100'
                                }`}
                        >
                            {/* Icon Circle */}
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-1.5 transition-all duration-300 shadow-sm border ${isActive
                                    ? isLightMode ? `bg-gradient-to-br ${category.color || 'from-green-500 to-emerald-600'} text-white border-transparent shadow-lg` : `bg-white text-neutral-900 border-white shadow-lg`
                                    : isLightMode ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'bg-white/20 text-white border-white/30 backdrop-blur-sm'
                                    }`}
                            >
                                {category.icon}
                            </div>

                            {/* Category Name */}
                            <span
                                className={`text-[11px] font-bold text-center leading-tight transition-colors duration-300 drop-shadow-sm ${isActive
                                    ? (isLightMode ? 'text-neutral-900' : 'text-white')
                                    : (isLightMode ? 'text-neutral-500' : 'text-white/90')
                                    }`}
                            >
                                {category.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Hide scrollbar */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
            `}</style>
        </div>
    );
}
