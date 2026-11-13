import type { AppLanguage } from '../../src/types';
import { isGnaniConfigured } from './integrations';

const DEFAULT_BASE_URL = 'https://api.vachana.ai';

// Gnani enforces a concurrency limit of 1 active request per API key at a time.
// Serialize all Gnani STT & TTS calls in-process with a short cooldown between requests.
let gnaniQueue: Promise<void> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withGnaniLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = gnaniQueue.then(fn, fn);
  gnaniQueue = run.then(
    () => sleep(180),
    () => sleep(180)
  );
  return run;
}

async function fetchGnaniWithRateLimitRetry(
  url: string,
  init: RequestInit,
  maxRateLimitRetries = 2,
  timeoutMs = 15000
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 429 && attempt < maxRateLimitRetries) {
      attempt += 1;
      await res.text().catch(() => '');
      await sleep(1200 * attempt);
      continue;
    }
    return res;
  }
}

export function mapLanguageToGnaniCode(lang: AppLanguage | 'auto'): string {
  switch (lang) {
    case 'auto':
      return 'indic-auto';
    case 'te':
      return 'te-IN';
    case 'hi':
      return 'hi-IN';
    default:
      return 'en-IN';
  }
}

export function mapGnaniCodeToAppLanguage(code?: string): AppLanguage | undefined {
  if (!code || typeof code !== 'string') return undefined;
  const lower = code.toLowerCase();
  if (lower.startsWith('te')) return 'te';
  if (lower.startsWith('hi')) return 'hi';
  if (lower.startsWith('en')) return 'en';
  return undefined;
}

export interface GnaniSttResult {
  transcript: string;
  detectedLanguage?: AppLanguage;
  rawLanguageCode?: string;
}

function extractTranscriptString(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;
  const nestedData =
    obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;
  const nestedResult =
    obj.result && typeof obj.result === 'object' ? (obj.result as Record<string, unknown>) : null;
  const resultsArr = Array.isArray(obj.results) ? obj.results : null;
  const firstResult =
    resultsArr && resultsArr[0] && typeof resultsArr[0] === 'object'
      ? (resultsArr[0] as Record<string, unknown>)
      : null;

  const candidate =
    obj.transcript ??
    obj.text ??
    nestedData?.transcript ??
    nestedData?.text ??
    nestedResult?.transcript ??
    nestedResult?.text ??
    firstResult?.transcript ??
    firstResult?.text ??
    '';

  return typeof candidate === 'string' ? candidate.trim() : String(candidate ?? '').trim();
}

function extractDetectedLanguageCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;
  const nestedData =
    obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;
  const nestedResult =
    obj.result && typeof obj.result === 'object' ? (obj.result as Record<string, unknown>) : null;
  const resultsArr = Array.isArray(obj.results) ? obj.results : null;
  const firstResult =
    resultsArr && resultsArr[0] && typeof resultsArr[0] === 'object'
      ? (resultsArr[0] as Record<string, unknown>)
      : null;

  const candidates = [
    obj.detected_language_code,
    obj.detectedLanguageCode,
    obj.language_code,
    obj.language,
    nestedData?.detected_language_code,
    nestedData?.language_code,
    nestedResult?.detected_language_code,
    nestedResult?.language_code,
    firstResult?.detected_language_code,
    firstResult?.language_code,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && !c.toLowerCase().includes('auto')) {
      return c.trim();
    }
  }
  return undefined;
}

/**
 * Calls Gnani Prisma STT REST endpoint:
 * POST https://api.vachana.ai/stt/v3 (multipart/form-data)
 * Header: X-API-Key-ID
 */
export async function transcribeWithGnaniPrisma(
  audioBuffer: Buffer,
  mimeType: string,
  language: AppLanguage | 'auto'
): Promise<GnaniSttResult> {
  if (!isGnaniConfigured()) {
    throw new Error('GNANI_NOT_CONFIGURED');
  }

  const baseUrl = (process.env.GNANI_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const apiKey = (process.env.GNANI_API_KEY ?? '').trim();
  const safeMime = (mimeType || 'audio/wav').toLowerCase();

  const ext = safeMime.includes('wav')
    ? 'wav'
    : safeMime.includes('mp3') || safeMime.includes('mpeg')
      ? 'mp3'
      : safeMime.includes('ogg')
        ? 'ogg'
        : safeMime.includes('flac')
          ? 'flac'
          : safeMime.includes('aac')
            ? 'aac'
            : safeMime.includes('mp4') || safeMime.includes('m4a')
              ? 'm4a'
              : 'webm';

  return withGnaniLock(async () => {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: safeMime });
    form.append('audio_file', blob, `recording.${ext}`);
    form.append('model', 'prisma-v3.0');
    form.append('language_code', mapLanguageToGnaniCode(language));
    form.append('format', 'transcribe');
    form.append(
      'topic',
      'Indian agriculture, crops, paddy, maize, cotton, chilli, weather, mandi prices'
    );

    const res = await fetchGnaniWithRateLimitRetry(`${baseUrl}/stt/v3`, {
      method: 'POST',
      headers: {
        'X-API-Key-ID': apiKey,
      },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gnani Prisma STT error (${res.status}): ${errText.slice(0, 240)}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    if (data.success === false) {
      const errObj =
        data.error && typeof data.error === 'object' ? (data.error as Record<string, unknown>) : null;
      const msg =
        (typeof errObj?.message === 'string' && errObj.message) ||
        (typeof data.detail === 'string' && data.detail) ||
        'Gnani Prisma STT returned an unsuccessful response.';
      throw new Error(msg);
    }

    const transcript = extractTranscriptString(data);
    const rawLang = extractDetectedLanguageCode(data);

    return {
      transcript,
      detectedLanguage: mapGnaniCodeToAppLanguage(rawLang),
      rawLanguageCode: rawLang,
    };
  });
}

async function callGnaniTtsOnce(params: {
  baseUrl: string;
  apiKey: string;
  text: string;
  voice?: string;
  model: string;
  language: string;
  speed: number;
  container: 'mp3' | 'wav';
}): Promise<{ audioBase64: string; audioMime: string }> {
  const payload: Record<string, unknown> = {
    text: params.text,
    model: params.model,
    language: params.language,
    speed: params.speed,
    audio_config:
      params.container === 'mp3'
        ? {
            container: 'mp3',
            sample_rate: 48000,
            bitrate: '128k',
          }
        : {
            encoding: 'linear_pcm',
            container: 'wav',
            num_channels: 1,
            sample_rate: 24000,
            sample_width: 2,
          },
  };
  if (params.voice) {
    payload.voice = params.voice;
  }

  const res = await fetchGnaniWithRateLimitRetry(
    `${params.baseUrl}/api/v1/tts/inference`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key-ID': params.apiKey,
      },
      body: JSON.stringify(payload),
    },
    1,
    25000
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const err = new Error(`Gnani Timbre TTS error (${res.status}): ${errText.slice(0, 240)}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const json = (await res.json()) as Record<string, unknown>;
    const b64 = json.audio || json.audio_base64 || json.data || json.audio_content;
    if (typeof b64 !== 'string' || !b64.trim()) {
      throw new Error('Gnani Timbre TTS returned JSON without audio data.');
    }
    return {
      audioBase64: b64.trim(),
      audioMime: params.container === 'mp3' ? 'audio/mpeg' : 'audio/wav',
    };
  }

  const arr = await res.arrayBuffer();
  if (arr.byteLength === 0) {
    throw new Error('Gnani Timbre TTS returned empty audio stream.');
  }
  return {
    audioBase64: Buffer.from(arr).toString('base64'),
    audioMime:
      contentType.includes('mpeg') || contentType.includes('mp3') || params.container === 'mp3'
        ? 'audio/mpeg'
        : 'audio/wav',
  };
}

function sanitizeTextForTts(raw: string, maxChars = 900): string {
  const cleaned = String(raw ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('। '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('! ')
  );
  if (lastSentenceEnd > maxChars * 0.5) {
    return slice.slice(0, lastSentenceEnd + 1).trim();
  }
  return slice.trim();
}

/**
 * Calls Gnani Timbre TTS REST endpoint:
 * POST https://api.vachana.ai/api/v1/tts/inference
 * Header: X-API-Key-ID
 */
export async function synthesizeWithGnaniTimbre(options: {
  text: string;
  language: AppLanguage;
  voice?: string;
  speed?: number;
}): Promise<{ audioBase64: string; audioMime: string }> {
  if (!isGnaniConfigured()) {
    throw new Error('GNANI_NOT_CONFIGURED');
  }

  const baseUrl = (process.env.GNANI_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const apiKey = (process.env.GNANI_API_KEY ?? '').trim();
  const cleanText = sanitizeTextForTts(options.text, 750);
  if (!cleanText) {
    throw new Error('Empty text for speech synthesis.');
  }

  const langCode = mapLanguageToGnaniCode(options.language);
  const speed =
    typeof options.speed === 'number' ? Math.min(1.5, Math.max(0.75, options.speed)) : 1;

  // Try configured voice on timbre-v3.0, then fallback to Nalini on timbre-v2.5
  const attempts: Array<{ voice?: string; model: string; container: 'mp3' | 'wav' }> = [
    { voice: options.voice || 'Nalini', model: 'timbre-v3.0', container: 'mp3' },
    { voice: 'Nalini', model: 'timbre-v2.5', container: 'mp3' },
  ];

  return withGnaniLock(async () => {
    let lastErr: Error | null = null;
    for (const attempt of attempts) {
      try {
        return await callGnaniTtsOnce({
          baseUrl,
          apiKey,
          text: cleanText,
          voice: attempt.voice,
          model: attempt.model,
          language: langCode,
          speed,
          container: attempt.container,
        });
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        const status = (err as { status?: number })?.status;
        // Stop retrying if rate-limited or timed out so fallback TTS responds fast
        if (status === 429 || lastErr.name === 'TimeoutError' || lastErr.name === 'AbortError') {
          throw lastErr;
        }
      }
    }

    throw lastErr ?? new Error('Gnani Timbre TTS synthesis failed.');
  });
}
