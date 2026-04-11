import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TransportHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const TransportHeader: React.FC<TransportHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <header className="h-20 bg-white border-b border-neutral-100 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-[30]">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 hover:bg-neutral-50 rounded-lg lg:hidden transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-xl font-black text-neutral-800 tracking-tight hidden md:block">Transport Vendor</h1>
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

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-sm font-bold text-neutral-800">Harsh Bus Service</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded cursor-default border border-teal-100">Verified</span>
        </div>
        <div className="w-10 h-10 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 overflow-hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
    </header>
  );
};

export default TransportHeader;
