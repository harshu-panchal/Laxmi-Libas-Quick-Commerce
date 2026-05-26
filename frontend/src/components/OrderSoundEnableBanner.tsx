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

/** Full-width button so the entire banner is tappable (fixes mobile / overlay click issues). */
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
      ? 'Tap anywhere on this card once — you should hear a test ring. New orders will ring automatically after that.'
      : 'Tap anywhere on this card once — you should hear a test ring when new delivery orders arrive.';

  return (
    <button
      type="button"
      onClick={handleActivate}
      className={`w-full text-left bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white p-5 sm:p-6 rounded-[2rem] shadow-xl border border-teal-500/20 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all touch-manipulation ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label="Activate order sound alerts"
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-bounce shadow-inner shrink-0">
          🔔
        </div>
        <div>
          <h4 className="font-extrabold text-sm sm:text-base tracking-tight">{title}</h4>
          <p className="text-xs text-white/90 font-medium mt-1 max-w-xl">{description}</p>
          <p className="text-[10px] text-white/50 mt-1 font-mono">Build {__APP_BUILD_TAG__}</p>
        </div>
      </div>

      <span className="relative z-10 px-6 py-3.5 bg-white text-teal-700 font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl shrink-0 pointer-events-none">
        Activate Now
      </span>

      <div
        className="absolute right-[-10%] top-[-20%] w-[15rem] h-[15rem] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl pointer-events-none"
        aria-hidden
      />
    </button>
  );
}
