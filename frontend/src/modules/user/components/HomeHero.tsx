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
import { getHeaderCategoriesPublic } from '../../../services/api/headerCategoryService';
import { getIconByName } from '../../../utils/iconLibrary';
import CategoryTabBar from '../../../components/CategoryTabBar';

gsap.registerPlugin(ScrollTrigger);

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  hideTopContent?: boolean;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ALL_TAB: Tab = {
  id: 'all',
  label: 'All',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function HomeHero({ activeTab = 'all', onTabChange, hideTopContent = false }: HomeHeroProps) {
  const [tabs, setTabs] = useState<Tab[]>([ALL_TAB]);

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        const cats = await getHeaderCategoriesPublic();
        if (cats && cats.length > 0) {
          const mapped = cats.map(c => ({
            id: c.slug,
            label: c.name,
            icon: getIconByName(c.iconName)
          }));
          setTabs([ALL_TAB, ...mapped]);
        }
      } catch (error) {
        console.error('Failed to fetch header categories', error);
      }
    };
    fetchHeaderCategories();
  }, []);
  const navigate = useNavigate();
  const { location: userLocation } = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Format location display text - only show if user has provided location
  const locationDisplayText = useMemo(() => {
    if (userLocation?.address) {
      // Use the full address if available
      return userLocation.address;
    }
    // Fallback to city, state format if available
    if (userLocation?.city && userLocation?.state) {
      return `${userLocation.city}, ${userLocation.state}`;
    }
    // Fallback to city only
    if (userLocation?.city) {
      return userLocation.city;
    }
    // No default - return empty string if no location provided
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
    if (activeTab === 'all' && categories.length > 0) {
      // Use real category names for 'all' tab suggestions
      return [baseSuggestion, ...categories.slice(0, 7).map(c => c.name.toLowerCase())];
    }

    switch (activeTab) {
      case 'wedding':
        return [baseSuggestion, 'gift packs', 'dry fruits', 'sweets', 'decorative items', 'wedding cards', 'return gifts'];
      case 'winter':
        return [baseSuggestion, 'woolen clothes', 'caps', 'gloves', 'blankets', 'heater', 'winter wear'];
      case 'electronics':
        return [baseSuggestion, 'chargers', 'cables', 'power banks', 'earphones', 'phone cases', 'screen guards'];
      case 'beauty':
        return [baseSuggestion, 'lipstick', 'makeup', 'skincare', 'kajal', 'face wash', 'moisturizer'];
      case 'grocery':
        return [baseSuggestion, 'atta', 'milk', 'dal', 'rice', 'oil', 'vegetables'];
      case 'fashion':
        return [baseSuggestion, 'clothing', 'shoes', 'accessories', 'watches', 'bags', 'jewelry'];
      case 'sports':
<<<<<<< HEAD
        return [baseSuggestion, 'cricket bat', 'football', 'badminton', 'fitness equipment', 'sports shoes', 'gym wear'];
=======
        return ['cricket bat', 'football', 'badminton', 'fitness equipment', 'sports shoes', 'gym wear'];
      case 'home-furniture':
        return ['bedsheet', 'sofa cover', 'cushions', 'wall decor', 'lamps', 'storage boxes'];
>>>>>>> 7df7ead5f3c7dc56f2aa7bea54d3552e2711ca65
      default: // 'all'
        return [baseSuggestion, 'atta', 'milk', 'dal', 'coke', 'bread', 'eggs', 'rice', 'oil'];
    }
<<<<<<< HEAD
  }, [activeTab, categories.length]);
=======
  }, [activeTab, categories]);
>>>>>>> 7df7ead5f3c7dc56f2aa7bea54d3552e2711ca65

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
          setIsSticky(sectionBottom <= 100);
        } else {
          // Fallback to original logic if section not found
          const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
          const topSectionHeight = topSectionRef.current.offsetHeight;
          const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
          setScrollProgress(progress);
          setIsSticky(topSectionBottom <= 0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator position when activeTab changes and scroll to active tab
  useEffect(() => {
    const updateIndicator = (shouldScroll = true) => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;

      if (activeTabButton && container) {
        try {
          // Use offsetLeft for position relative to container (not affected by scroll)
          // This ensures the indicator stays aligned even when container scrolls
          const left = activeTabButton.offsetLeft;
          const width = activeTabButton.offsetWidth;

          // Ensure valid values
          if (width > 0) {
            setIndicatorStyle({ left, width });
          }

          // Scroll the container to bring the active tab into view (only when tab changes)
          if (shouldScroll) {
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;
            const buttonLeft = left;
            const buttonWidth = width;
            const buttonRight = buttonLeft + buttonWidth;

            // Calculate scroll position to center the button or keep it visible
            const scrollPadding = 20; // Padding from edges
            let targetScrollLeft = containerScrollLeft;

            // If button is on the left side and partially or fully hidden
            if (buttonLeft < containerScrollLeft + scrollPadding) {
              targetScrollLeft = buttonLeft - scrollPadding;
            }
            // If button is on the right side and partially or fully hidden
            else if (buttonRight > containerScrollLeft + containerWidth - scrollPadding) {
              targetScrollLeft = buttonRight - containerWidth + scrollPadding;
            }

            // Smooth scroll to the target position
            if (targetScrollLeft !== containerScrollLeft) {
              container.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
              });
            }
          }
        } catch (error) {
          console.warn('Error updating indicator:', error);
        }
      }
    };

    // Update immediately with scroll
    updateIndicator(true);

    // Also update after delays to handle any layout shifts and ensure smooth animation
    const timeout1 = setTimeout(() => updateIndicator(true), 50);
    const timeout2 = setTimeout(() => updateIndicator(true), 150);
    const timeout3 = setTimeout(() => updateIndicator(false), 300); // Last update without scroll to avoid conflicts

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    // Don't scroll - keep page at current position
  };

  const theme = getTheme(activeTab || 'all');
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
<<<<<<< HEAD
      <div>
        <div ref={topSectionRef} className="px-4 md:px-6 lg:px-8 pt-2 md:pt-3 pb-0">
          <div className="flex items-start justify-between mb-2 md:mb-2 gap-2">
            {/* Left: Text content */}
            <div className="flex-1 pr-2">
              {/* Service name - small, dark */}
              <div className="text-neutral-800 font-medium text-[11px] md:text-xs mb-0 leading-tight">LaxMart Quick Commerce</div>
              {/* Delivery time - large, bold, dark grey/black */}
              <div className="text-neutral-900 font-extrabold text-[28px] md:text-2xl mb-0 md:mb-0.5 leading-tight">
                {appConfig.estimatedDeliveryTime}
              </div>
              {/* Location with dropdown indicator - only show if location is provided */}
              {locationDisplayText && (
                <div className="text-neutral-700 text-[11px] md:text-xs flex items-center gap-1 leading-tight">
                  <span className="line-clamp-1" title={locationDisplayText}>{locationDisplayText}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
=======
      {!hideTopContent && (
        <div>
          <div ref={topSectionRef} className="px-4 md:px-6 lg:px-8 pt-2 md:pt-3 pb-0">
            <div className="flex items-start justify-between mb-2 md:mb-2">
              {/* Left: Text content */}
              <div className="flex-1 pr-2">
                {/* Service name - small, dark */}
                <div
                  className="font-medium text-[10px] md:text-xs mb-0 leading-tight"
                  style={{ color: theme.headerTextColor }}
                >
                  LaxMart Quick Commerce
>>>>>>> 7df7ead5f3c7dc56f2aa7bea54d3552e2711ca65
                </div>
                {/* Delivery time - large, bold, dark grey/black */}
                <div
                  className="font-extrabold text-2xl md:text-xl mb-0 md:mb-0.5 leading-tight"
                  style={{ color: theme.headerTextColor || '#000000' }}
                >
                  {appConfig.estimatedDeliveryTime}
                </div>
                {/* Location with dropdown indicator - only show if location is provided */}
                {locationDisplayText && (
                  <div className="text-neutral-700 text-[10px] md:text-xs flex items-center gap-0.5 leading-tight">
                    <span className="line-clamp-1" title={locationDisplayText}>{locationDisplayText}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Right: Notification Bell */}
              <div className="flex-shrink-0 mt-1">
                <button
                  onClick={() => navigate('/notifications')}
                  className="flex items-center justify-center transition-all duration-300 relative"
                >
                  <Bell size={26} style={{ color: theme.headerTextColor || '#000000' }} />
                  {/* Notification Badge - always show red dot for demo if no real count service yet */}
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                </button>
              </div>
            </div>

            {/* Right: Notification icon */}
            <button
              type="button"
              aria-label="Notifications"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/70 border border-white/60 shadow-sm text-neutral-900 hover:bg-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
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
        <div className="px-4 md:px-6 lg:px-8 pt-2 md:pt-2 pb-2 md:pb-2">
          {/* Search Bar */}
          <div
            onClick={() => navigate('/search')}
<<<<<<< HEAD
            className="w-full md:w-auto md:max-w-xl md:mx-auto rounded-xl shadow-sm px-3 py-2 md:px-3 md:py-2 flex items-center gap-2 cursor-pointer hover:shadow-md transition-all duration-300 mb-2 bg-white"
=======
            className="w-full md:w-auto md:max-w-xl md:mx-auto rounded-none shadow-lg px-4 py-4 md:px-5 md:py-3.5 flex items-center gap-2 cursor-pointer hover:shadow-xl transition-all duration-300 mb-2 bg-white"
>>>>>>> 7df7ead5f3c7dc56f2aa7bea54d3552e2711ca65
            style={{
              backgroundColor: scrollProgress > 0.1 ? `rgba(249, 250, 251, ${scrollProgress})` : 'white',
              border: scrollProgress > 0.1 ? `1px solid rgba(229, 231, 235, ${scrollProgress})` : '1px solid rgba(255,255,255,0.6)',
            }}
          >
<<<<<<< HEAD
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 md:w-4 md:h-4 text-yellow-700">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
=======
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 md:w-4 md:h-4">
              <circle cx="11" cy="11" r="8" stroke={scrollProgress > 0.5 ? "#9ca3af" : theme.primary[0]} strokeWidth="2.5" />
              <path d="m21 21-4.35-4.35" stroke={scrollProgress > 0.5 ? "#9ca3af" : theme.primary[0]} strokeWidth="2.5" strokeLinecap="round" />
>>>>>>> 7df7ead5f3c7dc56f2aa7bea54d3552e2711ca65
            </svg>
            <div className="flex-1 relative h-4 md:h-4 overflow-hidden">
              {searchSuggestions.map((suggestion, index) => {
                const isActive = index === currentSearchIndex;
                const prevIndex = (currentSearchIndex - 1 + searchSuggestions.length) % searchSuggestions.length;
                const isPrev = index === prevIndex;

                return (
                  <div
                    key={suggestion}
                    className={`absolute inset-0 flex items-center transition-all duration-500 ${isActive
                      ? 'translate-y-0 opacity-100'
                      : isPrev
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                      }`}
                  >
                    <span className="text-xs md:text-xs text-neutral-500">
                      Search {suggestion}
                    </span>
                  </div>
                );
              })}
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 md:w-4 md:h-4 text-neutral-500">
              <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Category Tabs Section - Substituted with circular icons bar */}
          <div className="mt-1">
            <CategoryTabBar
              activeCategory={activeTab}
              onCategoryChange={onTabChange}
              onTabClick={handleTabClick}
              isLightMode={scrollProgress > 0.5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
