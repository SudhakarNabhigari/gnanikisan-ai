let sharedAudioCtx: AudioContext | null = null;
let activeAudioStopper: (() => void) | null = null;
let activeAudioToken: symbol | null = null;

/**
 * Unlocks Web Audio / browser media playback synchronously inside a user gesture
 * (click / submit) so subsequent asynchronous TTS playback is permitted.
 */
export function unlockAudioPlayback(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => {});
    }
    // Emit a 1-sample silent buffer to firmly unlock audio output in Safari/Chrome
    const buffer = sharedAudioCtx.createBuffer(1, 1, 22050);
    const source = sharedAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(sharedAudioCtx.destination);
    source.start(0);
    return sharedAudioCtx.state === 'running';
  } catch {
    return false;
  }
}

/**
 * Registers the currently playing AudioPlayer and stops any previously active
 * AudioPlayer so overlapping audio playback never occurs across turns.
 */
export function claimActiveAudioPlayback(stopper: () => void): symbol {
  if (activeAudioStopper && activeAudioStopper !== stopper) {
    try {
      activeAudioStopper();
    } catch {
      // Ignore cleanup errors from stale player instances
    }
  }
  const token = Symbol('audio-playback');
  activeAudioStopper = stopper;
  activeAudioToken = token;
  return token;
}

export function releaseActiveAudioPlayback(token: symbol | null): void {
  if (token && activeAudioToken === token) {
    activeAudioStopper = null;
    activeAudioToken = null;
  }
}

export function stopAllActiveAudio(): void {
  if (activeAudioStopper) {
    try {
      activeAudioStopper();
    } catch {
      // Ignore stop errors
    }
  }
  activeAudioStopper = null;
  activeAudioToken = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
