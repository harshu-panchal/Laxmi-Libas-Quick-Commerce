import { useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTheme } from '../../../utils/themes';
import { useLocation } from '../../../hooks/useLocation';
import { appConfig } from '../../../services/configService';
import { getCategories } from '../../../services/api/customerProductService';
import { Category } from '../../../types/domain';
import CategoryTabBar from '../../../components/CategoryTabBar';
import { isClothingRelated } from '../../../utils/clothingUtils';


gsap.registerPlugin(ScrollTrigger);

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  hideTopContent?: boolean;
  activeStore?: 'laxmart' | 'minutes' | 'travel' | 'grocery' | 'none';
  hideLocationBar?: boolean;
  hideSearchBar?: boolean;
  hideCategoryTabs?: boolean;
  headerCategories?: any[];
}


export default function HomeHero({
  activeTab = 'all',
  onTabChange,
  hideTopContent = false,
  activeStore = 'laxmart',
  hideLocationBar = false,
  hideSearchBar = false,
  hideCategoryTabs = false,
  headerCategories = []
}: HomeHeroProps) {
  const navigate = useNavigate();
  const { location: userLocation, requestLocation, isLocationLoading } = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Format location display text - only show if user has provided location
  // Format location display text - prioritized for local area names
  const locationDisplayText = useMemo(() => {
    if (!userLocation) return '';

    // If we have a city field (which now contains "Area, City" from our context update)
    if (userLocation.city) {
      return userLocation.city;
    }

    if (userLocation.address) {
      // If address is long, try to extract the first 2-3 components (usually most specific)
      const parts = userLocation.address.split(',').map(p => p.trim());
      if (parts.length > 2) {
        return `${parts[0]}, ${parts[1]}`;
      }
      return userLocation.address;
    }

    return '';
  }, [userLocation]);

  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for search suggestions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data.map((c: any) => ({
            ...c,
            id: c._id || c.id
          })));
        }
      } catch (error) {
        console.error("Error fetching categories for suggestions:", error);
      }
    };
    fetchCategories();
  }, []);

  // Search suggestions based on active tab or fetched categories
  const searchSuggestions = useMemo(() => {
    const baseSuggestion = 'your desired items or stores';
    if (categories.length > 0) {
      // Use real category names for suggestions
      return [baseSuggestion, ...categories.slice(0, 10).map(c => c.name.toLowerCase())];
    }
    return [baseSuggestion, 't-shirts', 'jeans', 'jackets', 'dresses', 'uniforms', 'fashion accessories'];
  }, [categories]);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        hero,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }, hero);

    return () => ctx.revert();
  }, []);

  // Animate search suggestions
  useEffect(() => {
    setCurrentSearchIndex(0);
    const interval = setInterval(() => {
      setCurrentSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [searchSuggestions.length, activeTab]);

  // Handle scroll to detect when "LOWEST PRICES EVER" section is out of view
  useEffect(() => {
    const handleScroll = () => {
      if (topSectionRef.current && stickyRef.current) {
        // Find the "LOWEST PRICES EVER" section
        const lowestPricesSection = document.querySelector('[data-section="lowest-prices"]');

        if (lowestPricesSection) {
          const sectionBottom = lowestPricesSection.getBoundingClientRect().bottom;
          // When the section has scrolled up past the viewport, transition to white
          const progress = Math.min(Math.max(1 - (sectionBottom / 200), 0), 1);
          setScrollProgress(progress);
        } else {
          // Fallback to original logic if section not found
          const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
          const topSectionHeight = topSectionRef.current.offsetHeight;
          const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
          setScrollProgress(progress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    // Don't scroll - keep page at current position
  };

  const activeHeaderCategory = useMemo(() => {
    return headerCategories.find(cat => cat.slug === activeTab);
  }, [headerCategories, activeTab]);

  const themeKey = activeHeaderCategory?.theme || activeHeaderCategory?.slug || activeTab || 'all';
  const theme = getTheme(themeKey);
  const heroGradient = `linear-gradient(180deg, ${theme.primary[1]} 0%, ${theme.primary[2]} 55%, ${theme.primary[3]} 100%)`;

  // Helper to convert RGB to RGBA
  const rgbToRgba = (rgb: string, alpha: number) => {
    return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  };

  return (
    <div
      ref={heroRef}
      style={{
        background: heroGradient,
        paddingBottom: 0,
        marginBottom: 0,
      }}
    >
      {/* Top section with delivery info and buttons - NOT sticky */}
      {!hideTopContent && (
        <div className="pt-3 px-3">
          {/* Row 1: App Icons / Service Tiles - Simplified to 3 Modules */}
          <div className="flex justify-center gap-4 pb-3 scrollbar-hide px-1">
            {[
              { 
                id: 'laxmart', 
                name: 'Laxmart', 
                icon: '/assets/laxmartlogo-removebg-preview.png', 
                path: '/user/home',
                activeBg: 'bg-[#ffec00]',
                activeBorder: 'border-yellow-300',
              },
              { 
                id: 'travel', 
                name: 'Travel', 
                icon: '/travel_airplane_red_flat_1774950352120.png', 
                path: '/store/travel',
                activeBg: 'bg-[#fff1f1]',
                activeBorder: 'border-[#ffdada]',
              },
              { 
                id: 'quick', 
                name: 'Quick', 
                icon: '/10mins_icon_pink_1774950068063.png', 
                path: '/store/minutes',
                activeBg: 'bg-[#ffebf5]',
                activeBorder: 'border-[#fccde5]',
              }
            ].map((store) => (
              <div 
                key={store.id} 
                className="flex flex-col items-center flex-shrink-0" 
                onClick={() => {
                  if (store.path.startsWith('/')) {
                    navigate(store.path);
                  }
                }}
              >
                <div className={`w-[84px] h-[58px] rounded-2xl p-1 shadow-sm active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-between border-2 ${activeStore === store.id ? `${store.activeBg} ${store.activeBorder}` : 'bg-white border-neutral-100'
                  }`}>
                  <div className="flex-1 flex items-center justify-center">
                    <img src={store.icon} alt={store.name} className="w-[30px] h-[30px] object-contain" />
                  </div>
                  <span className="text-[10px] font-black text-gray-900 pb-0.5 uppercase tracking-tighter">{store.name}</span>
                </div>
              </div>
            ))}
          </div>


          {/* Row 2: Location and Rewards Bar */}
          {!hideLocationBar && (
            <div className="flex items-center justify-between gap-2 mb-0">
              <div 
                onClick={() => requestLocation()}
                className="flex-1 min-w-0 bg-[#dff1ff] rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm border border-[#c5e4ff] cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="bg-gray-800 rounded-md p-1 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                </div>
                <span className="text-[12px] font-[900] text-gray-800 uppercase tracking-tight flex-shrink-0">HOME</span>
                <span className="text-[11px] font-bold text-gray-600 truncate">
                  {isLocationLoading ? "Locating..." : (locationDisplayText || "Set precise location...")}
                </span>
                <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${isLocationLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isLocationLoading ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </div>

              <div className="flex-shrink-0 bg-white rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm border border-gray-100 h-[32px]">
                <div className="w-4.5 h-4.5 bg-yellow-400 rounded-full flex items-center justify-center shadow-inner flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 3l-1 5h4L7 21l1-8H4l9-10z" />
                  </svg>
                </div>
                <span className="text-[13px] font-black text-gray-800 leading-none">23</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky section: Search Bar and Category Tabs - Always sticky */}
      <div
        ref={stickyRef}
        className="sticky top-0 z-50"
        style={{
          ...(scrollProgress >= 0.1 && {
            background: `linear-gradient(to bottom right,
              ${rgbToRgba(theme.primary[0], 1 - scrollProgress)},
              ${rgbToRgba(theme.primary[1], 1 - scrollProgress)},
              ${rgbToRgba(theme.primary[2], 1 - scrollProgress)}),
              rgba(255, 255, 255, ${scrollProgress})`,
            boxShadow: `0 4px 6px -1px rgba(0, 0, 0, ${scrollProgress * 0.1})`,
            transition: 'background 0.1s ease-out, box-shadow 0.1s ease-out',
          }),
        }}
      >
        <div className="px-4 md:px-6 lg:px-8 pt-2 md:pt-2 pb-2">
          {/* Search Bar Row */}
          {!hideSearchBar && (
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => navigate('/search')}
                className="flex-1 rounded-[14px] border-2 border-[#1e90ff] px-3 py-2 md:py-2.5 flex items-center gap-2 bg-white shadow-sm active:scale-[0.99] transition-all cursor-pointer h-[42px] md:h-[46px]"
              >
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div className="flex-1 relative h-5 overflow-hidden">
                  {searchSuggestions.map((suggestion, index) => {
                    const isActive = index === currentSearchIndex;
                    return (
                      <div
                        key={suggestion}
                        className={`absolute inset-0 flex items-center transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                      >
                        <span className="text-[13.5px] md:text-[15px] font-medium text-gray-400 truncate pr-2">
                          Search {suggestion}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Category Tabs Section - Substituted with circular icons bar */}
          {!hideCategoryTabs && (
            <div className="mt-0">
              <CategoryTabBar
                activeCategory={activeTab}
                onCategoryChange={onTabChange}
                onTabClick={handleTabClick}
                isLightMode={scrollProgress > 0.5}
                categories={headerCategories}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
