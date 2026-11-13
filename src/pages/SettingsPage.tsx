import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Globe,
  HelpCircle,
  Info,
  Leaf,
  Loader2,
  Mic,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Sun,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch } from '../lib/api';
import type { AppLanguage, IntegrationsStatus, UserSettings } from '../types';

interface SettingsPageProps {
  settings: UserSettings;
  integrations: IntegrationsStatus;
  onSettingsUpdated: (next: UserSettings) => void;
}

const SUPPORTED_VOICES = ['Shivani', 'Lakshmi', 'Avinash', 'Prakash', 'Nalini', 'Kalpana'];

export function SettingsPage({
  settings,
  integrations,
  onSettingsUpdated,
}: SettingsPageProps) {
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const t = TRANSLATIONS[draft.language].settings;
  const gnaniTtsConfigured = integrations.gnaniTts === 'connected';

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await apiFetch<{ settings: UserSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      onSettingsUpdated(res.settings);
      setToast({ type: 'success', text: TRANSLATIONS[res.settings.language].settings.savedToast });
    } catch {
      setToast({ type: 'error', text: t.errorToast });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setToast(null);
    try {
      const res = await apiFetch<{ settings: UserSettings }>('/api/settings/reset', {
        method: 'POST',
      });
      setDraft(res.settings);
      onSettingsUpdated(res.settings);
      setToast({ type: 'success', text: TRANSLATIONS[res.settings.language].settings.resetToast });
    } catch {
      setToast({ type: 'error', text: t.errorToast });
    } finally {
      setResetting(false);
    }
  };

  const handleExport = async () => {
    try {
      const payload = await apiFetch<Record<string, unknown>>('/api/privacy/export');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gnanikisan-data-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: 'error', text: t.errorToast });
    }
  };

  const handleDeleteData = async () => {
    setDeletingData(true);
    try {
      await apiFetch('/api/privacy/data', { method: 'DELETE' });
      setShowDeleteModal(false);
      setToast({ type: 'success', text: t.deletedToast });
    } catch {
      setToast({ type: 'error', text: t.errorToast });
    } finally {
      setDeletingData(false);
    }
  };

  const updateLanguagePreview = (lang: AppLanguage) => {
    setDraft((prev) => ({ ...prev, language: lang }));
  };

  const updateThemePreview = (theme: UserSettings['theme']) => {
    const next = { ...draft, theme };
    setDraft(next);
    onSettingsUpdated(next);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner (Reference Image 6) */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-[#E9F7EC] p-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
        <img
          src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
          alt="Agricultural sunrise"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#16A34A] text-white shadow-sm">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#15803D] sm:text-2xl dark:text-[#4ADE80]">
              {t.bannerTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-700 sm:text-sm dark:text-emerald-100/85">
              {t.bannerSubtitle}
            </p>
          </div>
        </div>
      </section>

      {toast && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Row 1: Language + Voice Settings */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs lg:col-span-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-[#16A34A]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.languageTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">{t.languageDesc}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {(
              [
                { id: 'te', native: 'తెలుగు', en: 'Telugu' },
                { id: 'en', native: 'English', en: 'English' },
                { id: 'hi', native: 'हिन्दी', en: 'Hindi' },
              ] as const
            ).map((lang) => {
              const selected = draft.language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => updateLanguagePreview(lang.id)}
                  className={`relative rounded-xl border p-3 text-center transition ${
                    selected
                      ? 'border-[#16A34A] bg-[#EEFAEF] text-[#0D2315] dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100'
                  }`}
                >
                  {selected && (
                    <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-[#16A34A]" />
                  )}
                  <div className="text-sm font-bold">{lang.native}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-emerald-300/70">
                    {lang.en}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs lg:col-span-7 dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <Mic className="h-4.5 w-4.5 text-[#16A34A]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.voiceTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">{t.voiceDesc}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                {t.voiceModelLabel}
              </label>
              <select
                value={draft.voiceName}
                disabled={!gnaniTtsConfigured}
                onChange={(e) => setDraft({ ...draft, voiceName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 disabled:opacity-60 dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              >
                {SUPPORTED_VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v} (Gnani Timbre)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-emerald-100">
                <span>{t.voiceSpeedLabel}</span>
                <span className="font-mono tabular-nums">{draft.voiceSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={draft.voiceSpeed}
                onChange={(e) => setDraft({ ...draft, voiceSpeed: Number(e.target.value) })}
                className="mt-2 w-full accent-[#16A34A]"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-emerald-100">
              {t.voiceStyleLabel}:
            </span>
            {(
              [
                { id: 'normal', label: t.voiceStyleNormal },
                { id: 'clear', label: t.voiceStyleClear },
                { id: 'concise', label: t.voiceStyleConcise },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setDraft({ ...draft, voiceStyle: st.id })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  draft.voiceStyle === st.id
                    ? 'bg-[#16A34A] text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-slate-500 dark:text-emerald-200/75">
            {gnaniTtsConfigured ? t.voiceSupportNoteConfigured : t.voiceSupportNoteFallback}
          </p>
        </section>
      </div>

      {/* Row 2: Notifications + Theme + App Preferences */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Notifications */}
        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-[#16A34A]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.notificationsTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">
                {t.notificationsDesc}
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-emerald-900/70">
            {(
              [
                { key: 'reminders', label: t.notifReminders },
                { key: 'weather', label: t.notifWeather },
                { key: 'schemes', label: t.notifSchemes },
                { key: 'cropAdvice', label: t.notifCropAdvice },
              ] as const
            ).map((item) => {
              const checked = draft.notifications[item.key];
              return (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center justify-between py-2.5 text-xs font-medium text-slate-800 dark:text-emerald-100"
                >
                  <span>{item.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        notifications: { ...draft.notifications, [item.key]: !checked },
                      })
                    }
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                      checked ? 'bg-[#16A34A]' : 'bg-slate-300 dark:bg-emerald-950'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        checked ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <Palette className="h-4.5 w-4.5 text-[#16A34A]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.themeTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">{t.themeDesc}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {(
              [
                { id: 'light', label: t.themeLight, icon: Sun },
                { id: 'dark', label: t.themeDark, icon: Moon },
                { id: 'system', label: t.themeSystem, icon: Monitor },
              ] as const
            ).map((th) => {
              const Icon = th.icon;
              const selected = draft.theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => updateThemePreview(th.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3.5 text-xs font-semibold transition ${
                    selected
                      ? 'border-[#16A34A] bg-[#EEFAEF] text-[#0D2315] dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 text-[#16A34A]" />
                  <span>{th.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* App Preferences */}
        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-[#16A34A]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.appPrefsTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">
                {t.appPrefsDesc}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-emerald-200/80">{t.unitsLabel}</span>
              <select
                value={draft.units}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    units: e.target.value === 'Hectares' ? 'Hectares' : 'Acres',
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              >
                <option value="Acres">{t.acres}</option>
                <option value="Hectares">{t.hectares}</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-emerald-200/80">
                {t.defaultLocationLabel}
              </span>
              <input
                type="text"
                value={draft.defaultLocation}
                onChange={(e) => setDraft({ ...draft, defaultLocation: e.target.value })}
                placeholder="Village / District"
                className="w-40 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right font-medium dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-emerald-200/80">{t.seasonLabel}</span>
              <select
                value={draft.farmingSeason}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    farmingSeason: e.target.value as UserSettings['farmingSeason'],
                  })
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              >
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Zaid">Zaid</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-emerald-200/80">
                {t.reminderTimeLabel}
              </span>
              <input
                type="time"
                value={draft.reminderTime}
                onChange={(e) => setDraft({ ...draft, reminderTime: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono font-medium dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Row 3: Privacy & Data | Help & Support | About GnaniKisan AI */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Privacy & Data */}
        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-[#16A34A]" />
              <div>
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.privacyTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">
                  {t.privacyDesc}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-emerald-100/85">
              {t.privacyExplain}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-[#F7FBF7] px-3.5 py-2.5 text-xs font-semibold text-[#0D2315] hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100"
            >
              <span>{t.downloadData}</span>
              <Download className="h-4 w-4 text-[#16A34A]" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <span>{t.deleteData}</span>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Help & Support */}
        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-[#16A34A]" />
            <div>
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.helpTitle}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-200/70">{t.helpDesc}</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {t.faqHeading}
            </div>
            {t.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-100 bg-[#F8FBF8] dark:border-emerald-900 dark:bg-[#08150D]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-[#0D2315] dark:text-white"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-600 dark:border-emerald-900 dark:text-emerald-200/80">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}

            <div className="pt-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {t.guideHeading}
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-emerald-200/80">
              {t.guideSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
            <p className="pt-1 text-[11px] font-medium text-emerald-900 dark:text-emerald-200">
              {t.supportContactNote}
            </p>
          </div>
        </section>

        {/* About GnaniKisan AI */}
        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Leaf className="h-4.5 w-4.5 text-[#16A34A]" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.aboutTitle}
                </h3>
              </div>
              <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {t.aboutVersion}
              </span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-emerald-100/85">
              {t.aboutDesc}
            </p>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                <Info className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>{t.integrationsHeading}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {(
                  [
                    ['Weather (Open-Meteo)', integrations.weather],
                    ['Geocoding (Nominatim)', integrations.geocoding],
                    ['Gemini Reasoning/Vision', integrations.geminiReasoning],
                    ['Gnani Prisma STT', integrations.gnaniStt],
                    ['Gnani Timbre TTS', integrations.gnaniTts],
                    ['AGMARKNET Mandi', integrations.mandi],
                    ['SMS OTP (Twilio)', integrations.smsOtp],
                    ['Email OTP (Resend)', integrations.emailOtp],
                  ] as const
                ).map(([label, status]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-[#F7FBF7] px-2.5 py-1.5 dark:bg-[#08150D]"
                  >
                    <span className="truncate text-slate-700 dark:text-emerald-100/85">{label}</span>
                    <span
                      className={`ml-1 shrink-0 font-semibold ${
                        status === 'connected'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {status === 'connected' ? '●' : '○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-emerald-800 dark:bg-[#0D2115] dark:text-emerald-100"
        >
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          {t.resetDefaults}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#166534] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t.saveChanges}
        </button>
      </div>

      {/* Delete Data Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-emerald-800 dark:bg-[#0D2115]">
            <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
              {t.deleteConfirmTitle}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-emerald-200/80">
              {t.deleteConfirmBody}
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deletingData}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-emerald-800 dark:text-emerald-100"
              >
                {TRANSLATIONS[draft.language].common.cancel}
              </button>
              <button
                type="button"
                disabled={deletingData}
                onClick={handleDeleteData}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingData ? '...' : TRANSLATIONS[draft.language].common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
