import { Check, Download, Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { triggerBlobDownload } from '../lib/api';
import type { AppLanguage } from '../types';

interface AudioPlayerProps {
  text: string;
  language: AppLanguage;
  uiLanguage?: AppLanguage;
  downloadFilename?: string;
  audioBase64?: string;
  audioMime?: string;
  ttsProvider?: string;
  initialSpeed?: number;
  autoPlay?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioPlayer({
  text,
  language,
  uiLanguage,
  downloadFilename,
  audioBase64,
  audioMime,
  ttsProvider,
  initialSpeed = 1.0,
  autoPlay = false,
  onPlayingChange,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(initialSpeed || 1.0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [downloaded, setDownloaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoPlayedRef = useRef(false);

  const t = TRANSLATIONS[uiLanguage ?? language].audioPlayer;

  const audioSrc = useMemo(() => {
    if (!audioBase64) return null;
    const mime = audioMime || 'audio/wav';
    return `data:${mime};base64,${audioBase64}`;
  }, [audioBase64, audioMime]);

  const bars = useMemo(() => {
    return [24, 48, 36, 72, 92, 60, 84, 52, 78, 65, 42, 68, 88, 56, 44, 70, 50, 32, 46, 30];
  }, []);

  useEffect(() => {
    setSpeed(initialSpeed || 1.0);
  }, [initialSpeed]);

  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      onPlayingChange?.(false);
    };
  }, [onPlayingChange]);

  useEffect(() => {
    if (autoPlay && audioSrc && !hasAutoPlayedRef.current && audioRef.current) {
      hasAutoPlayedRef.current = true;
      audioRef.current.playbackRate = speed;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [autoPlay, audioSrc, speed]);

  const togglePlayback = () => {
    if (audioSrc && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = speed;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    // Browser SpeechSynthesis fallback when no server audio file was generated
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        utter.rate = speed;
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        setIsPlaying(true);
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const cycleSpeed = () => {
    const next = speed === 1.0 ? 1.25 : speed === 1.25 ? 0.85 : 1.0;
    setSpeed(next);
  };

  const handleDownloadAudio = () => {
    if (!audioBase64) return;
    const mime = audioMime || 'audio/wav';
    const ext = mime.includes('mpeg') || mime.includes('mp3') ? 'mp3' : mime.includes('ogg') ? 'ogg' : 'wav';
    try {
      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      const base = (downloadFilename || `gnanikisan-${language}-audio`).replace(/\.(mp3|wav|ogg)$/i, '');
      triggerBlobDownload(blob, `${base}.${ext}`);
      setDownloaded(true);
      window.setTimeout(() => setDownloaded(false), 2000);
    } catch {
      // Ignore malformed base64
    }
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-xs dark:border-emerald-800/60 dark:bg-[#0D2216]">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? t.pauseAria : t.playAria}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white transition hover:bg-[#166534] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
      </button>

      <div className="flex min-w-[100px] flex-1 items-center gap-[3px]" aria-hidden="true">
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
          ? formatSeconds(isPlaying ? currentTime : duration)
          : audioSrc
            ? audioMime?.includes('mp3')
              ? 'MP3'
              : 'WAV'
            : t.speechBadge}
      </span>

      <button
        type="button"
        onClick={cycleSpeed}
        className="rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-1 font-mono text-[11px] font-medium text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
      >
        {speed.toFixed(speed === 1.25 || speed === 0.85 ? 2 : 1)}x
      </button>

      <button
        type="button"
        onClick={handleDownloadAudio}
        disabled={!audioBase64}
        title={
          !audioBase64
            ? t.downloadAudioUnavailable
            : downloaded
              ? t.downloadAudioSuccess
              : t.downloadAudio
        }
        aria-label={!audioBase64 ? t.downloadAudioUnavailable : t.downloadAudio}
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
      {ttsProvider && (
        <span className="text-[10px] text-slate-500 dark:text-emerald-300/70">
          {ttsProvider === 'gnani-timbre'
            ? t.gnaniTimbre
            : ttsProvider === 'gemini-fallback'
              ? t.geminiTts
              : t.deviceSpeech}
        </span>
      )}
    </div>
  );
}
