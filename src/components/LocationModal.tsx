import {
  Crosshair,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { ApiError, apiFetch } from '../lib/api';
import type { AppLanguage, AuthUser, UserLocation } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
  language?: AppLanguage;
  username: string;
  initialLocation?: UserLocation | null;
  onLocationSaved: (user: AuthUser, location: UserLocation) => void;
  onSessionExpired?: () => void;
}

export function LocationModal({
  isOpen,
  onClose,
  canClose = true,
  language = 'en',
  username,
  initialLocation,
  onLocationSaved,
  onSessionExpired,
}: LocationModalProps) {
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLocation[]>([]);
  const [manualMode, setManualMode] = useState(true);
  const [manualVillage, setManualVillage] = useState(initialLocation?.village || initialLocation?.name || '');
  const [manualDistrict, setManualDistrict] = useState(initialLocation?.district || '');
  const [manualState, setManualState] = useState(initialLocation?.state || '');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  const t = TRANSLATIONS[language].locationModal;

  if (!isOpen) return null;

  const handleRequestError = (err: unknown, fallbackMessage: string) => {
    if (err instanceof ApiError && err.status === 401) {
      setSessionExpired(true);
      setError(t.errSessionExpired);
      return;
    }
    setSessionExpired(false);
    setError(err instanceof Error && err.message ? err.message : fallbackMessage);
  };

  const handleUseGps = () => {
    setError(null);
    setSessionExpired(false);
    if (!('geolocation' in navigator)) {
      setError(t.errGeoUnsupported);
      setManualMode(true);
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const data = await apiFetch<{ location: UserLocation; user: AuthUser }>('/api/location/reverse', {
            method: 'POST',
            body: JSON.stringify({ lat: latitude, lon: longitude }),
          });
          onLocationSaved(data.user, data.location);
        } catch (err) {
          setDetectedCoords({ lat: latitude, lon: longitude });
          setManualMode(true);
          handleRequestError(err, t.errReverseFallback);
        } finally {
          setDetecting(false);
        }
      },
      (geoErr) => {
        setDetecting(false);
        setManualMode(true);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(t.errPermissionDenied);
        } else {
          setError(t.errDetectFailed);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setError(null);
    setSessionExpired(false);
    setSearching(true);
    try {
      const res = await apiFetch<{ results: UserLocation[] }>(
        `/api/location/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchResults(res.results);
      if (res.results.length === 0) {
        setError(t.errSearchEmpty);
      }
    } catch (err) {
      handleRequestError(err, t.errSearchUnavailable);
      setManualMode(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = async (loc: UserLocation) => {
    setSaving(true);
    setError(null);
    setSessionExpired(false);
    try {
      const res = await apiFetch<{ user: AuthUser; location: UserLocation }>('/api/location', {
        method: 'PUT',
        body: JSON.stringify(loc),
      });
      onLocationSaved(res.user, res.location);
    } catch (err) {
      handleRequestError(err, t.errSelectSave);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualVillage.trim()) {
      setError(t.errVillageRequired);
      return;
    }
    setSaving(true);
    setError(null);
    setSessionExpired(false);
    const parts = [manualVillage.trim(), manualDistrict.trim(), manualState.trim()].filter(Boolean);
    const payload: UserLocation = {
      name: parts.slice(0, 2).join(', '),
      village: manualVillage.trim(),
      district: manualDistrict.trim() || undefined,
      state: manualState.trim() || undefined,
      lat: detectedCoords?.lat,
      lon: detectedCoords?.lon,
      source: detectedCoords ? 'gps' : 'manual',
    };

    try {
      const res = await apiFetch<{ user: AuthUser; location: UserLocation }>('/api/location', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      onLocationSaved(res.user, res.location);
    } catch (err) {
      handleRequestError(err, t.errManualSave);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl dark:border-emerald-800 dark:bg-[#0D2115]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#15803D] dark:bg-emerald-900/60 dark:text-emerald-300">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#0D2315] dark:text-white">
                {t.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-emerald-200/75">
                {t.subtitlePrefix} {username}, {t.subtitleSuffix}
              </p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
              aria-label={t.closeAria}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-emerald-200/80 bg-[#F2FBF4] p-4 dark:border-emerald-800/70 dark:bg-emerald-950/40">
            <p className="text-xs leading-relaxed text-slate-700 dark:text-emerald-100/85">
              {t.privacyNote}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleUseGps}
                disabled={detecting || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-60"
              >
                {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                {detecting ? t.detecting : t.allowGps}
              </button>
              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-[#0D2115] dark:text-emerald-200"
              >
                {t.enterManuallyBtn}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
            >
              <p>{error}</p>
              {sessionExpired && onSessionExpired && (
                <button
                  type="button"
                  onClick={onSessionExpired}
                  className="mt-2 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900"
                >
                  {t.signInAgain}
                </button>
              )}
            </div>
          )}

          {/* Optional Geocoding Search */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-emerald-100">
              {t.searchLabel}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder={t.searchPlaceholder}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || searchQuery.trim().length < 2}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t.searchBtn}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-emerald-900 dark:border-emerald-800">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelectResult(r)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                  >
                    <span className="font-medium text-slate-800 dark:text-emerald-100">{r.name}</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-emerald-300/70">
                      {r.lat?.toFixed(3)}, {r.lon?.toFixed(3)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {manualMode && (
            <form onSubmit={handleSaveManual} className="space-y-3 border-t border-slate-100 pt-3 dark:border-emerald-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 dark:text-emerald-100">
                  {t.manualEntryTitle}
                </p>
                {detectedCoords && (
                  <span className="font-mono text-[10px] text-emerald-700 tabular-nums dark:text-emerald-300">
                    GPS: {detectedCoords.lat.toFixed(4)}, {detectedCoords.lon.toFixed(4)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  value={manualVillage}
                  onChange={(e) => setManualVillage(e.target.value)}
                  placeholder={t.villagePlaceholder}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
                <input
                  type="text"
                  value={manualDistrict}
                  onChange={(e) => setManualDistrict(e.target.value)}
                  placeholder={t.districtPlaceholder}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
                <input
                  type="text"
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  placeholder={t.statePlaceholder}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-60"
                >
                  {saving ? t.saving : t.saveLocation}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
