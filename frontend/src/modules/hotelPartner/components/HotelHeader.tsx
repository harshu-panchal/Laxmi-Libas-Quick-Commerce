import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HotelHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const HotelHeader: React.FC<HotelHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-neutral-50 rounded-xl lg:hidden text-neutral-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-neutral-800 hidden md:block">Hotel Partner</h1>
      </div>

      {/* Navigation Cards */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1 mx-2">
        <button
          onClick={() => navigate('/admin')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap border ${isActive('/admin')
            ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm ring-1 ring-teal-200'
            : 'bg-white border-neutral-200 text-neutral-600 hover:border-teal-200 hover:bg-neutral-50'
            }`}
        >
          <div className={`p-1.5 rounded-lg ${isActive('/admin') ? 'bg-teal-100' : 'bg-neutral-100'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Product Sellers</span>
        </button>

        <button
          onClick={() => navigate('/admin/hotel')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap border ${isActive('/admin/hotel')
            ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm ring-1 ring-orange-200'
            : 'bg-white border-neutral-200 text-neutral-600 hover:border-orange-200 hover:bg-neutral-50'
            }`}
        >
          <div className={`p-1.5 rounded-lg ${isActive('/admin/hotel') ? 'bg-orange-100' : 'bg-neutral-100'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 7h18M5 7v14M19 7v14M9 11h2M9 15h2M13 11h2M13 15h2M5 3l7 4 7-4" />
            </svg>
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Hotel Partners</span>
        </button>

        <button
          onClick={() => navigate('/admin/transport')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap border ${isActive('/admin/transport')
            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200'
            : 'bg-white border-neutral-200 text-neutral-600 hover:border-blue-200 hover:bg-neutral-50'
            }`}
        >
          <div className={`p-1.5 rounded-lg ${isActive('/admin/transport') ? 'bg-blue-100' : 'bg-neutral-100'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <span className="text-[10px] sm:text-xs font-bold">Transport Partners</span>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-xl transition-all relative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-teal-700 transition-all shadow-sm">
          HP
        </div>
      </div>
    </header>
  );
};

export default HotelHeader;
