import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AppLanguage,
  CropAnalysisResult,
  FarmDetails,
  UserLocation,
} from '../../src/types';
import { isGeminiConfigured } from './integrations';
import { findVerifiedProductsForDiagnosis } from './productCatalog';

function getAiClient(apiVersion?: 'v1beta' | 'v1alpha'): GoogleGenAI {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      ...(apiVersion ? { apiVersion } : {}),
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isQuotaExhaustedError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota');
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>
) {
  try {
    return await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      ...params,
    });
  } catch (err) {
    if (!isQuotaExhaustedError(err)) {
      throw err;
    }
    const baseConfig =
      params.config && typeof params.config === 'object' ? { ...params.config } : undefined;
    if (baseConfig && 'thinkingConfig' in baseConfig) {
      delete (baseConfig as Record<string, unknown>).thinkingConfig;
    }
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      ...params,
      ...(baseConfig ? { config: baseConfig } : {}),
    });
  }
}

function languageName(lang: AppLanguage): string {
  if (lang === 'te') return 'Telugu (తెలుగు)';
  if (lang === 'hi') return 'Hindi (हिन्दी)';
  return 'English';
}

export interface LanguageDetectionResult {
  language: AppLanguage | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  isTransliterated: boolean;
}

export interface AudioTranscriptionDetectionResult {
  transcript: string;
  detectedLanguage: AppLanguage | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  isCodeMixed: boolean;
}

const TELUGU_CHAR_RE = /[\u0C00-\u0C7F]/g;
const DEVANAGARI_CHAR_RE = /[\u0900-\u097F]/g;
const TELUGLISH_KEYWORDS = new Set([
  'naa', 'nenu', 'polam', 'vari', 'panta', 'pantalu', 'purugu', 'tegu', 'tegulu', 'eruvu',
  'eruvulu', 'neeru', 'neellu', 'cheyyali', 'cheyali', 'entha', 'ela', 'eppudu', 'ekada',
  'ekkada', 'rythu', 'raitulu', 'mirapa', 'patti', 'jonna', 'kandi', 'verusanaga', 'mandi',
  'dharalu', 'dhara', 'vaatavaranam', 'varsham', 'ekara', 'ekaraki', 'ekkada', 'cheppandi',
  'kavalsina', 'vadali', 'veyali', 'unnayi', 'undi', 'emiti', 'enti', 'enduku', 'bhumi',
]);
const HINGLISH_KEYWORDS = new Set([
  'mera', 'mere', 'meri', 'khet', 'fasal', 'dhaan', 'gehun', 'makka', 'kapas', 'mirch',
  'keeda', 'rog', 'khad', 'urea', 'kitna', 'kitni', 'kaise', 'kab', 'kahan', 'kya',
  'kisan', 'paani', 'sinchai', 'barish', 'mausam', 'mandi', 'bhav', 'yojana', 'bataiye',
  'bataye', 'karna', 'chahiye', 'dalna', 'lage', 'laga', 'peela', 'mitti', 'beej',
]);

function quickHeuristicTextLanguage(text: string): LanguageDetectionResult {
  const teluguCount = (text.match(TELUGU_CHAR_RE) || []).length;
  const hindiCount = (text.match(DEVANAGARI_CHAR_RE) || []).length;

  if (teluguCount >= 1 && teluguCount >= hindiCount) {
    return { language: 'te', confidence: 'high', isTransliterated: false };
  }
  if (hindiCount >= 1 && hindiCount > teluguCount) {
    return { language: 'hi', confidence: 'high', isTransliterated: false };
  }

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return { language: 'unknown', confidence: 'low', isTransliterated: false };
  }

  let teHits = 0;
  let hiHits = 0;
  for (const w of words) {
    if (TELUGLISH_KEYWORDS.has(w)) teHits += 1;
    if (HINGLISH_KEYWORDS.has(w)) hiHits += 1;
  }

  if (teHits >= 1 && teHits > hiHits) {
    return {
      language: 'te',
      confidence: teHits >= 2 ? 'high' : 'medium',
      isTransliterated: true,
    };
  }
  if (hiHits >= 1 && hiHits > teHits) {
    return {
      language: 'hi',
      confidence: hiHits >= 2 ? 'high' : 'medium',
      isTransliterated: true,
    };
  }

  const alphaCount = text.replace(/[^a-zA-Z]/g, '').length;
  if (alphaCount < 2) {
    return { language: 'unknown', confidence: 'low', isTransliterated: false };
  }

  return { language: 'en', confidence: 'medium', isTransliterated: false };
}

export async function detectTextLanguage(text: string): Promise<LanguageDetectionResult> {
  const clean = String(text ?? '').trim();
  if (!clean) {
    return { language: 'unknown', confidence: 'low', isTransliterated: false };
  }

  // 1. Deterministic script match for Telugu / Devanagari (handles mixed English + Telugu/Hindi script cleanly)
  const teluguCount = (clean.match(TELUGU_CHAR_RE) || []).length;
  const hindiCount = (clean.match(DEVANAGARI_CHAR_RE) || []).length;
  if (teluguCount >= 1 && teluguCount >= hindiCount) {
    return { language: 'te', confidence: 'high', isTransliterated: false };
  }
  if (hindiCount >= 1 && hindiCount > teluguCount) {
    return { language: 'hi', confidence: 'high', isTransliterated: false };
  }

  // 2. Reject empty/numeric/punctuation-only text cleanly instead of guessing
  const letterMatches = clean.match(/\p{L}/gu) || [];
  if (letterMatches.length < 2) {
    return { language: 'unknown', confidence: 'low', isTransliterated: false };
  }

  // 2b. Fast-path heuristic when message clearly uses multiple standard English words and zero Teluglish/Hinglish markers
  const heuristic = quickHeuristicTextLanguage(clean);
  if (heuristic.language === 'te' || heuristic.language === 'hi') {
    if (heuristic.confidence === 'high') {
      return heuristic;
    }
  }
  const lowerWords = clean
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const COMMON_ENGLISH_MARKERS = new Set([
    'what', 'which', 'when', 'where', 'how', 'why', 'should', 'would', 'could', 'can', 'will',
    'is', 'are', 'was', 'were', 'the', 'this', 'that', 'these', 'for', 'with', 'about', 'from',
    'apply', 'use', 'used', 'using', 'crop', 'crops', 'paddy', 'rice', 'maize', 'cotton', 'chilli',
    'fertilizer', 'urea', 'irrigation', 'water', 'weather', 'rain', 'soil', 'pest', 'disease',
    'leaf', 'leaves', 'price', 'prices', 'mandi', 'market', 'government', 'scheme', 'schemes',
    'farm', 'farmer', 'my', 'your', 'please', 'tell', 'best', 'manage', 'control', 'spray',
  ]);
  const englishHits = lowerWords.filter((w) => COMMON_ENGLISH_MARKERS.has(w)).length;
  if (
    heuristic.language === 'en' &&
    lowerWords.length >= 2 &&
    englishHits >= 2
  ) {
    return { language: 'en', confidence: 'high', isTransliterated: false };
  }

  // 3. Disambiguate Romanized text: English vs Teluglish (te) vs Hinglish (hi) vs gibberish/unsupported (unknown)
  if (isGeminiConfigured()) {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Classify the language of this farmer's message into one of: "te" (Telugu or Teluglish written in Roman/Latin letters like "naa vari polam lo"), "hi" (Hindi or Hinglish written in Roman/Latin letters like "dhaan me kitna urea dale"), "en" (English), or "unknown" (gibberish, random letters like "asdf", unintelligible noise, or a completely different unsupported language). Message:\n"""${clean}"""`,
        config: {
          systemInstruction:
            'You are a precise language identifier for Indian agriculture queries in Telugu, English, and Hindi (including Romanized Teluglish/Hinglish). Do not guess if input is gibberish or unclear — return language="unknown" and confidence="low".',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING },
              confidence: { type: Type.STRING },
              isTransliterated: { type: Type.BOOLEAN },
            },
            required: ['language', 'confidence', 'isTransliterated'],
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        language?: string;
        confidence?: string;
        isTransliterated?: boolean;
      };
      const langRaw = String(parsed.language ?? '').toLowerCase().trim();
      const confRaw = String(parsed.confidence ?? '').toLowerCase().trim();
      const language: AppLanguage | 'unknown' =
        langRaw === 'te' || langRaw === 'en' || langRaw === 'hi' ? langRaw : 'unknown';
      const confidence: 'high' | 'medium' | 'low' =
        confRaw === 'high' || confRaw === 'medium' ? confRaw : 'low';
      return {
        language,
        confidence,
        isTransliterated: Boolean(parsed.isTransliterated),
      };
    } catch {
      return quickHeuristicTextLanguage(clean);
    }
  }

  return quickHeuristicTextLanguage(clean);
}

export async function generateFarmAssistantReply(params: {
  question: string;
  language: AppLanguage;
  farm: FarmDetails;
  location: UserLocation | null;
  historyTurns: Array<{ role: 'user' | 'assistant'; text: string }>;
  style?: 'normal' | 'clear' | 'concise';
}): Promise<string> {
  const ai = getAiClient();
  const targetLang = languageName(params.language);

  const systemInstruction = [
    `You are GnaniKisan AI, a practical, trustworthy agricultural advisor for Indian farmers.`,
    `Always respond in natural ${targetLang}. Even if earlier turns in this conversation were in another language, answer the farmer's latest question strictly in ${targetLang}.`,
    `If the farmer wrote in Teluglish (Telugu words using English alphabet), still reply cleanly in natural Telugu script (తెలుగు) so voice synthesis pronounces Telugu clearly.`,
    `Farmer context: Location=${params.location?.name || 'Unknown'}, State=${params.location?.state || 'India'}, Farm Size=${params.farm.landArea || 'Unknown'} ${params.farm.landUnit}, Crops=${params.farm.crops.join(', ') || 'Not specified'}, Soil=${params.farm.soilType}, Irrigation=${params.farm.irrigation}, Growth Stage=${params.farm.growthStage || 'Not specified'}.`,
    `Safety & accuracy rules:`,
    `- Be practical, clear, and concise (suitable for both reading and voice playback).`,
    `- Never invent live market prices or fake government approval. If asked for live rates when unavailable, state clearly that live mandi rates depend on local APMC/AGMARKNET updates.`,
    `- Never invent chemical dosages. Recommend Integrated Pest Management (IPM), field hygiene, and consulting a local KVK / Agriculture Officer before applying synthetic pesticides.`,
    params.style === 'concise'
      ? `- Keep the answer under 4 short bullet points or 3 sentences.`
      : `- Structure advice clearly with numbered practical steps when helpful.`,
  ].join('\n');

  const conversationTranscript = params.historyTurns
    .slice(-8)
    .map((t) => `${t.role === 'user' ? 'Farmer' : 'Assistant'}: ${t.text}`)
    .join('\n');

  const prompt = conversationTranscript
    ? `Previous conversation:\n${conversationTranscript}\n\nLatest farmer question: ${params.question}`
    : params.question;

  const response = await generateWithModelFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction,
    },
  });

  return (response.text ?? '').trim();
}

export async function transcribeAndDetectAudioWithGemini(
  audioBase64: string,
  mimeType: string,
  languageMode: AppLanguage | 'auto'
): Promise<AudioTranscriptionDetectionResult> {
  const aiBeta = getAiClient('v1beta');
  const instruction =
    languageMode === 'auto'
      ? `Listen carefully to this farmer's spoken audio recording.
1. Identify the spoken language accurately among ONLY: "te" (Telugu, including natural English agricultural words mixed into Telugu), "hi" (Hindi, including natural English agricultural words mixed into Hindi), "en" (English), or "unknown" (if audio is silent, noise-only, unintelligible, or another unsupported language).
2. Transcribe the speech faithfully. Write Telugu speech in Telugu script (తెలుగు), Hindi speech in Devanagari script (हिन्दी), and English speech in English. If silent or unintelligible, return transcript="" and confidence="low".
3. Do NOT guess or invent speech if nothing clear was spoken.`
      : `Listen carefully to this farmer's spoken audio in ${languageName(languageMode)}. Transcribe it faithfully. If silent or unintelligible, return transcript="" and confidence="low". Set detectedLanguage="${languageMode}".`;

  const response = await aiBeta.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/wav',
            data: audioBase64,
          },
        },
        { text: instruction },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcript: { type: Type.STRING },
          detectedLanguage: { type: Type.STRING },
          confidence: { type: Type.STRING },
          isCodeMixed: { type: Type.BOOLEAN },
        },
        required: ['transcript', 'detectedLanguage', 'confidence', 'isCodeMixed'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    transcript?: string;
    detectedLanguage?: string;
    confidence?: string;
    isCodeMixed?: boolean;
  };

  const transcript = String(parsed.transcript ?? '').trim();
  const rawLang = String(parsed.detectedLanguage ?? '').toLowerCase().trim();
  const rawConf = String(parsed.confidence ?? '').toLowerCase().trim();
  const detectedLanguage: AppLanguage | 'unknown' =
    rawLang === 'te' || rawLang === 'en' || rawLang === 'hi'
      ? rawLang
      : languageMode !== 'auto'
        ? languageMode
        : 'unknown';
  const confidence: 'high' | 'medium' | 'low' =
    !transcript || detectedLanguage === 'unknown'
      ? 'low'
      : rawConf === 'high' || rawConf === 'medium'
        ? rawConf
        : 'low';

  return {
    transcript,
    detectedLanguage,
    confidence,
    isCodeMixed: Boolean(parsed.isCodeMixed),
  };
}

export async function transcribeAudioWithGeminiFallback(
  audioBase64: string,
  mimeType: string,
  language: AppLanguage
): Promise<string> {
  const aiBeta = getAiClient('v1beta');
  const targetLang = languageName(language);
  const modelsToTry = ['gemini-3.5-transcribe', 'gemini-4-hydrogen'];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await aiBeta.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/wav',
                data: audioBase64,
              },
            },
            {
              text: `Transcribe this farmer's spoken question accurately in ${targetLang}. Return ONLY the transcribed text without quotes or extra commentary.`,
            },
          ],
        },
      });
      return String(response.text ?? '').trim();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (model === 'gemini-3.5-transcribe' && (msg.includes('404') || msg.includes('NOT_FOUND'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Audio transcription failed.');
}

function ensureWavContainer(raw: Buffer, mimeType?: string): { buffer: Buffer; mime: string } {
  if (raw.length >= 12 && raw.subarray(0, 4).toString('ascii') === 'RIFF') {
    return { buffer: raw, mime: 'audio/wav' };
  }
  const lowerMime = (mimeType || '').toLowerCase();
  if (lowerMime.includes('mpeg') || lowerMime.includes('mp3')) {
    return { buffer: raw, mime: 'audio/mpeg' };
  }
  // Wrap headerless 24kHz mono 16-bit LE PCM into standard WAV container
  const sampleRateMatch = /rate=(\d+)/i.exec(lowerMime);
  const sampleRate = sampleRateMatch ? Number(sampleRateMatch[1]) || 24000 : 24000;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + raw.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(raw.length, 40);
  return { buffer: Buffer.concat([header, raw]), mime: 'audio/wav' };
}

export async function synthesizeSpeechWithGeminiFallback(text: string): Promise<{
  audioBase64: string;
  audioMime: string;
}> {
  const cleanText = String(text ?? '').trim().slice(0, 1200);
  if (!cleanText) {
    throw new Error('Empty text for Gemini TTS.');
  }

  const attempts: Array<{ apiVersion: 'v1beta' | 'v1alpha' }> = [
    { apiVersion: 'v1beta' },
    { apiVersion: 'v1alpha' },
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const ai = getAiClient(attempt.apiVersion);
      const part: Record<string, unknown> = { text: cleanText };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [part],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const audioPart = parts.find((p) => Boolean(p?.inlineData?.data));
      const base64Audio = audioPart?.inlineData?.data;
      if (base64Audio) {
        const rawBuf = Buffer.from(base64Audio, 'base64');
        if (rawBuf.length >= 128) {
          const wrapped = ensureWavContainer(rawBuf, audioPart?.inlineData?.mimeType);
          return {
            audioBase64: wrapped.buffer.toString('base64'),
            audioMime: wrapped.mime,
          };
        }
      }
      lastError = new Error('Gemini TTS did not return playable audio output.');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini TTS synthesis failed.');
}

const CROP_FALLBACK_TEXT: Record<
  AppLanguage,
  {
    cropDefault: string;
    possibleIssueDefault: string;
    severityUnclear: string;
    severityDefault: string;
    confidenceNoteDefault: string;
    ipmGuidanceDefault: string;
    disclaimer: string;
    emptyAnalysisError: string;
    emptyFollowUpError: string;
  }
> = {
  en: {
    cropDefault: 'Crop',
    possibleIssueDefault: 'Visual Symptom Assessment',
    severityUnclear: 'Undetermined (Photo needs clearer close-up)',
    severityDefault: 'Moderate (Visual estimate)',
    confidenceNoteDefault:
      'Visual assessment only — confirm crop stage and diagnosis with your local Agriculture Officer / KVK before chemical application.',
    ipmGuidanceDefault:
      'Prioritize field sanitation, balanced nutrition, and non-chemical IPM practices before considering registered inputs.',
    disclaimer:
      'Advisory Notice: Visual image inspection cannot replace field verification. Always read the official CIBRC label and consult your local Krishi Vigyan Kendra (KVK) or Agriculture Officer before using any plant protection product.',
    emptyAnalysisError: 'The vision model returned an empty or incomplete crop analysis. Please retry.',
    emptyFollowUpError: 'Unable to generate a follow-up answer right now. Please try again.',
  },
  te: {
    cropDefault: 'పంట',
    possibleIssueDefault: 'దృశ్య లక్షణాల పరిశీలన',
    severityUnclear: 'నిర్ధారించబడలేదు (మరింత స్పష్టమైన దగ్గరి ఫోటో అవసరం)',
    severityDefault: 'మధ్యస్థం (దృశ్య అంచనా)',
    confidenceNoteDefault:
      'ఇది ఫోటో ఆధారిత ప్రాథమిక పరిశీలన మాత్రమే — ఏదైనా పిచికారీ చేసే ముందు పంట దశ మరియు సమస్యను స్థానిక వ్యవసాయ అధికారి / KVK వద్ద నిర్ధారించుకోండి.',
    ipmGuidanceDefault:
      'రసాయనాల కంటే ముందు పొలం శుభ్రత, సమతుల్య పోషణ మరియు రసాయనేతర సమగ్ర సస్యరక్షణ (IPM) పద్ధతులకు ప్రాధాన్యత ఇవ్వండి.',
    disclaimer:
      'సూచన గమనిక: ఫోటో పరిశీలన నేరుగా పొలంలో చేసే తనిఖీకి ప్రత్యామ్నాయం కాదు. ఏదైనా పంట రక్షణ ఉత్పత్తిని వాడే ముందు అధికారిక CIBRC లేబుల్ చదివి స్థానిక కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ అధికారిని సంప్రదించండి.',
    emptyAnalysisError: 'పంట ఫోటో విశ్లేషణ అసంపూర్తిగా వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    emptyFollowUpError: 'తదుపరి ప్రశ్నకు సమాధానం రూపొందించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.',
  },
  hi: {
    cropDefault: 'फसल',
    possibleIssueDefault: 'दृश्य लक्षण निरीक्षण',
    severityUnclear: 'अनिश्चित (अधिक साफ़ नज़दीकी फ़ोटो आवश्यक)',
    severityDefault: 'मध्यम (दृश्य अनुमान)',
    confidenceNoteDefault:
      'यह केवल फ़ोटो के आधार पर प्रारंभिक जांच है — किसी भी रासायनिक छिड़काव से पहले स्थानीय कृषि अधिकारी / KVK से पुष्टि अवश्य करें।',
    ipmGuidanceDefault:
      'पंजीकृत इनपुट से पहले खेत की स्वच्छता, संतुलित पोषण और गैर-रासायनिक एकीकृत नाशीजीव प्रबंधन (IPM) को प्राथमिकता दें।',
    disclaimer:
      'सलाह सूचना: फ़ोटो का निरीक्षण खेत में प्रत्यक्ष जांच का विकल्प नहीं है। किसी भी फसल सुरक्षा उत्पाद के उपयोग से पहले आधिकारिक CIBRC लेबल पढ़ें और अपने स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से परामर्श करें।',
    emptyAnalysisError: 'फ़सल फ़ोटो विश्लेषण अधूरा रहा। कृपया पुनः प्रयास करें।',
    emptyFollowUpError: 'इस समय उत्तर तैयार नहीं हो सका। कृपया पुनः प्रयास करें।',
  },
};

function parseModelJsonObject<T>(rawText: string): T {
  const cleaned = String(rawText ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!cleaned) {
    throw new Error('EMPTY_MODEL_JSON');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('INVALID_MODEL_JSON');
  }
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('400') || msg.includes('401') || msg.includes('403') || msg.includes('api_key')) {
    return false;
  }
  if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota')) {
    return false;
  }
  return (
    msg.includes('empty_model_json') ||
    msg.includes('invalid_model_json') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('unavailable') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout')
  );
}

export async function analyzeCropImage(params: {
  imageBase64: string;
  mimeType: string;
  cropName?: string;
  location?: string;
  growthStage?: string;
  question?: string;
  language: AppLanguage;
}): Promise<CropAnalysisResult> {
  const ai = getAiClient();
  const targetLang = languageName(params.language);
  const fb = CROP_FALLBACK_TEXT[params.language] ?? CROP_FALLBACK_TEXT.en;

  const scriptRequirement =
    params.language === 'te'
      ? 'Write EVERY user-facing text field (crop, possibleIssue, symptomsSummary, explanation, severity, confidenceNote, careTips, preventionTips, ipmGuidance) strictly in natural Telugu script (తెలుగు). Do NOT leave any of those fields in English.'
      : params.language === 'hi'
        ? 'Write EVERY user-facing text field (crop, possibleIssue, symptomsSummary, explanation, severity, confidenceNote, careTips, preventionTips, ipmGuidance) strictly in natural Hindi Devanagari script (हिन्दी). Do NOT leave any of those fields in English.'
        : 'Write EVERY user-facing text field (crop, possibleIssue, symptomsSummary, explanation, severity, confidenceNote, careTips, preventionTips, ipmGuidance) clearly in natural English.';

  const systemInstruction = [
    `You are GnaniCrop Doctor AI, a cautious plant health visual inspection assistant for Indian farmers.`,
    scriptRequirement,
    `Strict agricultural safety rules:`,
    `1. Inspect ONLY visible symptoms in the image. Never fabricate a numeric confidence percentage.`,
    `2. If the image is blurry, dark, non-crop, too far away, or ambiguous, set isUnclear=true and advise taking a clear daylight close-up photo or consulting a local KVK / Agriculture Officer (in ${targetLang}).`,
    `3. Never prescribe chemical dosages (never output g/L, ml/L, or kg/acre chemical doses).`,
    `4. Prioritize Integrated Pest Management (IPM), cultural practices, resistant varieties, and biological measures.`,
    `5. Never claim a guaranteed cure.`,
    `6. Fill englishIssueKey ONLY in concise English (e.g. "Rice Blast", "Bacterial Leaf Blight", "Thrips", "Fall Armyworm", "Tikka Leaf Spot", "Healthy", "Unclear") for internal reference catalog matching.`,
    `7. Always provide 2-4 concise, practical careTips and 2-4 concise preventionTips in ${targetLang}.`,
  ].join('\n');

  const userPrompt = [
    `Target response language: ${targetLang}`,
    `Farmer provided context:`,
    `- Crop Name: ${params.cropName || 'Not provided (identify from photo if clear)'}`,
    `- Location: ${params.location || 'Not provided'}`,
    `- Growth Stage: ${params.growthStage || 'Not provided'}`,
    `- Farmer Question: ${params.question || 'Please examine this crop photo, identify any visible problem, and suggest safe care and prevention tips.'}`,
  ].join('\n');

  type ParsedAnalysis = {
    crop?: string;
    possibleIssue?: string;
    englishIssueKey?: string;
    symptomsSummary?: string;
    explanation?: string;
    severity?: string;
    confidenceNote?: string;
    isUnclear?: boolean;
    careTips?: string[];
    preventionTips?: string[];
    ipmGuidance?: string;
  };

  let parsed: ParsedAnalysis | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await generateWithModelFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: params.mimeType,
                data: params.imageBase64,
              },
            },
            { text: userPrompt },
          ],
        },
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              possibleIssue: { type: Type.STRING },
              englishIssueKey: { type: Type.STRING },
              symptomsSummary: { type: Type.STRING },
              explanation: { type: Type.STRING },
              severity: { type: Type.STRING },
              confidenceNote: { type: Type.STRING },
              isUnclear: { type: Type.BOOLEAN },
              careTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              preventionTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              ipmGuidance: { type: Type.STRING },
            },
            required: [
              'crop',
              'possibleIssue',
              'englishIssueKey',
              'symptomsSummary',
              'explanation',
              'severity',
              'confidenceNote',
              'isUnclear',
              'careTips',
              'preventionTips',
              'ipmGuidance',
            ],
          },
        },
      });

      const candidate = parseModelJsonObject<ParsedAnalysis>(response.text ?? '');
      const hasContent =
        Boolean(String(candidate.possibleIssue ?? '').trim()) &&
        (Boolean(String(candidate.explanation ?? '').trim()) ||
          Boolean(String(candidate.symptomsSummary ?? '').trim()));

      if (!hasContent) {
        throw new Error('EMPTY_MODEL_JSON');
      }

      parsed = candidate;
      break;
    } catch (err) {
      lastError = err;
      if (attempt === 0 && isRetryableGeminiError(err)) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        continue;
      }
      break;
    }
  }

  if (!parsed) {
    if (
      lastError instanceof Error &&
      (lastError.message === 'EMPTY_MODEL_JSON' || lastError.message === 'INVALID_MODEL_JSON')
    ) {
      throw new Error(fb.emptyAnalysisError);
    }
    throw lastError instanceof Error ? lastError : new Error(fb.emptyAnalysisError);
  }

  const isUnclear = Boolean(parsed.isUnclear);
  const cropLabel = String(parsed.crop ?? '').trim() || params.cropName || fb.cropDefault;
  const issueKey = `${parsed.englishIssueKey || ''} ${parsed.possibleIssue || ''}`;
  const verifiedProducts = findVerifiedProductsForDiagnosis(
    cropLabel,
    issueKey,
    isUnclear,
    params.language
  );

  const cleanTips = (items?: string[]) =>
    Array.isArray(items) ? items.map((s) => String(s ?? '').trim()).filter(Boolean) : [];

  return {
    crop: cropLabel,
    possibleIssue: String(parsed.possibleIssue ?? '').trim() || fb.possibleIssueDefault,
    symptomsSummary: String(parsed.symptomsSummary ?? '').trim(),
    explanation: String(parsed.explanation ?? '').trim(),
    severity: isUnclear
      ? String(parsed.severity ?? '').trim() || fb.severityUnclear
      : String(parsed.severity ?? '').trim() || fb.severityDefault,
    confidenceNote: String(parsed.confidenceNote ?? '').trim() || fb.confidenceNoteDefault,
    isUnclear,
    careTips: cleanTips(parsed.careTips),
    preventionTips: cleanTips(parsed.preventionTips),
    ipmGuidance: String(parsed.ipmGuidance ?? '').trim() || fb.ipmGuidanceDefault,
    verifiedProducts,
    disclaimer: fb.disclaimer,
  };
}

export async function generateCropDoctorFollowUp(params: {
  question: string;
  language: AppLanguage;
  cropName: string;
  analysis: CropAnalysisResult;
  turns: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<string> {
  const ai = getAiClient();
  const targetLang = languageName(params.language);
  const fb = CROP_FALLBACK_TEXT[params.language] ?? CROP_FALLBACK_TEXT.en;

  const systemInstruction = [
    `You are GnaniCrop Doctor AI answering a follow-up question about an inspected crop.`,
    `Always respond strictly in natural ${targetLang}. Even if earlier turns were in another language, answer this follow-up question completely in ${targetLang}.`,
    `Inspected Crop: ${params.cropName}`,
    `Visual Finding: ${params.analysis.possibleIssue} (${params.analysis.confidenceNote})`,
    `Symptoms: ${params.analysis.symptomsSummary}`,
    `Safety rules: Never invent or calculate chemical dosages. Direct the farmer to registered product labels and their local Agriculture Officer / KVK for specific spray dosages.`,
  ].join('\n');

  const historyText = params.turns
    .slice(-8)
    .map((t) => `${t.role === 'user' ? 'Farmer' : 'Crop Doctor'}: ${t.text}`)
    .join('\n');

  const response = await generateWithModelFallback(ai, {
    contents: `${historyText ? `Previous chat:\n${historyText}\n\n` : ''}Follow-up question: ${params.question}`,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error(fb.emptyFollowUpError);
  }
  return text;
}
