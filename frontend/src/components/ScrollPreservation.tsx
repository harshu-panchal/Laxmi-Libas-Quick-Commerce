import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Handles automatic scroll preservation and top-scrolling across navigation state changes.
 * Binds scroll position to React Router's internal location key within Session Storage.
 */
export default function ScrollPreservation() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Attempt scroll restoration if popping (navigating back/forward)
    if (navigationType === 'POP') {
      const savedPosition = sessionStorage.getItem(`scroll-${location.key}`);
      if (savedPosition) {
        // Use requestAnimationFrame to ensure DOM is ready before scrolling
        requestAnimationFrame(() => {
          // Double rAF ensures paint cycle completes for heavy DOM elements
          requestAnimationFrame(() => {
            window.scrollTo(0, parseInt(savedPosition, 10));
          });
        });
      }
    } else {
      // Standard navigation (PUSH or REPLACE) always resets to top
      window.scrollTo(0, 0);
    }

    // Define scroll caching event
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll caching to prevent performance bottleneck
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem(`scroll-${location.key}`, window.scrollY.toString());
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup event listener on location shift
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key, navigationType]);

  return null;
}
