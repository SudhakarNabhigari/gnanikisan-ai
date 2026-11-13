import crypto from 'node:crypto';
import { isEmailOtpConfigured, isSmsOtpConfigured } from './integrations';

interface PendingEmailOtp {
  codeHash: string;
  email: string;
  expiresAt: number;
}

const emailOtpMap = new Map<string, PendingEmailOtp>();

function normalizeIndianMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  throw new Error('Invalid 10-digit Indian mobile number.');
}

export async function sendMobileOtp(mobile: string): Promise<{ sent: boolean; message: string }> {
  if (!isSmsOtpConfigured()) {
    return {
      sent: false,
      message: 'Verification service not configured',
    };
  }

  const e164 = normalizeIndianMobile(mobile);
  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!.trim();

  const body = new URLSearchParams({
    To: e164,
    Channel: 'sms',
  });

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`SMS provider error (${res.status}): ${err.slice(0, 160)}`);
  }

  return { sent: true, message: `OTP sent to ${e164}` };
}

export async function verifyMobileOtp(
  mobile: string,
  code: string
): Promise<{ verified: boolean; message: string }> {
  if (!isSmsOtpConfigured()) {
    return { verified: false, message: 'Verification service not configured' };
  }

  const e164 = normalizeIndianMobile(mobile);
  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!.trim();

  const body = new URLSearchParams({
    To: e164,
    Code: code.trim(),
  });

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OTP check failed (${res.status}): ${err.slice(0, 160)}`);
  }

  const data = (await res.json()) as { status?: string };
  if (data.status === 'approved') {
    return { verified: true, message: 'Mobile number verified successfully.' };
  }
  return { verified: false, message: 'Invalid or expired OTP code.' };
}

export async function sendEmailOtp(
  userId: string,
  email: string
): Promise<{ sent: boolean; message: string }> {
  if (!isEmailOtpConfigured()) {
    return {
      sent: false,
      message: 'Verification service not configured',
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const otp = String(crypto.randomInt(100000, 999999));
  const codeHash = crypto.createHash('sha256').update(`${userId}:${cleanEmail}:${otp}`).digest('hex');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.OTP_FROM_EMAIL!.trim(),
      to: [cleanEmail],
      subject: 'GnaniKisan AI — Email Verification Code',
      text: `Your GnaniKisan AI verification code is: ${otp}. It expires in 10 minutes.`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Email provider error (${res.status}): ${err.slice(0, 160)}`);
  }

  emailOtpMap.set(userId, {
    codeHash,
    email: cleanEmail,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return { sent: true, message: `Verification code sent to ${cleanEmail}` };
}

export function verifyEmailOtp(
  userId: string,
  email: string,
  code: string
): { verified: boolean; message: string } {
  if (!isEmailOtpConfigured()) {
    return { verified: false, message: 'Verification service not configured' };
  }

  const pending = emailOtpMap.get(userId);
  const cleanEmail = email.trim().toLowerCase();
  if (!pending || pending.email !== cleanEmail) {
    return { verified: false, message: 'No active verification code for this email.' };
  }
  if (Date.now() > pending.expiresAt) {
    emailOtpMap.delete(userId);
    return { verified: false, message: 'Verification code expired. Please request a new one.' };
  }

  const candidateHash = crypto
    .createHash('sha256')
    .update(`${userId}:${cleanEmail}:${code.trim()}`)
    .digest('hex');

  if (candidateHash !== pending.codeHash) {
    return { verified: false, message: 'Incorrect verification code.' };
  }

  emailOtpMap.delete(userId);
  return { verified: true, message: 'Email verified successfully.' };
}
