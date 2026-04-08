import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcons } from './CategoryIcons';

interface Category {
    id: string;
    name: string;
    icon: any;
    slug: string;
    navUrl?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'all', name: 'For You', icon: CategoryIcons.ForYou, slug: 'all' },
    { id: 'fashion', name: 'Fashion', icon: CategoryIcons.Fashion, slug: 'fashion' },
    { id: 'mobiles', name: 'Mobiles', icon: CategoryIcons.Mobiles, slug: 'mobiles' },
    { id: 'beauty', name: 'Beauty', icon: CategoryIcons.Beauty, slug: 'beauty' },
    { id: 'electronics', name: 'Electronics', icon: CategoryIcons.Electronics, slug: 'electronics' },
    { id: 'home', name: 'Home', icon: CategoryIcons.Home, slug: 'home' },
    { id: 'appliances', name: 'Appliances', icon: CategoryIcons.Appliances, slug: 'appliances' },
    { id: 'toysbaby', name: 'Toys, baby', icon: CategoryIcons.ToysBaby, slug: 'toysbaby' },
    { id: 'foodhealth', name: 'Food & Health', icon: CategoryIcons.FoodHealth, slug: 'foodhealth' },
    { id: 'auto', name: 'Auto Accessories', icon: CategoryIcons.AutoAccessories, slug: 'auto' },
    { id: 'twowheelers', name: '2 Wheelers', icon: CategoryIcons.TwoWheelers, slug: 'twowheelers' },
    { id: 'sports', name: 'Sports & more', icon: CategoryIcons.Sports, slug: 'sports' },
    { id: 'books', name: 'Books & more', icon: CategoryIcons.Books, slug: 'books' },
    { id: 'furniture', name: 'Furniture', icon: CategoryIcons.Furniture, slug: 'furniture' },
];

interface CategoryTabBarProps {
    activeCategory?: string;
    onCategoryChange?: (categorySlug: string) => void;
    onTabClick?: (tabId: string) => void;
    isLightMode?: boolean;
    categories?: Category[];
}

export default function CategoryTabBar({ 
    activeCategory = 'all', 
    onCategoryChange, 
    onTabClick, 
    isLightMode = false,
    categories = DEFAULT_CATEGORIES
}: CategoryTabBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeCategory && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector(`[data-category="${activeCategory}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeCategory]);

    const navigate = useNavigate();

    const handleCategoryChange = (category: Category) => {
        if (category.navUrl) {
            navigate(category.navUrl);
            return;
        }
        if (onTabClick) onTabClick(category.slug);
        if (onCategoryChange) onCategoryChange(category.slug);
    };

    return (
        <div className="w-full">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-3 py-0.5 gap-[10px] items-end"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {categories.map((category) => {
                    const isActive = activeCategory === category.slug;
                    const Icon = category.icon;

                    return (
                        <button
                            key={category.id}
                            data-category={category.slug}
                            onClick={() => handleCategoryChange(category)}
                            className="flex flex-col items-center justify-end min-w-[50px] group flex-shrink-0 outline-none"
                        >
                            {/* Icon Wrapper */}
                            <div className={`w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-[#eef8ff]/60 border border-[#eef8ff]' : 'bg-transparent'}`}>
                                {typeof Icon === 'function' ? (
                                    <Icon className={`w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] ${isActive ? 'text-gray-900' : 'text-gray-700'}`} />
                                ) : (
                                    <div className={`w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{Icon}</div>
                                )}
                            </div>

                            {/* Text and Underline Wrapper */}
                            <div className="flex flex-col items-center mt-0.5">
                                <span className={`text-[10px] sm:text-[11px] whitespace-nowrap text-center leading-[14px] ${isActive ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>
                                    {category.name}
                                </span>
                                {/* Blue underline for active state */}
                                <div className={`h-[3px] rounded-t-sm transition-all duration-300 mt-1 ${isActive ? 'w-full bg-[#1e90ff]' : 'w-0 bg-transparent'}`} />
                            </div>
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
