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
    { id: '1', name: 'Clothing', icon: Shirt, slug: 'clothing', color: 'pink', accentIcon: Crown },
    { id: '2', name: 'Footwear', icon: Footprints, slug: 'footwear', color: 'blue' },
    { id: '3', name: 'Grocery', icon: ShoppingBasket, slug: 'grocery', color: 'green' },
    { id: '4', name: 'Food', icon: Soup, slug: 'food', color: 'orange' },
    { id: '13', name: 'Fruits & Vegetables', icon: Apple, slug: 'fruits-vegetables', color: 'lime' },
    { id: '5', name: 'Beauty', icon: Flower2, slug: 'beauty', color: 'purple', accentIcon: Sparkles },
    { id: '6', name: 'Electronics', icon: MonitorSmartphone, slug: 'electronics', color: 'cyan', accentIcon: Zap },
    { id: '7', name: 'Toys', icon: Gamepad2, slug: 'toys', color: 'yellow' },
    { id: '8', name: 'Home & Furniture', icon: Home, slug: 'home-furniture', color: 'amber' },
    { id: '9', name: 'Eyeglasses', icon: Glasses, slug: 'eyeglasses', color: 'indigo' },
    { id: '10', name: 'Rental', icon: Key, slug: 'rental', color: 'teal' },
    { id: '11', name: 'Automotive Parts', icon: Car, slug: 'automotive-parts', color: 'slate' },
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
        <div className="w-full pb-1">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-2 py-1 gap-3 md:gap-5"
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
                    className={`flex flex-col items-center justify-center min-w-[45px] md:min-w-[64px] group transition-all relative pb-1 ${activeCategory === 'all' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                    <div className={`w-8 h-8 md:w-11 md:h-11 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${activeCategory === 'all' ? 'bg-black text-yellow-400 rounded-lg md:rounded-xl' : 'text-black'}`}>
                        <LayoutGrid className="w-4.5 h-4.5 md:w-6 md:h-6" strokeWidth={2.5} />
                    </div>
                    <span className={`mt-0.5 md:mt-1 text-[8.5px] md:text-[11px] font-bold text-center leading-tight transition-colors text-black`}>
                        All
                    </span>
                    {activeCategory === 'all' && (
                        <div className="absolute bottom-0 left-1 right-1 md:left-2 md:right-2 h-[2px] md:h-[3px] bg-black rounded-full" />
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
                            className={`flex flex-col items-center justify-center min-w-[45px] md:min-w-[64px] group transition-all relative pb-1 ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                        >
                            <div className={`w-8 h-8 md:w-11 md:h-11 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${isActive ? 'bg-black text-yellow-400 rounded-lg md:rounded-xl' : 'text-black'}`}>
                                <Icon
                                    className="w-4.5 h-4.5 md:w-6 md:h-6"
                                    strokeWidth={2.5}
                                />
                            </div>

                            <span className={`mt-0.5 md:mt-1 text-[8.5px] md:text-[11px] font-bold text-center leading-tight transition-colors text-black`}>
                                {category.name}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 left-1 right-1 md:left-2 md:right-2 h-[2px] md:h-[3px] bg-black rounded-full" />
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
