export type AppPage = 'dashboard' | 'voice' | 'crop-doctor' | 'profile' | 'history' | 'settings';

export type AppLanguage = 'en' | 'te' | 'hi';

export type VoiceLanguageMode = 'auto' | AppLanguage;

export interface UserLocation {
  name: string;
  village?: string;
  district?: string;
  state?: string;
  lat?: number;
  lon?: number;
  source: 'gps' | 'manual';
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  createdAt: string;
  location: UserLocation | null;
}

export interface FarmDetails {
  landArea: number;
  landUnit: 'Acres' | 'Hectares';
  crops: string[];
  soilType: 'Black' | 'Red' | 'Alluvial' | 'Sandy' | 'Clay' | 'Other';
  irrigation: 'Borewell' | 'Canal' | 'Drip' | 'Sprinkler' | 'Rain-fed' | 'Other';
  sowingDate?: string;
  growthStage?: string;
  updatedAt: string;
}

export interface UserProfile {
  fullName: string;
  mobileNumber: string;
  mobileVerified: boolean;
  email: string;
  emailVerified: boolean;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  crop?: string;
  completed: boolean;
  snoozedUntil?: string;
  createdAt: string;
}

export interface UserSettings {
  language: AppLanguage;
  voiceName: string;
  voiceSpeed: number;
  voiceStyle: 'normal' | 'clear' | 'concise';
  notifications: {
    reminders: boolean;
    weather: boolean;
    schemes: boolean;
    cropAdvice: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  units: 'Acres' | 'Hectares';
  defaultLocation: string;
  farmingSeason: 'Kharif' | 'Rabi' | 'Zaid';
  reminderTime: string;
  updatedAt: string;
}

export interface VoiceTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language: AppLanguage;
  timestamp: string;
  sttProvider?: 'gnani-prisma' | 'gemini-fallback' | 'typed';
  ttsProvider?: 'gnani-timbre' | 'gemini-fallback' | 'browser-fallback' | 'none';
  ttsError?: string;
  detectedConfidence?: 'high' | 'medium' | 'low';
  audioBase64?: string;
  audioMime?: string;
  audioStoragePath?: string;
  audioUrl?: string;
}

export interface VoiceConversation {
  id: string;
  title: string;
  language: AppLanguage;
  durationSec: number;
  turns: VoiceTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedProduct {
  name: string;
  brand: string;
  activeIngredient: string;
  formulation: string;
  packSize: string;
  indicativePrice: string | null;
  sourceUrl: string;
  sourceLabel: string;
  isBioOrIpm: boolean;
  labelInstruction: string;
  linkType?: 'product' | 'search';
}

export interface CropAnalysisResult {
  crop: string;
  possibleIssue: string;
  symptomsSummary: string;
  explanation: string;
  severity: string;
  confidenceNote: string;
  isUnclear: boolean;
  careTips: string[];
  preventionTips: string[];
  ipmGuidance: string;
  verifiedProducts: VerifiedProduct[];
  disclaimer: string;
}

export interface CropDoctorTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioBase64?: string;
  audioMime?: string;
  audioStoragePath?: string;
  audioUrl?: string;
  ttsProvider?: 'gnani-timbre' | 'gemini-fallback' | 'browser-fallback' | 'none';
  ttsError?: string;
}

export interface CropDoctorRecord {
  id: string;
  cropName: string;
  location?: string;
  growthStage?: string;
  imageDataUrl: string;
  imageStoragePath?: string;
  analysis: CropAnalysisResult;
  turns: CropDoctorTurn[];
  createdAt: string;
  updatedAt: string;
}

export type ServiceStatus = 'connected' | 'not_configured' | 'error';

export interface IntegrationsStatus {
  gnaniStt: ServiceStatus;
  gnaniTts: ServiceStatus;
  geminiReasoning: ServiceStatus;
  weather: ServiceStatus;
  geocoding: ServiceStatus;
  mandi: ServiceStatus;
  schemes: ServiceStatus;
  smsOtp: ServiceStatus;
  emailOtp: ServiceStatus;
  productCatalog: ServiceStatus;
}

export interface WeatherForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  code: number;
  rainChance: number;
}

export interface WeatherData {
  status: 'live' | 'unavailable';
  temperatureC?: number;
  condition?: string;
  weatherCode?: number;
  humidity?: number;
  windKmh?: number;
  rainChance?: number;
  forecast?: WeatherForecastDay[];
  source: string;
  updatedAt: string;
  message?: string;
}

export interface MandiPriceRow {
  crop: string;
  commodity?: string;
  market: string;
  state?: string;
  district?: string;
  variety?: string;
  pricePerQuintal: number;
  minPrice?: number;
  maxPrice?: number;
  changePercent: number;
  unit: string;
  arrivalDate?: string;
  updatedAt: string;
}

export interface MandiPricesResponse {
  status: 'live' | 'cached' | 'empty' | 'unavailable' | 'not_configured';
  errorCode?:
    | 'NOT_CONFIGURED'
    | 'CONNECTION_REFUSED'
    | 'TIMEOUT'
    | 'INVALID_API_KEY'
    | 'RATE_LIMITED'
    | 'DATASET_UNAVAILABLE'
    | 'NETWORK_ERROR';
  isDemo: boolean;
  source: string;
  dataDate?: string;
  fetchedAt?: string;
  cachedAt?: string;
  updatedAt: string;
  items: MandiPriceRow[];
  notice: string;
  error?: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  category: string;
  benefit: string;
  eligibilityStatus: 'Criteria Matched (Verify on Portal)' | 'Potentially Relevant';
  eligibilityReason: string;
  officialUrl: string;
  lastVerified: string;
  applicableStates: string[];
}
