import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shirt,
    Footprints,
    ShoppingCart,
    Utensils,
    Sparkles,
    Smartphone,
    Gamepad2,
    Armchair,
    Glasses,
    Key,
    Wrench,
    Settings,
    LayoutGrid,
    Crown,
    Zap
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
    icon: any;
    slug: string;
    color: string; // Base color name for variants
    accentIcon?: any;
}

interface CategoryTabBarProps {
    activeCategory?: string;
    onCategoryChange?: (categorySlug: string) => void;
    onTabClick?: (tabId: string) => void;
    isLightMode?: boolean;
}

const CATEGORIES: Category[] = [
    { id: '1', name: 'Fast Fashion', icon: Shirt, slug: 'fast-fashion', color: 'pink', accentIcon: Crown },
    { id: '2', name: 'Footwear', icon: Footprints, slug: 'footwear', color: 'blue' },
    { id: '3', name: 'Grocery', icon: ShoppingCart, slug: 'grocery', color: 'green' },
    { id: '4', name: 'Food', icon: Utensils, slug: 'food', color: 'orange' },
    { id: '5', name: 'Beauty', icon: Sparkles, slug: 'beauty', color: 'purple', accentIcon: Sparkles },
    { id: '6', name: 'Electronics', icon: Smartphone, slug: 'electronics', color: 'cyan', accentIcon: Zap },
    { id: '7', name: 'Toys', icon: Gamepad2, slug: 'toys', color: 'yellow' },
    { id: '8', name: 'Home & Furniture', icon: Armchair, slug: 'home-furniture', color: 'amber' },
    { id: '9', name: 'Eyeglasses', icon: Glasses, slug: 'eyeglasses', color: 'indigo' },
    { id: '10', name: 'Rent', icon: Key, slug: 'rent', color: 'teal' },
    { id: '11', name: 'Automotive Parts', icon: Wrench, slug: 'automotive-parts', color: 'slate' },
    { id: '12', name: 'Services', icon: Settings, slug: 'services', color: 'rose' },
];

const colorConfig: Record<string, { from: string, to: string, dark: string, light: string }> = {
    yellow: { from: 'from-yellow-400', to: 'to-yellow-500', dark: 'bg-neutral-900', light: 'bg-yellow-50' },
};

export default function CategoryTabBar({ activeCategory, onCategoryChange, onTabClick, isLightMode = false }: CategoryTabBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeCategory && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector(`[data-category="${activeCategory}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeCategory]);

    const handleCategoryChange = (categorySlug: string) => {
        if (onTabClick) onTabClick(categorySlug);
        if (onCategoryChange) onCategoryChange(categorySlug);
    };

    return (
        <div className="w-full pb-2">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-4 md:gap-6"
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
                    className={`flex flex-col items-center justify-center min-w-[64px] group transition-opacity ${activeCategory === 'all' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors relative shadow-sm border ${activeCategory === 'all'
                        ? 'bg-neutral-900 border-neutral-800 text-primary shadow-primary/10'
                        : 'bg-white/10 text-white border-white/10'
                        }`}>
                        <LayoutGrid size={20} strokeWidth={2} />
                    </div>
                    <span className={`mt-2 text-[9px] font-bold uppercase tracking-wider text-center leading-tight transition-colors ${activeCategory === 'all' ? 'text-white' : 'text-white/70 group-hover:text-white'
                        }`}>
                        Everything
                    </span>
                </button>

                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.slug;
                    const Icon = category.icon;

                    return (
                        <button
                            key={category.id}
                            data-category={category.slug}
                            onClick={() => handleCategoryChange(category.slug)}
                            className={`flex flex-col items-center justify-center min-w-[64px] group transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                        >
                            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors border shadow-sm ${isActive
                                ? `bg-neutral-900 border-neutral-800 text-primary`
                                : `bg-white/10 border-white/10 text-white`
                                }`}>
                                <Icon
                                    size={20}
                                    strokeWidth={2}
                                />
                            </div>

                            <span className={`mt-2 text-[9px] font-bold uppercase tracking-wider text-center leading-tight transition-colors ${isActive
                                ? 'text-white'
                                : 'text-white/70 group-hover:text-white'
                                }`}>
                                {category.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
