type AlertVariant = 'seller' | 'delivery';

let sharedContext: AudioContext | null = null;
let loopIntervalId: ReturnType<typeof setInterval> | null = null;
let fallbackAudio: HTMLAudioElement | null = null;
let isUnlocked = false;

const SOUND_PATHS: Record<AlertVariant, string> = {
  seller: '/assets/sound/seller_alert.wav',
  delivery: '/assets/sound/delivery-alert.wav',
};

function getAudioContext(): AudioContext {
  if (!sharedContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedContext = new Ctx();
  }
  return sharedContext;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
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

async function tryFileFallback(variant: AlertVariant, volume: number, loop: boolean): Promise<boolean> {
  try {
    stopOrderAlertSound();
    const audio = new Audio(SOUND_PATHS[variant]);
    audio.volume = volume;
    audio.loop = loop;
    fallbackAudio = audio;
    await audio.play();
    return true;
  } catch {
    fallbackAudio = null;
    return false;
  }
}

/** Unlock audio after a user gesture (required by browsers). */
export async function unlockOrderAlertSound(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    isUnlocked = true;
    localStorage.setItem('sound_unlocked', 'true');
    return true;
  } catch {
    return false;
  }
}

export function isOrderAlertSoundUnlocked(): boolean {
  return isUnlocked || localStorage.getItem('sound_unlocked') === 'true';
}

/** Play order alert ring (Web Audio; falls back to wav in public/assets/sound). */
export async function playOrderAlertSound(options?: {
  variant?: AlertVariant;
  volume?: number;
  loop?: boolean;
}): Promise<void> {
  const { variant = 'seller', volume = 0.8, loop = false } = options ?? {};

  const playOnce = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      playWebRing(ctx, variant, volume);
      isUnlocked = true;
    } catch {
      await tryFileFallback(variant, volume, false);
    }
  };

  if (loop) {
    stopOrderAlertSound();
    await playOnce();
    loopIntervalId = setInterval(() => {
      playOnce().catch(() => {});
    }, 2200);
    return;
  }

  await playOnce();
}

/** Stop looping alert and any file-based playback. */
export function stopOrderAlertSound(): void {
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    loopIntervalId = null;
  }
  if (fallbackAudio) {
    fallbackAudio.pause();
    fallbackAudio.currentTime = 0;
    fallbackAudio = null;
  }
}
