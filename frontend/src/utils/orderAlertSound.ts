type AlertVariant = 'seller' | 'delivery';

let sharedContext: AudioContext | null = null;
let loopIntervalId: ReturnType<typeof setInterval> | null = null;
let isUnlocked = false;

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

async function ensureContextRunning(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
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
  } else {
    playTone(ctx, 880, now, 0.14, volume);
    playTone(ctx, 880, now + 0.2, 0.14, volume);
    playTone(ctx, 988, now + 0.45, 0.14, volume);
    playTone(ctx, 988, now + 0.62, 0.14, volume);
  }
}

/** Unlock audio after a user gesture (required by browsers). Plays a short test ring. */
export async function unlockOrderAlertSound(variant: AlertVariant = 'seller'): Promise<boolean> {
  try {
    const ctx = await ensureContextRunning();
    playWebRing(ctx, variant, 0.5);
    isUnlocked = true;
    localStorage.setItem('sound_unlocked', 'true');
    return true;
  } catch (error) {
    console.warn('Order alert sound unlock failed:', error);
    return false;
  }
}

export function isOrderAlertSoundUnlocked(): boolean {
  return isUnlocked || localStorage.getItem('sound_unlocked') === 'true';
}

/** Play order alert ring using Web Audio only (no external audio files). */
export async function playOrderAlertSound(options?: {
  variant?: AlertVariant;
  volume?: number;
  loop?: boolean;
}): Promise<void> {
  const { variant = 'seller', volume = 0.8, loop = false } = options ?? {};

  const playOnce = async () => {
    const ctx = await ensureContextRunning();
    playWebRing(ctx, variant, volume);
    isUnlocked = true;
  };

  if (loop) {
    stopOrderAlertSound();
    await playOnce();
    loopIntervalId = setInterval(() => {
      playOnce().catch((err) => console.warn('Looping order alert failed:', err));
    }, 2200);
    return;
  }

  await playOnce();
}

/** Stop looping alert playback. */
export function stopOrderAlertSound(): void {
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }
}
