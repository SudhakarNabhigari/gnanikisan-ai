import {
  AlertCircle,
  Check,
  Download,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Square,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch, triggerBlobDownload } from '../lib/api';
import {
  claimActiveAudioPlayback,
  releaseActiveAudioPlayback,
  unlockAudioPlayback,
} from '../lib/audioUnlock';
import type { AppLanguage } from '../types';

type TtsProviderType = 'gnani-timbre' | 'gemini-fallback' | 'browser-fallback' | 'none';
export type AudioPlaybackState = 'idle' | 'playing' | 'paused' | 'blocked';

export interface AudioPlayerControls {
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

interface RecoveredAudioPayload {
  audioBase64?: string;
  audioUrl?: string;
  audioMime: string;
  ttsProvider: TtsProviderType;
}

interface AudioPlayerProps {
  text: string;
  language: AppLanguage;
  uiLanguage?: AppLanguage;
  downloadFilename?: string;
  audioBase64?: string;
  audioUrl?: string;
  audioMime?: string;
  ttsProvider?: string;
  ttsError?: string;
  conversationId?: string;
  cropDoctorRecordId?: string;
  turnId?: string;
  initialSpeed?: number;
  autoPlay?: boolean;
  controlsRef?: React.MutableRefObject<AudioPlayerControls | null>;
  onPlayingChange?: (playing: boolean) => void;
  onPlaybackStateChange?: (state: AudioPlaybackState) => void;
  onPlaybackComplete?: () => void;
  onAudioRecovered?: (payload: RecoveredAudioPayload) => void;
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const rounded = Math.round(sec);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function decodeAudioBase64(
  rawBase64: string,
  preferredMime?: string
): { blob: Blob; mime: string } | null {
  const clean = rawBase64.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
  if (!clean || clean.length < 32) return null;

  try {
    const binary = atob(clean);
    if (binary.length < 128) return null;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Reject accidental JSON or HTML error text disguised as audio
    const b0 = bytes[0];
    if (b0 === 0x7b || b0 === 0x3c) {
      return null;
    }

    let detectedMime = (preferredMime || '').trim().toLowerCase();
    const isRiffWav =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45;
    const isId3Mp3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const isMpegSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    const isOgg = bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53;

    if (isRiffWav) detectedMime = 'audio/wav';
    else if (isId3Mp3 || isMpegSync) detectedMime = 'audio/mpeg';
    else if (isOgg) detectedMime = 'audio/ogg';
    else if (!detectedMime || !detectedMime.startsWith('audio/')) detectedMime = 'audio/wav';

    return {
      blob: new Blob([bytes], { type: detectedMime }),
      mime: detectedMime,
    };
  } catch {
    return null;
  }
}

export function AudioPlayer({
  text,
  language,
  uiLanguage,
  downloadFilename,
  audioBase64,
  audioUrl,
  audioMime,
  ttsProvider,
  ttsError,
  conversationId,
  cropDoctorRecordId,
  turnId,
  initialSpeed = 1.0,
  autoPlay = false,
  controlsRef,
  onPlayingChange,
  onPlaybackStateChange,
  onPlaybackComplete,
  onAudioRecovered,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedMidway, setIsPausedMidway] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [speed, setSpeed] = useState<number>(initialSpeed || 1.0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [downloaded, setDownloaded] = useState(false);

  const [recoveredAudio, setRecoveredAudio] = useState<RecoveredAudioPayload | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [resolvedMime, setResolvedMime] = useState<string>(audioMime || 'audio/wav');
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const playbackTokenRef = useRef<symbol | null>(null);
  const manualStopRef = useRef(false);

  const t = TRANSLATIONS[uiLanguage ?? language].audioPlayer;

  // Keep latest callbacks/labels in refs so re-renders never tear down active audio
  const onPlayingChangeRef = useRef(onPlayingChange);
  onPlayingChangeRef.current = onPlayingChange;

  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);
  onPlaybackStateChangeRef.current = onPlaybackStateChange;

  const onPlaybackCompleteRef = useRef(onPlaybackComplete);
  onPlaybackCompleteRef.current = onPlaybackComplete;

  const audioLoadErrorTextRef = useRef(t.audioLoadError);
  audioLoadErrorTextRef.current = t.audioLoadError;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const activeBase64 = recoveredAudio?.audioBase64 ?? audioBase64;
  const activeUrl = recoveredAudio?.audioUrl ?? audioUrl;
  const activeMime = recoveredAudio?.audioMime ?? audioMime;
  const activeProvider = recoveredAudio?.ttsProvider ?? ttsProvider;
  const activeTtsError = recoveredAudio ? null : ttsError || null;

  const notifyPlaybackState = useCallback((state: AudioPlaybackState) => {
    onPlayingChangeRef.current?.(state === 'playing');
    onPlaybackStateChangeRef.current?.(state);
  }, []);

  // Reset local overrides only when turnId or base64 audio changes
  useEffect(() => {
    setRecoveredAudio(null);
    setRetryError(null);
    setPlaybackError(null);
    setAutoplayBlocked(false);
    setIsPausedMidway(false);
    hasAutoPlayedRef.current = false;
  }, [turnId, audioBase64, audioUrl]);

  const bars = useMemo(() => {
    return [24, 48, 36, 72, 92, 60, 84, 52, 78, 65, 42, 68, 88, 56, 44, 70, 50, 32, 46, 30];
  }, []);

  useEffect(() => {
    setSpeed(initialSpeed || 1.0);
  }, [initialSpeed]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  const stopImmediately = useCallback(
    (notifyIdle = true) => {
      manualStopRef.current = true;
      const el = audioRef.current;
      if (el) {
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          // ignore seek error before metadata load
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      releaseActiveAudioPlayback(playbackTokenRef.current);
      playbackTokenRef.current = null;
      setIsPlaying(false);
      setIsPausedMidway(false);
      setAutoplayBlocked(false);
      setCurrentTime(0);
      if (notifyIdle) {
        notifyPlaybackState('idle');
      }
    },
    [notifyPlaybackState]
  );

  const pausePlayback = useCallback(() => {
    const el = audioRef.current;
    if (el && !el.paused) {
      el.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
      }
    }
    releaseActiveAudioPlayback(playbackTokenRef.current);
    playbackTokenRef.current = null;
    setIsPlaying(false);
    setIsPausedMidway(true);
    notifyPlaybackState('paused');
  }, [notifyPlaybackState]);

  const startElementPlayback = useCallback(
    async (fromStart = false) => {
      const el = audioRef.current;
      if (!el || !blobUrl) return;
      manualStopRef.current = false;
      playbackTokenRef.current = claimActiveAudioPlayback(() => stopImmediately(true));

      if (fromStart || el.ended || (duration > 0 && el.currentTime >= duration - 0.05)) {
        el.currentTime = 0;
        setCurrentTime(0);
      }
      el.playbackRate = speedRef.current;

      try {
        await el.play();
        setAutoplayBlocked(false);
        setPlaybackError(null);
        setIsPausedMidway(false);
        setIsPlaying(true);
        notifyPlaybackState('playing');
      } catch (err) {
        releaseActiveAudioPlayback(playbackTokenRef.current);
        playbackTokenRef.current = null;
        setIsPlaying(false);
        const isNotAllowed =
          err instanceof DOMException && err.name === 'NotAllowedError';
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        if (isNotAllowed) {
          setAutoplayBlocked(true);
          notifyPlaybackState('blocked');
        } else if (!isAbort) {
          setPlaybackError(audioLoadErrorTextRef.current);
          notifyPlaybackState('idle');
        }
      }
    },
    [blobUrl, duration, notifyPlaybackState, stopImmediately]
  );

  // Decode base64 into a real Blob URL and revoke cleanly on change/unmount
  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsPausedMidway(false);
    setPlaybackError(null);

    if (activeUrl) {
      setResolvedMime(activeMime || 'audio/wav');
      setBlobUrl(activeUrl);
      return;
    }

    if (!activeBase64) {
      setBlobUrl(null);
      return;
    }

    const decoded = decodeAudioBase64(activeBase64, activeMime);
    if (!decoded) {
      setBlobUrl(null);
      setPlaybackError(audioLoadErrorTextRef.current);
      return;
    }

    const objectUrl = URL.createObjectURL(decoded.blob);
    setResolvedMime(decoded.mime);
    setBlobUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [activeBase64, activeMime, activeUrl, audioMime]);

  // Real unmount-only cleanup — NEVER tied to parent callback identity
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      releaseActiveAudioPlayback(playbackTokenRef.current);
      playbackTokenRef.current = null;
      onPlayingChangeRef.current?.(false);
      onPlaybackStateChangeRef.current?.('idle');
    };
  }, []);

  // Automatically play when autoPlay is requested for a newly received response
  useEffect(() => {
    if (!autoPlay || hasAutoPlayedRef.current) return;
    if (blobUrl && audioRef.current) {
      hasAutoPlayedRef.current = true;
      void startElementPlayback(true);
      return;
    }
    if (
      !blobUrl &&
      activeProvider === 'browser-fallback' &&
      !activeTtsError &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      hasAutoPlayedRef.current = true;
      playbackTokenRef.current = claimActiveAudioPlayback(() => stopImmediately(true));
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      utter.rate = speedRef.current;
      utter.onend = () => {
        releaseActiveAudioPlayback(playbackTokenRef.current);
        playbackTokenRef.current = null;
        setIsPlaying(false);
        setIsPausedMidway(false);
        notifyPlaybackState('idle');
        if (!manualStopRef.current) {
          onPlaybackCompleteRef.current?.();
        }
      };
      utter.onerror = () => {
        releaseActiveAudioPlayback(playbackTokenRef.current);
        playbackTokenRef.current = null;
        setIsPlaying(false);
        notifyPlaybackState('idle');
      };
      setIsPlaying(true);
      notifyPlaybackState('playing');
      window.speechSynthesis.speak(utter);
    }
  }, [
    activeProvider,
    activeTtsError,
    autoPlay,
    blobUrl,
    language,
    notifyPlaybackState,
    startElementPlayback,
    stopImmediately,
    text,
  ]);

  const handleRetryAudio = useCallback(async () => {
    if (retrying || !text.trim()) return;
    unlockAudioPlayback();
    setRetrying(true);
    setRetryError(null);
    setPlaybackError(null);
    setAutoplayBlocked(false);
    try {
      const res = await apiFetch<{
        audioBase64?: string;
        audioUrl?: string;
        audioMime?: string;
        ttsProvider?: TtsProviderType;
        ttsError?: string;
      }>('/api/voice/tts', {
        method: 'POST',
        timeoutMs: 30000,
        body: JSON.stringify({
          text: text.trim(),
          language,
          conversationId,
          cropDoctorRecordId,
          turnId,
        }),
      });

      if (!res?.audioBase64 && !res?.audioUrl) {
        throw new Error(res?.ttsError || t.audioUnavailable);
      }

      const decoded = res.audioBase64 ? decodeAudioBase64(res.audioBase64, res.audioMime) : null;
      if (res.audioBase64 && !decoded) throw new Error(t.audioLoadError);
      const payload: RecoveredAudioPayload = {
        audioBase64: res.audioBase64,
        audioUrl: res.audioUrl,
        audioMime: decoded?.mime || res.audioMime || 'audio/wav',
        ttsProvider: res.ttsProvider || 'gnani-timbre',
      };
      // Trigger autoplay immediately once recovered
      hasAutoPlayedRef.current = false;
      setRecoveredAudio(payload);
      onAudioRecovered?.(payload);
    } catch (err) {
      setRetryError(err instanceof Error && err.message ? err.message : t.audioUnavailable);
    } finally {
      setRetrying(false);
    }
  }, [
    conversationId,
    cropDoctorRecordId,
    language,
    onAudioRecovered,
    retrying,
    t.audioLoadError,
    t.audioUnavailable,
    text,
    turnId,
  ]);

  const syncDurationFromElement = (el: HTMLAudioElement) => {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    }
  };

  const togglePlayback = useCallback(() => {
    unlockAudioPlayback();
    const el = audioRef.current;
    if (blobUrl && el && !playbackError) {
      if (isPlaying) {
        pausePlayback();
        return;
      }
      void startElementPlayback(false);
      return;
    }

    // Browser speechSynthesis ONLY when no server TTS keys are configured and no server error occurred
    if (
      activeProvider === 'browser-fallback' &&
      !activeTtsError &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      if (isPlaying) {
        pausePlayback();
      } else if (isPausedMidway && window.speechSynthesis.paused) {
        playbackTokenRef.current = claimActiveAudioPlayback(() => stopImmediately(true));
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPausedMidway(false);
        notifyPlaybackState('playing');
      } else {
        manualStopRef.current = false;
        playbackTokenRef.current = claimActiveAudioPlayback(() => stopImmediately(true));
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        utter.rate = speedRef.current;
        utter.onend = () => {
          releaseActiveAudioPlayback(playbackTokenRef.current);
          playbackTokenRef.current = null;
          setIsPlaying(false);
          setIsPausedMidway(false);
          notifyPlaybackState('idle');
          if (!manualStopRef.current) {
            onPlaybackCompleteRef.current?.();
          }
        };
        utter.onerror = () => {
          releaseActiveAudioPlayback(playbackTokenRef.current);
          playbackTokenRef.current = null;
          setIsPlaying(false);
          notifyPlaybackState('idle');
        };
        setIsPlaying(true);
        setIsPausedMidway(false);
        notifyPlaybackState('playing');
        window.speechSynthesis.speak(utter);
      }
      return;
    }

    void handleRetryAudio();
  }, [
    activeProvider,
    activeTtsError,
    blobUrl,
    handleRetryAudio,
    isPausedMidway,
    isPlaying,
    language,
    notifyPlaybackState,
    pausePlayback,
    playbackError,
    startElementPlayback,
    stopImmediately,
    text,
  ]);

  const resumePlayback = useCallback(() => {
    unlockAudioPlayback();
    if (blobUrl && audioRef.current && !playbackError) {
      void startElementPlayback(false);
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      playbackTokenRef.current = claimActiveAudioPlayback(() => stopImmediately(true));
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPausedMidway(false);
      notifyPlaybackState('playing');
    } else {
      togglePlayback();
    }
  }, [
    blobUrl,
    notifyPlaybackState,
    playbackError,
    startElementPlayback,
    stopImmediately,
    togglePlayback,
  ]);

  // Expose controls cleanly to parent VoiceAssistantPage when this player is active
  useEffect(() => {
    if (!controlsRef) return;
    if (autoPlay || isPlaying || isPausedMidway || autoplayBlocked) {
      controlsRef.current = {
        play: () => {
          unlockAudioPlayback();
          void startElementPlayback(false);
        },
        pause: pausePlayback,
        resume: resumePlayback,
        stop: () => stopImmediately(true),
      };
    }
  }, [
    autoPlay,
    autoplayBlocked,
    controlsRef,
    isPausedMidway,
    isPlaying,
    pausePlayback,
    resumePlayback,
    startElementPlayback,
    stopImmediately,
  ]);

  const cycleSpeed = () => {
    const next = speed === 1.0 ? 1.25 : speed === 1.25 ? 0.85 : 1.0;
    setSpeed(next);
  };

  const handleDownloadAudio = () => {
    if (activeUrl) {
      void fetch(activeUrl)
        .then((response) => {
          if (!response.ok) throw new Error('Audio download failed.');
          return response.blob();
        })
        .then((blob) => {
          triggerBlobDownload(blob, downloadFilename || `gnanikisan-${language}-audio`);
          setDownloaded(true);
          window.setTimeout(() => setDownloaded(false), 2000);
        })
        .catch(() => setRetryError(t.audioUnavailable));
      return;
    }
    if (!activeBase64) return;
    const decoded = decodeAudioBase64(activeBase64, resolvedMime);
    if (!decoded) return;
    const ext =
      decoded.mime.includes('mpeg') || decoded.mime.includes('mp3')
        ? 'mp3'
        : decoded.mime.includes('ogg')
          ? 'ogg'
          : 'wav';
    const base = (downloadFilename || `gnanikisan-${language}-audio`).replace(
      /\.(mp3|wav|ogg)$/i,
      ''
    );
    triggerBlobDownload(decoded.blob, `${base}.${ext}`);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2000);
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const showRetryButton = !blobUrl || Boolean(playbackError || retryError || activeTtsError);
  const showStopButton = isPlaying || isPausedMidway || currentTime > 0.05;
  const statusAlert = retryError || playbackError || (!blobUrl ? activeTtsError : null);

  return (
    <div className="mt-2.5 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-xs dark:border-emerald-800/60 dark:bg-[#0D2216]">
      <div className="flex flex-wrap items-center gap-2">
        {blobUrl && (
          <audio
            ref={audioRef}
            src={blobUrl}
            preload="auto"
            onLoadedMetadata={(e) => syncDurationFromElement(e.currentTarget)}
            onDurationChange={(e) => syncDurationFromElement(e.currentTarget)}
            onCanPlay={(e) => syncDurationFromElement(e.currentTarget)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onPlay={() => {
              setAutoplayBlocked(false);
              setIsPausedMidway(false);
              setIsPlaying(true);
              notifyPlaybackState('playing');
            }}
            onPause={(e) => {
              const el = e.currentTarget;
              setIsPlaying(false);
              if (!manualStopRef.current && !el.ended && el.currentTime > 0) {
                setIsPausedMidway(true);
                notifyPlaybackState('paused');
              } else {
                notifyPlaybackState('idle');
              }
            }}
            onEnded={() => {
              releaseActiveAudioPlayback(playbackTokenRef.current);
              playbackTokenRef.current = null;
              setIsPlaying(false);
              setIsPausedMidway(false);
              setCurrentTime(0);
              notifyPlaybackState('idle');
              if (!manualStopRef.current) {
                onPlaybackCompleteRef.current?.();
              }
            }}
            onError={() => {
              releaseActiveAudioPlayback(playbackTokenRef.current);
              playbackTokenRef.current = null;
              setIsPlaying(false);
              setIsPausedMidway(false);
              setPlaybackError(t.audioLoadError);
              notifyPlaybackState('idle');
            }}
          />
        )}

        <button
          type="button"
          onClick={togglePlayback}
          disabled={retrying}
          aria-label={isPlaying ? t.pauseAria : isPausedMidway ? t.resumeAria : t.playAria}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white transition hover:bg-[#166534] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] disabled:opacity-60"
        >
          {retrying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" />
          )}
        </button>

        {showStopButton && (
          <button
            type="button"
            onClick={() => stopImmediately(true)}
            aria-label={t.stopAria}
            title={t.stopAria}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800/70 dark:bg-red-950/50 dark:text-red-300"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>{t.stopSpeaking}</span>
          </button>
        )}

        <div className="flex min-w-[76px] flex-1 items-center gap-[3px]" aria-hidden="true">
          {bars.map((height, idx) => {
            const active = idx / bars.length <= progress || (isPlaying && idx % 3 === 0);
            return (
              <span
                key={idx}
                style={{ height: `${Math.max(20, height)}%` }}
                className={`inline-block h-5 w-1 rounded-full transition-colors ${
                  active ? 'bg-[#16A34A]' : 'bg-emerald-900/15 dark:bg-emerald-200/20'
                }`}
              />
            );
          })}
        </div>

        <span className="font-mono text-[11px] text-slate-600 tabular-nums dark:text-emerald-200/80">
          {duration > 0
            ? isPlaying || currentTime > 0
              ? `${formatSeconds(currentTime)} / ${formatSeconds(duration)}`
              : formatSeconds(duration)
            : blobUrl
              ? t.loadingDuration
              : activeProvider === 'browser-fallback'
                ? t.speechBadge
                : '--:--'}
        </span>

        <button
          type="button"
          onClick={cycleSpeed}
          className="rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-1 font-mono text-[11px] font-medium text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          {speed.toFixed(speed === 1.25 || speed === 0.85 ? 2 : 1)}x
        </button>

        {showRetryButton && (
          <button
            type="button"
            onClick={handleRetryAudio}
            disabled={retrying}
            className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
          >
            <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? t.retryingAudio : t.retryAudio}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownloadAudio}
          disabled={!blobUrl}
          title={
            !blobUrl
              ? t.downloadAudioUnavailable
              : downloaded
                ? t.downloadAudioSuccess
                : t.downloadAudio
          }
          aria-label={!blobUrl ? t.downloadAudioUnavailable : t.downloadAudio}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-1 text-[11px] font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          {downloaded ? (
            <Check className="h-3.5 w-3.5 text-[#16A34A]" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{t.downloadAudio}</span>
        </button>

        <Volume2 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
        {activeProvider && activeProvider !== 'none' && (
          <span className="text-[10px] text-slate-500 dark:text-emerald-300/70">
            {activeProvider === 'gnani-timbre'
              ? t.gnaniTimbre
              : activeProvider === 'gemini-fallback'
                ? t.geminiTts
                : t.deviceSpeech}
          </span>
        )}
      </div>

      {autoplayBlocked && blobUrl && !isPlaying && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-100">
          <span>{t.autoplayBlockedHint}</span>
          <button
            type="button"
            onClick={() => {
              unlockAudioPlayback();
              void startElementPlayback(false);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] px-2.5 py-1 font-semibold text-white transition hover:bg-[#15803D]"
          >
            <Volume2 className="h-3 w-3" />
            <span>{t.startAudioBtn}</span>
          </button>
        </div>
      )}

      {(statusAlert || (!blobUrl && activeProvider === 'none')) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{statusAlert || t.audioUnavailable}</span>
        </div>
      )}
    </div>
  );
}
