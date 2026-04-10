import React, { useState } from 'react';
import { Seat } from '../types';

interface SeatLayoutProps {
  totalSeats: number;
  onSeatClick?: (seatNumber: string) => void;
}

export const SeatLayout: React.FC<SeatLayoutProps> = ({ totalSeats, onSeatClick }) => {
  // Generate dummy seats
  const seats: Seat[] = Array.from({ length: totalSeats }, (_, i) => ({
    id: i + 1,
    number: `${Math.floor(i / 4) + 1}${String.fromCharCode(65 + (i % 4))}`,
    isBooked: Math.random() > 0.7 // Randomly book some seats for demo
  }));

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const handleSeatClick = (seatNumber: string, isBooked: boolean) => {
    if (isBooked) return;
    setSelectedSeat(seatNumber);
    onSeatClick?.(seatNumber);
  };

  return (
    <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-neutral-300"></div>
            <span className="text-xs font-bold text-neutral-500">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
            <span className="text-xs font-bold text-neutral-500">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-teal-500 border border-teal-600"></div>
            <span className="text-xs font-bold text-neutral-500">Selected</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          <span className="text-xs font-medium">Front</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-xs mx-auto">
        {seats.map((seat) => (
          <button
            key={seat.id}
            disabled={seat.isBooked}
            onClick={() => handleSeatClick(seat.number, seat.isBooked)}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all
              ${seat.isBooked 
                ? 'bg-red-50 text-red-300 border border-red-100 cursor-not-allowed' 
                : selectedSeat === seat.number
                  ? 'bg-teal-500 text-white border-b-4 border-teal-700 shadow-lg -translate-y-0.5'
                  : 'bg-white text-neutral-400 border border-neutral-200 hover:border-teal-500 hover:text-teal-600 shadow-sm'}
            `}
          >
            {seat.number}
          </button>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between items-center text-sm">
        <span className="font-bold text-neutral-500">Selected Seat:</span>
        <span className="font-black text-teal-600">{selectedSeat || 'None'}</span>
      </div>
    </div>
  );
};
