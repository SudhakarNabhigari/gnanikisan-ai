import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import { apiFetch } from '../lib/api';
import type { AppLanguage, IntegrationsStatus, UserProfile } from '../types';

export function ProfilePage({ language }: { language: AppLanguage }) {
  const t = TRANSLATIONS[language].profile;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<UserProfile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mobile OTP state
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpDigits, setMobileOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [mobileCooldown, setMobileCooldown] = useState(0);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);
  const [mobileOtpMsg, setMobileOtpMsg] = useState<string | null>(null);

  // Email OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtpMsg, setEmailOtpMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ profile: UserProfile; integrations: IntegrationsStatus }>('/api/profile')
      .then((res) => {
        setProfile(res.profile);
        setSavedSnapshot(res.profile);
        setIntegrations(res.integrations);
        setFullName(res.profile.fullName || '');
        setMobileNumber(res.profile.mobileNumber || '');
        setEmail(res.profile.email || '');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const t = window.setInterval(() => setMobileCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [mobileCooldown]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const t = window.setInterval(() => setEmailCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [emailCooldown]);

  const cleanMobileDigits = mobileNumber.replace(/\D/g, '');
  const normalized10 =
    cleanMobileDigits.length === 12 && cleanMobileDigits.startsWith('91')
      ? cleanMobileDigits.slice(2)
      : cleanMobileDigits;
  const isValidMobile = /^[6-9]\d{9}$/.test(normalized10);
  const isValidEmail = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const smsConfigured = integrations?.smsOtp === 'connected';
  const emailConfigured = integrations?.emailOtp === 'connected';

  const handleOtpInput = (
    digits: string[],
    setDigits: (next: string[]) => void,
    idx: number,
    value: string,
    prefix: string
  ) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < 5) {
      document.getElementById(`${prefix}-otp-${idx + 1}`)?.focus();
    }
  };

  const handleSendMobileOtp = async () => {
    setMobileOtpMsg(null);
    setSendingMobileOtp(true);
    try {
      const res = await apiFetch<{ sent: boolean; message: string }>('/api/profile/otp/mobile/send', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber: normalized10 }),
      });
      setMobileOtpSent(true);
      setMobileCooldown(30);
      setMobileOtpMsg(res.message);
    } catch (err) {
      setMobileOtpMsg(err instanceof Error ? err.message : t.serviceNotConfigured);
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    const code = mobileOtpDigits.join('');
    if (code.length !== 6) {
      setMobileOtpMsg(t.errOtpDigits);
      return;
    }
    setVerifyingMobileOtp(true);
    setMobileOtpMsg(null);
    try {
      const res = await apiFetch<{ verified: boolean; message: string; profile: UserProfile }>(
        '/api/profile/otp/mobile/verify',
        {
          method: 'POST',
          body: JSON.stringify({ mobileNumber: normalized10, code }),
        }
      );
      setProfile(res.profile);
      setSavedSnapshot(res.profile);
      setMobileOtpSent(false);
      setMobileOtpMsg(res.message);
    } catch (err) {
      setMobileOtpMsg(err instanceof Error ? err.message : t.errOtpVerifyFail);
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setEmailOtpMsg(null);
    setSendingEmailOtp(true);
    try {
      const res = await apiFetch<{ sent: boolean; message: string }>('/api/profile/otp/email/send', {
        method: 'POST',
        body: JSON.stringify({ email: String(email ?? '').trim() }),
      });
      setEmailOtpSent(true);
      setEmailCooldown(30);
      setEmailOtpMsg(res.message);
    } catch (err) {
      setEmailOtpMsg(err instanceof Error ? err.message : t.serviceNotConfigured);
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const code = emailOtpDigits.join('');
    if (code.length !== 6) {
      setEmailOtpMsg(t.errOtpDigits);
      return;
    }
    setVerifyingEmailOtp(true);
    setEmailOtpMsg(null);
    try {
      const res = await apiFetch<{ verified: boolean; message: string; profile: UserProfile }>(
        '/api/profile/otp/email/verify',
        {
          method: 'POST',
          body: JSON.stringify({ email: String(email ?? '').trim(), code }),
        }
      );
      setProfile(res.profile);
      setSavedSnapshot(res.profile);
      setEmailOtpSent(false);
      setEmailOtpMsg(res.message);
    } catch (err) {
      setEmailOtpMsg(err instanceof Error ? err.message : t.errOtpVerifyFail);
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const trimmedName = String(fullName ?? '').trim();
    const trimmedEmail = String(email ?? '').trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', text: t.errNameRequired });
      return;
    }
    if (!isValidMobile) {
      setFeedback({
        type: 'error',
        text: t.errMobileInvalid,
      });
      return;
    }
    if (!isValidEmail) {
      setFeedback({ type: 'error', text: t.errEmailInvalid });
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ profile: UserProfile }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: trimmedName,
          mobileNumber: normalized10,
          email: trimmedEmail,
        }),
      });
      setProfile(res.profile);
      setSavedSnapshot(res.profile);
      setFeedback({ type: 'success', text: t.savedSuccess });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : t.errSaveFail,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!savedSnapshot) return;
    setFullName(savedSnapshot.fullName || '');
    setMobileNumber(savedSnapshot.mobileNumber || '');
    setEmail(savedSnapshot.email || '');
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Top Banner (Reference Image 4) */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/15 bg-[#0F3F23] p-5 text-white shadow-xs">
        <img
          src="/src/assets/images/farm_sunrise_banner_1794593806581.jpg"
          alt="Sunrise agricultural field"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A321B]/90 via-[#0E4223]/65 to-[#0A321B]/80" />
        <div className="relative z-10 flex items-center gap-4">
          <img
            src="/src/assets/images/indian_farmer_portrait_1794593807306.jpg"
            alt="Farmer profile portrait"
            referrerPolicy="no-referrer"
            className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/75 object-cover shadow-md"
          />
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{t.title}</h2>
            <p className="mt-0.5 text-xs text-emerald-100 sm:text-sm">
              {t.subtitle}
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main 2-Column Profile & Verification Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Personal Details */}
        <section className="space-y-4 rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-xs lg:col-span-6 dark:border-emerald-800/60 dark:bg-[#0D2115]">
          <div className="flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-[#16A34A]" />
            <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
              {t.personalDetails}
            </h3>
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#F7FBF7] p-4 dark:border-emerald-900 dark:bg-[#08150D]">
            <label className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-emerald-100">
              {t.fullNameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#0D2115] dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#F7FBF7] p-4 dark:border-emerald-900 dark:bg-[#08150D]">
            <div className="flex items-center justify-between">
              <label className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-emerald-100">
                {t.mobileNumberLabel} <span className="text-red-500">*</span>
              </label>
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums ${
                  isValidMobile ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'
                }`}
              >
                {normalized10.length}/10 {t.digitsSuffix}
              </span>
            </div>
            <input
              type="tel"
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder={t.mobilePlaceholder}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#0D2115] dark:text-white"
            />
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-emerald-200/70">
              {t.mobileHelp}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-[#F7FBF7] p-4 dark:border-emerald-900 dark:bg-[#08150D]">
            <div className="flex items-center justify-between">
              <label className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-emerald-100">
                {t.emailLabel} <span className="text-slate-400">{t.optionalLabel}</span>
              </label>
              {email.trim() && (
                <span
                  className={`text-[11px] font-semibold ${
                    isValidEmail ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'
                  }`}
                >
                  {isValidEmail ? t.validEmail : t.invalidFormat}
                </span>
              )}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#16A34A] focus:outline-none dark:border-emerald-800 dark:bg-[#0D2115] dark:text-white"
            />
          </div>
        </section>

        {/* Right: Mobile & Email OTP Verification */}
        <div className="space-y-5 lg:col-span-6">
          {/* Verify Mobile Number */}
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16A34A] text-white">
                  <Phone className="h-4 w-4" />
                </div>
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.verifyMobileTitle}
                </h3>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  profile?.mobileVerified && profile.mobileNumber === normalized10
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-[#08150D] dark:text-emerald-200/70'
                }`}
              >
                {profile?.mobileVerified && profile.mobileNumber === normalized10
                  ? t.verifiedBadge
                  : t.unverifiedBadge}
              </span>
            </div>

            {!smsConfigured ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-semibold">{t.serviceNotConfigured}</p>
                <p className="mt-1 leading-relaxed">
                  {t.smsOtpNotice}
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-3 rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 dark:bg-emerald-950 dark:text-emerald-400/50"
                >
                  {t.sendOtpUnavailable}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600 dark:text-emerald-200/80">
                    {isValidMobile ? `${t.readyToVerifyPrefix} ${normalized10}` : t.enterMobileFirst}
                  </span>
                  <button
                    type="button"
                    disabled={!isValidMobile || sendingMobileOtp || mobileCooldown > 0}
                    onClick={handleSendMobileOtp}
                    className="rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-50"
                  >
                    {sendingMobileOtp
                      ? t.sendingBtn
                      : mobileCooldown > 0
                        ? `${t.resendInPrefix} ${mobileCooldown}s`
                        : mobileOtpSent
                          ? t.resendOtpBtn
                          : t.sendOtpBtn}
                  </button>
                </div>

                {mobileOtpSent && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      {mobileOtpDigits.map((d, idx) => (
                        <input
                          key={idx}
                          id={`mobile-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) =>
                            handleOtpInput(
                              mobileOtpDigits,
                              setMobileOtpDigits,
                              idx,
                              e.target.value,
                              'mobile'
                            )
                          }
                          className="h-11 w-11 rounded-xl border border-emerald-300 bg-white text-center font-mono text-base font-bold text-[#0D2315] focus:border-[#16A34A] focus:outline-none dark:border-emerald-700 dark:bg-[#08150D] dark:text-white"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={verifyingMobileOtp}
                      onClick={handleVerifyMobileOtp}
                      className="w-full rounded-xl bg-[#15803D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
                    >
                      {verifyingMobileOtp ? t.verifyingBtn : t.verifyConfirmBtn}
                    </button>
                  </div>
                )}
                {mobileOtpMsg && (
                  <p className="text-xs font-medium text-slate-700 dark:text-emerald-200">{mobileOtpMsg}</p>
                )}
              </div>
            )}
          </section>

          {/* Verify Email */}
          <section className="rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-xs dark:border-emerald-800/60 dark:bg-[#0D2115]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="font-display text-base font-bold text-[#0D2315] dark:text-white">
                  {t.verifyEmailTitle}
                </h3>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                  profile?.emailVerified && profile.email === email.trim() && email.trim()
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-[#08150D] dark:text-emerald-200/70'
                }`}
              >
                {profile?.emailVerified && profile.email === email.trim() && email.trim()
                  ? t.verifiedBadge
                  : t.unverifiedBadge}
              </span>
            </div>

            {!emailConfigured ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-semibold">{t.serviceNotConfigured}</p>
                <p className="mt-1 leading-relaxed">
                  {t.emailOtpNotice}
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-3 rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 dark:bg-emerald-950 dark:text-emerald-400/50"
                >
                  {t.verifyEmailUnavailable}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs text-slate-600 dark:text-emerald-200/80">
                    {email.trim() && isValidEmail ? email.trim() : t.enterEmailFirst}
                  </span>
                  <button
                    type="button"
                    disabled={!email.trim() || !isValidEmail || sendingEmailOtp || emailCooldown > 0}
                    onClick={handleSendEmailOtp}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {sendingEmailOtp
                      ? t.sendingBtn
                      : emailCooldown > 0
                        ? `${t.resendInPrefix} ${emailCooldown}s`
                        : t.sendEmailOtpBtn}
                  </button>
                </div>

                {emailOtpSent && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      {emailOtpDigits.map((d, idx) => (
                        <input
                          key={idx}
                          id={`email-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) =>
                            handleOtpInput(
                              emailOtpDigits,
                              setEmailOtpDigits,
                              idx,
                              e.target.value,
                              'email'
                            )
                          }
                          className="h-11 w-11 rounded-xl border border-purple-300 bg-white text-center font-mono text-base font-bold text-[#0D2315] focus:border-purple-600 focus:outline-none dark:border-emerald-700 dark:bg-[#08150D] dark:text-white"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={verifyingEmailOtp}
                      onClick={handleVerifyEmailOtp}
                      className="w-full rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
                    >
                      {verifyingEmailOtp ? t.verifyingBtn : t.verifyConfirmBtn}
                    </button>
                  </div>
                )}
                {emailOtpMsg && (
                  <p className="text-xs font-medium text-slate-700 dark:text-emerald-200">{emailOtpMsg}</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom Privacy & Save Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-emerald-200/70 bg-[#ECF9EE] p-4 sm:flex-row sm:items-center dark:border-emerald-800/60 dark:bg-[#0D2115]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0D2315] dark:text-white">
              {t.safeTitle}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-emerald-200/80">
              {t.safeSubtitle}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-[#08150D] dark:text-emerald-100"
          >
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#166534] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t.saveChangesBtn}
          </button>
        </div>
      </div>
    </form>
  );
}
