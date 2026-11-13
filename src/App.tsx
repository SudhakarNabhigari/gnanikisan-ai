import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Layout } from './components/Layout';
import { LocationModal } from './components/LocationModal';
import { TRANSLATIONS } from './i18n/translations';
import { apiFetch, setAuthToken } from './lib/api';
import { CropDoctorPage } from './pages/CropDoctorPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import type {
  AppLanguage,
  AppPage,
  AuthUser,
  IntegrationsStatus,
  UserLocation,
  UserSettings,
} from './types';

const LANG_STORAGE_KEY = 'gk_lang';

function getStoredLanguage(): AppLanguage {
  try {
    const val = localStorage.getItem(LANG_STORAGE_KEY);
    if (val === 'te' || val === 'hi' || val === 'en') return val;
  } catch {
    // ignore storage errors
  }
  return 'en';
}

const DEFAULT_SETTINGS: UserSettings = {
  language: getStoredLanguage(),
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
  defaultLocation: '',
  farmingSeason: 'Kharif',
  reminderTime: '08:00',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_INTEGRATIONS: IntegrationsStatus = {
  gnaniStt: 'not_configured',
  gnaniTts: 'not_configured',
  geminiReasoning: 'not_configured',
  weather: 'connected',
  geocoding: 'connected',
  mandi: 'not_configured',
  schemes: 'connected',
  smsOtp: 'not_configured',
  emailOtp: 'not_configured',
  productCatalog: 'connected',
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [integrations, setIntegrations] = useState<IntegrationsStatus>(DEFAULT_INTEGRATIONS);
  const [activePage, setActivePage] = useState<AppPage>('dashboard');

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [voiceContinueId, setVoiceContinueId] = useState<string | null>(null);
  const [cropDoctorContinueId, setCropDoctorContinueId] = useState<string | null>(null);
  const preAuthLangPickedRef = useRef(false);

  // Sync theme to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    applyTheme();
  }, [settings.theme]);

  // Persist selected language across navigation and browser refresh
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, settings.language);
    } catch {
      // ignore storage errors
    }
  }, [settings.language]);

  useEffect(() => {
    Promise.all([
      apiFetch<{ user: AuthUser | null; settings?: UserSettings }>('/api/auth/me'),
      apiFetch<IntegrationsStatus>('/api/integrations/status'),
    ])
      .then(([me, status]) => {
        setIntegrations(status);
        if (me.user) {
          setUser(me.user);
          if (me.settings) setSettings(me.settings);
          if (!me.user.location) {
            setLocationModalOpen(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  const handleAuthenticated = (authedUser: AuthUser, userSettings: UserSettings) => {
    setUser(authedUser);
    const chosenPreAuth = preAuthLangPickedRef.current ? settings.language : null;
    preAuthLangPickedRef.current = false;
    if (chosenPreAuth && chosenPreAuth !== userSettings.language) {
      setSettings({ ...userSettings, language: chosenPreAuth });
      apiFetch<{ settings: UserSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ language: chosenPreAuth }),
      })
        .then((res) => setSettings(res.settings))
        .catch(() => {});
    } else {
      setSettings(userSettings);
    }
    setActivePage('dashboard');
    apiFetch<IntegrationsStatus>('/api/integrations/status')
      .then(setIntegrations)
      .catch(() => {});
  };

  const handleChangeLanguage = useCallback(
    (lang: AppLanguage) => {
      if (!user) {
        preAuthLangPickedRef.current = true;
      }
      setSettings((prev) => ({ ...prev, language: lang }));
      if (user) {
        apiFetch<{ settings: UserSettings }>('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ language: lang }),
        })
          .then((res) => setSettings(res.settings))
          .catch(() => {});
      }
    },
    [user]
  );

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthToken(null);
    setUser(null);
    setActivePage('dashboard');
    setVoiceContinueId(null);
    setCropDoctorContinueId(null);
  };

  const handleSessionExpired = () => {
    setAuthToken(null);
    setUser(null);
    setLocationModalOpen(false);
  };

  const handleLocationSaved = (updatedUser: AuthUser, _loc: UserLocation) => {
    setUser(updatedUser);
    setLocationModalOpen(false);
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F8F3] dark:bg-[#07130C]">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#15803D] dark:text-emerald-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          {TRANSLATIONS[settings.language].auth.loadingApp}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        language={settings.language}
        onChangeLanguage={handleChangeLanguage}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <>
      <Layout
        user={user}
        activePage={activePage}
        language={settings.language}
        onNavigate={setActivePage}
        onChangeLanguage={handleChangeLanguage}
        onOpenLocationModal={() => setLocationModalOpen(true)}
        onLogout={handleLogout}
      >
        {activePage === 'dashboard' && (
          <DashboardPage
            user={user}
            language={settings.language}
            onNavigate={setActivePage}
            onOpenLocationModal={() => setLocationModalOpen(true)}
            onContinueConversation={(type, id) => {
              if (type === 'voice') {
                setVoiceContinueId(id);
                setActivePage('voice');
              } else {
                setCropDoctorContinueId(id);
                setActivePage('crop-doctor');
              }
            }}
          />
        )}

        {activePage === 'voice' && (
          <VoiceAssistantPage
            language={settings.language}
            settings={settings}
            integrations={integrations}
            initialConversationId={voiceContinueId}
            initialQuestion={null}
            onClearInitial={() => {
              setVoiceContinueId(null);
            }}
            onChangeLanguage={handleChangeLanguage}
          />
        )}

        {activePage === 'crop-doctor' && (
          <CropDoctorPage
            user={user}
            language={settings.language}
            settings={settings}
            initialRecordId={cropDoctorContinueId}
            onClearInitial={() => setCropDoctorContinueId(null)}
            onChangeLanguage={handleChangeLanguage}
          />
        )}

        {activePage === 'profile' && <ProfilePage language={settings.language} />}

        {activePage === 'history' && (
          <HistoryPage
            settings={settings}
            language={settings.language}
            onContinueVoice={(id) => {
              setVoiceContinueId(id);
              setActivePage('voice');
            }}
            onContinueCropDoctor={(id) => {
              setCropDoctorContinueId(id);
              setActivePage('crop-doctor');
            }}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            settings={settings}
            integrations={integrations}
            onSettingsUpdated={setSettings}
          />
        )}
      </Layout>

      <LocationModal
        isOpen={locationModalOpen}
        canClose={Boolean(user.location)}
        onClose={() => setLocationModalOpen(false)}
        username={user.username}
        initialLocation={user.location}
        language={settings.language}
        onLocationSaved={handleLocationSaved}
        onSessionExpired={handleSessionExpired}
      />
    </>
  );
}
