import {
  Archive,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  History as HistoryIcon,
  Loader2,
  MessageSquare,
  Mic,
  Search,
  Sprout,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AudioPlayer } from '../components/AudioPlayer';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch, apiFetchBlob, triggerBlobDownload } from '../lib/api';
import type { AppLanguage, CropDoctorRecord, UserSettings, VoiceConversation } from '../types';

interface HistoryPageProps {
  settings: UserSettings;
  language: AppLanguage;
  onContinueVoice: (id: string) => void;
  onContinueCropDoctor: (id: string) => void;
}

export function HistoryPage({
  settings,
  language,
  onContinueVoice,
  onContinueCropDoctor,
}: HistoryPageProps) {
  const t = TRANSLATIONS[language].history;
  const commonT = TRANSLATIONS[language].common;
  const locale = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  const [activeTab, setActiveTab] = useState<'voice' | 'crop-doctor'>('voice');
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const [voiceHistory, setVoiceHistory] = useState<VoiceConversation[]>([]);
  const [cropHistory, setCropHistory] = useState<CropDoctorRecord[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'voice' | 'crop-doctor';
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleDownloadExport = async (
    key: string,
    endpoint: string,
    fallbackFilename: string
  ) => {
    setDownloadingKey(key);
    setExportFeedback(null);
    try {
      const { blob, filename } = await apiFetchBlob(endpoint);
      triggerBlobDownload(blob, filename || fallbackFilename);
      setExportFeedback({ type: 'success', message: t.downloadSuccess });
      window.setTimeout(() => {
        setExportFeedback((prev) => (prev?.type === 'success' ? null : prev));
      }, 3500);
    } catch (err) {
      setExportFeedback({
        type: 'error',
        message: err instanceof Error && err.message ? err.message : t.downloadError,
      });
    } finally {
      setDownloadingKey(null);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        voiceHistory: VoiceConversation[];
        cropDoctorHistory: CropDoctorRecord[];
      }>('/api/history');
      setVoiceHistory(res.voiceHistory);
      setCropHistory(res.cropDoctorHistory);
      if (res.voiceHistory.length > 0 && !selectedVoiceId) {
        setSelectedVoiceId(res.voiceHistory[0].id);
      }
      if (res.cropDoctorHistory.length > 0 && !selectedCropId) {
        setSelectedCropId(res.cropDoctorHistory[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const matchesTimeFilter = (iso: string) => {
    if (timeFilter === 'all') return true;
    const diffMs = Date.now() - new Date(iso).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    if (timeFilter === 'today') return diffMs <= dayMs;
    if (timeFilter === '7d') return diffMs <= 7 * dayMs;
    return diffMs <= 30 * dayMs;
  };

  const filteredVoice = useMemo(() => {
    const q = search.trim().toLowerCase();
    return voiceHistory.filter((v) => {
      if (!matchesTimeFilter(v.updatedAt)) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        v.turns.some((t) => t.text.toLowerCase().includes(q))
      );
    });
  }, [voiceHistory, search, timeFilter]);

  const filteredCrop = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cropHistory.filter((c) => {
      if (!matchesTimeFilter(c.updatedAt)) return false;
      if (!q) return true;
      return (
        c.cropName.toLowerCase().includes(q) ||
        c.analysis.possibleIssue.toLowerCase().includes(q) ||
        c.analysis.symptomsSummary.toLowerCase().includes(q)
      );
    });
  }, [cropHistory, search, timeFilter]);

  const activeVoice =
    filteredVoice.find((v) => v.id === selectedVoiceId) ?? filteredVoice[0] ?? null;
  const activeCrop =
    filteredCrop.find((c) => c.id === selectedCropId) ?? filteredCrop[0] ?? null;

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const endpoint =
        deleteConfirm.type === 'voice'
          ? `/api/history/voice/${deleteConfirm.id}`
          : `/api/history/crop-doctor/${deleteConfirm.id}`;
      await apiFetch(endpoint, { method: 'DELETE' });
      setDeleteConfirm(null);
      await loadHistory();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner (Reference Image 5) */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-[#EAF8ED] p-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
        <img
          src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
          alt="Sunrise agricultural field"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#16A34A] text-white shadow-sm">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#0D2315] dark:text-white">
                {t.bannerTitlePrefix} <span className="text-[#16A34A]">{t.bannerTitleHighlight}</span>
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-emerald-200/80">
                {t.bannerSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              downloadingKey !== null ||
              (voiceHistory.length === 0 && cropHistory.length === 0)
            }
            title={
              voiceHistory.length === 0 && cropHistory.length === 0
                ? t.noHistoryToExport
                : t.downloadAllBtn
            }
            onClick={() =>
              handleDownloadExport(
                'export-all',
                '/api/history/export-all.zip',
                'gnanikisan-all-history.zip'
              )
            }
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-[#15803D] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#166534] disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
          >
            {downloadingKey === 'export-all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            <span>
              {downloadingKey === 'export-all' ? t.downloadingLabel : t.downloadAllBtn}
            </span>
          </button>
        </div>
      </section>

      {exportFeedback && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-medium ${
            exportFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200'
          }`}
        >
          <span>{exportFeedback.message}</span>
          <button
            type="button"
            onClick={() => setExportFeedback(null)}
            className="ml-3 text-[11px] underline opacity-80 hover:opacity-100"
          >
            {commonT.close}
          </button>
        </div>
      )}

      {/* Two Tabs + Search + Time Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-emerald-200 bg-white p-1 dark:border-emerald-800 dark:bg-[#0D2115]">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'voice'
                ? 'bg-[#16A34A] text-white'
                : 'text-slate-700 hover:bg-emerald-50 dark:text-emerald-200'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            {t.voiceTabLabel} ({voiceHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crop-doctor')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'crop-doctor'
                ? 'bg-[#16A34A] text-white'
                : 'text-slate-700 hover:bg-emerald-50 dark:text-emerald-200'
            }`}
          >
            <Sprout className="h-3.5 w-3.5" />
            {t.cropTabLabel} ({cropHistory.length})
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2.5">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#0D2115] dark:text-white"
            />
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-emerald-800 dark:bg-[#0D2115] dark:text-emerald-100"
          >
            <option value="all">{t.allTime}</option>
            <option value="today">{t.today}</option>
            <option value="7d">{t.last7d}</option>
            <option value="30d">{t.last30d}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#16A34A]" />
        </div>
      ) : activeTab === 'voice' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Voice Records List */}
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-xs lg:col-span-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <h3 className="mb-3 font-display text-sm font-bold text-[#0D2315] dark:text-white">
              {t.voiceListTitle}
            </h3>

            {filteredVoice.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 p-8 text-center text-xs text-slate-500 dark:border-emerald-800 dark:text-emerald-200/70">
                {t.noVoiceMatch}
              </div>
            ) : (
              <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
                {filteredVoice.map((v) => {
                  const selected = activeVoice?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoiceId(v.id)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                        selected
                          ? 'border-[#16A34A] bg-[#EEFAEF] dark:border-emerald-500 dark:bg-emerald-950/60'
                          : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-emerald-900 dark:bg-[#08150D]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white">
                          <Mic className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-[#0D2315] dark:text-white">
                            {v.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                            <span>{v.language.toUpperCase()}</span>
                            <span>·</span>
                            <span>
                              {new Date(v.updatedAt).toLocaleDateString(locale, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {v.durationSec > 0 && (
                              <>
                                <span>·</span>
                                <span>{v.durationSec}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ type: 'voice', id: v.id, title: v.title });
                        }}
                        aria-label={`${t.deleteBtn} ${v.title}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Voice Record Detail */}
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs lg:col-span-7 dark:border-emerald-800/60 dark:bg-[#0D2115]">
            {!activeVoice ? (
              <div className="flex min-h-[320px] items-center justify-center text-xs text-slate-500 dark:text-emerald-200/70">
                {t.voiceSelectPrompt}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-emerald-900">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                      {activeVoice.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(activeVoice.updatedAt).toLocaleString(locale)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeVoice.durationSec}s
                      </span>
                      <span>{t.languageLabel}: {activeVoice.language.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={downloadingKey !== null}
                      onClick={() =>
                        handleDownloadExport(
                          `voice-pdf-${activeVoice.id}`,
                          `/api/history/voice/${activeVoice.id}/pdf`,
                          `gnanikisan-voice-${activeVoice.updatedAt.slice(0, 10)}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                    >
                      {downloadingKey === `voice-pdf-${activeVoice.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      {t.downloadPdfBtn}
                    </button>
                    <button
                      type="button"
                      disabled={downloadingKey !== null}
                      onClick={() =>
                        handleDownloadExport(
                          `voice-zip-${activeVoice.id}`,
                          `/api/history/voice/${activeVoice.id}/zip`,
                          `gnanikisan-voice-${activeVoice.updatedAt.slice(0, 10)}.zip`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                    >
                      {downloadingKey === `voice-zip-${activeVoice.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {t.downloadZipBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => onContinueVoice(activeVoice.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> {t.continueBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'voice',
                          id: activeVoice.id,
                          title: activeVoice.title,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t.deleteBtn}
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {activeVoice.turns.map((turn, idx) => (
                    <div
                      key={turn.id}
                      className={`rounded-2xl border p-3.5 text-xs ${
                        turn.role === 'user'
                          ? 'border-emerald-200 bg-[#ECFAEE] text-[#0D2315] dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50'
                          : 'border-slate-200 bg-[#F7F8FC] text-slate-900 dark:border-emerald-900 dark:bg-[#08150D] dark:text-emerald-50'
                      }`}
                    >
                      <div className="mb-1 flex justify-between text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                        <span>
                          {turn.role === 'user'
                            ? `${t.youLabel} (${turn.language.toUpperCase()})`
                            : 'GnaniKisan AI'}
                        </span>
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
                          language={turn.language}
                          uiLanguage={language}
                          downloadFilename={`gnanikisan-voice-${activeVoice.updatedAt.slice(0, 10)}-turn-${idx + 1}`}
                          audioBase64={turn.audioBase64}
                          audioMime={turn.audioMime}
                          ttsProvider={turn.ttsProvider}
                          ttsError={turn.ttsError}
                          conversationId={activeVoice.id}
                          turnId={turn.id}
                          initialSpeed={settings.voiceSpeed}
                          onAudioRecovered={(payload) => {
                            setVoiceHistory((prev) =>
                              prev.map((conv) =>
                                conv.id === activeVoice.id
                                  ? {
                                      ...conv,
                                      turns: conv.turns.map((item) =>
                                        item.id === turn.id
                                          ? {
                                              ...item,
                                              audioBase64: payload.audioBase64,
                                              audioMime: payload.audioMime,
                                              ttsProvider: payload.ttsProvider,
                                              ttsError: undefined,
                                            }
                                          : item
                                      ),
                                    }
                                  : conv
                              )
                            );
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Crop Doctor History Tab */
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-xs lg:col-span-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <h3 className="mb-3 font-display text-sm font-bold text-[#0D2315] dark:text-white">
              {t.cropListTitle}
            </h3>

            {filteredCrop.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 p-8 text-center text-xs text-slate-500 dark:border-emerald-800 dark:text-emerald-200/70">
                {t.noCropMatch}
              </div>
            ) : (
              <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
                {filteredCrop.map((item) => {
                  const selected = activeCrop?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCropId(item.id)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                        selected
                          ? 'border-[#16A34A] bg-[#EEFAEF] dark:border-emerald-500 dark:bg-emerald-950/60'
                          : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-emerald-900 dark:bg-[#08150D]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={item.imageDataUrl}
                          alt={item.cropName}
                          className="h-12 w-12 shrink-0 rounded-xl border border-emerald-200 object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-[#0D2315] dark:text-white">
                            {item.cropName} — {item.analysis.possibleIssue}
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                            {new Date(item.updatedAt).toLocaleString(locale)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            type: 'crop-doctor',
                            id: item.id,
                            title: `${item.cropName} — ${item.analysis.possibleIssue}`,
                          });
                        }}
                        aria-label={`${t.deleteBtn} ${item.cropName}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs lg:col-span-7 dark:border-emerald-800/60 dark:bg-[#0D2115]">
            {!activeCrop ? (
              <div className="flex min-h-[320px] items-center justify-center text-xs text-slate-500 dark:text-emerald-200/70">
                {t.cropSelectPrompt}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-emerald-900">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeCrop.imageDataUrl}
                      alt={activeCrop.cropName}
                      className="h-14 w-14 rounded-xl border border-emerald-200 object-cover"
                    />
                    <div>
                      <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                        {activeCrop.cropName} — {activeCrop.analysis.possibleIssue}
                      </h3>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-emerald-300/70">
                        {activeCrop.location || t.farmLabel} · {activeCrop.analysis.severity}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={downloadingKey !== null}
                      onClick={() =>
                        handleDownloadExport(
                          `crop-pdf-${activeCrop.id}`,
                          `/api/history/crop-doctor/${activeCrop.id}/pdf`,
                          `gnanikisan-crop-doctor-${activeCrop.updatedAt.slice(0, 10)}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                    >
                      {downloadingKey === `crop-pdf-${activeCrop.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      {t.downloadPdfBtn}
                    </button>
                    <button
                      type="button"
                      disabled={downloadingKey !== null}
                      onClick={() =>
                        handleDownloadExport(
                          `crop-zip-${activeCrop.id}`,
                          `/api/history/crop-doctor/${activeCrop.id}/zip`,
                          `gnanikisan-crop-doctor-${activeCrop.updatedAt.slice(0, 10)}.zip`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                    >
                      {downloadingKey === `crop-zip-${activeCrop.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {t.downloadZipBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => onContinueCropDoctor(activeCrop.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> {t.continueBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'crop-doctor',
                          id: activeCrop.id,
                          title: `${activeCrop.cropName} — ${activeCrop.analysis.possibleIssue}`,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t.deleteBtn}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-[#F2FBF4] p-3 text-xs dark:border-emerald-800 dark:bg-[#08150D]">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200">{t.careTipsTitle}</div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700 dark:text-emerald-100/85">
                      {activeCrop.analysis.careTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-amber-200/70 bg-[#FFFDF2] p-3 text-xs dark:border-amber-800/60 dark:bg-[#1E1A0B]">
                    <div className="font-bold text-amber-900 dark:text-amber-200">{t.preventionTipsTitle}</div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700 dark:text-amber-100/85">
                      {activeCrop.analysis.preventionTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {activeCrop.analysis.verifiedProducts.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-emerald-900 dark:bg-[#08150D]">
                    <div className="font-bold text-[#0D2315] dark:text-white">
                      {t.verifiedProductsTitle}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {activeCrop.analysis.verifiedProducts.map((p) => (
                        <div key={p.name} className="flex items-center justify-between gap-2">
                          <span>
                            {p.name} ({p.activeIngredient})
                          </span>
                          <a
                            href={p.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#15803D] hover:underline dark:text-emerald-300"
                          >
                            {p.linkType === 'search' ? t.searchProductBtn : t.viewProductBtn}{' '}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                  {activeCrop.turns.map((turn, idx) => (
                    <div
                      key={turn.id}
                      className={`rounded-xl border p-3 text-xs ${
                        turn.role === 'user'
                          ? 'border-emerald-200 bg-[#ECFAEE] dark:border-emerald-800 dark:bg-emerald-950/60'
                          : 'border-slate-200 bg-[#F7F8FC] dark:border-emerald-900 dark:bg-[#08150D]'
                      }`}
                    >
                      <div className="mb-1 font-semibold text-emerald-800 dark:text-emerald-300">
                        {turn.role === 'user' ? t.youLabel : t.doctorAiLabel}
                      </div>
                      <p className="whitespace-pre-line">{turn.text}</p>
                      {turn.role === 'assistant' && (
                        <AudioPlayer
                          text={turn.text}
                          language={language}
                          uiLanguage={language}
                          downloadFilename={`gnanikisan-crop-doctor-${activeCrop.updatedAt.slice(0, 10)}-turn-${idx + 1}`}
                          audioBase64={turn.audioBase64}
                          audioMime={turn.audioMime}
                          ttsProvider={turn.ttsProvider}
                          ttsError={turn.ttsError}
                          cropDoctorRecordId={activeCrop.id}
                          turnId={turn.id}
                          initialSpeed={settings.voiceSpeed}
                          onAudioRecovered={(payload) => {
                            setCropHistory((prev) =>
                              prev.map((rec) =>
                                rec.id === activeCrop.id
                                  ? {
                                      ...rec,
                                      turns: rec.turns.map((item) =>
                                        item.id === turn.id
                                          ? {
                                              ...item,
                                              audioBase64: payload.audioBase64,
                                              audioMime: payload.audioMime,
                                              ttsProvider: payload.ttsProvider,
                                              ttsError: undefined,
                                            }
                                          : item
                                      ),
                                    }
                                  : rec
                              )
                            );
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-emerald-800 dark:bg-[#0D2115]">
            <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
              {t.deleteModalTitle}
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-emerald-200/80">
              {t.deleteConfirmPrefix} <strong>{deleteConfirm.title}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-emerald-800 dark:text-emerald-100"
              >
                {commonT.cancel}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? t.deletingBtn : t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
