import { Eye, EyeOff, Leaf, Loader2, Lock, ShieldCheck, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch, setAuthToken } from '../lib/api';
import type { AppLanguage, AuthUser, UserLocation, UserSettings } from '../types';
import { LocationModal } from './LocationModal';

interface AuthScreenProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  onAuthenticated: (user: AuthUser, settings: UserSettings) => void;
}

export function AuthScreen({ language, onChangeLanguage, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingAuth, setPendingAuth] = useState<{
    user: AuthUser;
    settings: UserSettings;
  } | null>(null);
  const [welcomeReady, setWelcomeReady] = useState(false);

  const t = TRANSLATIONS[language].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      setError(t.errUsernameMin);
      return;
    }
    if (password.length < 6) {
      setError(t.errPasswordMin);
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError(t.errPasswordMismatch);
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { username: cleanUser, password }
          : { username: cleanUser, password, confirmPassword };

      const res = await apiFetch<{ user: AuthUser; token?: string; settings: UserSettings }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.token) {
        setAuthToken(res.token);
      }

      // If the user already picked a language on the AuthScreen (or created a new account), honor it if registering
      let effectiveSettings = res.settings;
      if (mode === 'register' && language !== res.settings.language) {
        const updated = await apiFetch<{ settings: UserSettings }>('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ language }),
        }).catch(() => null);
        if (updated?.settings) {
          effectiveSettings = updated.settings;
        }
      } else if (res.settings.language !== language) {
        onChangeLanguage(res.settings.language);
      }

      setPendingAuth({ user: res.user, settings: effectiveSettings });
      if (res.user.location) {
        setWelcomeReady(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errAuthFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSaved = (updatedUser: AuthUser, _loc: UserLocation) => {
    if (!pendingAuth) return;
    setPendingAuth({ ...pendingAuth, user: updatedUser });
    setWelcomeReady(true);
  };

  const handleSessionExpired = () => {
    setAuthToken(null);
    setPendingAuth(null);
    setWelcomeReady(false);
    setError(t.errSessionExpired);
  };

  if (pendingAuth && welcomeReady) {
    const wt = TRANSLATIONS[pendingAuth.settings.language || language].auth;
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#082515] p-6">
        <img
          src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
          alt="Green Indian agricultural fields at sunrise"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200/30 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-md dark:border-emerald-800 dark:bg-[#0D2115]/95">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16A34A] text-white shadow-lg">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-[#0D2315] dark:text-white">
            {wt.welcomeTitle.replace('{username}', pendingAuth.user.username)}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-emerald-200/80">
            {wt.farmLocationSetTo}{' '}
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              {pendingAuth.user.location?.name || wt.yourFarm}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => onAuthenticated(pendingAuth.user, pendingAuth.settings)}
            className="mt-6 w-full rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803D]"
          >
            {wt.openDashboard}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#082515] p-4 sm:p-8">
      <img
        src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
        alt="Indian paddy fields at sunrise"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#072616]/90 via-[#0B3520]/75 to-[#061A0F]/90" />

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-200/20 bg-white/95 shadow-2xl backdrop-blur-md md:grid-cols-12 dark:border-emerald-800/70 dark:bg-[#0B1D13]/95">
        {/* Left Agricultural Brand Panel */}
        <div className="relative flex flex-col justify-between bg-gradient-to-b from-[#0E3F24] to-[#082716] p-8 text-white md:col-span-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#16A34A] shadow-md">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight">GnaniKisan AI</span>
                <p className="text-xs text-emerald-200/80">{t.tagline}</p>
              </div>
            </div>

            <h2 className="mt-8 font-display text-2xl font-bold leading-snug text-white">
              {t.heroTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/80">
              {t.heroDesc}
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-950/50 p-3.5 text-xs text-emerald-100/85">
            <div className="flex items-center gap-2 font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{t.prototypeTitle}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-200/75">
              {t.prototypeDesc}
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 md:col-span-7 md:p-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#0D2315] dark:text-white">
                {mode === 'login' ? t.farmerLogin : t.createAccountTitle}
              </h1>
              <p className="mt-1 text-xs text-slate-600 dark:text-emerald-200/75">
                {mode === 'login' ? t.loginSubtitle : t.registerSubtitle}
              </p>
            </div>

            <div className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-emerald-800 dark:bg-[#08150D]">
              {(
                [
                  { id: 'te', label: 'తె' },
                  { id: 'en', label: 'EN' },
                  { id: 'hi', label: 'हि' },
                ] as const
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onChangeLanguage(l.id)}
                  className={`rounded-lg px-2 py-1 font-semibold transition ${
                    language === l.id
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-emerald-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="auth-username"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-emerald-100"
              >
                {t.username}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-emerald-100"
              >
                {t.password}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? t.passwordLoginPlaceholder : t.passwordRegisterPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-11 pl-10 text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-emerald-100"
                >
                  {t.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#08150D] dark:text-white"
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803D] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? t.loginBtn : t.createAccountBtn}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center dark:border-emerald-900">
            {mode === 'login' ? (
              <p className="text-xs text-slate-600 dark:text-emerald-200/80">
                {t.newToApp}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-[#15803D] hover:underline dark:text-emerald-300"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {t.createAccountBtn}
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600 dark:text-emerald-200/80">
                {t.alreadyAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-semibold text-[#15803D] hover:underline dark:text-emerald-300"
                >
                  {t.backToLogin}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Post-Auth Location Onboarding */}
      {pendingAuth && !pendingAuth.user.location && (
        <LocationModal
          isOpen={true}
          canClose={false}
          language={pendingAuth.settings.language || language}
          username={pendingAuth.user.username}
          onLocationSaved={handleLocationSaved}
          onSessionExpired={handleSessionExpired}
        />
      )}
    </div>
  );
}
