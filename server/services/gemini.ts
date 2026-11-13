import { GoogleGenAI, Type } from '@google/genai';
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

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
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

export async function synthesizeSpeechWithGeminiFallback(text: string): Promise<{
  audioBase64: string;
  audioMime: string;
}> {
  const cleanText = String(text ?? '').trim().slice(0, 1200);
  if (!cleanText) {
    throw new Error('Empty text for Gemini TTS.');
  }

  const attempts: Array<{ apiVersion: 'v1beta' | 'v1alpha'; includeSpeechMetadata: boolean }> = [
    { apiVersion: 'v1beta', includeSpeechMetadata: false },
    { apiVersion: 'v1alpha', includeSpeechMetadata: false },
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
        return {
          audioBase64: base64Audio,
          audioMime: audioPart?.inlineData?.mimeType || 'audio/wav',
        };
      }
      lastError = new Error('Gemini TTS did not return audio output.');
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini TTS synthesis failed.');
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

  const systemInstruction = [
    `You are GnaniCrop Doctor AI, a cautious plant health visual inspection assistant for Indian farmers.`,
    `Respond with all user-facing text fields in ${targetLang}.`,
    `Strict agricultural safety rules:`,
    `1. Inspect ONLY visible symptoms in the image. Never fabricate a numeric confidence percentage.`,
    `2. If the image is blurry, dark, non-crop, too far away, or ambiguous, set isUnclear=true and advise taking a clear daylight close-up photo or consulting a local KVK / Agriculture Officer.`,
    `3. Never prescribe chemical dosages (never output g/L, ml/L, or kg/acre chemical doses).`,
    `4. Prioritize Integrated Pest Management (IPM), cultural practices, resistant varieties, and biological measures.`,
    `5. Never claim a guaranteed cure.`,
    `6. Also fill englishIssueKey in concise English (e.g. "Rice Blast", "Bacterial Leaf Blight", "Thrips", "Fall Armyworm", "Tikka Leaf Spot", "Unclear") for catalog matching.`,
  ].join('\n');

  const userPrompt = [
    `Farmer provided context:`,
    `- Crop Name: ${params.cropName || 'Not provided (identify from photo if clear)'}`,
    `- Location: ${params.location || 'Not provided'}`,
    `- Growth Stage: ${params.growthStage || 'Not provided'}`,
    `- Farmer Question: ${params.question || 'Please examine this crop photo, identify any visible problem, and suggest safe care and prevention tips.'}`,
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
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

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
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

  const isUnclear = Boolean(parsed.isUnclear);
  const cropLabel = parsed.crop || params.cropName || 'Crop';
  const issueKey = `${parsed.englishIssueKey || ''} ${parsed.possibleIssue || ''}`;
  const verifiedProducts = findVerifiedProductsForDiagnosis(cropLabel, issueKey, isUnclear);

  return {
    crop: cropLabel,
    possibleIssue: parsed.possibleIssue || 'Visual Symptom Assessment',
    symptomsSummary: parsed.symptomsSummary || '',
    explanation: parsed.explanation || '',
    severity: isUnclear ? 'Undetermined (Photo needs clearer close-up)' : parsed.severity || 'Moderate (Visual estimate)',
    confidenceNote:
      parsed.confidenceNote ||
      'Visual assessment only — confirm crop stage and diagnosis with your local Agriculture Officer / KVK before chemical application.',
    isUnclear,
    careTips: parsed.careTips ?? [],
    preventionTips: parsed.preventionTips ?? [],
    ipmGuidance:
      parsed.ipmGuidance ||
      'Prioritize field sanitation, balanced nutrition, and non-chemical IPM practices before considering registered inputs.',
    verifiedProducts,
    disclaimer:
      'Advisory Notice: Visual image inspection cannot replace field verification. Always read the official CIBRC label and consult your local Krishi Vigyan Kendra (KVK) or Agriculture Officer before using any plant protection product.',
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

  const systemInstruction = [
    `You are GnaniCrop Doctor AI answering a follow-up question about an inspected crop.`,
    `Always respond in ${targetLang}.`,
    `Inspected Crop: ${params.cropName}`,
    `Visual Finding: ${params.analysis.possibleIssue} (${params.analysis.confidenceNote})`,
    `Symptoms: ${params.analysis.symptomsSummary}`,
    `Safety rules: Never invent or calculate chemical dosages. Direct the farmer to registered product labels and their local Agriculture Officer / KVK for specific spray dosages.`,
  ].join('\n');

  const historyText = params.turns
    .slice(-8)
    .map((t) => `${t.role === 'user' ? 'Farmer' : 'Crop Doctor'}: ${t.text}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `${historyText ? `Previous chat:\n${historyText}\n\n` : ''}Follow-up question: ${params.question}`,
    config: {
      systemInstruction,
    },
  });

  return (response.text ?? '').trim();
}
