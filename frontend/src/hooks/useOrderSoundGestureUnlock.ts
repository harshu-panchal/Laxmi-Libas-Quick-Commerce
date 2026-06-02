import { useEffect } from 'react';
import { AlertVariant, isOrderAlertSoundUnlocked, primeOrderAlertSound } from '../utils/orderAlertSound';

/**
 * First tap anywhere on the page unlocks Web Audio for order alerts (browser policy).
 */
export function useOrderSoundGestureUnlock(variant: AlertVariant | null) {
  useEffect(() => {
    if (!variant) return;
    if (isOrderAlertSoundUnlocked(variant)) return;

    const onGesture = () => {
      primeOrderAlertSound(variant);
    };

    document.addEventListener('pointerdown', onGesture, { once: true, passive: true });
    document.addEventListener('keydown', onGesture, { once: true });

    return () => {
      document.removeEventListener('pointerdown', onGesture);
      document.removeEventListener('keydown', onGesture);
    };
  }, [variant]);
}
