import React from 'react';
import { useLocation } from '../hooks/useLocation';
import { motion } from 'framer-motion';
import { MapPin, ChevronDown } from 'lucide-react';

interface CompactLocationHeaderProps {
  onShowChangeModal: () => void;
}

export default function CompactLocationHeader({ onShowChangeModal }: CompactLocationHeaderProps) {
  const { location, isLocationLoading } = useLocation();

  return (
    <div className="px-4 md:px-6 lg:px-8 py-2 bg-transparent flex items-center justify-between text-sm transition-all duration-300">
      <div 
        className="flex items-center gap-3 overflow-hidden cursor-pointer active:scale-95 transition-transform group"
        onClick={onShowChangeModal}
      >
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-orange-100 transition-colors">
          <MapPin size={18} className="text-orange-600" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-900 font-[900] uppercase tracking-tighter text-[13px] leading-none">
              {isLocationLoading ? 'Locating...' : (location?.city ? `Delivering to ${location.city}` : 'Set precise location')}
            </span>
            <ChevronDown size={14} className="text-orange-600 transition-transform group-hover:translate-y-0.5" strokeWidth={3} />
          </div>
          {location?.address && (
            <span className="text-neutral-500 text-[11px] font-bold truncate max-w-[220px] sm:max-w-md mt-0.5 opacity-80">
              {location.address}
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={onShowChangeModal}
        className="text-[10px] font-[1000] uppercase tracking-[0.15em] text-orange-600 bg-orange-50 px-3.5 py-2 rounded-xl hover:bg-orange-100 transition-all border border-orange-200/50 active:scale-90"
      >
        Change
      </button>
    </div>
  );
}
