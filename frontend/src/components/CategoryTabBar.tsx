import { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcons } from './CategoryIcons';
import { getIconByName } from '../utils/iconLibrary';

interface HeaderCategory {
    _id: string;
    name: string;
    iconLibrary: string;
    iconName: string;
    slug: string;
    theme?: string;
    status: 'Published' | 'Unpublished';
}

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
    categories?: any[]; // Accept both internal Category and HeaderCategory from API
}

const mapHeaderCategoryToIcon = (name: string, slug: string, iconName: string, theme?: string) => {
    // 1. Try to find a premium icon by exact slug, name, or theme
    const premiumKeys = Object.keys(CategoryIcons);
    const match = premiumKeys.find(key => 
        key.toLowerCase() === (theme || '').toLowerCase() ||
        key.toLowerCase() === slug.toLowerCase() || 
        key.toLowerCase() === name.toLowerCase().replace(/\s+/g, '')
    );

    if (match) {
        return (CategoryIcons as any)[match];
    }

    // 2. Fallback to generic icon library
    return getIconByName(iconName);
};

export default function CategoryTabBar({ 
    activeCategory, 
    onCategoryChange, 
    onTabClick, 
    isLightMode = false,
    categories: propCategories
}: CategoryTabBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Prepare categories list
    const categories = useMemo(() => {
        // If no categories provided, use default
        if (!propCategories || propCategories.length === 0) return DEFAULT_CATEGORIES;

        // If categories provided, always prepend "For You"
        const forYou = DEFAULT_CATEGORIES[0];
        
        // Map any HeaderCategory from API to the internal Category format
        const dynamicCategories = propCategories
            .filter(cat => cat.slug !== 'all' && cat.name?.toLowerCase() !== 'for you') // Prevent duplicates/collisions with system tab
            .map(cat => {
                // If it's already in the internal format, return it
                if (cat.id && cat.icon && !cat._id) return cat;

                // Otherwise map from HeaderCategory
                return {
                    id: cat._id || cat.id || `temp-${Math.random()}`,
                    name: cat.name || 'Category',
                    slug: cat.slug || cat._id || 'all',
                    icon: mapHeaderCategoryToIcon(cat.name, (cat.slug || 'all'), cat.iconName, cat.theme)
                };
            });

        return [forYou, ...dynamicCategories];
    }, [propCategories]);

    useEffect(() => {
        if (activeCategory && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.querySelector(`[data-category="${activeCategory}"]`);
            if (activeElement) {
                // Short delay to ensure tabs are rendered
                const timer = setTimeout(() => {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [activeCategory]);


    const navigate = useNavigate();

    const handleCategoryChange = (category: Category) => {
        if (category.navUrl) {
            navigate(category.navUrl);
            return;
        }
        
        // Priority: use onCategoryChange if available, otherwise fallback to onTabClick
        if (onCategoryChange) {
            onCategoryChange(category.slug);
        } else if (onTabClick) {
            onTabClick(category.slug);
        }
    };

    return (
        <div className="w-full">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-3 py-0 gap-2 items-end"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {categories.map((category, index) => {
                    const activeSlug = activeCategory || 'all';
                    // Robust isActive logic: Only allow index 0 to match 'all' for highlighting
                    const isActive = activeSlug === category.slug && (category.slug !== 'all' || index === 0);
                    const Icon = category.icon;

                    return (
                        <button
                            key={`${category.id}-${index}`}
                            data-category={category.slug}
                            onClick={() => handleCategoryChange(category)}
                            className="flex flex-col items-center justify-end min-w-[50px] group flex-shrink-0 outline-none"
                        >
                            {/* Icon Wrapper */}
                            <div className={`w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-[#eef8ff]/60 border border-[#eef8ff]' : 'bg-transparent'}`}>
                                {typeof Icon === 'function' ? (
                                    <Icon className={`w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] ${isActive ? 'text-gray-900' : 'text-gray-700'}`} />
                                ) : (
                                    <div className={`w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{Icon}</div>
                                )}
                            </div>

                            {/* Text and Underline Wrapper */}
                            <div className="flex flex-col items-center mt-0">
                                <span className={`text-[9px] sm:text-[10px] whitespace-nowrap text-center leading-[12px] ${isActive ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>
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
