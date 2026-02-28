import { useRef, useEffect } from 'react';
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

export default function CategoryTabBar({ activeCategory, onCategoryChange, onTabClick, isLightMode = false }: CategoryTabBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeTextClass = isLightMode ? 'text-neutral-900' : 'text-neutral-900';
    const inactiveTextClass = isLightMode ? 'text-neutral-500' : 'text-neutral-700';

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
                className="flex overflow-x-auto scrollbar-hide px-4 py-1 gap-5 md:gap-6"
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
                    className="flex flex-col items-center justify-center min-w-[64px] group"
                >
                    <div className="w-9 h-9 flex items-center justify-center">
                        <LayoutGrid size={22} strokeWidth={1.8} className={activeCategory === 'all' ? activeTextClass : inactiveTextClass} />
                    </div>
                    <span className={`mt-1 text-[11px] font-medium text-center leading-tight ${activeCategory === 'all' ? activeTextClass : inactiveTextClass}`}>
                        Everything
                    </span>
                    <span className={`mt-1 h-0.5 w-7 rounded-full ${activeCategory === 'all' ? 'bg-neutral-900' : 'bg-transparent'}`} />
                </button>

                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.slug;
                    const Icon = category.icon;

                    return (
                        <button
                            key={category.id}
                            data-category={category.slug}
                            onClick={() => handleCategoryChange(category.slug)}
                            className="flex flex-col items-center justify-center min-w-[64px] group"
                        >
                            <div className="w-9 h-9 flex items-center justify-center">
                                <Icon size={22} strokeWidth={1.8} className={isActive ? activeTextClass : inactiveTextClass} />
                            </div>

                            <span className={`mt-1 text-[11px] font-medium text-center leading-tight ${isActive ? activeTextClass : inactiveTextClass}`}>
                                {category.name}
                            </span>
                            <span className={`mt-1 h-0.5 w-7 rounded-full ${isActive ? 'bg-neutral-900' : 'bg-transparent'}`} />
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
