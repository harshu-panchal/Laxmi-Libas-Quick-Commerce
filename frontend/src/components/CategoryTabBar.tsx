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

const CATEGORIES: Category[] = [
    { id: '1', name: 'For You', icon: CategoryIcons.ForYou, slug: 'all' },
    { id: '2', name: 'Clothing', icon: CategoryIcons.Fashion, slug: 'fashion' },
    { id: '15', name: 'Contact Us', icon: CategoryIcons.Contact, slug: 'contact', navUrl: '/contact-us' },
    { id: '16', name: 'Privacy Policy', icon: CategoryIcons.Privacy, slug: 'privacy', navUrl: '/privacy-policy' },
    /*
    { id: '3', name: 'Mobiles', icon: CategoryIcons.Mobiles, slug: 'mobiles' },
    { id: '4', name: 'Beauty', icon: CategoryIcons.Beauty, slug: 'beauty' },
    { id: '5', name: 'Electronics', icon: CategoryIcons.Electronics, slug: 'electronics' },
    { id: '6', name: 'Home', icon: CategoryIcons.Home, slug: 'home' },
    { id: '7', name: 'Appliances', icon: CategoryIcons.Appliances, slug: 'appliances' },
    { id: '8', name: 'Toys, baby', icon: CategoryIcons.ToysBaby, slug: 'toys-baby' },
    { id: '9', name: 'Food & Health', icon: CategoryIcons.FoodHealth, slug: 'food-health' },
    { id: '10', name: 'Auto Access...', icon: CategoryIcons.AutoAccessories, slug: 'auto-accessories' },
    { id: '11', name: '2 Wheelers', icon: CategoryIcons.TwoWheelers, slug: 'two-wheelers' },
    { id: '12', name: 'Sports & Out...', icon: CategoryIcons.Sports, slug: 'sports' },
    { id: '13', name: 'Books & More', icon: CategoryIcons.Books, slug: 'books' },
    { id: '14', name: 'Furniture', icon: CategoryIcons.Furniture, slug: 'furniture' },
    */
];

interface CategoryTabBarProps {
    activeCategory?: string;
    onCategoryChange?: (categorySlug: string) => void;
    onTabClick?: (tabId: string) => void;
    isLightMode?: boolean;
}

export default function CategoryTabBar({ activeCategory = 'all', onCategoryChange, onTabClick, isLightMode = false }: CategoryTabBarProps) {
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
                {CATEGORIES.map((category) => {
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
                            <div className={`w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] flex items-center justify-center rounded-[16px] transition-all duration-300 ${isActive ? 'bg-[#eef8ff]/60 border border-[#eef8ff]' : 'bg-transparent'}`}>
                                <Icon className={`w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] ${isActive ? 'text-gray-900' : 'text-gray-700'}`} />
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
