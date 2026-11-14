import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Info,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sprout,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AudioPlayer } from '../components/AudioPlayer';
import { TRANSLATIONS } from '../i18n/translations';
import { ApiError, apiFetch, uploadSignedMedia } from '../lib/api';
import type {
  AppLanguage,
  AuthUser,
  CropDoctorRecord,
  FarmDetails,
  UserSettings,
} from '../types';

interface CropDoctorPageProps {
  user: AuthUser;
  language: AppLanguage;
  settings: UserSettings;
  initialRecordId?: string | null;
  onClearInitial: () => void;
  onChangeLanguage: (lang: AppLanguage) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_DIMENSION = 1600;
const OPTIMIZE_THRESHOLD_CHARS = 1_800_000;

async function optimizeUploadDataUrl(rawDataUrl: string): Promise<string> {
  if (rawDataUrl.length <= OPTIMIZE_THRESHOLD_CHARS || typeof document === 'undefined') {
    return rawDataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_UPLOAD_DIMENSION / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
        );
        const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
        const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

export function CropDoctorPage({
  user,
  language,
  settings,
  initialRecordId,
  onClearInitial,
  onChangeLanguage,
}: CropDoctorPageProps) {
  const t = TRANSLATIONS[language].cropDoctor;
  const locale = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [cropName, setCropName] = useState('');
  const [locationInput, setLocationInput] = useState(user.location?.name || '');
  const [growthStage, setGrowthStage] = useState('');
  const [initialQuestion, setInitialQuestion] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<CropDoctorRecord | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-fill farm context on mount
  useEffect(() => {
    apiFetch<FarmDetails>('/api/farm')
      .then((farm) => {
        if (!cropName && farm.crops.length > 0) {
          setCropName(farm.crops[0]);
        }
        if (!growthStage && farm.growthStage) {
          setGrowthStage(farm.growthStage);
        }
      })
      .catch(() => {});
  }, []);

  // Load initial record if continued from History / Dashboard
  useEffect(() => {
    if (!initialRecordId) return;
    apiFetch<{ cropDoctorHistory: CropDoctorRecord[] }>('/api/history')
      .then((res) => {
        const found = res.cropDoctorHistory.find((r) => r.id === initialRecordId);
        if (found) {
          setRecord(found);
          setImageDataUrl(found.imageDataUrl);
          setCropName(found.cropName);
          if (found.location) setLocationInput(found.location);
          if (found.growthStage) setGrowthStage(found.growthStage);
        }
      })
      .finally(() => onClearInitial());
  }, [initialRecordId, onClearInitial]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError(t.errUnsupportedFormat);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t.errSizeLimit);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const optimized = await optimizeUploadDataUrl(String(reader.result));
      setImageDataUrl(optimized);
      setRecord(null);
    };
    reader.onerror = () => setError(t.errReadFail);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    if (!imageDataUrl) {
      setError(t.errUploadFirst);
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const imageBlob = await (await fetch(imageDataUrl)).blob();
      const imagePath = await uploadSignedMedia(imageBlob, 'image');
      const res = await apiFetch<{ record?: CropDoctorRecord }>('/api/crop-doctor/analyze', {
        method: 'POST',
        timeoutMs: 90000,
        body: JSON.stringify({
          imagePath,
          cropName: String(cropName ?? '').trim(),
          location: String(locationInput ?? '').trim(),
          growthStage: String(growthStage ?? '').trim(),
          question: String(initialQuestion ?? '').trim(),
          language,
        }),
      });
      if (!res?.record?.analysis?.possibleIssue) {
        throw new Error(t.errInvalidResponse);
      }
      setRecord(res.record);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TIMEOUT') {
        setError(t.errTimeout);
      } else {
        setError(err instanceof Error && err.message ? err.message : t.errAnalyzeFail);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = String(followUpInput ?? '').trim();
    if (!record || !q || sendingFollowUp || analyzing) return;
    setFollowUpInput('');
    setSendingFollowUp(true);
    setError(null);
    try {
      const res = await apiFetch<{ record?: CropDoctorRecord }>('/api/crop-doctor/followup', {
        method: 'POST',
        timeoutMs: 60000,
        body: JSON.stringify({
          recordId: record.id,
          question: q,
          language,
        }),
      });
      if (!res?.record?.turns) {
        throw new Error(t.errInvalidResponse);
      }
      setRecord(res.record);
    } catch (err) {
      setFollowUpInput(q);
      if (err instanceof ApiError && err.code === 'TIMEOUT') {
        setError(t.errTimeout);
      } else {
        setError(err instanceof Error && err.message ? err.message : t.errFollowUpFail);
      }
    } finally {
      setSendingFollowUp(false);
    }
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setRecord(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      {/* Hero Banner (Reference Image 3) */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-[#E9F7EC] dark:border-emerald-800/60 dark:bg-[#0D2115]">
        <img
          src="/src/assets/images/healthy_leaf_macro_1794593808305.jpg"
          alt="Fresh sunlit green crop leaves"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#16A34A] text-white shadow-md">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#0D2315] sm:text-2xl dark:text-white">
                {t.title}
              </h2>
              <p className="mt-0.5 text-xs text-slate-700 sm:text-sm dark:text-emerald-100/85">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white/90 p-1 text-xs dark:border-emerald-800 dark:bg-[#08150D]">
            {(
              [
                { id: 'te', label: 'తెలుగు' },
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिन्दी' },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                type="button"
                disabled={analyzing || sendingFollowUp}
                onClick={() => onChangeLanguage(l.id)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition disabled:opacity-60 ${
                  language === l.id
                    ? 'bg-[#16A34A] text-white'
                    : 'text-slate-700 hover:bg-emerald-50 dark:text-emerald-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          {imageDataUrl && !analyzing && (
            <button
              type="button"
              onClick={handleAnalyze}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.retryAnalyzeBtn}
            </button>
          )}
        </div>
      )}

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Upload + Detected Problem */}
        <div className="space-y-5 lg:col-span-6">
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-[#16A34A]" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.uploadCropImage}
                </h3>
              </div>
              {imageDataUrl && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t.removeBtn}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
            />

            <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
                  dragOver
                    ? 'border-[#16A34A] bg-emerald-50 dark:bg-emerald-950/60'
                    : 'border-emerald-200 bg-[#F7FBF7] hover:border-[#16A34A] dark:border-emerald-800 dark:bg-[#08150D]'
                }`}
              >
                <ImagePlus className="h-8 w-8 text-[#16A34A]" />
                <p className="mt-2 text-xs font-semibold text-[#0D2315] dark:text-white">
                  {t.dragDropPrompt}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-emerald-200/70">
                  {t.formatLimit}
                </p>

                <div
                  className="mt-3 flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#0D2115] dark:text-emerald-100"
                  >
                    <Camera className="h-3.5 w-3.5 text-[#16A34A]" /> {t.cameraBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#0D2115] dark:text-emerald-100"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#16A34A]" /> {t.galleryBtn}
                  </button>
                </div>
              </div>

              {/* Image Preview */}
              <div className="relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-slate-50 dark:border-emerald-800 dark:bg-[#08150D]">
                {imageDataUrl ? (
                  <>
                    <img
                      src={imageDataUrl}
                      alt={t.uploadCropImage}
                      className="h-full max-h-[220px] w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs hover:bg-black/80"
                    >
                      <RefreshCw className="h-3 w-3" /> {t.replaceBtn}
                    </button>
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-emerald-300/50">
                    {t.previewPlaceholder}
                  </div>
                )}
              </div>
            </div>

            {/* Context Inputs */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-emerald-100">
                  {t.cropNameLabel}
                </label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder={t.cropNamePlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-emerald-100">
                  {t.locationLabel}
                </label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={t.locationPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-emerald-100">
                  {t.growthStageLabel}
                </label>
                <input
                  type="text"
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  placeholder={t.growthStagePlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <input
                type="text"
                value={initialQuestion}
                onChange={(e) => setInitialQuestion(e.target.value)}
                placeholder={t.notePlaceholder}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !imageDataUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-4 w-4" />}
                {analyzing ? t.inspectingPhoto : t.analyzeCropBtn}
              </button>
            </div>
          </section>

          {/* Detected Problem Summary Card */}
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#16A34A]" />
                <div className="text-xs font-semibold text-[#0D2315] dark:text-white">
                  {t.analyzingConversationHint}
                </div>
                <p className="max-w-sm text-[11px] text-slate-500 dark:text-emerald-200/70">
                  {t.analyzingSubHint}
                </p>
              </div>
            ) : !record ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-emerald-200/70">
                {t.emptyAnalysisHint}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    record.analysis.isUnclear
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
                      : 'border-rose-200/70 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-emerald-200/80">
                      {t.visualInspectionFinding}
                    </span>
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${
                        record.analysis.isUnclear
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-100'
                      }`}
                    >
                      {record.analysis.isUnclear ? t.photoUnclearBadge : t.possibleIssueBadge}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#0D2315] dark:text-white">
                    {record.analysis.possibleIssue}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-[#F7FBF7] p-3 dark:border-emerald-900 dark:bg-[#08150D]">
                    <div className="text-[11px] text-slate-500 dark:text-emerald-200/70">{t.cropCardLabel}</div>
                    <div className="mt-0.5 text-sm font-bold text-[#0D2315] dark:text-white">
                      {record.analysis.crop}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-[#F7FBF7] p-3 dark:border-emerald-900 dark:bg-[#08150D]">
                    <div className="text-[11px] text-slate-500 dark:text-emerald-200/70">
                      {t.observedSeverityLabel}
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">
                      {record.analysis.severity}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-[#F2FBF4] p-3.5 text-xs dark:border-emerald-800 dark:bg-emerald-950/40">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                    <Info className="h-4 w-4 text-[#16A34A]" />
                    <span>{t.symptomsNoteLabel}</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-slate-700 dark:text-emerald-100/85">
                    {record.analysis.symptomsSummary}
                  </p>
                  <p className="mt-2 font-medium text-emerald-900 dark:text-emerald-200">
                    {record.analysis.confidenceNote}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:border-emerald-900 dark:bg-[#08150D] dark:text-emerald-200/75">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#16A34A]" />
                  {record.analysis.disclaimer}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Chat + Verified Reference Products + Care/Prevention Tips */}
        <div className="space-y-5 lg:col-span-6">
          {/* Chat Panel */}
          <section className="flex h-[340px] flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-emerald-900">
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.conversationTitle}
              </h3>
              {record && (
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  {t.savedToHistory}
                </span>
              )}
            </div>

            <div className="my-3 flex-1 space-y-3 overflow-y-auto pr-1">
              {analyzing ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#16A34A]" />
                  <p className="text-xs font-semibold text-[#0D2315] dark:text-white">
                    {t.analyzingConversationHint}
                  </p>
                  <p className="max-w-xs text-[11px] text-slate-500 dark:text-emerald-200/70">
                    {t.analyzingSubHint}
                  </p>
                </div>
              ) : !record ? (
                <div className="flex h-full items-center justify-center text-center text-xs text-slate-500 dark:text-emerald-200/70">
                  {t.emptyConversationHint}
                </div>
              ) : (
                record.turns.map((turn, idx) => (
                  <div
                    key={turn.id}
                    className={`rounded-2xl border p-3.5 text-xs ${
                      turn.role === 'user'
                        ? 'border-emerald-200 bg-[#ECFAEE] text-[#0D2315] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-50'
                        : 'border-slate-200 bg-[#F7F8FC] text-slate-900 dark:border-emerald-900 dark:bg-[#08150D] dark:text-emerald-50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      <span>{turn.role === 'user' ? t.youLabel : t.doctorAiLabel}</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {new Date(turn.timestamp).toLocaleTimeString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{turn.text}</p>
                    {turn.role === 'assistant' && (
                      <AudioPlayer
                        text={turn.text}
                        language={language}
                        uiLanguage={language}
                        downloadFilename={`gnanikisan-crop-doctor-${record.updatedAt.slice(0, 10)}-turn-${idx + 1}`}
                        audioBase64={turn.audioBase64}
                          audioUrl={turn.audioUrl}
                        audioMime={turn.audioMime}
                        ttsProvider={turn.ttsProvider}
                        ttsError={turn.ttsError}
                        cropDoctorRecordId={record.id}
                        turnId={turn.id}
                        initialSpeed={settings.voiceSpeed}
                        autoPlay={idx === 1 && Boolean(turn.audioBase64)}
                        onAudioRecovered={(payload) => {
                          setRecord((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  turns: prev.turns.map((item) =>
                                    item.id === turn.id
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
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleFollowUp} className="flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-emerald-900">
              <input
                type="text"
                disabled={!record || sendingFollowUp}
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                placeholder={record ? t.followUpPlaceholder : t.followUpDisabledPlaceholder}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-[#16A34A] focus:bg-white focus:outline-none disabled:opacity-60 dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              />
              <button
                type="submit"
                disabled={!record || !followUpInput.trim() || sendingFollowUp}
                aria-label={t.followUpPlaceholder}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white hover:bg-[#15803D] disabled:opacity-50"
              >
                {sendingFollowUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>

          {/* Verified Product References (Up to 3 — Safety Enforced) */}
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.verifiedSuggestionsTitle}
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {t.ipmTag}
              </span>
            </div>

            {!record ? (
              <p className="mt-2.5 text-xs text-slate-500 dark:text-emerald-200/70">
                {t.verifiedEmptyHint}
              </p>
            ) : record.analysis.isUnclear ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {t.verifiedUnclearWarning}
              </div>
            ) : record.analysis.verifiedProducts.length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 dark:border-emerald-900 dark:bg-[#08150D] dark:text-emerald-200/80">
                {t.verifiedNoMatch}
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {record.analysis.verifiedProducts.slice(0, 3).map((prod, idx) => (
                  <div
                    key={prod.name}
                    className="rounded-xl border border-emerald-100 bg-[#F8FBF8] p-3.5 dark:border-emerald-800/70 dark:bg-[#08150D]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <span className="truncate text-xs font-bold text-[#0D2315] dark:text-white">
                            {prod.name}
                          </span>
                          {prod.isBioOrIpm && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                              {t.ipmBioBadge}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600 dark:text-emerald-200/80">
                          {prod.brand} · {t.activeLabel}: {prod.activeIngredient} · {prod.formulation}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-emerald-300/70">
                          {t.packLabel}: {prod.packSize} · {t.priceLabel}:{' '}
                          {prod.indicativePrice || t.checkDealerPrice}
                        </div>
                        <p className="mt-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                          {prod.labelInstruction}
                        </p>
                      </div>

                      <a
                        href={prod.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#0D2115] dark:text-emerald-200"
                      >
                        {prod.linkType === 'search' ? t.searchProductBtn : t.viewProductBtn}{' '}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Care Tips & Prevention Tips */}
          {record && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-emerald-200/80 bg-[#F1FBF3] p-4 dark:border-emerald-800/70 dark:bg-[#0E2618]">
                <h4 className="font-display text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {t.careTipsTitle}
                </h4>
                <ul className="mt-2.5 space-y-2 text-xs text-slate-800 dark:text-emerald-100/90">
                  {record.analysis.careTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-amber-200/80 bg-[#FFFDF2] p-4 dark:border-amber-800/60 dark:bg-[#1E1A0B]">
                <h4 className="font-display text-sm font-bold text-amber-950 dark:text-amber-100">
                  {t.preventionTipsTitle}
                </h4>
                <ul className="mt-2.5 space-y-2 text-xs text-slate-800 dark:text-amber-100/90">
                  {record.analysis.preventionTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
