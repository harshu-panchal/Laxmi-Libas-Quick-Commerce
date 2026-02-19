import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shirt,
    Footprints,
    ShoppingBasket,
    Soup,
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
    Zap,
    Flower2,
    MonitorSmartphone,
    Home,
    Car,
    Apple
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
    { id: '13', name: 'Fruits & Vegetables', icon: Apple, slug: 'fruits-vegetables', color: 'lime' },
    { id: '3', name: 'Grocery', icon: ShoppingBasket, slug: 'grocery', color: 'green' },
    { id: '1', name: 'Fast Fashion', icon: Shirt, slug: 'fast-fashion', color: 'pink', accentIcon: Crown },
    { id: '2', name: 'Footwear', icon: Footprints, slug: 'footwear', color: 'blue' },
    { id: '4', name: 'Food', icon: Soup, slug: 'food', color: 'orange' },
    { id: '5', name: 'Beauty', icon: Flower2, slug: 'beauty', color: 'purple', accentIcon: Sparkles },
    { id: '6', name: 'Electronics', icon: MonitorSmartphone, slug: 'electronics', color: 'cyan', accentIcon: Zap },
    { id: '7', name: 'Toys', icon: Gamepad2, slug: 'toys', color: 'yellow' },
    { id: '8', name: 'Home & Furniture', icon: Home, slug: 'home-furniture', color: 'amber' },
    { id: '9', name: 'Eyeglasses', icon: Glasses, slug: 'eyeglasses', color: 'indigo' },
    { id: '10', name: 'Rentals', icon: Key, slug: 'rent', color: 'teal' },
    { id: '11', name: 'Car Parts', icon: Car, slug: 'automotive-parts', color: 'slate' },
    { id: '12', name: 'Services', icon: Wrench, slug: 'services', color: 'rose' },
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
                className="flex overflow-x-auto scrollbar-hide px-4 py-1 gap-4 md:gap-5"
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
                    className={`flex flex-col items-center justify-center min-w-[64px] group transition-all relative pb-2 ${activeCategory === 'all' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                    <div className={`w-11 h-11 flex items-center justify-center transition-all duration-300 group-hover:scale-110 text-black`}>
                        <LayoutGrid size={24} strokeWidth={2.5} />
                    </div>
                    <span className={`mt-1 text-[11px] font-bold text-center leading-tight transition-colors text-black`}>
                        Everything
                    </span>
                    {activeCategory === 'all' && (
                        <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-black rounded-full" />
                    )}
                </button>

                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.slug;
                    const Icon = category.icon;

                    return (
                        <button
                            key={category.id}
                            data-category={category.slug}
                            onClick={() => handleCategoryChange(category.slug)}
                            className={`flex flex-col items-center justify-center min-w-[64px] group transition-all relative pb-2 ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                        >
                            <div className={`w-11 h-11 flex items-center justify-center transition-all duration-300 group-hover:scale-110 text-black`}>
                                <Icon
                                    size={24}
                                    strokeWidth={2.5}
                                />
                            </div>

                            <span className={`mt-1 text-[11px] font-bold text-center leading-tight transition-colors text-black`}>
                                {category.name}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-black rounded-full" />
                            )}
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
