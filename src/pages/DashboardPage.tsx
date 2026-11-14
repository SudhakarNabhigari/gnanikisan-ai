import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudRain,
  Droplets,
  Edit3,
  ExternalLink,
  Landmark,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  Navigation,
  Plus,
  RefreshCw,
  Sprout,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch } from '../lib/api';
import type {
  AppLanguage,
  AppPage,
  AuthUser,
  FarmDetails,
  GovernmentScheme,
  IntegrationsStatus,
  MandiPricesResponse,
  Reminder,
  WeatherData,
} from '../types';

interface RecentConversationSummary {
  id: string;
  type: 'voice' | 'crop-doctor';
  title: string;
  summary: string;
  timestamp: string;
  language?: AppLanguage;
}

interface DashboardSummary {
  user: AuthUser;
  farm: FarmDetails;
  reminders: Reminder[];
  weather: WeatherData;
  mandi: MandiPricesResponse;
  schemes: GovernmentScheme[];
  recentConversations: RecentConversationSummary[];
  integrations: IntegrationsStatus;
}

interface DashboardPageProps {
  user: AuthUser;
  language: AppLanguage;
  onNavigate: (page: AppPage) => void;
  onOpenLocationModal: () => void;
  onContinueConversation: (type: 'voice' | 'crop-doctor', id: string) => void;
}

const CROP_OPTIONS = [
  'Paddy (Vari)',
  'Maize (Jonna)',
  'Cotton (Patti)',
  'Chilli',
  'Groundnut',
  'Red Gram (Kandi)',
];

const SOIL_TYPES: FarmDetails['soilType'][] = ['Black', 'Red', 'Alluvial', 'Sandy', 'Clay', 'Other'];
const IRRIGATION_TYPES: FarmDetails['irrigation'][] = [
  'Borewell',
  'Canal',
  'Drip',
  'Sprinkler',
  'Rain-fed',
  'Other',
];

function WeatherIcon({ code }: { code?: number }) {
  if (code === undefined) return <Cloud className="h-9 w-9 text-sky-500" />;
  if (code === 0 || code === 1) return <Sun className="h-9 w-9 text-amber-500" />;
  if (code >= 51) return <CloudRain className="h-9 w-9 text-sky-600" />;
  return <Cloud className="h-9 w-9 text-sky-500" />;
}

export function DashboardPage({
  user,
  language,
  onNavigate,
  onOpenLocationModal,
  onContinueConversation,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Independent mandi refresh state
  const [mandiOverride, setMandiOverride] = useState<MandiPricesResponse | null>(null);
  const [mandiLoading, setMandiLoading] = useState(false);

  // Schemes carousel index
  const [schemeIndex, setSchemeIndex] = useState(0);

  // Farm edit modal
  const [editingFarm, setEditingFarm] = useState(false);
  const [farmForm, setFarmForm] = useState<FarmDetails | null>(null);
  const [customCrop, setCustomCrop] = useState('');
  const [savingFarm, setSavingFarm] = useState(false);

  // Reminder modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState('');
  const [remTime, setRemTime] = useState('07:00');
  const [remCrop, setRemCrop] = useState('');
  const [savingRem, setSavingRem] = useState(false);

  const t = TRANSLATIONS[language].dashboard;
  const c = TRANSLATIONS[language].common;
  const locale = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<DashboardSummary>('/api/dashboard/summary');
      setData(res);
      setMandiOverride(null);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.unableToLoad);
    } finally {
      setLoading(false);
    }
  }, [t.unableToLoad]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, user.location?.name, user.location?.lat]);

  useEffect(() => {
    const len = data?.schemes?.length ?? 0;
    setSchemeIndex((prev) => (len === 0 ? 0 : Math.min(prev, len - 1)));
  }, [data?.schemes?.length]);

  const refreshMandiPrices = async () => {
    setMandiLoading(true);
    try {
      const res = await apiFetch<MandiPricesResponse>('/api/market-prices');
      setMandiOverride(res);
    } catch (err) {
      setMandiOverride({
        status: 'unavailable',
        isDemo: false,
        source: 'AGMARKNET (data.gov.in)',
        updatedAt: new Date().toISOString(),
        items: [],
        notice: t.mandiUnavailableDesc,
        error: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setMandiLoading(false);
    }
  };

  const openEditFarm = () => {
    if (!data) return;
    setFarmForm({ ...data.farm });
    setEditingFarm(true);
  };

  const handleToggleCrop = (crop: string) => {
    if (!farmForm) return;
    const exists = farmForm.crops.includes(crop);
    const next = exists
      ? farmForm.crops.filter((item) => item !== crop)
      : [...farmForm.crops, crop];
    setFarmForm({ ...farmForm, crops: next });
  };

  const handleAddCustomCrop = () => {
    if (!farmForm || !customCrop.trim()) return;
    if (!farmForm.crops.includes(customCrop.trim())) {
      setFarmForm({ ...farmForm, crops: [...farmForm.crops, customCrop.trim()] });
    }
    setCustomCrop('');
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmForm) return;
    setSavingFarm(true);
    try {
      await apiFetch<FarmDetails>('/api/farm', {
        method: 'PUT',
        body: JSON.stringify(farmForm),
      });
      setEditingFarm(false);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.saveFarmError);
    } finally {
      setSavingFarm(false);
    }
  };

  const openAddReminder = () => {
    setEditingReminder(null);
    setRemTitle('');
    setRemDate(new Date().toISOString().slice(0, 10));
    setRemTime('07:00');
    setRemCrop(data?.farm.crops[0] || '');
    setShowReminderModal(true);
  };

  const openEditReminder = (r: Reminder) => {
    setEditingReminder(r);
    setRemTitle(r.title);
    setRemDate(r.date);
    setRemTime(r.time);
    setRemCrop(r.crop || '');
    setShowReminderModal(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDate || !remTime) return;
    setSavingRem(true);
    try {
      if (editingReminder) {
        await apiFetch(`/api/reminders/${editingReminder.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: remTitle.trim(),
            date: remDate,
            time: remTime,
            crop: remCrop || undefined,
          }),
        });
      } else {
        await apiFetch('/api/reminders', {
          method: 'POST',
          body: JSON.stringify({
            title: remTitle.trim(),
            date: remDate,
            time: remTime,
            crop: remCrop || undefined,
          }),
        });
      }
      setShowReminderModal(false);
      await loadDashboard();
    } finally {
      setSavingRem(false);
    }
  };

  const toggleReminderDone = async (r: Reminder) => {
    await apiFetch(`/api/reminders/${r.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !r.completed }),
    });
    await loadDashboard();
  };

  const snoozeReminderOneDay = async (r: Reminder) => {
    const dt = new Date(`${r.date}T00:00:00`);
    dt.setDate(dt.getDate() + 1);
    const nextDate = dt.toISOString().slice(0, 10);
    await apiFetch(`/api/reminders/${r.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ date: nextDate, snoozedUntil: nextDate }),
    });
    await loadDashboard();
  };

  const deleteReminder = async (id: string) => {
    await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' });
    await loadDashboard();
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-800 dark:text-emerald-200">
          <Loader2 className="h-5 w-5 animate-spin text-[#16A34A]" />
          {t.loadingDashboard}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {c.retry}
        </button>
      </div>
    );
  }

  const farm = data!.farm;
  const weather = data!.weather;
  const mandi = mandiOverride ?? data!.mandi;
  const schemes = data!.schemes;
  const activeScheme = schemes[schemeIndex] ?? schemes[0];
  const loc = data!.user.location;
  const hasCoords = typeof loc?.lat === 'number' && typeof loc?.lon === 'number';

  const weatherConditionText =
    weather.weatherCode !== undefined
      ? t.weatherCodes[weather.weatherCode] ?? t.weatherVariable
      : weather.condition;

  const formatWeekday = (dateStr: string, fallback: string) => {
    try {
      const parsed = new Date(`${dateStr}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return fallback;
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(parsed);
    } catch {
      return fallback;
    }
  };

  const mandiBadgeLabel =
    mandi.status === 'live'
      ? t.liveAgmarknet
      : mandi.status === 'cached'
        ? t.cachedAgmarknet
        : mandi.status === 'empty'
          ? t.emptyBadge
          : mandi.status === 'not_configured'
            ? t.notConfiguredBadge
            : t.unavailableBadge;

  const mandiBadgeClass =
    mandi.status === 'live'
      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
      : mandi.status === 'cached'
        ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200'
        : 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200';

  return (
    <div className="space-y-5">
      {/* Welcome Banner (Reference Image 1) */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-[#0F3F23] text-white shadow-sm">
        <img
          src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
          alt="Sunrise over green Indian agricultural fields"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B321C]/90 via-[#0E3F23]/65 to-[#0B321C]/85" />

        <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/images/indian_farmer_portrait_1794593807306.jpg"
              alt={user.username}
              referrerPolicy="no-referrer"
              className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/70 object-cover shadow-md sm:h-20 sm:w-20"
            />
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t.welcomePrefix} {user.username}
              </h2>
              <p className="mt-1 text-sm font-medium text-emerald-100">
                {t.companionLine}
              </p>
            </div>
          </div>

          {/* Right Farm Location Green Card + Map Preview */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-300/30 bg-[#104A28]/85 p-3.5 backdrop-blur-sm sm:min-w-[330px]">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                <MapPin className="h-3.5 w-3.5 text-[#4ADE80]" />
                <span>{t.yourFarmLocation}</span>
              </div>
              <div className="mt-1 truncate text-sm font-bold text-white">
                {loc?.name || c.locationNotSet}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-emerald-100/80 tabular-nums">
                {hasCoords
                  ? `${loc!.lat!.toFixed(4)}° N, ${loc!.lon!.toFixed(4)}° E`
                  : t.manualNoGps}
              </div>
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="mt-2 text-xs font-semibold text-[#86EFAC] underline-offset-2 hover:underline"
              >
                {c.updateLocation}
              </button>
            </div>

            {hasCoords ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${loc!.lat}&mlon=${loc!.lon}#map=14/${loc!.lat}/${loc!.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-20 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-emerald-200/40 bg-[#E6F4EA] text-[#0D2315] shadow-inner transition hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(#16a34a33_1px,transparent_1px)] [background-size:10px_10px]" />
                <MapPin className="relative z-10 h-6 w-6 text-red-600" />
                <span className="relative z-10 mt-1 text-[10px] font-bold text-emerald-950">
                  {t.mapView}
                </span>
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300/50 bg-emerald-950/50 p-2 text-center text-[11px] text-emerald-100 hover:bg-emerald-900/60"
              >
                <Navigation className="mb-1 h-4 w-4 text-emerald-300" />
                {t.setGps}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Row 1: Weather Today | Market Price Today | My Farm Details */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Weather Today */}
        <section className="flex flex-col justify-between rounded-2xl border border-sky-200/70 bg-gradient-to-br from-[#EDF7FF] via-white to-[#F7FBFF] p-5 shadow-xs dark:border-emerald-800/60 dark:from-[#0C2017] dark:via-[#0D2115] dark:to-[#0A1A12]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sun className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.weatherToday}
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-emerald-200/70">
                {weather.status === 'live' ? t.openMeteoLive : t.unavailable}
              </span>
            </div>

            {weather.status === 'live' ? (
              <>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <WeatherIcon code={weather.weatherCode} />
                    <div>
                      <div className="font-display text-3xl font-bold text-[#0D2315] tabular-nums dark:text-white">
                        {weather.temperatureC}°C
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-emerald-200/80">
                        {weatherConditionText}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-emerald-200/75">
                        <Droplets className="h-3.5 w-3.5 text-sky-500" /> {t.humidity}
                      </span>
                      <span className="font-semibold tabular-nums">{weather.humidity}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-emerald-200/75">
                        <Wind className="h-3.5 w-3.5 text-sky-500" /> {t.wind}
                      </span>
                      <span className="font-semibold tabular-nums">{weather.windKmh} km/h</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-emerald-200/75">
                        <CloudRain className="h-3.5 w-3.5 text-sky-500" /> {t.rainChance}
                      </span>
                      <span className="font-semibold tabular-nums">{weather.rainChance}%</span>
                    </div>
                  </div>
                </div>

                {/* Next 3 Days */}
                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.next3Days}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(weather.forecast ?? []).map((day) => (
                      <div
                        key={day.date}
                        className="flex flex-col items-center rounded-xl border border-sky-100 bg-white/90 px-2 py-2.5 text-center dark:border-emerald-800/60 dark:bg-[#08150D]"
                      >
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-emerald-200/80">
                          {formatWeekday(day.date, day.dayName)}
                        </span>
                        <span className="mt-1 font-display text-sm font-bold text-[#0D2315] tabular-nums dark:text-white">
                          {day.tempMax}°C
                        </span>
                        <span className="text-[10px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                          {t.rainLabel} {day.rainChance}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-semibold">{t.liveWeatherUnavailable}</p>
                {weather.message && <p className="mt-1 leading-relaxed">{weather.message}</p>}
                <button
                  type="button"
                  onClick={onOpenLocationModal}
                  className="mt-2.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                >
                  {t.setGeocodedLocation}
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-emerald-300/65">
            {t.updatedLabel}{' '}
            {new Date(weather.updatedAt).toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </section>

        {/* Market Price Today */}
        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.marketPriceToday}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${mandiBadgeClass}`}>
                  {mandiBadgeLabel}
                </span>
                <button
                  type="button"
                  onClick={refreshMandiPrices}
                  disabled={mandiLoading}
                  title={t.refreshBtn}
                  aria-label={t.refreshBtn}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-200"
                >
                  <RefreshCw className={`h-3 w-3 ${mandiLoading ? 'animate-spin' : ''}`} />
                  {t.refreshBtn}
                </button>
              </div>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-emerald-200/70">
              {t.showingRatesFor} {mandi.source}
            </p>

            {(mandi.status === 'live' || mandi.status === 'cached') && mandi.items.length > 0 && !mandiLoading && (
              <>
                {mandi.status === 'cached' && (
                  <div className="mt-2.5 rounded-lg border border-sky-200 bg-sky-50/80 px-2.5 py-1.5 text-[11px] text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
                    {t.mandiCachedNotice.replace(
                      '{date}',
                      mandi.dataDate || (mandi.cachedAt ? mandi.cachedAt.slice(0, 10) : mandi.updatedAt.slice(0, 10))
                    )}
                  </div>
                )}
                <div className="mt-3 divide-y divide-slate-100 dark:divide-emerald-900/70">
                  {mandi.items.map((row, idx) => (
                    <div
                      key={`${row.crop}-${row.market}-${idx}`}
                      className="flex items-start justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#0D2315] dark:text-white">
                          {row.crop}
                          {row.variety ? (
                            <span className="ml-1 text-[11px] font-normal text-slate-500 dark:text-emerald-300/70">
                              ({row.variety})
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate text-[11px] text-slate-600 dark:text-emerald-200/75">
                          {row.market}
                          {row.state ? `, ${row.state}` : ''}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-slate-500 dark:text-emerald-300/70">
                          {typeof row.minPrice === 'number' && (
                            <span className="tabular-nums">
                              {t.minPriceLabel}: ₹{row.minPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {typeof row.maxPrice === 'number' && (
                            <span className="tabular-nums">
                              {t.maxPriceLabel}: ₹{row.maxPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {(row.arrivalDate || mandi.dataDate) && (
                            <span>
                              {t.dataDateLabel}: {row.arrivalDate || mandi.dataDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-medium text-slate-500 dark:text-emerald-300/70">
                          {t.modalPriceLabel}
                        </div>
                        <div className="font-mono text-sm font-bold text-[#0D2315] tabular-nums dark:text-white">
                          ₹{row.pricePerQuintal.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-emerald-300/70">
                          {row.unit}
                        </div>
                        {row.changePercent !== 0 && (
                          <div
                            className={`mt-0.5 inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                              row.changePercent > 0
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {row.changePercent > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {row.changePercent > 0 ? '+' : ''}
                            {row.changePercent}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {mandiLoading ? (
              <div className="mt-6 flex min-h-[150px] items-center justify-center gap-2 text-xs text-slate-500 dark:text-emerald-200/80">
                <Loader2 className="h-4 w-4 animate-spin text-[#16A34A]" />
                <span>{c.loading}</span>
              </div>
            ) : (mandi.status === 'live' || mandi.status === 'cached') && mandi.items.length > 0 ? null : mandi.status === 'empty' ? (
              <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-[#F7FBF7] p-4 text-xs text-slate-700 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-200/80">
                <p className="leading-relaxed">{t.noMandiMatch}</p>
                <button
                  type="button"
                  onClick={refreshMandiPrices}
                  className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#15803D]"
                >
                  <RefreshCw className="h-3 w-3" /> {c.retry}
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{t.mandiUnavailableTitle}</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  {mandi.status === 'not_configured'
                    ? t.mandiNotConfiguredDesc
                    : mandi.errorCode === 'CONNECTION_REFUSED'
                      ? t.mandiRefusedDesc
                      : mandi.errorCode === 'TIMEOUT'
                        ? t.mandiTimeoutDesc
                        : mandi.errorCode === 'INVALID_API_KEY'
                          ? t.mandiInvalidKeyDesc
                          : mandi.errorCode === 'RATE_LIMITED'
                            ? t.mandiRateLimitedDesc
                            : t.mandiUnavailableDesc}
                </p>
                {mandi.error && (
                  <p className="mt-1 font-mono text-[10px] opacity-80">{mandi.error}</p>
                )}
                {mandi.status !== 'not_configured' && (
                  <button
                    type="button"
                    onClick={refreshMandiPrices}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                  >
                    <RefreshCw className="h-3 w-3" /> {c.retry}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:bg-[#08150D] dark:text-emerald-200/75">
            {t.lastUpdatedLabel}:{' '}
            {new Date(mandi.fetchedAt || mandi.updatedAt).toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {mandi.dataDate ? ` · ${t.dataDateLabel}: ${mandi.dataDate}` : ''} · {mandi.source}
          </div>
        </section>

        {/* My Farm Details */}
        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sprout className="h-4.5 w-4.5 text-[#16A34A]" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.myFarmDetails}
                </h3>
              </div>
              <button
                type="button"
                onClick={openEditFarm}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
              >
                <Edit3 className="h-3 w-3" /> {c.edit}
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-12 gap-3">
              <div className="col-span-7 space-y-2 text-xs">
                <div className="flex justify-between rounded-lg bg-[#F5FAF5] px-3 py-2 dark:bg-[#08150D]">
                  <span className="text-slate-600 dark:text-emerald-200/75">{t.totalArea}</span>
                  <span className="font-semibold text-[#0D2315] tabular-nums dark:text-white">
                    {farm.landArea > 0
                      ? `${farm.landArea} ${farm.landUnit === 'Hectares' ? t.hectares : t.acres}`
                      : t.notSet}
                  </span>
                </div>
                <div className="rounded-lg bg-[#F5FAF5] px-3 py-2 dark:bg-[#08150D]">
                  <span className="text-slate-600 dark:text-emerald-200/75">{t.cropsLabel}</span>
                  <div className="mt-0.5 font-semibold text-[#0D2315] dark:text-white">
                    {farm.crops.join(', ') || t.noneSelected}
                  </div>
                </div>
                <div className="flex justify-between rounded-lg bg-[#F5FAF5] px-3 py-2 dark:bg-[#08150D]">
                  <span className="text-slate-600 dark:text-emerald-200/75">{t.soilLabel}</span>
                  <span className="font-semibold text-[#0D2315] dark:text-white">
                    {t.soilTypes[farm.soilType] ?? farm.soilType}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-[#F5FAF5] px-3 py-2 dark:bg-[#08150D]">
                  <span className="text-slate-600 dark:text-emerald-200/75">{t.irrigationLabel}</span>
                  <span className="font-semibold text-[#0D2315] dark:text-white">
                    {t.irrigationTypes[farm.irrigation] ?? farm.irrigation}
                  </span>
                </div>
              </div>

              <div className="col-span-5 overflow-hidden rounded-xl border border-emerald-100 dark:border-emerald-800">
                <img
                  src="/src/assets/images/crop_field_preview_1794593807262.jpg"
                  alt="Farm crop field"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {(farm.growthStage || farm.sowingDate) && (
            <div className="mt-3 text-[11px] text-slate-600 dark:text-emerald-200/75">
              {farm.growthStage && (
                <span>
                  {t.stageLabel}: {farm.growthStage}
                </span>
              )}
              {farm.growthStage && farm.sowingDate && <span className="mx-1.5">·</span>}
              {farm.sowingDate && (
                <span>
                  {t.sownLabel}: {farm.sowingDate}
                </span>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Row 2: Govt Schemes for You | Work Reminders (Duplicate AI Assistant Box Removed) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Government Schemes for You */}
        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-4.5 w-4.5 text-[#15803D]" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.govtSchemesTitle}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 tabular-nums dark:text-emerald-200/70">
                {schemeIndex + 1} / {schemes.length}
              </span>
            </div>

            {activeScheme && (
              <div className="mt-3.5 rounded-xl border border-emerald-100 bg-[#F6FBF7] p-4 dark:border-emerald-800/70 dark:bg-[#08150D]">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-sm font-bold text-[#0D2315] dark:text-white">
                    {activeScheme.name}
                  </h4>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400">
                  {activeScheme.eligibilityStatus === 'Criteria Matched (Verify on Portal)'
                    ? t.schemeStatusMatched
                    : t.schemeStatusRelevant}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-emerald-100/85">
                  {activeScheme.benefit}
                </p>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-emerald-200/70">
                  {activeScheme.eligibilityReason}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/60 pt-2.5 dark:border-emerald-800/50">
                  <span className="text-[10px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                    {t.verifiedLabel} {activeScheme.lastVerified}
                  </span>
                  <a
                    href={activeScheme.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#15803D]"
                  >
                    {t.officialPortal} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSchemeIndex((idx) => Math.max(0, idx - 1))}
              disabled={schemeIndex <= 0 || schemes.length <= 1}
              aria-label={t.prevScheme}
              title={t.prevScheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center gap-2">
              {schemes.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSchemeIndex(idx)}
                  aria-label={s.name}
                  className={`h-2 rounded-full transition-all ${
                    idx === schemeIndex ? 'w-6 bg-[#16A34A]' : 'w-2 bg-emerald-200 dark:bg-emerald-800'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSchemeIndex((idx) => Math.min(Math.max(0, schemes.length - 1), idx + 1))}
              disabled={schemeIndex >= schemes.length - 1 || schemes.length <= 1}
              aria-label={t.nextScheme}
              title={t.nextScheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Work Reminders */}
        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-[#16A34A]" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.workReminders}
                </h3>
              </div>
              <button
                type="button"
                onClick={openAddReminder}
                className="inline-flex items-center gap-1 rounded-xl bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#15803D]"
              >
                <Plus className="h-3.5 w-3.5" /> {t.addReminder}
              </button>
            </div>

            {data!.reminders.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-emerald-200 p-5 text-center text-xs text-slate-500 dark:border-emerald-800 dark:text-emerald-200/70">
                {t.noReminders}
              </div>
            ) : (
              <div className="mt-3.5 max-h-[210px] space-y-2 overflow-y-auto pr-1">
                {data!.reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-[#F8FBF8] p-2.5 dark:border-emerald-900 dark:bg-[#08150D]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleReminderDone(r)}
                      aria-label={r.completed ? t.markIncomplete : t.markComplete}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        r.completed
                          ? 'border-[#16A34A] bg-[#16A34A] text-white'
                          : 'border-slate-300 bg-white dark:border-emerald-700 dark:bg-[#0D2115]'
                      }`}
                    >
                      {r.completed && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-xs font-semibold ${
                          r.completed
                            ? 'text-slate-400 line-through dark:text-emerald-200/40'
                            : 'text-[#0D2315] dark:text-white'
                        }`}
                      >
                        {r.title}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-slate-500 tabular-nums dark:text-emerald-300/70">
                        <span>{r.date}</span>
                        <span>·</span>
                        <span>{r.time}</span>
                        {r.crop && (
                          <>
                            <span>·</span>
                            <span className="font-sans text-emerald-700 dark:text-emerald-300">{r.crop}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => snoozeReminderOneDay(r)}
                        title={t.snoozeTip}
                        aria-label={t.snoozeTip}
                        className="rounded-md p-1 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditReminder(r)}
                        title={t.editTip}
                        aria-label={t.editTip}
                        className="rounded-md p-1 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReminder(r.id)}
                        title={t.deleteTip}
                        aria-label={t.deleteTip}
                        className="rounded-md p-1 text-slate-500 hover:bg-red-100 hover:text-red-700 dark:text-emerald-300 dark:hover:bg-red-950/60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Row 3: Recent Conversations & Quick Farm Location */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs lg:col-span-7 dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-[#16A34A]" />
              <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                {t.recentConversations}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-[#15803D] hover:underline dark:text-emerald-300"
            >
              {t.viewHistory}
            </button>
          </div>

          {data!.recentConversations.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-emerald-200 p-6 text-center text-xs text-slate-500 dark:border-emerald-800 dark:text-emerald-200/70">
              {t.noConversations}
            </div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100 dark:divide-emerald-900/70">
              {data!.recentConversations.map((conv) => (
                <div key={conv.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#15803D] dark:bg-emerald-950 dark:text-emerald-300">
                      {conv.type === 'voice' ? <Mic className="h-4 w-4" /> : <Sprout className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#0D2315] dark:text-white">
                        {conv.title}
                      </div>
                      <div className="truncate text-[11px] text-slate-500 dark:text-emerald-200/70">
                        {conv.type === 'voice' ? t.voiceAssistantLabel : t.cropDoctorLabel} ·{' '}
                        {new Date(conv.timestamp).toLocaleString(locale, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onContinueConversation(conv.type, conv.id)}
                    className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                  >
                    {t.continueBtn}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-emerald-200/70 bg-white p-5 shadow-xs lg:col-span-5 dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-[#16A34A]" />
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.farmLocationQuickActions}
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="text-xs font-semibold text-[#15803D] hover:underline dark:text-emerald-300"
              >
                {t.changeBtn}
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-[#F5FAF5] p-3 text-xs dark:bg-[#08150D]">
              <div className="font-semibold text-[#0D2315] dark:text-white">
                {loc?.name || c.locationNotSet}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-emerald-200/75">
                {loc?.district && (
                  <span>
                    {t.districtLabel}: {loc.district}
                  </span>
                )}
                {loc?.state && (
                  <span>
                    {t.stateLabel}: {loc.state}
                  </span>
                )}
                {hasCoords && (
                  <span className="font-mono tabular-nums">
                    {loc!.lat!.toFixed(4)}°N, {loc!.lon!.toFixed(4)}°E
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={openEditFarm}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-left text-xs font-semibold text-emerald-950 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100"
            >
              <Sprout className="h-4 w-4 text-[#16A34A]" /> {t.updateFarmDetails}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('crop-doctor')}
              className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 text-left text-xs font-semibold text-sky-950 hover:bg-sky-100 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100"
            >
              <Cloud className="h-4 w-4 text-sky-600" /> {t.openCropDoctor}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('voice')}
              className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 px-3 py-2.5 text-left text-xs font-semibold text-purple-950 hover:bg-purple-100 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100"
            >
              <Mic className="h-4 w-4 text-purple-600" /> {t.voiceAssistantAction}
            </button>
            <button
              type="button"
              onClick={openAddReminder}
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-left text-xs font-semibold text-amber-950 hover:bg-amber-100 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100"
            >
              <Calendar className="h-4 w-4 text-amber-600" /> {t.setWorkReminder}
            </button>
          </div>
        </section>
      </div>

      {/* Edit Farm Details Modal */}
      {editingFarm && farmForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl dark:border-emerald-800 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#0D2315] dark:text-white">
                {t.editFarmTitle}
              </h2>
              <button
                type="button"
                onClick={() => setEditingFarm(false)}
                aria-label={c.close}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-emerald-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFarm} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.totalLandArea}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={farmForm.landArea}
                    onChange={(e) =>
                      setFarmForm({ ...farmForm, landArea: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.unitLabel}
                  </label>
                  <select
                    value={farmForm.landUnit}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        landUnit: e.target.value === 'Hectares' ? 'Hectares' : 'Acres',
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  >
                    <option value="Acres">{t.acres}</option>
                    <option value="Hectares">{t.hectares}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                  {t.cropsGrownMultiple}
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...CROP_OPTIONS, ...farmForm.crops])).map((cropOpt) => {
                    const selected = farmForm.crops.includes(cropOpt);
                    return (
                      <button
                        key={cropOpt}
                        type="button"
                        onClick={() => handleToggleCrop(cropOpt)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          selected
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#08150D] dark:text-emerald-100'
                        }`}
                      >
                        {cropOpt}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    placeholder={t.addAnotherCropPlaceholder}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCrop}
                    className="rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-900 dark:border-emerald-700 dark:text-emerald-200"
                  >
                    {t.addBtn}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.soilTypeLabel}
                  </label>
                  <select
                    value={farmForm.soilType}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        soilType: e.target.value as FarmDetails['soilType'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {t.soilTypes[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.irrigationSourceLabel}
                  </label>
                  <select
                    value={farmForm.irrigation}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        irrigation: e.target.value as FarmDetails['irrigation'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  >
                    {IRRIGATION_TYPES.map((i) => (
                      <option key={i} value={i}>
                        {t.irrigationTypes[i]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.sowingDateOpt}
                  </label>
                  <input
                    type="date"
                    value={farmForm.sowingDate || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, sowingDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.growthStageOpt}
                  </label>
                  <input
                    type="text"
                    value={farmForm.growthStage || ''}
                    onChange={(e) => setFarmForm({ ...farmForm, growthStage: e.target.value })}
                    placeholder={t.growthStagePlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFarm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-emerald-800 dark:text-emerald-100"
                >
                  {c.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingFarm}
                  className="rounded-xl bg-[#16A34A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-60"
                >
                  {savingFarm ? t.savingBtn : t.saveFarmBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl dark:border-emerald-800 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#0D2315] dark:text-white">
                {editingReminder ? t.editReminderTitle : t.addReminderTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                aria-label={c.close}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-emerald-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveReminder} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                  {t.taskTitleLabel}
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder={t.taskTitlePlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                    {t.timeLabel}
                  </label>
                  <input
                    type="time"
                    required
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
                  {t.cropOptionalLabel}
                </label>
                <select
                  value={remCrop}
                  onChange={(e) => setRemCrop(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                >
                  <option value="">{t.generalAllCrops}</option>
                  {farm.crops.map((cropOpt) => (
                    <option key={cropOpt} value={cropOpt}>
                      {cropOpt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-emerald-800 dark:text-emerald-100"
                >
                  {c.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingRem}
                  className="rounded-xl bg-[#16A34A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-60"
                >
                  {savingRem ? t.savingBtn : t.saveReminderBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
