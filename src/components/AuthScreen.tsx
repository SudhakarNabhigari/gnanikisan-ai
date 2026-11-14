import {
  ArrowLeft,
  ArrowRight,
  CloudSun,
  Eye,
  EyeOff,
  Landmark,
  Leaf,
  Loader2,
  Lock,
  Sprout,
  TrendingUp,
  User,
  UserPlus,
} from 'lucide-react';
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

      const res = await apiFetch<{ user: AuthUser; token?: string; settings: UserSettings }>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

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
            className="mt-6 w-full rounded-full bg-gradient-to-r from-[#188C3F] via-[#16A34A] to-[#0E682D] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-4px_rgba(22,163,74,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-2px_rgba(34,197,94,0.75)]"
          >
            {wt.openDashboard}
          </button>
        </div>
      </div>
    );
  }

  const featureHighlights = [
    { icon: CloudSun, label: t.featWeather },
    { icon: Leaf, label: t.featCropDoctor },
    { icon: TrendingUp, label: t.featMarketPrices },
    { icon: Landmark, label: t.featGovtSchemes },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#062213] p-4 sm:p-6 lg:p-10">
      {/* Scenic Agricultural Field Sunrise Backdrop */}
      <img
        src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
        alt="Lush Indian agricultural fields at golden sunrise"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#062816]/80 via-[#0C3820]/55 to-[#061D10]/80" />

      {/* Subtle Top-Left Swaying Foliage Frame */}
      <svg
        aria-hidden="true"
        viewBox="0 0 220 180"
        className="animate-leaf-sway-left pointer-events-none fixed top-0 left-0 z-10 hidden h-36 w-44 opacity-90 sm:block"
      >
        <defs>
          <linearGradient id="topLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>
        <path d="M-8,12 C38,4 72,30 88,68 C48,74 12,52 -8,12 Z" fill="url(#topLeafGrad)" />
        <path d="M18,-6 C58,14 78,48 76,84 C42,68 18,34 18,-6 Z" fill="#65A30D" opacity="0.88" />
        <path d="M65,-8 C96,12 128,20 156,12 C130,44 92,46 65,-8 Z" fill="#84CC16" opacity="0.82" />
        <path d="M-10,58 C24,56 54,78 62,114 C28,112 -2,90 -10,58 Z" fill="#4D7C0F" opacity="0.78" />
      </svg>

      {/* Main Split-Screen Card */}
      <div className="relative z-20 grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-emerald-200/45 bg-[#F4FAF2] shadow-[0_28px_80px_-14px_rgba(3,28,13,0.78)] md:grid-cols-[47%_53%]">
        {/* Subtle Luminous Top Border Highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 z-30 h-[2px] bg-gradient-to-r from-transparent via-[#86EFAC]/80 to-transparent"
        />

        {/* LEFT PANEL: Dark Forest Green Branding + Feature Icons + Farmer & Bullocks Photo */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0D4622] via-[#083016] to-[#041D0D] text-white">
          {/* Top Brand + Headline + Four Feature Icons */}
          <div className="relative z-10 px-6 pt-7 pb-3 sm:px-8 sm:pt-8 md:pr-11">
            {/* Logo Lockup */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#15803D] shadow-[0_6px_18px_rgba(34,197,94,0.45)]">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold tracking-tight text-white">
                  GnaniKisan AI
                </div>
                <p className="text-xs font-medium text-emerald-100/85">{t.tagline}</p>
                <div className="mt-1.5 h-[2px] w-28 rounded-full bg-gradient-to-r from-[#4ADE80] via-[#A3E635]/60 to-transparent" />
              </div>
            </div>

            {/* Multilingual Hero Headline */}
            <h2 className="mt-6 font-display text-2xl leading-[1.2] font-bold tracking-tight text-white sm:text-[27px]">
              {language === 'en' ? (
                <>
                  Your trusted farming companion in{' '}
                  <span className="text-[#C2F159]">Telugu, English</span> &amp; Hindi.
                </>
              ) : (
                t.heroTitle
              )}
            </h2>

            {/* Four Feature Icons Row */}
            <div className="mt-6 grid grid-cols-4 divide-x divide-emerald-300/20 text-center">
              {featureHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex flex-col items-center px-1.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/35 bg-gradient-to-b from-emerald-500/25 to-emerald-950/75 text-[#D9F99D] shadow-inner transition-transform duration-200 hover:-translate-y-0.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="mt-2 text-[11px] leading-tight font-medium text-emerald-50/95">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exact Uploaded Farmer Ploughing with Bullocks Photograph */}
          <div className="relative mt-2 w-full overflow-hidden">
            <img
              src="/assets/aistudio/farming_img_811b60fe.webp"
              alt="Indian farmer ploughing a field with bullocks at sunrise"
              referrerPolicy="no-referrer"
              className="block aspect-[16/10] w-full object-cover object-center sm:aspect-[16/9] md:h-[250px] md:aspect-auto"
            />
            {/* Soft top edge transition so upper branding never clips abruptly */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#062612] to-transparent"
            />
            {/* Sweeping emerald foreground wave */}
            <svg
              aria-hidden="true"
              viewBox="0 0 500 54"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full"
            >
              <path
                d="M0,18 C115,52 270,44 500,8 L500,54 L0,54 Z"
                fill="#0D5E26"
                opacity="0.92"
              />
              <path
                d="M0,30 C135,54 315,48 500,18 L500,54 L0,54 Z"
                fill="#22A83B"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Curved Split Divider into Light Mint Panel (Desktop/Tablet) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 60 600"
            preserveAspectRatio="none"
            className="pointer-events-none absolute top-0 -right-px bottom-0 z-20 hidden h-full w-9 md:block"
          >
            <path
              d="M10,0 C48,140 52,290 18,450 C6,515 16,565 44,600 L60,600 L60,0 Z"
              fill="#F7FBF6"
            />
            <path
              d="M10,0 C48,140 52,290 18,450 C6,515 16,565 44,600"
              fill="none"
              stroke="url(#curveGlow)"
              strokeWidth="3"
            />
            <defs>
              <linearGradient id="curveGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#4ADE80" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#84CC16" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* RIGHT PANEL: Light Mint/Ivory Form + Language Toggle + Landscape Decoration */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#FAFDF8] via-[#F3FAF0] to-[#E8F4E4]">
          {/* Subtle Swaying Botanical Leaf Accent Top-Right */}
          <svg
            aria-hidden="true"
            viewBox="0 0 180 180"
            className="animate-leaf-sway pointer-events-none absolute top-0 right-0 z-0 h-36 w-36 opacity-55"
          >
            <path d="M180,0 C135,18 112,50 108,86 C144,74 170,46 180,0 Z" fill="#BBF7D0" />
            <path d="M150,-5 C115,28 106,68 118,108 C148,84 162,42 150,-5 Z" fill="#86EFAC" opacity="0.65" />
            <path d="M185,48 C145,56 122,82 122,118 C154,110 176,84 185,48 Z" fill="#A7F3D0" opacity="0.75" />
          </svg>

          {/* Form Content Area */}
          <div className="relative z-10 px-6 pt-7 pb-4 sm:px-10 sm:pt-9">
            {/* Heading + Language Selector Row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 inline-flex items-center gap-1.5 text-[#16A34A]">
                  <Sprout className="h-5 w-5" />
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0A2E16] sm:text-[28px]">
                  {mode === 'login' ? t.farmerLogin : t.createAccountTitle}
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                  {mode === 'login' ? t.loginSubtitle : t.registerSubtitle}
                </p>
                <div className="mt-2.5 h-[3px] w-16 rounded-full bg-gradient-to-r from-[#22C55E] to-[#84CC16]" />
              </div>

              {/* Language Selector Pill (తె | EN | हि) */}
              <div
                className="flex shrink-0 items-center rounded-full border border-emerald-200/90 bg-white/95 p-1 text-xs shadow-xs"
                role="group"
                aria-label="Language"
              >
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
                    className={`rounded-full px-2.5 py-1 font-bold transition-all duration-150 ${
                      language === l.id
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0A2E16]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              <div>
                <label htmlFor="auth-username" className="sr-only">
                  {t.username}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.usernamePlaceholder}
                    className="w-full rounded-xl border border-emerald-700/25 bg-white/95 py-3 pr-4 pl-11 text-sm text-[#0D2315] shadow-xs transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#22C55E]/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="sr-only">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === 'login' ? t.passwordLoginPlaceholder : t.passwordRegisterPlaceholder
                    }
                    className="w-full rounded-xl border border-emerald-700/25 bg-white/95 py-3 pr-11 pl-11 text-sm text-[#0D2315] shadow-xs transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#22C55E]/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-[#15803D]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-confirm-password" className="sr-only">
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.confirmPasswordPlaceholder}
                      className="w-full rounded-xl border border-emerald-700/25 bg-white/95 py-3 pr-4 pl-11 text-sm text-[#0D2315] shadow-xs transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#22C55E]/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50/95 px-3.5 py-2.5 text-xs font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Glowing Green Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#178B3F] via-[#15803D] to-[#0B5A28] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_-4px_rgba(22,163,74,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-2px_rgba(34,197,94,0.85)] active:translate-y-0 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Sprout className="h-4.5 w-4.5 text-[#D9F99D]" />
                )}
                <span>{mode === 'login' ? t.loginBtn : t.createAccountBtn}</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>

            {/* "or" Divider + Create Account / Back to Login Button */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-emerald-900/15" />
              <span className="rounded-full border border-emerald-900/10 bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                {t.orDivider}
              </span>
              <div className="h-px flex-1 bg-emerald-900/15" />
            </div>

            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-700/35 bg-white/85 px-5 py-3 text-sm font-semibold text-[#0E4723] shadow-xs transition-all duration-200 hover:border-[#16A34A] hover:bg-emerald-50"
              >
                <UserPlus className="h-4 w-4 text-[#16A34A]" />
                <span>{t.createAccountBtn}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-700/35 bg-white/85 px-5 py-3 text-sm font-semibold text-[#0E4723] shadow-xs transition-all duration-200 hover:border-[#16A34A] hover:bg-emerald-50"
              >
                <ArrowLeft className="h-4 w-4 text-[#16A34A]" />
                <span>{t.backToLogin}</span>
              </button>
            )}
          </div>

          {/* Bottom Agricultural Sunrise, Hills & Farm Cottage Illustration */}
          <div className="pointer-events-none relative mt-2 h-24 w-full overflow-hidden select-none sm:h-28">
            <svg
              aria-hidden="true"
              viewBox="0 0 600 130"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <radialGradient id="sunriseGlow" cx="40%" cy="76%" r="48%">
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#FDE047" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="hillFront" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4ADE80" />
                  <stop offset="45%" stopColor="#65A30D" />
                  <stop offset="100%" stopColor="#16A34A" />
                </linearGradient>
                <linearGradient id="hillMid" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A7F3D0" />
                  <stop offset="55%" stopColor="#86EFAC" />
                  <stop offset="100%" stopColor="#4ADE80" />
                </linearGradient>
              </defs>

              {/* Soft Morning Sun Halo & Disc */}
              <rect x="0" y="0" width="600" height="130" fill="url(#sunriseGlow)" />
              <circle cx="242" cy="88" r="19" fill="#FEF9C3" />

              {/* Distant Misty Hills */}
              <path
                d="M0,78 Q80,52 175,74 T365,68 T600,60 L600,130 L0,130 Z"
                fill="#CBE5D0"
                opacity="0.7"
              />
              <path
                d="M0,88 Q125,64 250,82 T475,72 T600,82 L600,130 L0,130 Z"
                fill="url(#hillMid)"
                opacity="0.82"
              />

              {/* Rolling Cultivated Green Fields */}
              <path
                d="M0,104 C135,88 265,78 415,82 C505,84 560,92 600,98 L600,130 L0,130 Z"
                fill="url(#hillFront)"
              />
              <path
                d="M110,130 C215,98 335,88 510,104 L600,115 L600,130 Z"
                fill="#15803D"
                opacity="0.85"
              />
              {/* Subtle Crop Row Lines */}
              <path
                d="M160,126 C245,103 345,96 440,105"
                fill="none"
                stroke="#A3E635"
                strokeWidth="1.6"
                opacity="0.55"
              />
              <path
                d="M195,130 C275,110 365,104 460,114"
                fill="none"
                stroke="#BEF264"
                strokeWidth="1.4"
                opacity="0.45"
              />

              {/* Small Rural Farm Cottage & Trees on Right */}
              <g transform="translate(432, 46)">
                {/* Left Tree */}
                <rect x="6" y="34" width="4" height="16" fill="#78350F" />
                <circle cx="8" cy="26" r="13" fill="#65A30D" />
                <circle cx="14" cy="29" r="9" fill="#84CC16" />

                {/* Cottage Body */}
                <rect x="26" y="29" width="38" height="22" rx="1.5" fill="#FFFBEB" stroke="#E5E7EB" strokeWidth="0.8" />
                {/* Chimney */}
                <rect x="52" y="13" width="5" height="10" fill="#B45309" />
                {/* Roof */}
                <polygon points="22,30 45,14 68,30" fill="#D97706" />
                {/* Door & Window */}
                <rect x="41" y="38" width="8" height="13" rx="1" fill="#92400E" />
                <rect x="30" y="35" width="7" height="7" rx="1" fill="#FDE68A" />
                <rect x="53" y="35" width="7" height="7" rx="1" fill="#FDE68A" />

                {/* Right Shade Tree */}
                <rect x="78" y="28" width="5" height="24" fill="#78350F" />
                <circle cx="80" cy="18" r="16" fill="#15803D" />
                <circle cx="71" cy="23" r="10" fill="#22C55E" />
                <circle cx="90" cy="22" r="10" fill="#4ADE80" />
              </g>

              {/* Sweeping Bottom Emerald Wave Seam */}
              <path
                d="M0,118 C175,132 385,112 600,120 L600,130 L0,130 Z"
                fill="#16A34A"
                opacity="0.92"
              />
            </svg>
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
