import type { IntegrationsStatus } from '../../src/types';

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 8);
}

export function isGnaniConfigured(): boolean {
  const key = process.env.GNANI_API_KEY?.trim();
  return Boolean(key && key.length > 6);
}

export function isMandiApiConfigured(): boolean {
  const key = process.env.DATA_GOV_API_KEY?.trim();
  return Boolean(key && key.length > 6);
}

export function isSmsOtpConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_VERIFY_SERVICE_SID?.trim()
  );
}

export function isEmailOtpConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.OTP_FROM_EMAIL?.trim());
}

export function getIntegrationsStatus(): IntegrationsStatus {
  const gnani = isGnaniConfigured() ? 'connected' : 'not_configured';
  const gemini = isGeminiConfigured() ? 'connected' : 'not_configured';
  return {
    gnaniStt: gnani,
    gnaniTts: gnani,
    geminiReasoning: gemini,
    weather: 'connected',
    geocoding: 'connected',
    mandi: isMandiApiConfigured() ? 'connected' : 'not_configured',
    schemes: 'connected',
    smsOtp: isSmsOtpConfigured() ? 'connected' : 'not_configured',
    emailOtp: isEmailOtpConfigured() ? 'connected' : 'not_configured',
    productCatalog: 'connected',
  };
}
