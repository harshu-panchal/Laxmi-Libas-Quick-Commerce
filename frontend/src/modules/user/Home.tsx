import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HomeHero from "./components/HomeHero";
import HomeBannerCarousel from "./components/HomeBannerCarousel";
import BannerSlider from "./components/BannerSlider";
import CategoryTileSection from "./components/CategoryTileSection";
import FeaturedThisWeek from "./components/FeaturedThisWeek";
import ProductCard from "./components/ProductCard";
import { getHomeContent } from "../../services/api/customerHomeService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import { useLocation } from "../../hooks/useLocation";
import { useLoading } from "../../context/LoadingContext";
import PageLoader from "../../components/PageLoader";
import { ProductCardSkeleton, CategoryCardSkeleton, SectionSkeleton } from "../../components/loaders/Skeletons";
import CategoryTabBar from "../../components/CategoryTabBar";
import { getTheme } from "../../utils/themes";
import { useThemeContext } from "../../context/ThemeContext";
import { isClothingRelated } from "../../utils/clothingUtils";
import { CLOTHING_MOCK_DATA } from "../../utils/clothingMockData";


export default function Home() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { activeCategory, setActiveCategory } = useThemeContext();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const activeTab = activeCategory; // mapping for existing code compatibility
  const setActiveTab = setActiveCategory;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const SCROLL_POSITION_KEY = 'home-scroll-position';

  // State for dynamic data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>({
    bestsellers: [],
    categories: [],
    homeSections: [], // Dynamic sections created by admin
    shops: [],
    promoBanners: [],
    promoCards: [], // Categories linked to the current header
    trending: [],
    cookingIdeas: [],
  });
  const [selectedMockSubCategory, setSelectedMockSubCategory] = useState<string | null>(null);
  const [headerCategories, setHeaderCategories] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);

  // Function to save scroll position before navigation
  const saveScrollPosition = () => {
    const mainElement = document.querySelector('main');
    const scrollPos = Math.max(
      mainElement ? mainElement.scrollTop : 0,
      window.scrollY || 0,
      document.documentElement.scrollTop || 0
    );
    if (scrollPos > 0) {
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        startRouteLoading();
        setLoading(true);
        setError(null);
        setProducts([]); // CRITICAL: Reset products to prevent old category data showing

        const slug = activeTab === "all" ? undefined : activeTab;
        console.log(`[Home] Fetching content for tab: ${activeTab}, slug: ${slug}`);

        const response = await getHomeContent(
          slug,
          location?.latitude,
          location?.longitude,
          location?.city
        );

        if (response.success && response.data) {
          let data = response.data;

          setHomeData(data);

          // Products for the "Filtered Products Section" at the bottom
          // If we are on "all" tab, we might show bestsellers or other global items
          // If on a specific tab, we show products returned for that category
          if (activeTab === "all") {
            // For "all" tab, products state can hold bestsellers for legacy sections 
            // but we should distinguish between bestseller tiles and actual products.
            setProducts([]);
          } else {
            // Look for a products section in the dynamic sections
            const productSection = data.homeSections?.find(
              (s: any) => s.displayType === "products" || s.id === "category-products"
            );
            if (productSection && productSection.data) {
              setProducts(productSection.data);
            } else {
              setProducts([]);
            }
          }
        } else {
          setError("Failed to load content. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch home content", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
        stopRouteLoading();
      }
    };

    fetchData();
    
    // Fetch Header Categories
    const fetchHeaderCategories = async () => {
      try {
        const categories = await getHeaderCategoriesPublic(true);
        setHeaderCategories(categories);
      } catch (err) {
        console.error("Failed to fetch header categories:", err);
      }
    };
    fetchHeaderCategories();
    
    setSelectedMockSubCategory(null); // Reset when tab changes
  }, [location?.latitude, location?.longitude, activeTab]);

  // Separate effect for preloading only on mount/location change, NOT activeTab
  useEffect(() => {
    const preloadHeaderCategories = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const headerCategories = await getHeaderCategoriesPublic(true);
        const slugsToPreload = ['all', ...headerCategories.map(cat => cat.slug)];

        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(
                slug,
                location?.latitude,
                location?.longitude,
                location?.city,
                true,
                5 * 60 * 1000,
                true
              ).catch(err => {
                console.debug(`Failed to preload data for ${slug}:`, err);
              })
            )
          );
          if (i + batchSize < slugsToPreload.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.debug("Failed to preload header categories:", error);
      }
    };

    preloadHeaderCategories();
  }, [location?.latitude, location?.longitude]);

  // Restore scroll position when returning to this page
  useEffect(() => {
    // Only restore scroll after data has loaded
    if (!loading && homeData.shops) {
      // Use a ref to ensure we only handle initial scroll once per mount
      if (scrollHandledRef.current) return;
      scrollHandledRef.current = true;

      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);

        const performScroll = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) {
            mainElement.scrollTop = scrollY;
          }
          window.scrollTo(0, scrollY);
        };

        // Try multiple times to ensure scroll is applied even if content is still rendering
        requestAnimationFrame(() => {
          performScroll();
          requestAnimationFrame(() => {
            performScroll();
            // Final fallback after a small delay for any late-rendering content
            setTimeout(performScroll, 100);
            setTimeout(performScroll, 300);
          });
        });

        // Clear the saved position after some time to ensure AppLayout can also see it if needed
        // but Home.tsx is the primary restorer now.
        setTimeout(() => {
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        }, 1000);
      } else {
        // No saved position, ensure we start at the top
        const performReset = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) {
            mainElement.scrollTop = 0;
          }
          window.scrollTo(0, 0);
        };
        requestAnimationFrame(performReset);
        setTimeout(performReset, 100);
      }
    }
  }, [loading, homeData.shops]);

  // Global click/touch listener to save scroll position before any navigation
  useEffect(() => {
    const handleNavigationEvent = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // If clicking a link, button, or any element with cursor-pointer (like product cards/store tiles)
      if (target.closest('a') || target.closest('button') || target.closest('[role="button"]') || target.closest('.cursor-pointer')) {
        saveScrollPosition();
      }
    };

    window.addEventListener('click', handleNavigationEvent, { capture: true });
    window.addEventListener('touchstart', handleNavigationEvent, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleNavigationEvent, { capture: true });
      window.removeEventListener('touchstart', handleNavigationEvent, { capture: true });
    };
  }, []);

  // Removed duplicate saveScrollPosition
  const getFilteredProducts = (tabId: string) => {
    if (tabId === "all") {
      return products;
    }
    return products.filter(
      (p) =>
        p.id === tabId ||
        p.categoryId === tabId ||
        p.headerCategoryId === tabId ||
        (p.category && (p.category._id === tabId || p.category.slug === tabId)) ||
        (p.headerCategory && (p.headerCategory._id === tabId || p.headerCategory.slug === tabId))
    );
  };

  const filteredProducts = useMemo(
    () => getFilteredProducts(activeTab),
    [activeTab, products]
  );
  
  const activeHeaderCategory = useMemo(() => {
    return headerCategories.find(cat => cat.slug === activeTab);
  }, [headerCategories, activeTab]);
  
  const themeKey = activeHeaderCategory?.theme || activeHeaderCategory?.slug || activeTab || 'all';
  const theme = getTheme(themeKey);
  const isDefaultTheme = activeTab === 'all';

  if (loading && !products.length) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-48 bg-neutral-100 animate-pulse mb-8" />
        <div className="px-4 grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <CategoryCardSkeleton key={i} />)}
        </div>
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-dark text-white rounded-full font-medium hover:bg-yellow-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20 md:pb-0 transition-colors duration-500"
      ref={contentRef}
      style={{
        backgroundColor: theme.backgroundColor || '#ffffff'
      }}
    >
      {/* Hero Header with Gradient and Tabs */}
      <HomeHero 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        hideSearchBar={false} 
        headerCategories={headerCategories}
      />

      {/* Premium Home Banner Carousel - Restored as per request */}
      <HomeBannerCarousel />

      {/* LaxMart Services Grid */}
      <div className="px-4 py-3 bg-white">
        <div className="grid grid-cols-4 gap-3">
          <div 
            onClick={() => setActiveTab('minutes')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-all">
              ⚡
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight">Quick</span>
          </div>
          <div 
            onClick={() => setActiveTab('all')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-all">
              🛒
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight">Shop</span>
          </div>
          <div 
            onClick={() => navigate('/store/travel/hotels')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-all">
              🏨
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight">Hotels</span>
          </div>
          <div 
            onClick={() => navigate('/store/travel/buses')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-all">
              🚌
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight">Buses</span>
          </div>
        </div>
      </div>


      {/* Main content */}
      <div
        className="transition-colors duration-500 -mt-2 pt-1 space-y-5 md:space-y-8 md:pt-4"
        style={{
          backgroundColor: theme.surfaceColor || '#f8fafc'
        }}
      >
        {/* Dynamic Home Sections - Render sections created by admin */}
        {homeData.homeSections && homeData.homeSections.length > 0 && (
          <>
            {homeData.homeSections.map((section: any) => {
              const columnCount = Number(section.columns) || 4;

              // Banners display
              if (section.displayType === "banners") {
                return (
                  <div key={section.id} className="px-4 md:px-6 lg:px-8 mt-2 mb-4">
                    <BannerSlider />
                  </div>
                );
              }

              if (section.displayType === "products" && section.data && section.data.length > 0) {
                const productCount = section.data.length;
                const shouldScroll = productCount > 3;

                return (
                  <div key={section.id} className="mt-6 mb-6 md:mt-8 md:mb-8">
                    {section.title && (
                      <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight capitalize">
                        {section.title}
                      </h2>
                    )}
                    <div className="px-4 md:px-6 lg:px-8">
                      {shouldScroll ? (
                        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2">
                          {section.data.map((product: any) => (
                            <div key={product.id || product._id} className="flex-none w-[31.5%] snap-start">
                              <ProductCard
                                product={product}
                                categoryStyle={true}
                                showBadge={true}
                                showPackBadge={false}
                                showStockInfo={false}
                                compact={true}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`grid grid-cols-3 gap-3 md:gap-4`}>
                          {section.data.map((product: any) => (
                            <ProductCard
                              key={product.id || product._id}
                              product={product}
                              categoryStyle={true}
                              showBadge={true}
                              showPackBadge={false}
                              showStockInfo={false}
                              compact={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <CategoryTileSection
                  key={section.id}
                  title={section.title}
                  tiles={section.data || []}
                  columns={columnCount as 2 | 3 | 4 | 6 | 8}
                  showProductCount={false}
                />
              );
            })}
          </>
        )}

        {/* Filtered Products Section - Only show if no dynamic homeSections are present for the active category */}
        {activeTab !== "all" && (!homeData.homeSections || homeData.homeSections.length === 0) && (
          <div data-products-section className="mt-6 mb-6 md:mt-8 md:mb-8 min-h-[40vh]">
            <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight capitalize">
              {activeTab === "grocery" ? "Grocery Items" : activeTab}
            </h2>
            <div className="px-4 md:px-6 lg:px-8">
              {(() => {
                const hasSections = homeData.homeSections && homeData.homeSections.length > 0;
                const hasProducts = filteredProducts.length > 0;
                const hasPromoCards = homeData.promoCards && homeData.promoCards.length > 0;

                // Priority 1: If we have promo cards (linked categories), show them as tiles
                if (!hasSections && hasPromoCards) {
                   return (
                    <CategoryTileSection
                      title=""
                      tiles={homeData.promoCards.map((card: any) => ({
                        id: card.categoryId,
                        name: card.title,
                        image: (card.subcategoryImages && card.subcategoryImages.length > 0) 
                           ? card.subcategoryImages[0] 
                           : "",
                        slug: card.slug
                      }))}
                      columns={4}
                      showProductCount={false}
                      onTileClick={(tile) => navigate(`/category/${tile.slug || tile.id}`)}
                    />
                  );
                }

                // Priority 2: If we have products, show them
                if (hasProducts) {
                  return (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id || product._id}
                          product={product}
                          categoryStyle={true}
                          showBadge={true}
                          showPackBadge={false}
                          showStockInfo={true}
                        />
                      ))}
                    </div>
                  );
                }

                // Priority 3: No sections, no promo cards, no products -> Empty State
                if (!hasSections) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
                      <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900">No products available</h3>
                      <p className="text-sm text-neutral-500 mt-1">We're working on bringing more items to this category soon.</p>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>
        )}

        {/* Bestsellers Section - Hidden as per request */}
        {activeTab === "all" && (
          <>
            {/* Bestsellers Section - Restored as per request */}
            <div className="mt-2 md:mt-4">
              <CategoryTileSection
                title="Bestsellers"
                tiles={
                  homeData.bestsellers && homeData.bestsellers.length > 0
                    ? homeData.bestsellers
                      .slice(0, 6)
                      .map((card: any) => {
                        // Bestseller cards have categoryId and productImages array from backend
                        return {
                          id: card.id,
                          categoryId: card.categoryId,
                          name: card.name || "Category",
                          productImages: card.productImages || [],
                          productCount: card.productCount || 0,
                        };
                      })
                    : []
                }
                columns={3}
                showProductCount={true}
              />
            </div>

            {/* Featured this week Section - Hidden as per request */}
            {/* Featured this week Section - Restored as per request */}
            <FeaturedThisWeek />

            {/* Shop by Store Section - Restored as per request */}
            <div className="mb-6 mt-6 md:mb-8 md:mt-8">
              <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight">
                Shop by Store
              </h2>
              <div className="px-4 md:px-6 lg:px-8">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4">
                  {(homeData.shops || [])
                    .map((tile: any) => {
                    const hasImages =
                      tile.image ||
                      (tile.productImages &&
                        tile.productImages.filter(Boolean).length > 0);

                    return (
                      <div key={tile.id} className="flex flex-col relative group">
                        <div
                          onClick={() => {
                            if (!tile.isOpen) return;
                            const storeSlug =
                              tile.slug || tile.id.replace("-store", "");
                            saveScrollPosition();
                            navigate(`/store/${storeSlug}`);
                          }}
                          className={`block bg-white rounded-[28px] shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative ${!tile.isOpen ? 'opacity-70 grayscale' : ''}`}>
                          {hasImages ? (
                            <img
                              src={
                                tile.image ||
                                (tile.productImages
                                  ? tile.productImages[0]
                                  : "")
                              }
                              alt={tile.name}
                              className="w-full h-16 object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-16 flex items-center justify-center text-3xl text-neutral-300 ${tile.bgColor || "bg-neutral-50"
                                }`}>
                              {tile.name.charAt(0)}
                            </div>
                          )}

                          {!tile.isOpen && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-all">
                               <span className="text-[10px] font-black text-white uppercase tracking-widest bg-red-600/90 px-2 py-0.5 rounded-full shadow-lg scale-90">Closed</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 text-center">
                          <span className="text-[10px] font-bold text-neutral-800 line-clamp-1 leading-tight uppercase tracking-tight">
                            {tile.name}
                          </span>
                          {!tile.isOpen && tile.openingTime && (
                             <div className="text-[8px] font-bold text-red-500 mt-0.5">Opens at {tile.openingTime}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
