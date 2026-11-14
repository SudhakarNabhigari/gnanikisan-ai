import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  fetchLiveWeather,
  fetchMandiPrices,
  getRecommendedSchemes,
  reverseGeocode,
  searchLocations,
} from './server/services/agricultureData';
import {
  analyzeCropImage,
  detectTextLanguage,
  generateCropDoctorFollowUp,
  generateFarmAssistantReply,
  synthesizeSpeechWithGeminiFallback,
  transcribeAndDetectAudioWithGemini,
} from './server/services/gemini';
import {
  buildTurnAudioFilename,
  generateAllHistoryZip,
  generateCropDoctorPdfBuffer,
  generateCropDoctorZip,
  generateVoiceConversationZip,
  generateVoicePdfBuffer,
  slugifyFilename,
} from './server/services/historyExport';
import {
  mapLanguageToGnaniCode,
  synthesizeWithGnaniTimbre,
  transcribeWithGnaniPrisma,
} from './server/services/gnani';
import {
  getIntegrationsStatus,
  isGeminiConfigured,
  isGnaniConfigured,
} from './server/services/integrations';
import {
  sendEmailOtp,
  sendMobileOtp,
  verifyEmailOtp,
  verifyMobileOtp,
} from './server/services/otp';
import { cleanupExpiredExports, createMediaUpload, defaultSettings, deleteUserMedia, downloadUserMedia, signedMediaUrl, signSessionToken, store, uploadUserMedia, verifySessionToken } from './server/store';
import type {
  AppLanguage,
  CropDoctorRecord,
  CropDoctorTurn,
  UserLocation,
  VoiceConversation,
  VoiceTurn,
} from './src/types';

const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE = 'gk_session';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

function isHttpsRequest(req: Request): boolean {
  const xfProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(xfProto) ? xfProto[0] : xfProto;
  return Boolean(req.secure || (proto && proto.split(',')[0].trim() === 'https'));
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const secure = isHttpsRequest(req);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(req: Request, res: Response): void {
  const secure = isHttpsRequest(req);
  res.clearCookie(SESSION_COOKIE, {
    path: '/',
    sameSite: secure ? 'none' : 'lax',
    secure,
  });
}

function extractSessionToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE];
}

interface AuthedRequest extends Request {
  userId?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractSessionToken(req);
  const userId = verifySessionToken(token);
  if (!userId || !(await store.getUserById(userId))) {
    res.status(401).json({
      error: 'Your login session is missing or expired. Please sign in again to continue.',
      code: 'SESSION_EXPIRED',
    });
    return;
  }
  req.userId = userId;
  next();
}

async function synthesizeBestAvailableTts(params: {
  text: string;
  language: AppLanguage;
  voice?: string;
  speed?: number;
}): Promise<{
  audioBase64?: string;
  audioMime?: string;
  ttsProvider: 'gnani-timbre' | 'gemini-fallback' | 'browser-fallback' | 'none';
  ttsError?: string;
}> {
  const errors: string[] = [];

  if (isGnaniConfigured()) {
    try {
      const gnani = await synthesizeWithGnaniTimbre({
        text: params.text,
        language: params.language,
        voice: params.voice,
        speed: params.speed,
      });
      if (gnani.audioBase64 && gnani.audioBase64.trim().length >= 32) {
        return {
          audioBase64: gnani.audioBase64,
          audioMime: gnani.audioMime || 'audio/mpeg',
          ttsProvider: 'gnani-timbre',
        };
      }
      errors.push('Gnani Timbre TTS: returned empty audio payload.');
    } catch (err) {
      const msg = (err as Error).message;
      errors.push(`Gnani Timbre TTS: ${msg}`);
    }
  }

  if (isGeminiConfigured()) {
    try {
      const gem = await synthesizeSpeechWithGeminiFallback(params.text);
      if (gem.audioBase64 && gem.audioBase64.trim().length >= 32) {
        return {
          audioBase64: gem.audioBase64,
          audioMime: gem.audioMime || 'audio/wav',
          ttsProvider: 'gemini-fallback',
        };
      }
      errors.push('Gemini TTS: returned empty audio payload.');
    } catch (err) {
      const msg = (err as Error).message;
      errors.push(`Gemini TTS: ${msg}`);
    }
  }

  if (errors.length > 0) {
    console.warn('All server TTS providers failed:', errors.join(' | '));
  }

  return {
    ttsProvider: errors.length > 0 ? 'none' : 'browser-fallback',
    ...(errors.length > 0 ? { ttsError: errors.join(' | ') } : {}),
  };
}

async function persistVoiceMedia(userId: string, conversation: VoiceConversation): Promise<VoiceConversation> {
  const turns = await Promise.all(conversation.turns.map(async (turn) => {
    if (turn.audioStoragePath) return { ...turn, audioBase64: undefined };
    if (!turn.audioBase64) return turn;
    const audioStoragePath = await uploadUserMedia(userId, 'audio', Buffer.from(turn.audioBase64, 'base64'), turn.audioMime || 'audio/wav');
    return { ...turn, audioStoragePath, audioBase64: undefined };
  }));
  const stored = { ...conversation, turns };
  await store.upsertVoiceConversation(userId, stored);
  return stored;
}

async function persistCropMedia(userId: string, record: CropDoctorRecord): Promise<CropDoctorRecord> {
  let imageStoragePath = record.imageStoragePath;
  if (!imageStoragePath && record.imageDataUrl?.startsWith('data:image/')) {
    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i.exec(record.imageDataUrl);
    if (match) {
      const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
      imageStoragePath = await uploadUserMedia(userId, 'image', Buffer.from(match[2], 'base64'), mime);
    }
  }
  const turns = await Promise.all(record.turns.map(async (turn) => {
    if (!turn.audioBase64) return turn;
    const audioStoragePath = await uploadUserMedia(userId, 'audio', Buffer.from(turn.audioBase64, 'base64'), turn.audioMime || 'audio/wav');
    return { ...turn, audioStoragePath, audioBase64: undefined };
  }));
  const stored = { ...record, imageStoragePath, imageDataUrl: imageStoragePath ? '' : record.imageDataUrl, turns };
  await store.upsertCropDoctorRecord(userId, stored);
  return stored;
}

async function presentVoice(userId: string, conversation: VoiceConversation): Promise<VoiceConversation> {
  const stored = await persistVoiceMedia(userId, conversation);
  return { ...stored, turns: await Promise.all(stored.turns.map(async (turn) => ({
    ...turn,
    audioBase64: undefined,
    audioUrl: turn.audioStoragePath ? await signedMediaUrl(userId, turn.audioStoragePath, 3600) : undefined,
  }))) };
}

async function presentCrop(userId: string, record: CropDoctorRecord): Promise<CropDoctorRecord> {
  const stored = await persistCropMedia(userId, record);
  return {
    ...stored,
    imageDataUrl: stored.imageStoragePath ? await signedMediaUrl(userId, stored.imageStoragePath, 3600) : stored.imageDataUrl,
    turns: await Promise.all(stored.turns.map(async (turn) => ({
      ...turn,
      audioBase64: undefined,
      audioUrl: turn.audioStoragePath ? await signedMediaUrl(userId, turn.audioStoragePath, 3600) : undefined,
    }))),
  };
}

async function sendStoredDownload(userId: string, buffer: Buffer, mime: string, filename: string, res: Response): Promise<void> {
  await cleanupExpiredExports(userId);
  const objectPath = await uploadUserMedia(userId, 'export', buffer, mime);
  res.redirect(302, await signedMediaUrl(userId, objectPath, 300, filename));
}

async function materializeVoice(userId: string, conversation: VoiceConversation): Promise<VoiceConversation> {
  return { ...conversation, turns: await Promise.all(conversation.turns.map(async (turn) => ({
    ...turn,
    audioBase64: turn.audioStoragePath ? (await downloadUserMedia(userId, turn.audioStoragePath)).toString('base64') : turn.audioBase64,
  }))) };
}

async function materializeCrop(userId: string, record: CropDoctorRecord): Promise<CropDoctorRecord> {
  const imageDataUrl = record.imageStoragePath
    ? `data:${record.imageStoragePath.toLowerCase().endsWith('.png') ? 'image/png' : record.imageStoragePath.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'};base64,${(await downloadUserMedia(userId, record.imageStoragePath)).toString('base64')}`
    : record.imageDataUrl;
  return {
    ...record,
    imageDataUrl,
    turns: await Promise.all(record.turns.map(async (turn) => ({
      ...turn,
      audioBase64: turn.audioStoragePath ? (await downloadUserMedia(userId, turn.audioStoragePath)).toString('base64') : turn.audioBase64,
    }))),
  };
}

async function createServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16mb' }));

  // Express 4 does not forward rejected route promises to its error middleware.
  const routeMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
  const routeApp = app as unknown as Record<(typeof routeMethods)[number], (...args: unknown[]) => unknown>;
  for (const method of routeMethods) {
    const original = routeApp[method].bind(app);
    routeApp[method] = (...args: unknown[]) => original(...args.map((arg) => {
      if (typeof arg !== 'function' || arg.constructor.name !== 'AsyncFunction') return arg;
      const handler = arg as (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
      return (req: Request, res: Response, next: NextFunction) => { void Promise.resolve(handler(req, res, next)).catch(next); };
    }));
  }

  app.get('/api/health/database', async (_req, res) => {
    try {
      await store.healthCheck();
      res.json({ status: 'ok', database: 'reachable' });
    } catch (err) {
      console.error('Database health check failed:', err);
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  app.post('/api/media/upload-url', requireAuth, async (req: AuthedRequest, res) => {
    const { kind, mimeType } = req.body as { kind?: string; mimeType?: string };
    const allowed = kind === 'image'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      : kind === 'audio' ? ['audio/wav', 'audio/wave', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4'] : [];
    if (!allowed.includes(String(mimeType).toLowerCase())) {
      res.status(400).json({ error: 'Unsupported media type.' });
      return;
    }
    try {
      const upload = await createMediaUpload(req.userId!, kind as 'image' | 'audio', String(mimeType).toLowerCase());
      res.json(upload);
    } catch (err) {
      console.error('Media upload URL creation failed:', err);
      res.status(503).json({ error: 'Media storage is unavailable.' });
    }
  });

  // Public integration status
  app.get('/api/integrations/status', (_req, res) => {
    res.json(getIntegrationsStatus());
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, confirmPassword } = req.body as {
      username?: string;
      password?: string;
      confirmPassword?: string;
    };

    const cleanUser = (username ?? '').trim();
    if (cleanUser.length < 3 || cleanUser.length > 40) {
      res.status(400).json({ error: 'Username must be between 3 and 40 characters.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    try {
      const user = await store.createUser(cleanUser, password);
      const token = signSessionToken(user.id);
      setSessionCookie(req, res, token);
      res.status(201).json({
        user,
        token,
        settings: await store.getSettings(user.id),
      });
    } catch (err) {
      if ((err as Error).message === 'USERNAME_EXISTS') {
        res.status(409).json({ error: 'An account with this username already exists.' });
        return;
      }
      res.status(500).json({ error: 'Failed to create account.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username?.trim() || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }
    const user = await store.authenticateUser(username, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }
    const token = signSessionToken(user.id);
    setSessionCookie(req, res, token);
    res.json({
      user,
      token,
      settings: await store.getSettings(user.id),
    });
  });

  app.post('/api/auth/logout', async (req, res) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', async (req, res) => {
    const token = extractSessionToken(req);
    const userId = verifySessionToken(token);
    if (!userId) {
      res.json({ user: null });
      return;
    }
    const user = await store.getUserById(userId);
    if (!user) {
      clearSessionCookie(req, res);
      res.json({ user: null });
      return;
    }
    res.json({
      user,
      settings: await store.getSettings(user.id),
    });
  });

  // Location & Geocoding routes (geocoding uses open Nominatim and is optional; manual entry works offline)
  app.post('/api/location/reverse', requireAuth, async (req: AuthedRequest, res) => {
    const { lat, lon } = req.body as { lat?: number; lon?: number };
    if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
      res.status(400).json({ error: 'Valid numeric coordinates are required.' });
      return;
    }
    try {
      const resolved = await reverseGeocode(lat, lon);
      const user = await store.updateUserLocation(req.userId!, resolved);
      res.json({ location: resolved, user });
    } catch {
      res.status(502).json({
        error:
          'Address lookup service is currently unavailable. Please enter your village, district, and state manually below.',
      });
    }
  });

  app.get('/api/location/search', requireAuth, async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) {
      res.json({ results: [] });
      return;
    }
    try {
      const results = await searchLocations(q);
      res.json({ results });
    } catch {
      res.status(502).json({
        error:
          'Place search service is currently unavailable. You can still enter your village, district, and state manually below.',
      });
    }
  });

  app.put('/api/location', requireAuth, async (req: AuthedRequest, res) => {
    const loc = req.body as Partial<UserLocation>;
    if (!loc.name || !loc.name.trim()) {
      res.status(400).json({ error: 'Location name is required.' });
      return;
    }
    const saved: UserLocation = {
      name: loc.name.trim(),
      village: loc.village?.trim(),
      district: loc.district?.trim(),
      state: loc.state?.trim(),
      lat: typeof loc.lat === 'number' && !Number.isNaN(loc.lat) ? loc.lat : undefined,
      lon: typeof loc.lon === 'number' && !Number.isNaN(loc.lon) ? loc.lon : undefined,
      source: loc.source === 'gps' ? 'gps' : 'manual',
    };
    const user = await store.updateUserLocation(req.userId!, saved);
    res.json({ user, location: saved });
  });

  // Dashboard summary
  app.get('/api/dashboard/summary', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const user = (await store.getUserById(userId))!;
    const farm = await store.getFarm(userId);
    const reminders = await store.getReminders(userId);
    const profile = await store.getProfile(userId);
    const settings = await store.getSettings(userId);
    const voiceHistory = await store.getVoiceHistory(userId);
    const cropDoctorHistory = await store.getCropDoctorHistory(userId);

    const [weather, mandi] = await Promise.all([
      fetchLiveWeather(user.location?.lat, user.location?.lon),
      fetchMandiPrices(farm.crops, user.location),
    ]);

    const schemes = getRecommendedSchemes(farm, user.location);

    const recentVoice = voiceHistory.slice(0, 3).map((v) => ({
      id: v.id,
      type: 'voice' as const,
      title: v.title,
      summary: v.turns[v.turns.length - 1]?.text.slice(0, 90) || v.title,
      timestamp: v.updatedAt,
      language: v.language,
    }));

    const recentCrop = cropDoctorHistory.slice(0, 3).map((c) => ({
      id: c.id,
      type: 'crop-doctor' as const,
      title: `${c.cropName} — ${c.analysis.possibleIssue}`,
      summary: c.analysis.symptomsSummary.slice(0, 90) || c.analysis.explanation.slice(0, 90),
      timestamp: c.updatedAt,
    }));

    const recentConversations = [...recentVoice, ...recentCrop]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    res.json({
      user,
      farm,
      profile,
      settings,
      reminders,
      weather,
      mandi,
      schemes,
      recentConversations,
      integrations: getIntegrationsStatus(),
    });
  });

  // Independent Market Prices endpoint (allows independent retry & crop refresh)
  app.get('/api/market-prices', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const user = (await store.getUserById(userId))!;
    const farm = await store.getFarm(userId);
    const mandi = await fetchMandiPrices(farm.crops, user.location);
    res.json(mandi);
  });

  // Farm Details
  app.get('/api/farm', requireAuth, async (req: AuthedRequest, res) => {
    res.json(await store.getFarm(req.userId!));
  });

  app.put('/api/farm', requireAuth, async (req: AuthedRequest, res) => {
    const body = req.body as Partial<import('./src/types').FarmDetails>;
    const landArea = Number(body.landArea ?? 0);
    if (Number.isNaN(landArea) || landArea < 0 || landArea > 10000) {
      res.status(400).json({ error: 'Enter a valid land area.' });
      return;
    }
    const crops = Array.isArray(body.crops) ? body.crops.map((c) => String(c).trim()).filter(Boolean) : [];
    const saved = await store.saveFarm(req.userId!, {
      landArea,
      landUnit: body.landUnit === 'Hectares' ? 'Hectares' : 'Acres',
      crops: crops.length > 0 ? crops : ['Paddy (Vari)'],
      soilType: body.soilType || 'Black',
      irrigation: body.irrigation || 'Borewell',
      sowingDate: body.sowingDate ? String(body.sowingDate) : '',
      growthStage: body.growthStage ? String(body.growthStage) : '',
    });
    res.json(saved);
  });

  // Reminders
  app.get('/api/reminders', requireAuth, async (req: AuthedRequest, res) => {
    res.json({ reminders: await store.getReminders(req.userId!) });
  });

  app.post('/api/reminders', requireAuth, async (req: AuthedRequest, res) => {
    const { title, date, time, crop } = req.body as {
      title?: string;
      date?: string;
      time?: string;
      crop?: string;
    };
    if (!title?.trim() || !date?.trim() || !time?.trim()) {
      res.status(400).json({ error: 'Reminder title, date, and time are required.' });
      return;
    }
    const item = await store.addReminder(req.userId!, {
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      crop: crop?.trim() || undefined,
    });
    res.status(201).json(item);
  });

  app.patch('/api/reminders/:id', requireAuth, async (req: AuthedRequest, res) => {
    const updated = await store.updateReminder(req.userId!, String(req.params.id), req.body);
    if (!updated) {
      res.status(404).json({ error: 'Reminder not found.' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/reminders/:id', requireAuth, async (req: AuthedRequest, res) => {
    const deleted = await store.deleteReminder(req.userId!, String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Reminder not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // Profile & OTP Verification
  app.get('/api/profile', requireAuth, async (req: AuthedRequest, res) => {
    res.json({
      profile: await store.getProfile(req.userId!),
      integrations: getIntegrationsStatus(),
    });
  });

  app.put('/api/profile', requireAuth, async (req: AuthedRequest, res) => {
    const { fullName, mobileNumber, email } = req.body as {
      fullName?: string;
      mobileNumber?: string;
      email?: string;
    };

    if (!fullName?.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    const digits = (mobileNumber ?? '').replace(/\D/g, '');
    const normalized10 = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    if (!/^[6-9]\d{9}$/.test(normalized10)) {
      res.status(400).json({ error: 'Mobile Number must be a valid 10-digit Indian mobile number.' });
      return;
    }

    const cleanEmail = (email ?? '').trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const saved = await store.saveProfile(req.userId!, {
      fullName: fullName.trim(),
      mobileNumber: normalized10,
      email: cleanEmail,
    });
    res.json({ profile: saved });
  });

  app.post('/api/profile/otp/mobile/send', requireAuth, async (req: AuthedRequest, res) => {
    const { mobileNumber } = req.body as { mobileNumber?: string };
    try {
      const result = await sendMobileOtp(mobileNumber ?? '');
      if (!result.sent) {
        res.status(503).json({ error: result.message, configured: false });
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to send mobile OTP.' });
    }
  });

  app.post('/api/profile/otp/mobile/verify', requireAuth, async (req: AuthedRequest, res) => {
    const { mobileNumber, code } = req.body as { mobileNumber?: string; code?: string };
    if (!code || !/^\d{6}$/.test(code.trim())) {
      res.status(400).json({ error: 'Enter a 6-digit OTP code.' });
      return;
    }
    try {
      const result = await verifyMobileOtp(mobileNumber ?? '', code);
      if (!result.verified) {
        res.status(400).json({ error: result.message });
        return;
      }
      const digits = (mobileNumber ?? '').replace(/\D/g, '');
      const normalized10 = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
      const profile = await store.saveProfile(req.userId!, {
        mobileNumber: normalized10,
        mobileVerified: true,
      });
      res.json({ verified: true, message: result.message, profile });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'OTP verification failed.' });
    }
  });

  app.post('/api/profile/otp/email/send', requireAuth, async (req: AuthedRequest, res) => {
    const { email } = req.body as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Enter a valid email address first.' });
      return;
    }
    try {
      const result = await sendEmailOtp(req.userId!, email);
      if (!result.sent) {
        res.status(503).json({ error: result.message, configured: false });
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to send email OTP.' });
    }
  });

  app.post('/api/profile/otp/email/verify', requireAuth, async (req: AuthedRequest, res) => {
    const { email, code } = req.body as { email?: string; code?: string };
    if (!code || !/^\d{6}$/.test(code.trim())) {
      res.status(400).json({ error: 'Enter a 6-digit email verification code.' });
      return;
    }
    const result = verifyEmailOtp(req.userId!, email ?? '', code);
    if (!result.verified) {
      res.status(400).json({ error: result.message });
      return;
    }
    const profile = await store.saveProfile(req.userId!, {
      email: (email ?? '').trim(),
      emailVerified: true,
    });
    res.json({ verified: true, message: result.message, profile });
  });

  // Settings & Privacy
  app.get('/api/settings', requireAuth, async (req: AuthedRequest, res) => {
    res.json({
      settings: await store.getSettings(req.userId!),
      integrations: getIntegrationsStatus(),
    });
  });

  app.put('/api/settings', requireAuth, async (req: AuthedRequest, res) => {
    const settings = await store.saveSettings(req.userId!, req.body);
    res.json({ settings });
  });

  app.post('/api/settings/reset', requireAuth, async (req: AuthedRequest, res) => {
    const user = await store.getUserById(req.userId!);
    const settings = await store.saveSettings(req.userId!, defaultSettings(user?.location?.name || ''));
    res.json({ settings });
  });

  app.get('/api/privacy/export', requireAuth, async (req: AuthedRequest, res) => {
    const payload = await store.exportUserData(req.userId!);
    const voiceHistory = await Promise.all(payload.voiceHistory.map((v) => presentVoice(req.userId!, v)));
    const cropDoctorHistory = await Promise.all(payload.cropDoctorHistory.map((r) => presentCrop(req.userId!, r)));
    res.setHeader('Content-Disposition', 'attachment; filename="gnanikisan-data-export.json"');
    res.json({ ...payload, voiceHistory, cropDoctorHistory });
  });

  app.delete('/api/privacy/data', requireAuth, async (req: AuthedRequest, res) => {
    await store.clearUserHistoryAndFarm(req.userId!);
    res.json({ ok: true });
  });

  // Voice Assistant routes
  app.post('/api/voice/transcribe', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const { audioBase64, audioPath, mimeType, language } = req.body as {
      audioBase64?: string;
      audioPath?: string;
      mimeType?: string;
      language?: AppLanguage | 'auto';
    };

    if (!audioBase64 && !audioPath) {
      res.status(400).json({ error: 'Audio recording is required.' });
      return;
    }
    if (audioPath && !audioPath.startsWith(`${userId}/audio/`)) {
      res.status(400).json({ error: 'Invalid audio upload.' });
      return;
    }

    const mode: AppLanguage | 'auto' =
      language === 'te' || language === 'hi' || language === 'en' ? language : 'auto';
    let buffer: Buffer;
    try {
      buffer = audioPath ? await downloadUserMedia(userId, audioPath) : Buffer.from(audioBase64!, 'base64');
    } catch (err) {
      res.status(400).json({ error: err instanceof Error && err.message === 'MEDIA_ACCESS_DENIED' ? 'Invalid audio upload.' : 'Audio upload could not be read.' });
      return;
    }
    if (buffer.byteLength > 20 * 1024 * 1024) {
      res.status(413).json({ error: 'Audio recording exceeds the 20 MB limit.' });
      return;
    }
    const resolvedAudioBase64 = audioBase64 || buffer.toString('base64');

    let gnaniError: string | null = null;
    if (isGnaniConfigured()) {
      try {
        const result = await transcribeWithGnaniPrisma(buffer, mimeType || 'audio/wav', mode);
        const transcript = String(result.transcript ?? '').trim();

        if (transcript) {
          let resolvedLang: AppLanguage | 'unknown' =
            mode !== 'auto' ? mode : result.detectedLanguage || 'unknown';
          let confidence: 'high' | 'medium' | 'low' =
            mode !== 'auto' || result.detectedLanguage ? 'high' : 'medium';

          // Disambiguate Telugu / Hindi / English / Teluglish when auto-detecting
          if (mode === 'auto') {
            const textLang = await detectTextLanguage(transcript);
            if (textLang.language !== 'unknown' && textLang.confidence !== 'low') {
              // Trust explicit Telugu/Devanagari script or Gemini identification over raw unknown
              if (
                resolvedLang === 'unknown' ||
                textLang.isTransliterated ||
                /[\u0C00-\u0C7F\u0900-\u097F]/.test(transcript)
              ) {
                resolvedLang = textLang.language;
              }
              confidence = textLang.confidence;
            } else if (!result.detectedLanguage && textLang.confidence === 'low') {
              confidence = 'low';
            }
          }

          if (resolvedLang === 'unknown' || confidence === 'low') {
            res.json({
              status: 'unclear',
              transcript: '',
              detectedLanguage: 'unknown',
              confidence: 'low',
              sttProvider: 'gnani-prisma',
            });
            return;
          }

          res.json({
            status: 'ok',
            transcript,
            detectedLanguage: resolvedLang,
            confidence,
            languageCode: result.rawLanguageCode || mapLanguageToGnaniCode(resolvedLang),
            sttProvider: 'gnani-prisma',
          });
          return;
        }
      } catch (err) {
        gnaniError = err instanceof Error ? err.message : 'Gnani Prisma STT request failed.';
        console.warn('Gnani Prisma STT error:', gnaniError);
        if (!isGeminiConfigured()) {
          res.status(502).json({ error: gnaniError });
          return;
        }
      }
    }

    if (isGeminiConfigured()) {
      try {
        const gemResult = await transcribeAndDetectAudioWithGemini(
          resolvedAudioBase64,
          mimeType || 'audio/wav',
          mode
        );
        if (
          !gemResult.transcript ||
          gemResult.detectedLanguage === 'unknown' ||
          gemResult.confidence === 'low'
        ) {
          res.json({
            status: 'unclear',
            transcript: '',
            detectedLanguage: 'unknown',
            confidence: 'low',
            sttProvider: 'gemini-fallback',
          });
          return;
        }
        res.json({
          status: 'ok',
          transcript: gemResult.transcript,
          detectedLanguage: gemResult.detectedLanguage,
          confidence: gemResult.confidence,
          languageCode: mapLanguageToGnaniCode(gemResult.detectedLanguage),
          sttProvider: 'gemini-fallback',
        });
        return;
      } catch (err) {
        res.status(502).json({
          error: err instanceof Error ? err.message : gnaniError || 'Audio transcription failed.',
        });
        return;
      }
    }

    res.status(503).json({
      error:
        'Speech-to-Text service is not configured. Configure GNANI_API_KEY or GEMINI_API_KEY on the server, or use typed question input.',
    });
  });

  app.post('/api/voice/ask', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const {
      conversationId,
      question,
      language,
      detectedLanguage,
      sttProvider,
      durationSec,
    } = req.body as {
      conversationId?: string;
      question?: string;
      language?: AppLanguage | 'auto';
      detectedLanguage?: AppLanguage;
      sttProvider?: 'gnani-prisma' | 'gemini-fallback' | 'typed';
      durationSec?: number;
    };

    const cleanQuestion = String(question ?? '').trim();
    if (!cleanQuestion) {
      res.status(400).json({ error: 'Question text is required.' });
      return;
    }

    if (!isGeminiConfigured()) {
      res.status(503).json({
        error: 'Reasoning service (GEMINI_API_KEY) is not configured on the server.',
      });
      return;
    }

    const mode: AppLanguage | 'auto' =
      language === 'te' || language === 'hi' || language === 'en' ? language : 'auto';

    let resolvedLang: AppLanguage;
    let detectedConfidence: 'high' | 'medium' | 'low' = 'high';

    if (mode !== 'auto') {
      resolvedLang = mode;
    } else if (detectedLanguage === 'te' || detectedLanguage === 'hi' || detectedLanguage === 'en') {
      resolvedLang = detectedLanguage;
    } else {
      const detected = await detectTextLanguage(cleanQuestion);
      if (detected.language === 'unknown' || detected.confidence === 'low') {
        res.json({
          status: 'unclear',
          detectedLanguage: 'unknown',
          confidence: 'low',
          clarificationMessage:
            'Could not clearly determine your language. Please speak or type clearly in Telugu, English, or Hindi.',
        });
        return;
      }
      resolvedLang = detected.language;
      detectedConfidence = detected.confidence;
    }

    const user = (await store.getUserById(userId))!;
    const farm = await store.getFarm(userId);
    const settings = await store.getSettings(userId);
    const history = await store.getVoiceHistory(userId);

    const existing = conversationId ? history.find((h) => h.id === conversationId) : undefined;
    const prevTurns = existing?.turns ?? [];

    try {
      const answerText = await generateFarmAssistantReply({
        question: cleanQuestion,
        language: resolvedLang,
        farm,
        location: user.location,
        historyTurns: prevTurns.map((t) => ({ role: t.role, text: t.text })),
        style: settings.voiceStyle,
      });

      const ttsResult = await synthesizeBestAvailableTts({
        text: answerText,
        language: resolvedLang,
        voice: settings.voiceName,
        speed: settings.voiceSpeed,
      });

      const now = new Date().toISOString();
      const userTurn: VoiceTurn = {
        id: crypto.randomUUID(),
        role: 'user',
        text: cleanQuestion,
        language: resolvedLang,
        timestamp: now,
        sttProvider: sttProvider || 'typed',
        detectedConfidence,
      };

      const assistantTurn: VoiceTurn = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: answerText,
        language: resolvedLang,
        timestamp: new Date().toISOString(),
        ttsProvider: ttsResult.ttsProvider,
        ttsError: ttsResult.ttsError,
        audioBase64: ttsResult.audioBase64,
        audioMime: ttsResult.audioMime,
      };

      const conversation: VoiceConversation = {
        id: existing?.id || crypto.randomUUID(),
        title: existing?.title || cleanQuestion.slice(0, 64),
        language: resolvedLang,
        durationSec: (existing?.durationSec ?? 0) + (Number(durationSec) || 0),
        turns: [...prevTurns, userTurn, assistantTurn],
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const savedConversation = await persistVoiceMedia(userId, conversation);
      res.json({
        status: 'ok',
        detectedLanguage: resolvedLang,
        confidence: detectedConfidence,
        ttsError: ttsResult.ttsError,
        conversation: await presentVoice(userId, savedConversation),
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to generate farming response.',
      });
    }
  });

  app.post('/api/voice/tts', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const { text, language, conversationId, cropDoctorRecordId, turnId } = req.body as {
      text?: string;
      language?: AppLanguage;
      conversationId?: string;
      cropDoctorRecordId?: string;
      turnId?: string;
    };
    if (!text?.trim()) {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }
    const lang: AppLanguage = language === 'te' || language === 'hi' ? language : 'en';
    const settings = await store.getSettings(userId);
    const ttsResult = await synthesizeBestAvailableTts({
      text: text.trim(),
      language: lang,
      voice: settings.voiceName,
      speed: settings.voiceSpeed,
    });

    if (!ttsResult.audioBase64) {
      res.status(ttsResult.ttsProvider === 'browser-fallback' ? 503 : 502).json({
        error: ttsResult.ttsError || 'Speech audio service is unavailable right now.',
        ...ttsResult,
      });
      return;
    }

    let audioStoragePath: string | undefined;
    if (turnId && conversationId) {
      const existing = (await store.getVoiceHistory(userId)).find((v) => v.id === conversationId);
      if (existing) {
        const updatedTurns = existing.turns.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                audioBase64: ttsResult.audioBase64,
                audioMime: ttsResult.audioMime,
                ttsProvider: ttsResult.ttsProvider,
                ttsError: undefined,
              }
            : turn
        );
        const saved = await persistVoiceMedia(userId, { ...existing, turns: updatedTurns });
        audioStoragePath = saved.turns.find((turn) => turn.id === turnId)?.audioStoragePath;
      }
    } else if (turnId && cropDoctorRecordId) {
      const existing = (await store.getCropDoctorHistory(userId)).find((r) => r.id === cropDoctorRecordId);
      if (existing) {
        const updatedTurns = existing.turns.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                audioBase64: ttsResult.audioBase64,
                audioMime: ttsResult.audioMime,
                ttsProvider: ttsResult.ttsProvider,
                ttsError: undefined,
              }
            : turn
        );
        const saved = await persistCropMedia(userId, { ...existing, turns: updatedTurns });
        audioStoragePath = saved.turns.find((turn) => turn.id === turnId)?.audioStoragePath;
      }
    }

    audioStoragePath ??= await uploadUserMedia(userId, 'audio', Buffer.from(ttsResult.audioBase64, 'base64'), ttsResult.audioMime || 'audio/wav');
    res.json({ audioUrl: await signedMediaUrl(userId, audioStoragePath), audioMime: ttsResult.audioMime, ttsProvider: ttsResult.ttsProvider, ttsError: ttsResult.ttsError });
  });

  // Crop Doctor AI routes
  app.post('/api/crop-doctor/analyze', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const {
      imageDataUrl,
      imagePath,
      cropName,
      location,
      growthStage,
      question,
      language,
    } = req.body as {
      imageDataUrl?: string;
      imagePath?: string;
      cropName?: string;
      location?: string;
      growthStage?: string;
      question?: string;
      language?: AppLanguage;
    };

    const lang: AppLanguage = language === 'te' || language === 'hi' ? language : 'en';

    let mimeType: string;
    let base64: string;
    let imageStoragePath: string | undefined;
    if (imagePath) {
      if (!imagePath.startsWith(`${userId}/image/`)) {
        res.status(400).json({ error: 'Invalid image upload.' });
        return;
      }
      try {
        const imageBuffer = await downloadUserMedia(userId, imagePath);
        if (imageBuffer.byteLength > 10 * 1024 * 1024) {
          res.status(400).json({ error: 'Image size exceeds the 10 MB upload limit.' });
          return;
        }
        mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : imagePath.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        base64 = imageBuffer.toString('base64');
        imageStoragePath = imagePath;
      } catch {
        res.status(400).json({ error: 'Uploaded image could not be read.' });
        return;
      }
    } else if (imageDataUrl?.startsWith('data:image/')) {
      const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i.exec(imageDataUrl);
      if (!match) {
        res.status(400).json({ error: 'Only JPG, PNG, and WEBP image formats are supported.' });
        return;
      }
      mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
      base64 = match[2];
    } else {
      res.status(400).json({ error: 'Please upload a valid JPG, PNG, or WEBP crop image.' });
      return;
    }
    const approxBytes = Math.ceil((base64.length * 3) / 4);
    if (approxBytes > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size exceeds the 10 MB upload limit.' });
      return;
    }

    if (!isGeminiConfigured()) {
      res.status(503).json({
        error: 'Vision analysis service (GEMINI_API_KEY) is not configured on the server.',
        code: 'VISION_NOT_CONFIGURED',
      });
      return;
    }

    const user = (await store.getUserById(userId))!;
    const settings = await store.getSettings(userId);
    const cleanCrop = cropName?.trim();

    try {
      const analysis = await analyzeCropImage({
        imageBase64: base64,
        mimeType,
        cropName: cleanCrop,
        location: location?.trim() || user.location?.name,
        growthStage: growthStage?.trim(),
        question: question?.trim(),
        language: lang,
      });

      const summaryVoiceText = `${analysis.possibleIssue}. ${analysis.explanation} ${analysis.confidenceNote}`;
      let ttsResult: Awaited<ReturnType<typeof synthesizeBestAvailableTts>> = {
        ttsProvider: 'browser-fallback',
      };
      try {
        ttsResult = await synthesizeBestAvailableTts({
          text: summaryVoiceText,
          language: lang,
          voice: settings.voiceName,
          speed: settings.voiceSpeed,
        });
      } catch (ttsErr) {
        console.warn('Crop Doctor TTS warning:', ttsErr instanceof Error ? ttsErr.message : ttsErr);
      }

      const now = new Date().toISOString();
      const defaultPromptByLang: Record<AppLanguage, string> = {
        te: cleanCrop
          ? `దయచేసి ఈ ${cleanCrop} పంట ఫోటోను పరిశీలించి సురక్షిత యాజమాన్య సూచనలు ఇవ్వండి.`
          : 'దయచేసి ఈ పంట ఫోటోను పరిశీలించి సురక్షిత యాజమాన్య సూచనలు ఇవ్వండి.',
        hi: cleanCrop
          ? `कृपया इस ${cleanCrop} फसल की फ़ोटो की जांच करें और सुरक्षित देखभाल की सलाह दें।`
          : 'कृपया इस फसल की फ़ोटो की जांच करें और सुरक्षित देखभाल की सलाह दें।',
        en: `Please inspect this ${cleanCrop || 'crop'} photo and advise safe management.`,
      };

      const userQuestion = question?.trim() || defaultPromptByLang[lang];

      const turns: CropDoctorTurn[] = [
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: userQuestion,
          timestamp: now,
        },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `${analysis.possibleIssue}\n\n${analysis.explanation}\n\n${analysis.ipmGuidance}`,
          timestamp: new Date().toISOString(),
          audioBase64: ttsResult.audioBase64,
          audioMime: ttsResult.audioMime,
          ttsProvider: ttsResult.ttsProvider,
          ttsError: ttsResult.ttsError,
        },
      ];

      const record: CropDoctorRecord = {
        id: crypto.randomUUID(),
        cropName: analysis.crop,
        location: location?.trim() || user.location?.name,
        growthStage: growthStage?.trim(),
        imageDataUrl: imageStoragePath ? '' : imageDataUrl!,
        imageStoragePath,
        analysis,
        turns,
        createdAt: now,
        updatedAt: now,
      };

      const saved = await persistCropMedia(userId, record);
      res.json({ record: await presentCrop(userId, saved) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Crop image analysis failed.';
      const lower = message.toLowerCase();
      console.error(`Crop Doctor analyze error (${lang}):`, message);
      const status =
        lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')
          ? 429
          : lower.includes('timeout') || lower.includes('aborted')
            ? 504
            : 502;
      res.status(status).json({
        error: message,
        code: status === 429 ? 'RATE_LIMITED' : status === 504 ? 'TIMEOUT' : 'ANALYSIS_FAILED',
      });
    }
  });

  app.post('/api/crop-doctor/followup', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const { recordId, question, language } = req.body as {
      recordId?: string;
      question?: string;
      language?: AppLanguage;
    };

    if (!recordId || !question?.trim()) {
      res.status(400).json({ error: 'Record ID and follow-up question are required.' });
      return;
    }

    if (!isGeminiConfigured()) {
      res.status(503).json({ error: 'Reasoning service (GEMINI_API_KEY) is not configured.' });
      return;
    }

    const list = await store.getCropDoctorHistory(userId);
    const existing = list.find((r) => r.id === recordId);
    if (!existing) {
      res.status(404).json({ error: 'Crop Doctor record not found.' });
      return;
    }

    const lang: AppLanguage = language === 'te' || language === 'hi' ? language : 'en';
    const settings = await store.getSettings(userId);

    try {
      const answer = await generateCropDoctorFollowUp({
        question: question.trim(),
        language: lang,
        cropName: existing.cropName,
        analysis: existing.analysis,
        turns: existing.turns.map((t) => ({ role: t.role, text: t.text })),
      });

      let ttsResult: Awaited<ReturnType<typeof synthesizeBestAvailableTts>> = {
        ttsProvider: 'browser-fallback',
      };
      try {
        ttsResult = await synthesizeBestAvailableTts({
          text: answer,
          language: lang,
          voice: settings.voiceName,
          speed: settings.voiceSpeed,
        });
      } catch (ttsErr) {
        console.warn('Crop Doctor follow-up TTS warning:', ttsErr instanceof Error ? ttsErr.message : ttsErr);
      }

      const now = new Date().toISOString();
      const updated: CropDoctorRecord = {
        ...existing,
        turns: [
          ...existing.turns,
          {
            id: crypto.randomUUID(),
            role: 'user',
            text: question.trim(),
            timestamp: now,
          },
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: answer,
            timestamp: new Date().toISOString(),
            audioBase64: ttsResult.audioBase64,
            audioMime: ttsResult.audioMime,
            ttsProvider: ttsResult.ttsProvider,
            ttsError: ttsResult.ttsError,
          },
        ],
        updatedAt: now,
      };

      const saved = await persistCropMedia(userId, updated);
      res.json({ record: await presentCrop(userId, saved) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Follow-up response failed.';
      const lower = message.toLowerCase();
      console.error(`Crop Doctor followup error (${lang}):`, message);
      const status =
        lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')
          ? 429
          : 502;
      res.status(status).json({
        error: message,
        code: status === 429 ? 'RATE_LIMITED' : 'FOLLOWUP_FAILED',
      });
    }
  });

  // History routes & authenticated downloads (PDF, Audio, Conversation ZIP, Complete Archive ZIP)
  app.get('/api/history', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const [voiceHistory, cropDoctorHistory] = await Promise.all([store.getVoiceHistory(userId), store.getCropDoctorHistory(userId)]);
    res.json({
      voiceHistory: await Promise.all(voiceHistory.map((v) => presentVoice(userId, v))),
      cropDoctorHistory: await Promise.all(cropDoctorHistory.map((r) => presentCrop(userId, r))),
    });
  });

  app.get('/api/history/voice/:id/pdf', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const conv = (await store.getVoiceHistory(userId)).find((v) => v.id === String(req.params.id));
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    try {
      const user = (await store.getUserById(userId))!;
      const farm = await store.getFarm(userId);
      const exportConv = await materializeVoice(userId, conv);
      const pdfBuf = await generateVoicePdfBuffer(exportConv, farm, user.location, user.username);
      const datePart = (conv.updatedAt || conv.createdAt).slice(0, 10);
      const filename = `gnanikisan-voice-${datePart}-${slugifyFilename(conv.title, 'transcript')}.pdf`;
      await sendStoredDownload(userId, pdfBuf, 'application/pdf', filename, res);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate PDF.' });
    }
  });

  app.get('/api/history/voice/:id/zip', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const conv = (await store.getVoiceHistory(userId)).find((v) => v.id === String(req.params.id));
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    try {
      const user = (await store.getUserById(userId))!;
      const farm = await store.getFarm(userId);
      const exportConv = await materializeVoice(userId, conv);
      const zipBuf = await generateVoiceConversationZip(exportConv, farm, user.location, user.username);
      const datePart = (conv.updatedAt || conv.createdAt).slice(0, 10);
      const filename = `gnanikisan-voice-${datePart}-${slugifyFilename(conv.title, 'bundle')}.zip`;
      await sendStoredDownload(userId, zipBuf, 'application/zip', filename, res);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build conversation archive.' });
    }
  });

  app.get('/api/history/voice/:id/turns/:turnId/audio', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const conv = (await store.getVoiceHistory(userId)).find((v) => v.id === String(req.params.id));
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    const turnIdx = conv.turns.findIndex((t) => t.id === String(req.params.turnId));
    const turn = turnIdx >= 0 ? conv.turns[turnIdx] : undefined;
    if (turn?.audioStoragePath) {
      res.redirect(302, await signedMediaUrl(userId, turn.audioStoragePath, 300, buildTurnAudioFilename({ prefix: 'voice', createdAt: turn.timestamp || conv.createdAt, turnNumber: conv.turns.slice(0, turnIdx + 1).filter((t) => t.role === 'assistant').length, language: turn.language, audioMime: turn.audioMime })));
      return;
    }
    if (!turn || !turn.audioBase64) {
      res.status(404).json({ error: 'Audio recording is unavailable for this response.' });
      return;
    }
    const assistantNumber = conv.turns.slice(0, turnIdx + 1).filter((t) => t.role === 'assistant').length;
    const filename = buildTurnAudioFilename({
      prefix: 'voice',
      createdAt: turn.timestamp || conv.createdAt,
      turnNumber: assistantNumber,
      language: turn.language,
      audioMime: turn.audioMime,
    });
    const audioStoragePath = await uploadUserMedia(userId, 'audio', Buffer.from(turn.audioBase64, 'base64'), turn.audioMime || 'audio/wav');
    const migrated = { ...conv, turns: conv.turns.map((item) => item.id === turn.id ? { ...item, audioStoragePath, audioBase64: undefined } : item) };
    await store.upsertVoiceConversation(userId, migrated);
    res.redirect(302, await signedMediaUrl(userId, audioStoragePath, 300, filename));
  });

  app.get('/api/history/crop-doctor/:id/pdf', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const rec = (await store.getCropDoctorHistory(userId)).find((r) => r.id === String(req.params.id));
    if (!rec) {
      res.status(404).json({ error: 'Crop analysis record not found.' });
      return;
    }
    try {
      const user = (await store.getUserById(userId))!;
      const farm = await store.getFarm(userId);
      const exportRecord = await materializeCrop(userId, rec);
      const pdfBuf = await generateCropDoctorPdfBuffer(exportRecord, farm, user.location, user.username);
      const datePart = (rec.updatedAt || rec.createdAt).slice(0, 10);
      const filename = `gnanikisan-crop-doctor-${datePart}-${slugifyFilename(rec.cropName, 'report')}.pdf`;
      await sendStoredDownload(userId, pdfBuf, 'application/pdf', filename, res);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate PDF.' });
    }
  });

  app.get('/api/history/crop-doctor/:id/zip', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const rec = (await store.getCropDoctorHistory(userId)).find((r) => r.id === String(req.params.id));
    if (!rec) {
      res.status(404).json({ error: 'Crop analysis record not found.' });
      return;
    }
    try {
      const user = (await store.getUserById(userId))!;
      const farm = await store.getFarm(userId);
      const exportRecord = await materializeCrop(userId, rec);
      const zipBuf = await generateCropDoctorZip(exportRecord, farm, user.location, user.username);
      const datePart = (rec.updatedAt || rec.createdAt).slice(0, 10);
      const filename = `gnanikisan-crop-doctor-${datePart}-${slugifyFilename(rec.cropName, 'bundle')}.zip`;
      await sendStoredDownload(userId, zipBuf, 'application/zip', filename, res);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build Crop Doctor archive.' });
    }
  });

  app.get('/api/history/crop-doctor/:id/turns/:turnId/audio', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const rec = (await store.getCropDoctorHistory(userId)).find((r) => r.id === String(req.params.id));
    if (!rec) {
      res.status(404).json({ error: 'Crop analysis record not found.' });
      return;
    }
    const turnIdx = rec.turns.findIndex((t) => t.id === String(req.params.turnId));
    const turn = turnIdx >= 0 ? rec.turns[turnIdx] : undefined;
    if (turn?.audioStoragePath) {
      res.redirect(302, await signedMediaUrl(userId, turn.audioStoragePath, 300, buildTurnAudioFilename({ prefix: 'crop-doctor', createdAt: turn.timestamp || rec.createdAt, turnNumber: rec.turns.slice(0, turnIdx + 1).filter((t) => t.role === 'assistant').length, audioMime: turn.audioMime })));
      return;
    }
    if (!turn || !turn.audioBase64) {
      res.status(404).json({ error: 'Audio recording is unavailable for this response.' });
      return;
    }
    const assistantNumber = rec.turns.slice(0, turnIdx + 1).filter((t) => t.role === 'assistant').length;
    const filename = buildTurnAudioFilename({
      prefix: 'crop-doctor',
      createdAt: turn.timestamp || rec.createdAt,
      turnNumber: assistantNumber,
      audioMime: turn.audioMime,
    });
    const audioStoragePath = await uploadUserMedia(userId, 'audio', Buffer.from(turn.audioBase64, 'base64'), turn.audioMime || 'audio/wav');
    const migrated = { ...rec, turns: rec.turns.map((item) => item.id === turn.id ? { ...item, audioStoragePath, audioBase64: undefined } : item) };
    await store.upsertCropDoctorRecord(userId, migrated);
    res.redirect(302, await signedMediaUrl(userId, audioStoragePath, 300, filename));
  });

  app.get('/api/history/export-all.zip', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const voiceHistory = await store.getVoiceHistory(userId);
    const cropHistory = await store.getCropDoctorHistory(userId);
    if (voiceHistory.length === 0 && cropHistory.length === 0) {
      res.status(400).json({ error: 'No history records available to archive yet.' });
      return;
    }
    try {
      const user = (await store.getUserById(userId))!;
      const farm = await store.getFarm(userId);
      const zipBuf = await generateAllHistoryZip(
        await Promise.all(voiceHistory.map((v) => materializeVoice(userId, v))),
        await Promise.all(cropHistory.map((r) => materializeCrop(userId, r))),
        farm,
        user.location,
        user.username
      );
      const datePart = new Date().toISOString().slice(0, 10);
      const filename = `gnanikisan-all-history-${datePart}.zip`;
      await sendStoredDownload(userId, zipBuf, 'application/zip', filename, res);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build complete history archive.' });
    }
  });

  app.delete('/api/history/voice/:id', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const conversation = (await store.getVoiceHistory(userId)).find((v) => v.id === String(req.params.id));
    const ok = await store.deleteVoiceConversation(userId, String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    if (conversation) await deleteUserMedia(userId, conversation.turns.map((turn) => turn.audioStoragePath || '').filter(Boolean));
    res.json({ ok: true });
  });

  app.delete('/api/history/crop-doctor/:id', requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.userId!;
    const record = (await store.getCropDoctorHistory(userId)).find((r) => r.id === String(req.params.id));
    const ok = await store.deleteCropDoctorRecord(userId, String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Crop analysis record not found.' });
      return;
    }
    if (record) await deleteUserMedia(userId, [record.imageStoragePath || '', ...record.turns.map((turn) => turn.audioStoragePath || '')].filter(Boolean));
    res.json({ ok: true });
  });

  // Vite dev middleware or static production serving
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const message = err instanceof Error ? err.message : String(err);
    const unavailable = message.startsWith('DATABASE_ERROR') || message.startsWith('MEDIA_STORAGE_ERROR');
    console.error('Request failed:', message);
    res.status(unavailable ? 503 : 500).json({ error: unavailable ? 'Database or media storage is temporarily unavailable.' : 'The request could not be completed.' });
  });

  if (!process.env.VERCEL) await store.migrateLegacyData();
  return app;
}

const app = await createServer();
export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GnaniKisan AI server listening on http://localhost:${PORT}`);
  });
}
