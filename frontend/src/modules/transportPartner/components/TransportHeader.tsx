import React from 'react';

interface TransportHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const TransportHeader: React.FC<TransportHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
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
        <h1 className="text-xl font-black text-neutral-800 tracking-tight">Transport Vendor Portal</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold text-neutral-800">Harsh Bus Service</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded cursor-default border border-teal-100">Verified Vendor</span>
        </div>
        <div className="w-10 h-10 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 overflow-hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
    </header>
  );
};

export default TransportHeader;
