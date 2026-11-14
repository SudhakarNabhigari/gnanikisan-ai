import {
  AlertCircle,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioPlayer,
  type AudioPlaybackState,
  type AudioPlayerControls,
} from '../components/AudioPlayer';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch, uploadSignedMedia } from '../lib/api';
import { stopAllActiveAudio, unlockAudioPlayback } from '../lib/audioUnlock';
import type {
  AppLanguage,
  IntegrationsStatus,
  UserSettings,
  VoiceConversation,
  VoiceLanguageMode,
} from '../types';

type VoiceState = 'ready' | 'listening' | 'paused' | 'processing' | 'speaking' | 'error';

interface VoiceAssistantPageProps {
  language: AppLanguage;
  settings: UserSettings;
  integrations: IntegrationsStatus;
  initialConversationId?: string | null;
  initialQuestion?: string | null;
  onClearInitial: () => void;
  onChangeLanguage: (lang: AppLanguage) => void;
}

const SUGGESTED_QUESTIONS: Record<AppLanguage, string[]> = {
  te: [
    'ఈ వారం నా పొలంలో ఏ పనులు చేయాలి?',
    'వరి పంటలో నీటి నిర్వహణ ఎలా ఉండాలి?',
    'రైతుల కోసం ప్రభుత్వ పథకాలు ఏవి ఉన్నాయి?',
  ],
  en: [
    'What farm tasks should I prioritize this week?',
    'How should I manage irrigation for paddy?',
    'Which government schemes fit my farm details?',
  ],
  hi: [
    'इस सप्ताह मुझे अपने खेत में कौन से काम करने चाहिए?',
    'धान की फसल में सिंचाई प्रबंधन कैसे करें?',
    'मेरे खेत के लिए कौन सी सरकारी योजनाएं उपयुक्त हैं?',
  ],
};

function encodeAudioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
}

/**
 * Decodes browser-recorded audio (e.g., audio/webm) and resamples to 16 kHz mono 16-bit PCM WAV
 * so Gnani Prisma STT (/stt/v3) receives its preferred audio/wav container cleanly.
 */
async function encodeBlobToWav16kMono(blob: Blob): Promise<{ blob: Blob; mimeType: string }> {
  if (blob.type === 'audio/wav' || blob.type === 'audio/wave') {
    return { blob, mimeType: 'audio/wav' };
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx || typeof OfflineAudioContext === 'undefined') {
    return { blob, mimeType: blob.type || 'audio/webm' };
  }

  let ctx: AudioContext | null = null;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const targetRate = 16000;
    const frameCount = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const offline = new OfflineAudioContext(1, frameCount, targetRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const wavBuffer = encodeAudioBufferToWav(rendered);
    return {
      blob: new Blob([wavBuffer], { type: 'audio/wav' }),
      mimeType: 'audio/wav',
    };
  } catch {
    return { blob, mimeType: blob.type || 'audio/webm' };
  } finally {
    if (ctx) {
      ctx.close().catch(() => {});
    }
  }
}

export function VoiceAssistantPage({
  language,
  settings,
  integrations,
  initialConversationId,
  initialQuestion,
  onClearInitial,
}: VoiceAssistantPageProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [voiceMode, setVoiceMode] = useState<VoiceLanguageMode>('auto');
  const [detectedLanguage, setDetectedLanguage] = useState<AppLanguage | null>(null);
  const [processingStage, setProcessingStage] = useState<'understanding' | 'preparing' | null>(null);
  const [playingLanguage, setPlayingLanguage] = useState<AppLanguage | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [conversation, setConversation] = useState<VoiceConversation | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [waveLevels, setWaveLevels] = useState<number[]>(Array(24).fill(18));
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsPlaybackStatus, setTtsPlaybackStatus] = useState<AudioPlaybackState>('idle');
  const [activeAutoPlayTurnId, setActiveAutoPlayTurnId] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gk_voice_continuous') === 'true';
    } catch {
      return false;
    }
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const sentInitialQuestionRef = useRef<string | null>(null);
  const requestSeqRef = useRef(0);
  const activeAudioControlsRef = useRef<AudioPlayerControls | null>(null);
  const continuousTimerRef = useRef<number | null>(null);
  const continuousModeRef = useRef(continuousMode);
  continuousModeRef.current = continuousMode;
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;
  const startRecordingRef = useRef<() => Promise<void>>(async () => {});

  const t = TRANSLATIONS[language].voice;
  const c = TRANSLATIONS[language].common;

  const gnaniReady =
    integrations.gnaniStt === 'connected' && integrations.gnaniTts === 'connected';

  const getLanguageDisplayName = useCallback(
    (lang: AppLanguage) => {
      if (lang === 'te') return t.langNameTe;
      if (lang === 'hi') return t.langNameHi;
      return t.langNameEn;
    },
    [t.langNameEn, t.langNameHi, t.langNameTe]
  );

  // Load initial conversation when continued from History / Dashboard
  useEffect(() => {
    if (!initialConversationId) return;
    apiFetch<{ voiceHistory: VoiceConversation[] }>('/api/history')
      .then((res) => {
        const found = res.voiceHistory.find((v) => v.id === initialConversationId);
        if (found) {
          setConversation(found);
          setDetectedLanguage(found.language);
        }
      })
      .finally(() => onClearInitial());
  }, [initialConversationId, onClearInitial]);

  useEffect(() => {
    try {
      localStorage.setItem('gk_voice_continuous', String(continuousMode));
    } catch {
      // ignore storage errors
    }
  }, [continuousMode]);

  const sendQuestion = useCallback(
    async (
      questionText: string,
      sttProvider: 'gnani-prisma' | 'gemini-fallback' | 'typed',
      durationSec = 0,
      languageOverride?: VoiceLanguageMode
    ) => {
      const clean = String(questionText ?? '').trim();
      if (!clean) return;
      unlockAudioPlayback();
      stopAllActiveAudio();
      if (continuousTimerRef.current) {
        window.clearTimeout(continuousTimerRef.current);
        continuousTimerRef.current = null;
      }

      const seq = ++requestSeqRef.current;
      setActiveAutoPlayTurnId(null);
      setTtsPlaybackStatus('idle');
      setIsTtsPlaying(false);
      setVoiceState('processing');
      setProcessingStage('preparing');
      setStatusError(null);
      setTtsNotice(null);

      const requestedLang = languageOverride ?? voiceMode;

      try {
        const res = await apiFetch<{
          status: 'ok' | 'unclear';
          message?: string;
          detectedLanguage?: AppLanguage;
          ttsError?: string;
          conversation?: VoiceConversation;
        }>('/api/voice/ask', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: conversation?.id,
            question: clean,
            language: requestedLang,
            uiLanguage: language,
            sttProvider,
            durationSec,
          }),
        });

        if (seq !== requestSeqRef.current) {
          return;
        }

        if (res.status === 'unclear') {
          setStatusError(res.message || t.errUnclearSpeech);
          setProcessingStage(null);
          setVoiceState('ready');
          return;
        }

        if (res.detectedLanguage) {
          setDetectedLanguage(res.detectedLanguage);
        }
        if (res.ttsError) {
          setTtsNotice(`${t.ttsWarningPrefix} (${res.ttsError})`);
        }
        if (res.conversation) {
          setConversation(res.conversation);
          const turns = res.conversation.turns;
          const newestTurn = turns[turns.length - 1];
          if (newestTurn?.role === 'assistant') {
            setPlayingLanguage(newestTurn.language);
            setActiveAutoPlayTurnId(newestTurn.id);
          }
        }
        setProcessingStage(null);
        setVoiceState('ready');
      } catch (err) {
        if (seq !== requestSeqRef.current) {
          return;
        }
        setProcessingStage(null);
        setStatusError(err instanceof Error && err.message ? err.message : t.errAskFailed);
        setVoiceState('error');
      }
    },
    [conversation?.id, language, t.errAskFailed, t.errUnclearSpeech, t.ttsWarningPrefix, voiceMode]
  );

  useEffect(() => {
    if (initialQuestion && sentInitialQuestionRef.current !== initialQuestion) {
      sentInitialQuestionRef.current = initialQuestion;
      sendQuestion(initialQuestion, 'typed', 0);
      onClearInitial();
    }
  }, [initialQuestion, onClearInitial, sendQuestion]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.turns.length]);

  const stopMediaResources = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setWaveLevels(Array(24).fill(18));
  }, []);

  useEffect(() => {
    return () => {
      if (continuousTimerRef.current) {
        window.clearTimeout(continuousTimerRef.current);
        continuousTimerRef.current = null;
      }
      stopMediaResources();
      stopAllActiveAudio();
    };
  }, [stopMediaResources]);

  const startRecording = async () => {
    unlockAudioPlayback();
    if (continuousTimerRef.current) {
      window.clearTimeout(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }
    // Self-echo protection: never open microphone while TTS audio is actively playing
    if (isTtsPlaying || ttsPlaybackStatus === 'playing') {
      setStatusError(t.errEchoLock);
      return;
    }
    stopAllActiveAudio();
    setActiveAutoPlayTurnId(null);
    setTtsPlaybackStatus('idle');
    setStatusError(null);
    setTtsNotice(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatusError(t.errUnsupportedBrowser);
      setVoiceState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      // Live audio waveform via Web Audio AnalyserNode
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        const ctx = new AudioContextCtor();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        const freqData = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(freqData);
          const next = Array.from({ length: 24 }, (_, idx) => {
            const val = freqData[idx % freqData.length] ?? 0;
            return Math.max(14, Math.min(96, Math.round((val / 255) * 95)));
          });
          setWaveLevels(next);
          animFrameRef.current = window.requestAnimationFrame(tick);
        };
        tick();
      }

      recorder.start(250);
      setElapsedSec(0);
      setVoiceState('listening');
      timerRef.current = window.setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    } catch (err) {
      stopMediaResources();
      setVoiceState('error');
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setStatusError(t.errMicDenied);
      } else {
        setStatusError(err instanceof Error && err.message ? err.message : t.errMicStart);
      }
    }
  };

  const pauseRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.pause();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setVoiceState('paused');
    }
  };

  const resumeRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'paused') {
      rec.resume();
      timerRef.current = window.setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
      setVoiceState('listening');
    }
  };

  startRecordingRef.current = startRecording;

  const stopAndTranscribe = async () => {
    unlockAudioPlayback();
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    const seq = ++requestSeqRef.current;
    const durationCaptured = elapsedSec;
    setVoiceState('processing');
    setProcessingStage('understanding');

    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });

    const rawBlob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
    stopMediaResources();

    if (rawBlob.size < 400) {
      setProcessingStage(null);
      setStatusError(t.errRecordingShort);
      setVoiceState('ready');
      return;
    }

    try {
      const prepared = await encodeBlobToWav16kMono(rawBlob);
      const audioPath = await uploadSignedMedia(prepared.blob, 'audio');
      const stt = await apiFetch<{
        status?: 'ok' | 'unclear';
        message?: string;
        transcript?: string;
        detectedLanguage?: AppLanguage;
        confidence?: 'high' | 'medium' | 'low';
        sttProvider?: 'gnani-prisma' | 'gemini-fallback';
      }>('/api/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({
          audioPath,
          mimeType: prepared.mimeType,
          language: voiceMode,
          uiLanguage: language,
        }),
      });

      if (seq !== requestSeqRef.current) {
        return;
      }

      if (stt?.status === 'unclear') {
        setProcessingStage(null);
        setStatusError(stt.message || t.errUnclearSpeech);
        setVoiceState('ready');
        return;
      }

      const transcriptText = String(stt?.transcript ?? '').trim();
      if (!transcriptText) {
        setProcessingStage(null);
        setStatusError(t.errNoSpeech);
        setVoiceState('ready');
        return;
      }

      if (stt?.detectedLanguage) {
        setDetectedLanguage(stt.detectedLanguage);
      }

      const resolvedLangMode: VoiceLanguageMode =
        voiceMode === 'auto' ? (stt?.detectedLanguage ?? 'auto') : voiceMode;

      await sendQuestion(
        transcriptText,
        stt?.sttProvider || 'gnani-prisma',
        durationCaptured,
        resolvedLangMode
      );
    } catch (err) {
      setProcessingStage(null);
      setStatusError(err instanceof Error && err.message ? err.message : t.errSttFailed);
      setVoiceState('error');
    }
  };

  const resetSession = () => {
    requestSeqRef.current += 1;
    if (continuousTimerRef.current) {
      window.clearTimeout(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }
    stopMediaResources();
    stopAllActiveAudio();
    setIsTtsPlaying(false);
    setTtsPlaybackStatus('idle');
    setActiveAutoPlayTurnId(null);
    setPlayingLanguage(null);
    setProcessingStage(null);
    setDetectedLanguage(null);
    setConversation(null);
    setElapsedSec(0);
    setStatusError(null);
    setTtsNotice(null);
    setVoiceState('ready');
  };

  const handleStopSpeaking = useCallback(() => {
    if (continuousTimerRef.current) {
      window.clearTimeout(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }
    activeAudioControlsRef.current?.stop();
    stopAllActiveAudio();
    setIsTtsPlaying(false);
    setTtsPlaybackStatus('idle');
    setActiveAutoPlayTurnId(null);
  }, []);

  const handlePlaybackStateChange = useCallback((state: AudioPlaybackState) => {
    setTtsPlaybackStatus(state);
    setIsTtsPlaying(state === 'playing');
  }, []);

  const handlePlaybackComplete = useCallback(() => {
    setIsTtsPlaying(false);
    setTtsPlaybackStatus('idle');
    setActiveAutoPlayTurnId(null);
    if (continuousModeRef.current && voiceStateRef.current === 'ready') {
      if (continuousTimerRef.current) {
        window.clearTimeout(continuousTimerRef.current);
      }
      continuousTimerRef.current = window.setTimeout(() => {
        continuousTimerRef.current = null;
        if (continuousModeRef.current && voiceStateRef.current === 'ready') {
          void startRecordingRef.current();
        }
      }, 420);
    }
  }, []);

  const handleAudioRecoveredForTurn = useCallback(
    (
      turnId: string,
      payload: { audioBase64?: string; audioUrl?: string; audioMime: string; ttsProvider: 'gnani-timbre' | 'gemini-fallback' | 'browser-fallback' | 'none' }
    ) => {
      setTtsNotice(null);
      setActiveAutoPlayTurnId(turnId);
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              turns: prev.turns.map((item) =>
                item.id === turnId
                  ? {
                      ...item,
                      audioBase64: payload.audioBase64,
                      audioUrl: payload.audioUrl,
                      audioMime: payload.audioMime,
                      ttsProvider: payload.ttsProvider,
                      ttsError: undefined,
                    }
                  : item
              ),
            }
          : prev
      );
    },
    []
  );

  const handleLanguageButtonClick = (targetLang: AppLanguage) => {
    setVoiceMode((prev) => (prev === targetLang ? 'auto' : targetLang));
    if (voiceMode !== targetLang) {
      setDetectedLanguage(targetLang);
    }
  };

  const formattedTimer = useMemo(() => {
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsedSec]);

  const displayState = isTtsPlaying ? 'speaking' : voiceState;
  const cleanTyped = String(typedInput ?? '').trim();
  const activePromptLang: AppLanguage =
    voiceMode !== 'auto' ? voiceMode : (detectedLanguage ?? language);
  const activeSpeakingLang: AppLanguage =
    playingLanguage ?? detectedLanguage ?? (voiceMode !== 'auto' ? voiceMode : language);

  return (
    <div className="space-y-4">
      {/* Top Integration Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 bg-white px-4 py-2.5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {gnaniReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E4424] px-3 py-1 font-semibold text-white">
              <Zap className="h-3.5 w-3.5 text-[#4ADE80]" /> {t.poweredByGnani}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1 font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              {t.gnaniNotConfiguredFallback}
            </span>
          )}
          <span className="text-slate-600 dark:text-emerald-200/80">
            {t.prismaSttLabel}:{' '}
            <strong className={integrations.gnaniStt === 'connected' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
              {integrations.gnaniStt === 'connected' ? c.connected : c.notConfigured}
            </strong>
          </span>
          <span className="text-slate-300 dark:text-emerald-800">|</span>
          <span className="text-slate-600 dark:text-emerald-200/80">
            {t.timbreTtsLabel}:{' '}
            <strong className={integrations.gnaniTts === 'connected' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
              {integrations.gnaniTts === 'connected' ? c.connected : c.notConfigured}
            </strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              unlockAudioPlayback();
              setContinuousMode((v) => !v);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              continuousMode
                ? 'border-[#16A34A] bg-[#16A34A] text-white shadow-xs'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-200'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>
              {t.continuousModeLabel}: {continuousMode ? t.continuousModeOn : t.continuousModeOff}
            </span>
          </button>
          <span className="text-[11px] text-slate-500 dark:text-emerald-200/70">
            {t.echoProtectionNote}
          </span>
        </div>
      </div>

      {/* Main Split Stage (Reference Image 2) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left/Center Microphone Stage */}
        <section className="relative flex min-h-[580px] flex-col justify-between overflow-hidden rounded-2xl border border-emerald-900/15 bg-[#0D381E] p-6 text-white shadow-sm lg:col-span-7">
          <img
            src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
            alt="Agricultural fields background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#E8F6EC]/90 via-[#104927]/45 to-[#082414]/90 dark:from-[#091E12]/90 dark:via-[#0B2D19]/75 dark:to-[#06180E]/95" />

          {/* Header & Language Selector */}
          <div className="relative z-10 text-center">
            <h2 className="font-display text-2xl font-bold text-[#0D2315] sm:text-3xl dark:text-white">
              {t.talkToPrefix} <span className="text-[#15803D] dark:text-[#4ADE80]">GnaniKisan AI</span>
            </h2>
            <p className="mt-1.5 text-xs font-medium text-slate-700 sm:text-sm dark:text-emerald-100/85">
              {t.subtitle}
            </p>

            {/* Visible Auto-Detect + 3 Required Language Buttons (తెలుగు, English, हिन्दी) */}
            <div className="mt-4 inline-flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceMode('auto')}
                disabled={voiceState === 'listening' || voiceState === 'processing'}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition ${
                  voiceMode === 'auto'
                    ? 'bg-[#0E4424] text-white ring-2 ring-[#4ADE80]'
                    : 'bg-white/90 text-slate-800 hover:bg-emerald-50 dark:bg-[#0D2115] dark:text-emerald-100'
                }`}
              >
                <Sparkles className={`h-3.5 w-3.5 ${voiceMode === 'auto' ? 'text-[#4ADE80]' : 'text-[#16A34A]'}`} />
                {t.autoDetectBtn}
              </button>

              {(
                [
                  { id: 'te', label: 'తెలుగు (Telugu)' },
                  { id: 'en', label: 'English' },
                  { id: 'hi', label: 'हिन्दी (Hindi)' },
                ] as const
              ).map((langOption) => {
                const isManualLocked = voiceMode === langOption.id;
                const isAutoDetectedHighlight =
                  voiceMode === 'auto' && detectedLanguage === langOption.id;
                return (
                  <button
                    key={langOption.id}
                    type="button"
                    onClick={() => handleLanguageButtonClick(langOption.id)}
                    disabled={voiceState === 'listening' || voiceState === 'processing'}
                    className={`rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition ${
                      isManualLocked
                        ? 'bg-[#15803D] text-white ring-2 ring-[#86EFAC]'
                        : isAutoDetectedHighlight
                          ? 'bg-emerald-100 text-[#0D2315] ring-2 ring-[#22C55E] dark:bg-emerald-900/80 dark:text-white'
                          : 'bg-white/95 text-slate-800 hover:bg-emerald-50 dark:bg-[#0D2115] dark:text-emerald-100'
                    }`}
                  >
                    {langOption.label}
                  </button>
                );
              })}
            </div>

            {/* Active Detection Status Indicator */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
              <span className="rounded-lg bg-black/35 px-2.5 py-1 text-emerald-100 backdrop-blur-xs">
                {voiceMode === 'auto' ? t.autoDetectActiveBadge : t.manualOverrideBadge}
              </span>
              {detectedLanguage && (
                <span className="rounded-lg bg-[#15803D]/90 px-2.5 py-1 text-white shadow-xs">
                  {t.detectedLabel}: {getLanguageDisplayName(detectedLanguage)}
                </span>
              )}
            </div>
          </div>

          {/* Central Glowing Microphone + Live Waveforms */}
          <div className="relative z-10 my-5 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {(displayState === 'listening' || displayState === 'speaking') && (
                <>
                  <span className="animate-pulse-ring absolute h-44 w-44 rounded-full border-2 border-[#4ADE80]/60" />
                  <span className="animate-pulse-ring absolute h-36 w-36 rounded-full bg-[#22C55E]/25" />
                </>
              )}

              {/* Left Waveform Bars */}
              <div className="mr-4 hidden items-center gap-1 sm:flex" aria-hidden="true">
                {waveLevels.slice(0, 10).map((lvl, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: `${
                        displayState === 'listening'
                          ? lvl * 0.65
                          : displayState === 'speaking'
                            ? 18 + ((idx * 17) % 34)
                            : 14
                      }px`,
                    }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      displayState === 'speaking'
                        ? 'animate-pulse bg-[#86EFAC]'
                        : 'bg-white/85'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={
                  voiceState === 'listening'
                    ? stopAndTranscribe
                    : voiceState === 'paused'
                      ? resumeRecording
                      : startRecording
                }
                disabled={voiceState === 'processing' || isTtsPlaying}
                aria-label={voiceState === 'listening' ? t.stopAria : t.startAria}
                className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/80 shadow-2xl transition hover:scale-[1.03] disabled:opacity-60 sm:h-32 sm:w-32 ${
                  voiceState === 'listening'
                    ? 'bg-gradient-to-br from-[#22C55E] to-[#15803D] ring-4 ring-[#86EFAC]/50'
                    : voiceState === 'processing'
                      ? 'bg-emerald-800'
                      : 'bg-gradient-to-br from-[#16A34A] to-[#0F6930]'
                }`}
              >
                {voiceState === 'processing' ? (
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                ) : (
                  <Mic className="h-12 w-12 text-white" />
                )}
              </button>

              {/* Right Waveform Bars */}
              <div className="ml-4 hidden items-center gap-1 sm:flex" aria-hidden="true">
                {waveLevels.slice(10, 20).map((lvl, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: `${
                        displayState === 'listening'
                          ? lvl * 0.65
                          : displayState === 'speaking'
                            ? 18 + (((idx + 3) * 19) % 34)
                            : 14
                      }px`,
                    }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      displayState === 'speaking'
                        ? 'animate-pulse bg-[#86EFAC]'
                        : 'bg-white/85'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* State & Timer */}
            <div className="mt-5 text-center">
              <div className="text-base font-bold text-white drop-shadow-xs">
                {ttsPlaybackStatus === 'playing' &&
                  t.stateSpeakingLang.replace('{lang}', getLanguageDisplayName(activeSpeakingLang))}
                {ttsPlaybackStatus === 'paused' && t.stateSpeakingPaused}
                {ttsPlaybackStatus === 'blocked' && t.autoplayBlockedHint}
                {ttsPlaybackStatus === 'idle' && displayState === 'ready' && t.stateReady}
                {ttsPlaybackStatus === 'idle' &&
                  displayState === 'listening' &&
                  (voiceMode === 'auto' ? t.stateAutoListening : t.stateListening)}
                {ttsPlaybackStatus === 'idle' && displayState === 'paused' && t.statePaused}
                {ttsPlaybackStatus === 'idle' &&
                  displayState === 'processing' &&
                  (processingStage === 'understanding'
                    ? t.stateUnderstanding
                    : processingStage === 'preparing'
                      ? t.statePreparing
                      : t.stateProcessing)}
                {ttsPlaybackStatus === 'idle' && displayState === 'error' && t.stateError}
              </div>

              {(voiceState === 'listening' || voiceState === 'paused') && (
                <div className="mt-1.5 inline-flex items-center gap-2 rounded-lg bg-black/55 px-3 py-1 font-mono text-xs font-semibold text-white tabular-nums">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {formattedTimer}
                </div>
              )}
            </div>

            {/* Recording & Speaking Control Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {ttsPlaybackStatus === 'blocked' && (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudioPlayback();
                    activeAudioControlsRef.current?.play();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#22C55E] px-4 py-2 text-xs font-bold text-[#052E16] shadow-lg ring-2 ring-white/70 transition hover:bg-[#4ADE80]"
                >
                  <Volume2 className="h-3.5 w-3.5" /> {t.startAudioBtn}
                </button>
              )}

              {ttsPlaybackStatus === 'playing' && (
                <button
                  type="button"
                  onClick={() => activeAudioControlsRef.current?.pause()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-black/50 px-4 py-2 text-xs font-semibold text-white hover:bg-black/70"
                >
                  <Pause className="h-3.5 w-3.5" /> {t.pauseSpeakingBtn}
                </button>
              )}

              {ttsPlaybackStatus === 'paused' && (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudioPlayback();
                    activeAudioControlsRef.current?.resume();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#15803D]"
                >
                  <Play className="h-3.5 w-3.5" /> {t.resumeSpeakingBtn}
                </button>
              )}

              {(ttsPlaybackStatus === 'playing' ||
                ttsPlaybackStatus === 'paused' ||
                ttsPlaybackStatus === 'blocked') && (
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700"
                >
                  <Square className="h-3.5 w-3.5 fill-current" /> {t.stopSpeakingBtn}
                </button>
              )}

              {(voiceState === 'ready' || voiceState === 'error') &&
                ttsPlaybackStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isTtsPlaying}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#15803D] disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5" /> {t.startBtn}
                  </button>
                )}
              {voiceState === 'listening' && (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-black/45 px-4 py-2 text-xs font-semibold text-white hover:bg-black/60"
                >
                  <Pause className="h-3.5 w-3.5" /> {t.pauseBtn}
                </button>
              )}
              {voiceState === 'paused' && (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
                >
                  <Play className="h-3.5 w-3.5" /> {t.resumeBtn}
                </button>
              )}
              {(voiceState === 'listening' || voiceState === 'paused') && (
                <button
                  type="button"
                  onClick={stopAndTranscribe}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700"
                >
                  <Square className="h-3.5 w-3.5" /> {t.stopSendBtn}
                </button>
              )}
              <button
                type="button"
                onClick={resetSession}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-black/45 px-4 py-2 text-xs font-semibold text-white hover:bg-black/60"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t.resetBtn}
              </button>
            </div>

            {statusError && (
              <div
                role="alert"
                className="mt-3 flex max-w-md items-start gap-2 rounded-xl border border-red-300/60 bg-red-950/85 px-3.5 py-2 text-xs text-red-100"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <span>{statusError}</span>
              </div>
            )}

            {ttsNotice && !statusError && (
              <div className="mt-3 flex max-w-md items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-950/85 px-3.5 py-2 text-xs text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{ttsNotice}</span>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          <div className="relative z-10 rounded-xl border border-white/25 bg-white/90 p-3 text-[#0D2315] backdrop-blur-sm dark:border-emerald-800 dark:bg-[#0B1E13]/90 dark:text-emerald-100">
            <div className="mb-2 text-[11px] font-bold">{t.tryAsking}</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS[activePromptLang].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={voiceState === 'processing'}
                  onClick={() => sendQuestion(q, 'typed')}
                  className="rounded-lg border border-emerald-200 bg-[#F2FBF4] px-3 py-1.5 text-left text-xs font-medium text-emerald-950 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Voice Conversation Panel */}
        <section className="flex h-[580px] flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-xs lg:col-span-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-emerald-900">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4.5 w-4.5 text-[#16A34A]" />
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.voiceConversation}
              </h3>
            </div>
            {conversation && (
              <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                {conversation.turns.length} {t.messagesUnit}
              </span>
            )}
          </div>

          <div className="my-3 flex-1 space-y-3 overflow-y-auto pr-1">
            {!conversation || conversation.turns.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-xs text-slate-500 dark:text-emerald-200/70">
                <Mic className="mb-2 h-8 w-8 text-emerald-600/50" />
                <p className="font-semibold text-slate-700 dark:text-emerald-100">
                  {t.noTurnsTitle}
                </p>
                <p className="mt-1">
                  {t.noTurnsSubtitle}
                </p>
              </div>
            ) : (
              conversation.turns.map((turn, idx) => {
                const isLastAssistant =
                  turn.role === 'assistant' && idx === conversation.turns.length - 1;
                return (
                  <div
                    key={turn.id}
                    className={`rounded-2xl border p-3.5 text-sm ${
                      turn.role === 'user'
                        ? 'border-emerald-200 bg-[#ECFAEE] text-[#0D2315] dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50'
                        : 'border-slate-200 bg-[#F7F8FC] text-slate-900 dark:border-emerald-900 dark:bg-[#08150D] dark:text-emerald-50'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {turn.role === 'user'
                          ? `${t.sttBadge} (${turn.language.toUpperCase()}) · ${
                              turn.sttProvider === 'gnani-prisma'
                                ? 'Gnani Prisma'
                                : turn.sttProvider === 'gemini-fallback'
                                  ? 'Gemini STT'
                                  : t.typedLabel
                            }`
                          : `${t.ttsBadge} (${turn.language.toUpperCase()})`}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums dark:text-emerald-300/70">
                        {new Date(turn.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-xs leading-relaxed sm:text-sm">
                      {turn.text}
                    </p>

                    {turn.role === 'assistant' && (
                      <AudioPlayer
                        text={turn.text}
                        language={turn.language}
                        uiLanguage={language}
                        downloadFilename={`gnanikisan-${turn.language}-turn-${idx + 1}`}
                        audioBase64={turn.audioBase64}
                          audioUrl={turn.audioUrl}
                        audioMime={turn.audioMime}
                        ttsProvider={turn.ttsProvider}
                        ttsError={turn.ttsError}
                        conversationId={conversation.id}
                        turnId={turn.id}
                        initialSpeed={settings.voiceSpeed}
                        autoPlay={
                          turn.id === activeAutoPlayTurnId &&
                          (Boolean(turn.audioBase64) ||
                            (turn.ttsProvider === 'browser-fallback' && !turn.ttsError))
                        }
                        controlsRef={
                          turn.id === activeAutoPlayTurnId || isLastAssistant
                            ? activeAudioControlsRef
                            : undefined
                        }
                        onPlaybackStateChange={handlePlaybackStateChange}
                        onPlaybackComplete={handlePlaybackComplete}
                        onAudioRecovered={(payload) => handleAudioRecoveredForTurn(turn.id, payload)}
                      />
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Typed Fallback Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!cleanTyped || voiceState === 'processing') return;
              setTypedInput('');
              sendQuestion(cleanTyped, 'typed');
            }}
            className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-emerald-900"
          >
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#16A34A] focus:bg-white focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
            />
            <button
              type="submit"
              disabled={!cleanTyped || voiceState === 'processing'}
              aria-label={t.sendAria}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white transition hover:bg-[#15803D] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
