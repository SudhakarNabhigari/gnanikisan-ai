import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AuthUser,
  CropDoctorRecord,
  FarmDetails,
  Reminder,
  UserLocation,
  UserProfile,
  UserSettings,
  VoiceConversation,
} from '../src/types';

interface StoredUserRecord {
  id: string;
  username: string;
  usernameLower: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  location: UserLocation | null;
}

interface DatabaseSchema {
  users: StoredUserRecord[];
  profiles: Record<string, UserProfile>;
  farms: Record<string, FarmDetails>;
  reminders: Record<string, Reminder[]>;
  settings: Record<string, UserSettings>;
  voiceHistory: Record<string, VoiceConversation[]>;
  cropDoctorHistory: Record<string, CropDoctorRecord[]>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'gnanikisan-db.json');
const SECRET_FILE = path.join(DATA_DIR, 'session-secret.key');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  ensureDataDir();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
  return generated;
}

function defaultDb(): DatabaseSchema {
  return {
    users: [],
    profiles: {},
    farms: {},
    reminders: {},
    settings: {},
    voiceHistory: {},
    cropDoctorHistory: {},
  };
}

function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = defaultDb();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      users: parsed.users ?? [],
      profiles: parsed.profiles ?? {},
      farms: parsed.farms ?? {},
      reminders: parsed.reminders ?? {},
      settings: parsed.settings ?? {},
      voiceHistory: parsed.voiceHistory ?? {},
      cropDoctorHistory: parsed.cropDoctorHistory ?? {},
    };
  } catch {
    return defaultDb();
  }
}

function writeDb(db: DatabaseSchema): void {
  ensureDataDir();
  const tempFile = `${DB_FILE}.tmp.${process.pid}`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), { encoding: 'utf8' });
  fs.renameSync(tempFile, DB_FILE);
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt ?? crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash: derived, salt };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signSessionToken(userId: string): string {
  const secret = getSessionSecret();
  const issuedAt = Date.now();
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: issuedAt })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const secret = getSessionSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string;
      iat?: number;
    };
    if (!parsed.uid) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

export function defaultSettings(locationName = ''): UserSettings {
  return {
    language: 'en',
    voiceName: 'Shivani',
    voiceSpeed: 1.0,
    voiceStyle: 'normal',
    notifications: {
      reminders: true,
      weather: true,
      schemes: true,
      cropAdvice: true,
    },
    theme: 'light',
    units: 'Acres',
    defaultLocation: locationName,
    farmingSeason: 'Kharif',
    reminderTime: '08:00',
    updatedAt: new Date().toISOString(),
  };
}

export function defaultFarm(): FarmDetails {
  return {
    landArea: 0,
    landUnit: 'Acres',
    crops: ['Paddy (Vari)'],
    soilType: 'Black',
    irrigation: 'Borewell',
    sowingDate: '',
    growthStage: '',
    updatedAt: new Date().toISOString(),
  };
}

export function defaultProfile(fullName = ''): UserProfile {
  return {
    fullName,
    mobileNumber: '',
    mobileVerified: false,
    email: '',
    emailVerified: false,
    updatedAt: new Date().toISOString(),
  };
}

export const store = {
  createUser(username: string, password: string): AuthUser {
    const db = readDb();
    const clean = username.trim();
    const lower = clean.toLowerCase();
    if (db.users.some((u) => u.usernameLower === lower)) {
      throw new Error('USERNAME_EXISTS');
    }
    const { hash, salt } = hashPassword(password);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: StoredUserRecord = {
      id,
      username: clean,
      usernameLower: lower,
      passwordHash: hash,
      salt,
      createdAt: now,
      location: null,
    };
    db.users.push(record);
    db.profiles[id] = defaultProfile(clean);
    db.farms[id] = defaultFarm();
    db.settings[id] = defaultSettings();
    db.reminders[id] = [];
    db.voiceHistory[id] = [];
    db.cropDoctorHistory[id] = [];
    writeDb(db);
    return {
      id: record.id,
      username: record.username,
      createdAt: record.createdAt,
      location: record.location,
    };
  },

  authenticateUser(username: string, password: string): AuthUser | null {
    const db = readDb();
    const lower = username.trim().toLowerCase();
    const found = db.users.find((u) => u.usernameLower === lower);
    if (!found) return null;
    if (!verifyPassword(password, found.salt, found.passwordHash)) return null;
    return {
      id: found.id,
      username: found.username,
      createdAt: found.createdAt,
      location: found.location,
    };
  },

  getUserById(userId: string): AuthUser | null {
    const db = readDb();
    const found = db.users.find((u) => u.id === userId);
    if (!found) return null;
    return {
      id: found.id,
      username: found.username,
      createdAt: found.createdAt,
      location: found.location,
    };
  },

  updateUserLocation(userId: string, location: UserLocation): AuthUser | null {
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    user.location = { ...location, updatedAt: new Date().toISOString() };
    if (db.settings[userId] && !db.settings[userId].defaultLocation) {
      db.settings[userId].defaultLocation = location.name;
    }
    writeDb(db);
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      location: user.location,
    };
  },

  getProfile(userId: string): UserProfile {
    const db = readDb();
    return db.profiles[userId] ?? defaultProfile();
  },

  saveProfile(userId: string, patch: Partial<UserProfile>): UserProfile {
    const db = readDb();
    const current = db.profiles[userId] ?? defaultProfile();
    const mobileChanged =
      typeof patch.mobileNumber === 'string' && patch.mobileNumber !== current.mobileNumber;
    const emailChanged = typeof patch.email === 'string' && patch.email !== current.email;

    const updated: UserProfile = {
      ...current,
      ...patch,
      mobileVerified: mobileChanged ? false : (patch.mobileVerified ?? current.mobileVerified),
      emailVerified: emailChanged ? false : (patch.emailVerified ?? current.emailVerified),
      updatedAt: new Date().toISOString(),
    };
    db.profiles[userId] = updated;
    writeDb(db);
    return updated;
  },

  getFarm(userId: string): FarmDetails {
    const db = readDb();
    return db.farms[userId] ?? defaultFarm();
  },

  saveFarm(userId: string, farm: Partial<FarmDetails>): FarmDetails {
    const db = readDb();
    const current = db.farms[userId] ?? defaultFarm();
    const updated: FarmDetails = {
      ...current,
      ...farm,
      updatedAt: new Date().toISOString(),
    };
    db.farms[userId] = updated;
    writeDb(db);
    return updated;
  },

  getReminders(userId: string): Reminder[] {
    const db = readDb();
    return db.reminders[userId] ?? [];
  },

  addReminder(userId: string, input: Omit<Reminder, 'id' | 'createdAt' | 'completed'>): Reminder {
    const db = readDb();
    const list = db.reminders[userId] ?? [];
    const item: Reminder = {
      ...input,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    db.reminders[userId] = list;
    writeDb(db);
    return item;
  },

  updateReminder(userId: string, reminderId: string, patch: Partial<Reminder>): Reminder | null {
    const db = readDb();
    const list = db.reminders[userId] ?? [];
    const idx = list.findIndex((r) => r.id === reminderId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    db.reminders[userId] = list;
    writeDb(db);
    return list[idx];
  },

  deleteReminder(userId: string, reminderId: string): boolean {
    const db = readDb();
    const list = db.reminders[userId] ?? [];
    const next = list.filter((r) => r.id !== reminderId);
    if (next.length === list.length) return false;
    db.reminders[userId] = next;
    writeDb(db);
    return true;
  },

  getSettings(userId: string): UserSettings {
    const db = readDb();
    return db.settings[userId] ?? defaultSettings();
  },

  saveSettings(userId: string, patch: Partial<UserSettings>): UserSettings {
    const db = readDb();
    const current = db.settings[userId] ?? defaultSettings();
    const updated: UserSettings = {
      ...current,
      ...patch,
      notifications: {
        ...current.notifications,
        ...(patch.notifications ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };
    db.settings[userId] = updated;
    writeDb(db);
    return updated;
  },

  getVoiceHistory(userId: string): VoiceConversation[] {
    const db = readDb();
    return db.voiceHistory[userId] ?? [];
  },

  upsertVoiceConversation(userId: string, conv: VoiceConversation): VoiceConversation {
    const db = readDb();
    const list = db.voiceHistory[userId] ?? [];
    const idx = list.findIndex((c) => c.id === conv.id);
    if (idx === -1) {
      list.unshift(conv);
    } else {
      list[idx] = conv;
    }
    db.voiceHistory[userId] = list;
    writeDb(db);
    return conv;
  },

  deleteVoiceConversation(userId: string, id: string): boolean {
    const db = readDb();
    const list = db.voiceHistory[userId] ?? [];
    const next = list.filter((c) => c.id !== id);
    if (next.length === list.length) return false;
    db.voiceHistory[userId] = next;
    writeDb(db);
    return true;
  },

  getCropDoctorHistory(userId: string): CropDoctorRecord[] {
    const db = readDb();
    return db.cropDoctorHistory[userId] ?? [];
  },

  upsertCropDoctorRecord(userId: string, rec: CropDoctorRecord): CropDoctorRecord {
    const db = readDb();
    const list = db.cropDoctorHistory[userId] ?? [];
    const idx = list.findIndex((c) => c.id === rec.id);
    if (idx === -1) {
      list.unshift(rec);
    } else {
      list[idx] = rec;
    }
    db.cropDoctorHistory[userId] = list;
    writeDb(db);
    return rec;
  },

  deleteCropDoctorRecord(userId: string, id: string): boolean {
    const db = readDb();
    const list = db.cropDoctorHistory[userId] ?? [];
    const next = list.filter((c) => c.id !== id);
    if (next.length === list.length) return false;
    db.cropDoctorHistory[userId] = next;
    writeDb(db);
    return true;
  },

  exportUserData(userId: string) {
    const db = readDb();
    const user = db.users.find((u) => u.id === userId);
    return {
      user: user
        ? { id: user.id, username: user.username, createdAt: user.createdAt, location: user.location }
        : null,
      profile: db.profiles[userId] ?? null,
      farm: db.farms[userId] ?? null,
      reminders: db.reminders[userId] ?? [],
      settings: db.settings[userId] ?? null,
      voiceHistory: (db.voiceHistory[userId] ?? []).map((v) => ({
        ...v,
        turns: v.turns.map((t) => ({ ...t, audioBase64: undefined })),
      })),
      cropDoctorHistory: db.cropDoctorHistory[userId] ?? [],
      exportedAt: new Date().toISOString(),
    };
  },

  clearUserHistoryAndFarm(userId: string): void {
    const db = readDb();
    db.voiceHistory[userId] = [];
    db.cropDoctorHistory[userId] = [];
    db.reminders[userId] = [];
    db.farms[userId] = defaultFarm();
    writeDb(db);
  },
};
