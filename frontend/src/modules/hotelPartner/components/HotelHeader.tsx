import React from 'react';

interface HotelHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const HotelHeader: React.FC<HotelHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  return (
    <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-6 sticky top-0 z-30">
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
        <h1 className="text-xl font-bold text-neutral-800">Hotel Partner</h1>
      </div>

      <div className="flex items-center gap-4">
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
