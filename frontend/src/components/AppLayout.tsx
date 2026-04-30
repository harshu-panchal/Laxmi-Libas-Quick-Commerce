import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import FloatingCartPill from './FloatingCartPill';
import { useCart } from '../context/CartContext';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import LocationPermissionRequest from './LocationPermissionRequest';
import { useThemeContext } from '../context/ThemeContext';
import ServiceNotAvailable from './ServiceNotAvailable';
import CompactLocationHeader from './CompactLocationHeader';


interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoriesRotation, setCategoriesRotation] = useState(0);
  const [prevCategoriesActive, setPrevCategoriesActive] = useState(false);
  const { isLocationEnabled, isLocationLoading, location: userLocation, showChangeModal, setShowChangeModal } = useLocationContext();
  const [showLocationRequest, setShowLocationRequest] = useState(false);
  const { currentTheme } = useThemeContext();

  // State to track if service is available at user's location
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);

  // Check serviceability when user location changes
  useEffect(() => {
    // Temporarily disabled: service is available everywhere
    setIsServiceAvailable(true);
  }, [userLocation]);

  const isActive = (path: string) => location.pathname === path;

  // ... (rest of the component logic)

  // Check if location is required for current route
  const requiresLocation = () => {
    // Prompt immediately on all pages if location is missing for a persistent experience
    return !isLocationEnabled;
  };


  // ... (rest of the component logic)

  // ...

  // ALWAYS show location request modal on app load if location is not enabled
  // This ensures modal appears on every app open, regardless of browser permission state
  useEffect(() => {
    // Wait for initial loading to complete
    if (isLocationLoading) {
      return;
    }

    // If location is enabled, hide modal
    if (isLocationEnabled) {
      setShowLocationRequest(false);
      return;
    }

    // If location is NOT enabled and route requires location, ALWAYS show modal
    // This will trigger on every app open until user explicitly confirms location
    if (!isLocationEnabled && requiresLocation()) {
      setShowLocationRequest(true);
    } else {
      setShowLocationRequest(false);
    }
  }, [isLocationLoading, isLocationEnabled, location.pathname]);

  // ...



  // Update search query when URL params change
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (location.pathname === '/search') {
      // Update URL params when on search page
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    } else {
      // Navigate to search page with query
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value)}`);
      }
    }
  };


  const SCROLL_POSITION_KEY = 'home-scroll-position';

  // Reset scroll position when navigating to any page (smooth, no flash)
  // BUT skip for Home page if there's a saved scroll position to restore
  useEffect(() => {
    const isHomePage = location.pathname === '/' || location.pathname === '/user/home';

    // Home page handles its own scroll restoration and reset logic
    if (isHomePage) {
      return;
    }

    // Use requestAnimationFrame to prevent visual flash
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      // Also reset window scroll smoothly
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [location.pathname]);

  // Track categories active state for rotation
  const isCategoriesActive = isActive('/categories') || location.pathname.startsWith('/category/');

  useEffect(() => {
    if (isCategoriesActive && !prevCategoriesActive) {
      // Rotate clockwise when clicked (becoming active)
      setCategoriesRotation(prev => prev + 360);
      setPrevCategoriesActive(true);
    } else if (!isCategoriesActive && prevCategoriesActive) {
      // Rotate counter-clockwise when unclicked (becoming inactive)
      setCategoriesRotation(prev => prev - 360);
      setPrevCategoriesActive(false);
    }
  }, [isCategoriesActive, prevCategoriesActive]);

  const isHomePage = location.pathname === '/' || location.pathname === '/user/home';
  const isOrderAgainPage = location.pathname.toLowerCase().includes('order-again');
  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isSearchPage = location.pathname === '/search';
  const isCheckoutPage = location.pathname === '/checkout' || location.pathname.startsWith('/checkout/');
  const isCartPage = location.pathname === '/cart';
  const isTravelPage = location.pathname.startsWith('/store/travel');
  const showHeader = (isHomePage || isSearchPage) && !isCheckoutPage && !isCartPage && !isTravelPage;
  const showSearchBar = !isOrderAgainPage; // Restored search bar visibility
  const showFooter = !isCheckoutPage && !isProductDetailPage && !isTravelPage;

  const isAccountPage = location.pathname.startsWith('/account');
  const isCategoriesPage = location.pathname === '/categories' || location.pathname.startsWith('/category/');
  const shouldHideDeliveryInfo = isAccountPage || isCategoriesPage;

  const isHomePageDirect = location.pathname === '/' || location.pathname === '/user/home';
  const showStickyHeader = (showHeader || isSearchPage || !isHomePage) && !isOrderAgainPage && !isHomePageDirect;

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      {/* Desktop Container Wrapper */}
      <div className="md:w-full md:bg-white md:min-h-screen overflow-x-hidden">
        <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden">
          {/* Real-time Compact Location Header - Removed from top as per request */}

          {/* Top Navigation Bar - Desktop Only */}
          {showFooter && !isOrderAgainPage && (
            <nav
              className="hidden md:flex items-center justify-center gap-8 px-6 lg:px-8 py-3 shadow-sm transition-colors duration-300"
              style={{
                background: `linear-gradient(to right, ${currentTheme.primary[0]}, ${currentTheme.primary[1]})`,
                borderBottom: `1px solid ${currentTheme.primary[0]}`
              }}
            >

              {/* Home */}
              <Link
                to="/user/home"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/user/home')
                  ? 'bg-white shadow-md font-semibold'
                  : 'hover:bg-white/20'
                  }`}
                style={{
                  color: isActive('/user/home') ? currentTheme.accentColor : currentTheme.headerTextColor
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isActive('/user/home') ? (
                    <>
                      <path d="M2 12L12 4L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
                      <rect x="4" y="12" width="16" height="8" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </>
                  ) : (
                    <>
                      <path d="M12 2L2 12H5V20H19V12H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">Home</span>
              </Link>

              {/* Order Again */}
              <Link
                to="/order-again"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/order-again')
                  ? 'bg-white shadow-md font-semibold'
                  : 'hover:bg-white/20'
                  }`}
                style={{
                  color: isActive('/order-again') ? currentTheme.accentColor : currentTheme.headerTextColor
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isActive('/order-again') ? (
                    <path d="M5 8V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V8H21C21.5523 8 22 8.44772 22 9V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V9C2 8.44772 2.44772 8 3 8H5Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  ) : (
                    <path d="M5 8V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V8H21C21.5523 8 22 8.44772 22 9V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V9C2 8.44772 2.44772 8 3 8H5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
                  )}
                </svg>
                <span className="font-medium text-sm">Order Again</span>
              </Link>

              {/* Categories */}
              <Link
                to="/categories"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${(isActive('/categories') || location.pathname.startsWith('/category/'))
                  ? 'bg-white shadow-md font-semibold'
                  : 'hover:bg-white/20'
                  }`}
                style={{
                  color: (isActive('/categories') || location.pathname.startsWith('/category/')) ? currentTheme.accentColor : currentTheme.headerTextColor
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {(isActive('/categories') || location.pathname.startsWith('/category/')) ? (
                    <>
                      <circle cx="7" cy="7" r="2.5" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                      <circle cx="17" cy="7" r="2.5" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                      <circle cx="7" cy="17" r="2.5" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                      <circle cx="17" cy="17" r="2.5" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                    </>
                  ) : (
                    <>
                      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="7" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="17" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">Categories</span>
              </Link>

              {/* Profile */}
              <Link
                to="/account"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/account')
                  ? 'bg-white shadow-md font-semibold'
                  : 'hover:bg-white/20'
                  }`}
                style={{
                  color: isActive('/account') ? currentTheme.accentColor : currentTheme.headerTextColor
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isActive('/account') ? (
                    <>
                      <circle cx="12" cy="8" r="4" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="currentColor" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">Profile</span>
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/notifications')
                  ? 'bg-white shadow-md font-semibold'
                  : 'hover:bg-white/20'
                  }`}
                style={{
                  color: isActive('/notifications') ? currentTheme.accentColor : currentTheme.headerTextColor
                }}
              >
                <NotificationBell size={20} />
                <span className="font-medium text-sm">Notifications</span>
              </Link>
            </nav>
          )}


          {/* Sticky Header - Show on search page and other non-home pages */}
          {showStickyHeader && (
            <header className={`sticky z-50 shadow-sm md:shadow-md ${isOrderAgainPage ? 'top-0 bg-yellow-50' : 'top-0 md:top-[60px] bg-white'}`}>
              {/* Delivery info line - removed as per request */}
              {/* Delivery info line - removed as per request */}
              {/* {!shouldHideDeliveryInfo && !isOrderAgainPage && (
                <div className="px-4 md:px-6 lg:px-8 py-1.5 bg-yellow-50 text-xs text-yellow-700 text-center relative">
                  Delivering in 10–15 mins
                </div>
              )} */}



              {/* Header Title Row - Restored with Notification Bell */}
              {!isSearchPage && !isOrderAgainPage && location.pathname !== '/store/travel' && location.pathname !== '/store/minutes' && location.pathname !== '/categories' && (
                <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 bg-white md:hidden">
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">
                      {location.pathname === '/account' ? 'My Account' :
                        location.pathname === '/orders' ? 'My Orders' :
                        location.pathname === '/notifications' ? 'Notifications' :
                        location.pathname === '/wishlist' ? 'My Wishlist' : 'LaxMart'}
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/notifications')}
                    className="p-1"
                  >
                    <NotificationBell size={22} className="text-neutral-900" variant="static" />
                  </button>
                </div>
              )}
            </header>
          )}

          {/* Scrollable Main Content */}
          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isLocationEnabled && userLocation ? 'content' : 'location-check'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full"
                style={{ minHeight: '100%' }}
              >
                {/* Service Availability Check */}
                {
                  (() => {
                    // If we have a location but service is NOT available, show the unavailable screen
                    // We check the component state 'isServiceAvailable' which is updated by useEffect
                    if (isLocationEnabled && userLocation && !isServiceAvailable && !showLocationRequest) {
                      return <ServiceNotAvailable onChangeLocation={() => setShowChangeModal(true)} />;
                    }
                    return children;
                  })()
                }
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Floating Cart Pill */}
          <FloatingCartPill />

          {/* Location Permission Request Modal - Mandatory for all users */}
          {showLocationRequest && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationRequest(false)}
              skipable={false}
              title="Location Access Required"
              description="We need your location to show you products available near you and enable delivery services. Location access is required to continue."
            />
          )}

          {/* Location Change Modal */}
          {showChangeModal && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowChangeModal(false)}
              skipable={true}
              title="Change Location"
              description="Update your location to see products available near you."
              forceOpen={true}
            />
          )}

          {/* Fixed Bottom Navigation - Mobile Only, Hidden on checkout pages */}
          {showFooter && location.pathname !== '/' && (
            <nav
              className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-neutral-100 shadow-[0_-1px_10px_rgba(0,0,0,0.02)] z-50 md:hidden pb-[env(safe-area-inset-bottom,20px)]"
            >
              <div className="grid grid-cols-5 h-[72px]">
                {/* Home */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-full"
                >
                  <Link
                    to="/user/home"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="relative mb-1">
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isActive('/user/home') ? 'text-indigo-600' : 'text-neutral-400'}
                        animate={isActive('/user/home') ? { scale: 1.1 } : { scale: 1 }}
                      >
                        {isActive('/user/home') ? (
                          <path d="M12 2L2 12H5V20H19V12H22L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                          <path d="M12 2L2 12H5V20H19V12H22L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        )}
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] tracking-tight transition-all duration-300 ${isActive('/user/home') ? 'font-bold text-indigo-600' : 'font-medium text-neutral-500'}`}>
                      Home
                    </span>
                    {isActive('/user/home') && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Order Again */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-full"
                >
                  <Link
                    to="/order-again"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="relative mb-1">
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isActive('/order-again') ? 'text-indigo-600' : 'text-neutral-400'}
                        animate={isActive('/order-again') ? { scale: 1.1 } : { scale: 1 }}
                      >
                        <path d="M5 8V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V8H21C21.5523 8 22 8.44772 22 9V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V9C2 8.44772 2.44772 8 3 8H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={isActive('/order-again') ? "currentColor" : "none"} />
                        <path d="M7 8V6C7 5.44772 7.44772 5 8 5H16C16.5523 5 17 5.44772 17 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] tracking-tight transition-all duration-300 ${isActive('/order-again') ? 'font-bold text-indigo-600' : 'font-medium text-neutral-500'}`}>
                      Order Again
                    </span>
                    {isActive('/order-again') && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Categories */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-full"
                >
                  <Link
                    to="/categories"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="relative mb-1">
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isCategoriesActive ? 'text-indigo-600' : 'text-neutral-400'}
                        animate={{ rotate: categoriesRotation, scale: isCategoriesActive ? 1.1 : 1 }}
                      >
                        <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill={isCategoriesActive ? "currentColor" : "none"} />
                        <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill={isCategoriesActive ? "currentColor" : "none"} />
                        <circle cx="7" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" fill={isCategoriesActive ? "currentColor" : "none"} />
                        <circle cx="17" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" fill={isCategoriesActive ? "currentColor" : "none"} />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] tracking-tight transition-all duration-300 ${isCategoriesActive ? 'font-bold text-indigo-600' : 'font-medium text-neutral-500'}`}>
                      Categories
                    </span>
                    {isCategoriesActive && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Cart navigation item */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-full"
                >
                  <Link
                    to="/cart"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="relative mb-1">
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isActive('/cart') ? 'text-indigo-600' : 'text-neutral-400'}
                        animate={isActive('/cart') ? { scale: 1.1 } : { scale: 1 }}
                      >
                        <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7L5.4 5ZM7 13L4.707 15.293C4.077 15.923 4.523 17 5.414 17H19M17 17C15.895 17 15 17.895 15 19C15 20.105 15.895 21 17 21C18.105 21 19 20.105 19 19C19 17.895 18.105 17 17 17ZM9 17C7.895 17 7 17.895 7 19C7 20.105 7.895 21 9 21C10.105 21 11 20.105 11 19C11 17.895 10.105 17 9 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={isActive('/cart') ? "currentColor" : "none"} />
                      </motion.svg>
                      {/* Cart Badge */}
                      {(cart?.itemCount || 0) > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-white">
                          {cart.itemCount}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] tracking-tight transition-all duration-300 ${isActive('/cart') ? 'font-bold text-indigo-600' : 'font-medium text-neutral-500'}`}>
                      Cart
                    </span>
                    {isActive('/cart') && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>

                {/* Profile */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-full"
                >
                  <Link
                    to="/account"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="relative mb-1">
                      <motion.svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isActive('/account') ? 'text-indigo-600' : 'text-neutral-400'}
                        animate={isActive('/account') ? { scale: 1.1 } : { scale: 1 }}
                      >
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill={isActive('/account') ? "currentColor" : "none"} />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill={isActive('/account') ? "currentColor" : "none"} />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] tracking-tight transition-all duration-300 ${isActive('/account') ? 'font-bold text-indigo-600' : 'font-medium text-neutral-500'}`}>
                      Profile
                    </span>
                    {isActive('/account') && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

