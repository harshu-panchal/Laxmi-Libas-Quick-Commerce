import { ReactNode, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import SellerHeader from './SellerHeader';
import SellerSidebar from './SellerSidebar';
import { useSellerSocket, SellerNotification } from '../hooks/useSellerSocket';
import SellerNotificationAlert from './SellerNotificationAlert';
import { useAuth } from '../../../context/AuthContext';

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<SellerNotification | null>(null);
  const { user } = useAuth();
  const location = useLocation();

  const handleNotificationReceived = useCallback((notification: SellerNotification) => {
    setActiveNotification(notification);
  }, []);

  useSellerSocket(handleNotificationReceived);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeNotification = () => {
    setActiveNotification(null);
  };

  const sellerStatus = user?.status || 'Pending';
  const isDashboard = location.pathname === '/seller' || location.pathname === '/seller/';
  const isRestricted = sellerStatus !== 'Approved' && !isDashboard;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Real-time Notification Alert */}
      <SellerNotificationAlert
        notification={activeNotification}
        onClose={closeNotification}
      />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <SellerSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 w-full lg:ml-64`}
      >
        {/* Header */}
        <SellerHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-neutral-50">
          {isRestricted ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl shadow-sm border border-neutral-100 max-w-2xl mx-auto my-10">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V17M12 7V13M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Access Restricted</h2>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Your seller account is currently <span className="font-bold text-yellow-600">Pending Approval</span>. 
                Full access to products, orders, and settings will be enabled once our admin team verifies your profile.
              </p>
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-left w-full mb-8">
                <h3 className="text-sm font-semibold text-neutral-700 mb-1 flex items-center gap-2">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Why can't I access this page?
                </h3>
                <p className="text-xs text-neutral-500">
                  To maintain the quality of our marketplace, all new sellers go through a verification process. 
                  This usually takes 24-48 business hours.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/seller'}
                className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

