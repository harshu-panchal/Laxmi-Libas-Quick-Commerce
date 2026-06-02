export type AlertVariant = 'seller' | 'delivery' | 'customer';

let sharedContext: AudioContext | null = null;
let loopIntervalId: ReturnType<typeof setInterval> | null = null;
const unlockedVariants = new Set<AlertVariant>();

function storageKey(variant: AlertVariant): string {
  return `sound_unlocked_${variant}`;
}

function getAudioContext(): AudioContext {
  if (!sharedContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      throw new Error('Web Audio API is not supported in this browser');
    }
    sharedContext = new Ctx();
  }
  return sharedContext;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function playWebRing(ctx: AudioContext, variant: AlertVariant, volume: number) {
  const now = ctx.currentTime;
  if (variant === 'seller') {
    playTone(ctx, 1046.5, now, 0.28, volume);
    playTone(ctx, 783.99, now + 0.32, 0.28, volume);
    playTone(ctx, 1046.5, now + 0.64, 0.38, volume);
  } else if (variant === 'delivery') {
    playTone(ctx, 880, now, 0.14, volume);
    playTone(ctx, 880, now + 0.2, 0.14, volume);
    playTone(ctx, 988, now + 0.45, 0.14, volume);
    playTone(ctx, 988, now + 0.62, 0.14, volume);
  } else {
    playTone(ctx, 659.25, now, 0.2, volume * 0.85);
    playTone(ctx, 783.99, now + 0.22, 0.25, volume * 0.9);
  }
}

/**
 * Call directly inside a click/tap handler (sync) so the browser keeps the user-gesture chain.
 */
export function primeOrderAlertSound(variant: AlertVariant = 'seller'): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    playWebRing(ctx, variant, 0.65);
    unlockedVariants.add(variant);
    localStorage.setItem(storageKey(variant), 'true');
    if (variant === 'customer') {
      localStorage.setItem('sound_unlocked_customer', 'true');
    } else {
      localStorage.setItem('sound_unlocked', 'true');
    }
    return true;
  } catch (error) {
    console.warn('Order alert sound prime failed:', error);
    return false;
  }
}

export async function unlockOrderAlertSound(variant: AlertVariant = 'seller'): Promise<boolean> {
  return primeOrderAlertSound(variant);
}

export function isOrderAlertSoundUnlocked(variant: AlertVariant = 'seller'): boolean {
  if (unlockedVariants.has(variant)) return true;
  if (localStorage.getItem(storageKey(variant)) === 'true') return true;
  // Legacy key from earlier builds (seller + delivery shared)
  if (variant !== 'customer' && localStorage.getItem('sound_unlocked') === 'true') {
    return true;
  }
  if (localStorage.getItem('sound_unlocked_customer') === 'true') {
    return true;
  }
  return false;
}

export function playOrderAlertSound(options?: {
  variant?: AlertVariant;
  volume?: number;
  loop?: boolean;
}): void {
  const { variant = 'seller', volume = 0.8, loop = false } = options ?? {};

  const playOnce = () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      playWebRing(ctx, variant, volume);
    } catch (error) {
      console.warn('Order alert playback failed:', error);
    }
  };

  if (loop) {
    stopOrderAlertSound();
    playOnce();
    loopIntervalId = setInterval(playOnce, 2200);
    return;
  }

  playOnce();
}

export function stopOrderAlertSound(): void {
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }
}
