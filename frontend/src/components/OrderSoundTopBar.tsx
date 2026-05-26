import { useState } from 'react';
import { AlertVariant, isOrderAlertSoundUnlocked, primeOrderAlertSound } from '../utils/orderAlertSound';

interface OrderSoundTopBarProps {
  variant: AlertVariant;
}

/** Sticky top bar — entire bar is one button to unlock sound. */
export default function OrderSoundTopBar({ variant }: OrderSoundTopBarProps) {
  const [hidden, setHidden] = useState(() => isOrderAlertSoundUnlocked(variant));
  if (hidden) return null;

  const handleEnable = () => {
    if (primeOrderAlertSound(variant)) {
      setHidden(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnable}
      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-bold flex flex-wrap items-center justify-center gap-2 cursor-pointer hover:from-amber-600 hover:to-orange-700 shadow-md sticky top-0 z-[99999] touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label="Enable order sound alerts"
    >
      <span>🔊</span>
      <span>Tap here to enable order sound alerts</span>
      <span className="bg-white text-orange-600 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase pointer-events-none">
        Enable Sound
      </span>
    </button>
  );
}
