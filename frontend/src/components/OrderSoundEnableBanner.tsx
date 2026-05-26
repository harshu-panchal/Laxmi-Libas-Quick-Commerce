import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertVariant,
  isOrderAlertSoundUnlocked,
  primeOrderAlertSound,
} from '../utils/orderAlertSound';

interface OrderSoundEnableBannerProps {
  variant: AlertVariant;
  className?: string;
}

export default function OrderSoundEnableBanner({ variant, className = '' }: OrderSoundEnableBannerProps) {
  const [dismissed, setDismissed] = useState(() => isOrderAlertSoundUnlocked(variant));

  if (dismissed) return null;

  const handleActivate = () => {
    const ok = primeOrderAlertSound(variant);
    if (ok) {
      setDismissed(true);
      toast.success(
        variant === 'seller'
          ? 'Order sound alerts activated!'
          : 'Delivery order alerts activated!'
      );
    } else {
      toast.error('Could not enable sound. Check volume and browser permissions.');
    }
  };

  const title =
    variant === 'seller'
      ? 'Enable Real-Time Order Sound Alerts'
      : 'Enable New Order Sound Alerts';

  const description =
    variant === 'seller'
      ? 'Tap the button below once so your browser can play a ring on every new customer order.'
      : 'Tap the button below once so you hear a ring when a new delivery order arrives.';

  return (
    <div
      className={`bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white p-5 sm:p-6 rounded-[2rem] shadow-xl border border-teal-500/20 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-4 relative z-10 pointer-events-none">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-bounce shadow-inner">
          🔔
        </div>
        <div>
          <h4 className="font-extrabold text-sm sm:text-base tracking-tight">{title}</h4>
          <p className="text-xs text-white/90 font-medium mt-1 max-w-xl">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleActivate}
        className="relative z-20 px-6 py-3.5 bg-white text-teal-700 font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-neutral-50 transition-all hover:scale-105 active:scale-95 flex-shrink-0 touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        Activate Now
      </button>

      <div
        className="absolute right-[-10%] top-[-20%] w-[15rem] h-[15rem] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
