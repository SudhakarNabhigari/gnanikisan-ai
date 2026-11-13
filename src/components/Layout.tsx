import {
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Settings,
  Sprout,
  User,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import type { AppLanguage, AppPage, AuthUser } from '../types';

interface LayoutProps {
  user: AuthUser;
  activePage: AppPage;
  language: AppLanguage;
  onNavigate: (page: AppPage) => void;
  onChangeLanguage: (lang: AppLanguage) => void;
  onOpenLocationModal: () => void;
  onLogout: () => Promise<void>;
  children: ReactNode;
}

export function Layout({
  user,
  activePage,
  language,
  onNavigate,
  onChangeLanguage,
  onOpenLocationModal,
  onLogout,
  children,
}: LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const t = TRANSLATIONS[language];

  // STRICT REQUIREMENT: Exactly six navigation items + separate Logout at bottom.
  const navItems: Array<{ id: AppPage; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'voice', label: t.nav.voice, icon: Mic },
    { id: 'crop-doctor', label: t.nav.cropDoctor, icon: Sprout },
    { id: 'profile', label: t.nav.profile, icon: User },
    { id: 'history', label: t.nav.history, icon: History },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const currentNav = navItems.find((n) => n.id === activePage) ?? navItems[0];
  const CurrentIcon = currentNav.icon;

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const sidebarContent = (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0A3A21] via-[#082E1A] to-[#062113] text-white">
      <div>
        {/* Brand Lockup */}
        <div className="flex items-center justify-between px-5 pt-5 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] shadow-md">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold leading-tight tracking-tight text-white">
                GnaniKisan AI
              </div>
              <div className="truncate text-[11px] text-emerald-200/75">{t.nav.tagline}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Exact 6 Navigation Links */}
        <nav className="space-y-1.5 px-3" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileNavOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white shadow-md shadow-emerald-950/30'
                    : 'text-emerald-100/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Agricultural Visual + Separate Logout Button */}
      <div className="relative mt-6">
        <div className="relative h-28 overflow-hidden opacity-45">
          <img
            src="/src/assets/images/sidebar_farm_dusk_1794593808249.jpg"
            alt="Farm tractor at dusk"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062113] via-[#062113]/50 to-[#062113]" />
        </div>

        <div className="border-t border-emerald-400/15 bg-[#051B0F] p-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-emerald-400/20 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-emerald-100 transition hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F3F8F3] text-[#0D2315] dark:bg-[#07130C] dark:text-[#ECF5EE]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden w-[250px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-[260px] max-w-[85vw]">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-emerald-900/10 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-emerald-800/40 dark:bg-[#0B1C12]/90">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-emerald-50 lg:hidden dark:border-emerald-800 dark:text-emerald-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#15803D] dark:bg-emerald-900/50 dark:text-emerald-300">
              <CurrentIcon className="h-4.5 w-4.5" />
            </div>
            <h1 className="truncate font-display text-lg font-bold text-[#0D2315] sm:text-xl dark:text-white">
              {currentNav.label}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            {/* Readable Farm Location Button */}
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="hidden items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-950 transition hover:bg-emerald-100 sm:inline-flex dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
              <span className="max-w-[180px] truncate">
                {user.location?.name || t.common.locationNotSet}
              </span>
            </button>

            {/* Quick Language Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-emerald-800 dark:bg-[#08150D]">
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

            {/* User Avatar */}
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-white py-1 pr-2.5 pl-1 transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-[#0D2115]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#15803D] font-display text-xs font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[110px] truncate text-xs font-semibold text-slate-800 md:inline dark:text-emerald-100">
                {user.username}
              </span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-emerald-800 dark:bg-[#0D2115]">
            <h2 className="font-display text-lg font-bold text-[#0D2315] dark:text-white">
              {t.logoutModal.title}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-emerald-200/80">
              {t.logoutModal.description}
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-emerald-800 dark:text-emerald-100"
              >
                {t.logoutModal.cancel}
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={loggingOut}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {t.logoutModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
