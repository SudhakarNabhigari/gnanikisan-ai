import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { AuthUser, CropDoctorRecord, FarmDetails, Reminder, UserLocation, UserProfile, UserSettings, VoiceConversation } from '../src/types';

interface StoredUserRecord { id: string; username: string; usernameLower: string; passwordHash: string; salt: string; createdAt: string; location: UserLocation | null }
interface LegacyDb { users?: StoredUserRecord[]; profiles?: Record<string, UserProfile>; farms?: Record<string, FarmDetails>; reminders?: Record<string, Reminder[]>; settings?: Record<string, UserSettings>; voiceHistory?: Record<string, VoiceConversation[]>; cropDoctorHistory?: Record<string, CropDoctorRecord[]> }

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();
if (!supabaseUrl || !supabaseSecretKey) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be configured on the server.');
const supabase = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const mediaBucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'gnanikisan-media';
const DB_FILE = path.resolve(process.cwd(), '.data', 'gnanikisan-db.json');

function dbError(error: { message: string; code?: string } | null): never | void {
  if (error) throw new Error(`DATABASE_ERROR${error.code ? `:${error.code}` : ''}: ${error.message}`);
}
function assertUserMediaPath(userId: string, objectPath: string): void {
  if (!objectPath.startsWith(`${userId}/`) || objectPath.includes('..')) throw new Error('MEDIA_ACCESS_DENIED');
}
export async function createMediaUpload(userId: string, kind: 'image' | 'audio' | 'export', mimeType: string) {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'audio/webm' ? 'webm' : mimeType === 'audio/ogg' ? 'ogg' : mimeType === 'audio/mpeg' ? 'mp3' : mimeType === 'application/zip' ? 'zip' : mimeType === 'application/pdf' ? 'pdf' : 'wav';
  const objectPath = `${userId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(mediaBucket).createSignedUploadUrl(objectPath);
  if (error) throw new Error(`MEDIA_STORAGE_ERROR: ${error.message}`);
  return { signedUrl: data.signedUrl, path: objectPath };
}
export async function uploadUserMedia(userId: string, kind: 'image' | 'audio' | 'export', bytes: Buffer, mimeType: string): Promise<string> {
  const { path: objectPath } = await createMediaUpload(userId, kind, mimeType);
  const { error } = await supabase.storage.from(mediaBucket).upload(objectPath, bytes, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`MEDIA_STORAGE_ERROR: ${error.message}`);
  return objectPath;
}
export async function signedMediaUrl(userId: string, objectPath: string, expiresIn = 300, download?: string): Promise<string> {
  assertUserMediaPath(userId, objectPath);
  const { data, error } = await supabase.storage.from(mediaBucket).createSignedUrl(objectPath, expiresIn, download ? { download } : undefined);
  if (error) throw new Error(`MEDIA_STORAGE_ERROR: ${error.message}`);
  return data.signedUrl;
}
export async function downloadUserMedia(userId: string, objectPath: string): Promise<Buffer> {
  assertUserMediaPath(userId, objectPath);
  const { data, error } = await supabase.storage.from(mediaBucket).download(objectPath);
  if (error) throw new Error(`MEDIA_STORAGE_ERROR: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}
export async function deleteUserMedia(userId: string, objectPaths: string[]): Promise<void> {
  const safePaths = objectPaths.filter((p) => p && p.startsWith(`${userId}/`) && !p.includes('..'));
  if (safePaths.length === 0) return;
  const { error } = await supabase.storage.from(mediaBucket).remove(safePaths);
  if (error) throw new Error(`MEDIA_STORAGE_ERROR: ${error.message}`);
}
export async function cleanupExpiredExports(userId: string): Promise<void> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let offset = 0;
  const expiredPaths: string[] = [];
  for (;;) {
    const { data, error } = await supabase.storage.from(mediaBucket).list(`${userId}/export`, { limit: 100, offset });
    if (error) throw new Error(`MEDIA_STORAGE_ERROR: ${error.message}`);
    expiredPaths.push(...(data ?? []).filter((item) => item.name && item.created_at && Date.parse(item.created_at) < cutoff).map((item) => `${userId}/export/${item.name}`));
    if (!data || data.length < 100) break;
    offset += data.length;
  }
  await deleteUserMedia(userId, expiredPaths);
}
function userFrom(row: any): AuthUser { return { id: row.id, username: row.username, createdAt: row.created_at, location: row.location ?? null }; }
function storedFrom(row: any): StoredUserRecord { return { id: row.id, username: row.username, usernameLower: row.username_lower, passwordHash: row.password_hash, salt: row.salt, createdAt: row.created_at, location: row.location ?? null }; }
async function getData<T>(table: string, userId: string, fallback: T): Promise<T> {
  const { data, error } = await supabase.from(table).select('data').eq('user_id', userId).maybeSingle(); dbError(error);
  return (data?.data as T | undefined) ?? fallback;
}
async function putData<T>(table: string, userId: string, value: T): Promise<T> {
  const { error } = await supabase.from(table).upsert({ user_id: userId, data: value }, { onConflict: 'user_id' }); dbError(error); return value;
}
async function updateList<T extends { id: string }>(table: string, userId: string, id: string, change: (list: T[]) => T[] | null): Promise<boolean> {
  const { data, error } = await supabase.from(table).select('data').eq('user_id', userId).maybeSingle(); dbError(error);
  const current = (data?.data ?? []) as T[]; const next = change(current); if (next === null) return false;
  await putData(table, userId, next); return true;
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } { const salt = existingSalt ?? crypto.randomBytes(16).toString('hex'); return { hash: crypto.scryptSync(password, salt, 64).toString('hex'), salt }; }
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean { const a = Buffer.from(hashPassword(password, salt).hash, 'hex'); const b = Buffer.from(expectedHash, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function getSessionSecret(): string { const secret = process.env.SESSION_SECRET?.trim(); if (!secret || secret.length < 16) throw new Error('SESSION_SECRET must be configured and at least 16 characters long.'); return secret; }
export function signSessionToken(userId: string): string { const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url'); return `${payload}.${crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')}`; }
export function verifySessionToken(token: string | undefined): string | null { if (!token || !token.includes('.')) return null; const [payload, sig] = token.split('.'); if (!payload || !sig) return null; const expected = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url'); const a = Buffer.from(sig); const b = Buffer.from(expected); if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null; try { return (JSON.parse(Buffer.from(payload, 'base64url').toString()) as { uid?: string }).uid ?? null; } catch { return null; } }

export function defaultSettings(locationName = ''): UserSettings { return { language: 'en', voiceName: 'Shivani', voiceSpeed: 1, voiceStyle: 'normal', notifications: { reminders: true, weather: true, schemes: true, cropAdvice: true }, theme: 'light', units: 'Acres', defaultLocation: locationName, farmingSeason: 'Kharif', reminderTime: '08:00', updatedAt: new Date().toISOString() }; }
export function defaultFarm(): FarmDetails { return { landArea: 0, landUnit: 'Acres', crops: ['Paddy (Vari)'], soilType: 'Black', irrigation: 'Borewell', sowingDate: '', growthStage: '', updatedAt: new Date().toISOString() }; }
export function defaultProfile(fullName = ''): UserProfile { return { fullName, mobileNumber: '', mobileVerified: false, email: '', emailVerified: false, updatedAt: new Date().toISOString() }; }

export const store = {
  async healthCheck(): Promise<boolean> { const { error } = await supabase.from('app_users').select('id').limit(1); dbError(error); return true; },
  async migrateLegacyData(): Promise<void> {
    if (!fs.existsSync(DB_FILE)) return;
    let legacy: LegacyDb;
    try { legacy = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as LegacyDb; } catch (error) { throw new Error(`Legacy database migration could not read ${DB_FILE}: ${String(error)}`); }
    for (const user of legacy.users ?? []) {
      const { error } = await supabase.from('app_users').upsert({ id: user.id, username: user.username, username_lower: user.usernameLower, password_hash: user.passwordHash, salt: user.salt, created_at: user.createdAt, location: user.location }, { onConflict: 'id', ignoreDuplicates: true }); dbError(error);
      const entries: Array<[string, unknown]> = [['user_profiles', legacy.profiles?.[user.id] ?? defaultProfile(user.username)], ['user_farms', legacy.farms?.[user.id] ?? defaultFarm()], ['user_reminders', legacy.reminders?.[user.id] ?? []], ['user_settings', legacy.settings?.[user.id] ?? defaultSettings()], ['voice_history', legacy.voiceHistory?.[user.id] ?? []], ['crop_doctor_history', legacy.cropDoctorHistory?.[user.id] ?? []]];
      for (const [table, value] of entries) { const { data, error: readError } = await supabase.from(table).select('user_id').eq('user_id', user.id).maybeSingle(); dbError(readError); if (!data) await putData(table, user.id, value); }
    }
  },
  async createUser(username: string, password: string): Promise<AuthUser> {
    const clean = username.trim(); const lower = clean.toLowerCase(); const { data: existing, error: findError } = await supabase.from('app_users').select('id').eq('username_lower', lower).maybeSingle(); dbError(findError); if (existing) throw new Error('USERNAME_EXISTS');
    const { hash, salt } = hashPassword(password); const id = crypto.randomUUID(); const createdAt = new Date().toISOString();
    const { data, error } = await supabase.from('app_users').insert({ id, username: clean, username_lower: lower, password_hash: hash, salt, created_at: createdAt, location: null }).select('*').single(); dbError(error);
    await Promise.all([putData('user_profiles', id, defaultProfile(clean)), putData('user_farms', id, defaultFarm()), putData('user_reminders', id, []), putData('user_settings', id, defaultSettings()), putData('voice_history', id, []), putData('crop_doctor_history', id, [])]); return userFrom(data);
  },
  async authenticateUser(username: string, password: string): Promise<AuthUser | null> { const { data, error } = await supabase.from('app_users').select('*').eq('username_lower', username.trim().toLowerCase()).maybeSingle(); dbError(error); if (!data) return null; const user = storedFrom(data); return verifyPassword(password, user.salt, user.passwordHash) ? userFrom(data) : null; },
  async getUserById(userId: string): Promise<AuthUser | null> { const { data, error } = await supabase.from('app_users').select('*').eq('id', userId).maybeSingle(); dbError(error); return data ? userFrom(data) : null; },
  async updateUserLocation(userId: string, location: UserLocation): Promise<AuthUser | null> { const saved = { ...location, updatedAt: new Date().toISOString() }; const { data, error } = await supabase.from('app_users').update({ location: saved }).eq('id', userId).select('*').maybeSingle(); dbError(error); if (!data) return null; const settings = await getData<UserSettings>('user_settings', userId, defaultSettings()); if (!settings.defaultLocation) await putData('user_settings', userId, { ...settings, defaultLocation: saved.name }); return userFrom(data); },
  async getProfile(id: string): Promise<UserProfile> { return getData('user_profiles', id, defaultProfile()); },
  async saveProfile(id: string, patch: Partial<UserProfile>): Promise<UserProfile> { const current = await getData('user_profiles', id, defaultProfile()); const mobileChanged = typeof patch.mobileNumber === 'string' && patch.mobileNumber !== current.mobileNumber; const emailChanged = typeof patch.email === 'string' && patch.email !== current.email; return putData('user_profiles', id, { ...current, ...patch, mobileVerified: mobileChanged ? false : patch.mobileVerified ?? current.mobileVerified, emailVerified: emailChanged ? false : patch.emailVerified ?? current.emailVerified, updatedAt: new Date().toISOString() }); },
  async getFarm(id: string): Promise<FarmDetails> { return getData('user_farms', id, defaultFarm()); },
  async saveFarm(id: string, patch: Partial<FarmDetails>): Promise<FarmDetails> { return putData('user_farms', id, { ...await getData('user_farms', id, defaultFarm()), ...patch, updatedAt: new Date().toISOString() }); },
  async getReminders(id: string): Promise<Reminder[]> { return getData('user_reminders', id, []); },
  async addReminder(id: string, input: Omit<Reminder, 'id' | 'createdAt' | 'completed'>): Promise<Reminder> { const item = { ...input, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString() }; const list = await this.getReminders(id); await putData('user_reminders', id, [item, ...list]); return item; },
  async updateReminder(uid: string, id: string, patch: Partial<Reminder>): Promise<Reminder | null> { let result: Reminder | null = null; await updateList<Reminder>('user_reminders', uid, id, list => { const i = list.findIndex(x => x.id === id); if (i < 0) return null; result = { ...list[i], ...patch }; list[i] = result; return list; }); return result; },
  async deleteReminder(uid: string, id: string): Promise<boolean> { let found = false; await updateList<Reminder>('user_reminders', uid, id, list => { const next = list.filter(x => x.id !== id); found = next.length !== list.length; return found ? next : null; }); return found; },
  async getSettings(id: string): Promise<UserSettings> { return getData('user_settings', id, defaultSettings()); },
  async saveSettings(id: string, patch: Partial<UserSettings>): Promise<UserSettings> { const current = await getData<UserSettings>('user_settings', id, defaultSettings()); return putData('user_settings', id, { ...current, ...patch, notifications: { ...current.notifications, ...(patch.notifications ?? {}) }, updatedAt: new Date().toISOString() }); },
  async getVoiceHistory(id: string): Promise<VoiceConversation[]> { return getData('voice_history', id, []); },
  async upsertVoiceConversation(uid: string, conv: VoiceConversation): Promise<VoiceConversation> { const list = await this.getVoiceHistory(uid); const i = list.findIndex(x => x.id === conv.id); if (i < 0) list.unshift(conv); else list[i] = conv; await putData('voice_history', uid, list); return conv; },
  async deleteVoiceConversation(uid: string, id: string): Promise<boolean> { let found = false; await updateList<VoiceConversation>('voice_history', uid, id, list => { const next = list.filter(x => x.id !== id); found = next.length !== list.length; return found ? next : null; }); return found; },
  async getCropDoctorHistory(id: string): Promise<CropDoctorRecord[]> { return getData('crop_doctor_history', id, []); },
  async upsertCropDoctorRecord(uid: string, rec: CropDoctorRecord): Promise<CropDoctorRecord> { const list = await this.getCropDoctorHistory(uid); const i = list.findIndex(x => x.id === rec.id); if (i < 0) list.unshift(rec); else list[i] = rec; await putData('crop_doctor_history', uid, list); return rec; },
  async deleteCropDoctorRecord(uid: string, id: string): Promise<boolean> { let found = false; await updateList<CropDoctorRecord>('crop_doctor_history', uid, id, list => { const next = list.filter(x => x.id !== id); found = next.length !== list.length; return found ? next : null; }); return found; },
  async exportUserData(id: string) { const [user, profile, farm, reminders, settings, voiceHistory, cropDoctorHistory] = await Promise.all([this.getUserById(id), this.getProfile(id), this.getFarm(id), this.getReminders(id), this.getSettings(id), this.getVoiceHistory(id), this.getCropDoctorHistory(id)]); return { user, profile, farm, reminders, settings, voiceHistory: voiceHistory.map(v => ({ ...v, turns: v.turns.map(t => ({ ...t, audioBase64: undefined })) })), cropDoctorHistory: cropDoctorHistory.map(r => ({ ...r, imageDataUrl: '', turns: r.turns.map(t => ({ ...t, audioBase64: undefined })) })), exportedAt: new Date().toISOString() }; },
  async clearUserHistoryAndFarm(id: string): Promise<void> { const [voice, crops] = await Promise.all([this.getVoiceHistory(id), this.getCropDoctorHistory(id)]); const media = [...voice.flatMap(v => v.turns.map(t => t.audioStoragePath)), ...crops.flatMap(r => [r.imageStoragePath, ...r.turns.map(t => t.audioStoragePath)])].filter((p): p is string => Boolean(p)); await deleteUserMedia(id, media); await Promise.all([putData('voice_history', id, []), putData('crop_doctor_history', id, []), putData('user_reminders', id, []), putData('user_farms', id, defaultFarm())]); },
};
