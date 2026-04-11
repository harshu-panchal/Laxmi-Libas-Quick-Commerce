import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import laxmartLogo from '@assets/ChatGPT Image Feb 11, 2026, 01_01_14 PM.png';

interface AdminHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export default function AdminHeader({ onMenuClick, isSidebarOpen }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationsRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname.includes(path);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleLogoClick = () => {
    navigate('/admin');
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-3 sm:gap-0">
        {/* Logo and Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 6H20M4 12H20M4 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          {/* LaxMart Logo */}
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src={laxmartLogo}
              alt="LaxMart"
              className="h-14 sm:h-16 w-auto object-contain cursor-pointer"
              style={{ maxWidth: '200px' }}
            />
          </button>
        </div>

        {/* Navigation Cards */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap border ${isActive('/admin')
              ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm ring-1 ring-teal-200'
              : 'bg-white border-neutral-200 text-neutral-600 hover:border-teal-200 hover:bg-neutral-50'
              }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive('/admin') ? 'bg-teal-100' : 'bg-neutral-100'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold">Product Sellers</span>
          </button>

          <button
            onClick={() => navigate('/admin/hotel')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap border ${isActive('/admin/hotel')
              ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm ring-1 ring-orange-200'
              : 'bg-white border-neutral-200 text-neutral-600 hover:border-orange-200 hover:bg-neutral-50'
              }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive('/admin/hotel') ? 'bg-orange-100' : 'bg-neutral-100'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 7h18M5 7v14M19 7v14M9 11h2M9 15h2M13 11h2M13 15h2M5 3l7 4 7-4" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold">Hotel Partners</span>
          </button>

          <button
            onClick={() => navigate('/admin/transport')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap border ${isActive('/admin/transport')
              ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200'
              : 'bg-white border-neutral-200 text-neutral-600 hover:border-blue-200 hover:bg-neutral-50'
              }`}
          >
            <div className={`p-1.5 rounded-lg ${isActive('/admin/transport') ? 'bg-blue-100' : 'bg-neutral-100'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-bold">Transport Partners</span>
          </button>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 md:gap-4 relative">
          {/* Search Button */}
          <div className="relative">
            <button
              onClick={() => setShowSearchModal(!showSearchModal)}
              className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showSearchModal && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 p-4 z-50">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        // Navigate to search results or perform search
                        navigate(`/admin?search=${encodeURIComponent(searchQuery)}`);
                        setShowSearchModal(false);
                        setSearchQuery('');
                      }
                    }}
                    placeholder="Search orders, customers, products..."
                    className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    autoFocus
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21L16.65 16.65"></path>
                  </svg>
                  <button
                    onClick={() => {
                      setShowSearchModal(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                {searchQuery && (
                  <div className="mt-2 text-xs text-neutral-500">
                    Press Enter to search
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                setShowSearchModal(false);
              }}
              className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors relative"
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8C6 11.3137 4 14 4 17H20C20 14 18 11.3137 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-neutral-200">
                  <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                </div>
                <div className="py-4 px-4 text-center text-sm text-neutral-500">
                  <p>No new notifications</p>
                </div>
                <div className="px-4 py-2 border-t border-neutral-200">
                  <button
                    onClick={() => {
                      navigate('/admin/notification');
                      setShowNotificationsDropdown(false);
                    }}
                    className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <button
            onClick={() => navigate('/admin/profile')}
            className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            aria-label="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}


