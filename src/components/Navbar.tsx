import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { UserRole, InventoryAlert } from '../types.ts';
import { ToprunLogo } from './ToprunLogo.tsx';
import { UserAvatar } from './UserAvatar.tsx';
import { 
  Sun, 
  Moon, 
  Bell, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Menu, 
  X,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  alerts: InventoryAlert[];
  onOpenAlerts: () => void;
  onSelectPartId?: (partId: string) => void;
  onResolveAlert?: (alertId: string) => Promise<void>;
  onNavigateHome?: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  alerts,
  onOpenAlerts,
  onSelectPartId,
  onResolveAlert,
  onNavigateHome,
  onOpenProfile
}) => {
  const { user, role, logout, setLoginModalOpen } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAlertPopoverOpen, setAlertPopoverOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const alertPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (alertPopoverRef.current && !alertPopoverRef.current.contains(event.target as Node)) {
        setAlertPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAlerts = alerts.filter(a => !a.isResolved);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    admin: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
    manager: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    technician: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    viewer: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="inline-flex h-10 w-10 min-w-[40px] shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <button
          id="navbar-logo-btn"
          type="button"
          onClick={onNavigateHome}
          aria-label="Go to homepage"
          title="Go to Homepage"
          className="flex items-center rounded-lg p-1 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
        >
          <ToprunLogo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Alerts Bell (Compact & Accessible) */}
        <div ref={alertPopoverRef} className="relative">
          <button
            id="navbar-alerts-btn"
            onClick={() => setAlertPopoverOpen(!isAlertPopoverOpen)}
            aria-label="View notifications"
            className="relative flex h-9 w-9 min-w-[36px] items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {activeAlerts.length > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'}`}>
                {activeAlerts.length}
              </span>
            )}
          </button>

          {isAlertPopoverOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-1 w-[calc(100vw-1rem)] max-w-sm sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Database Stock Alerts</span>
                  {activeAlerts.length > 0 && (
                    <span className="rounded-full bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      {activeAlerts.length} active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAlertPopoverOpen(false);
                    onOpenAlerts();
                  }}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400 font-medium py-1 px-2"
                >
                  View All ({alerts.length})
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 py-1">
                {activeAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-1.5 opacity-80" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">All parts have adequate stock</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Database triggers report no low-stock alerts</p>
                  </div>
                ) : (
                  activeAlerts.slice(0, 5).map((alt) => (
                    <div key={alt.id} className="py-2.5 px-1 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-700/40 rounded-lg transition-colors">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {alt.severity === 'critical' ? (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {alt.title}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          alt.severity === 'critical' 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {alt.severity}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alt.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="font-mono text-[10px] text-slate-400">
                          {alt.partNumber}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {onSelectPartId && alt.partId && (
                            <button
                              onClick={() => {
                                setAlertPopoverOpen(false);
                                onSelectPartId(alt.partId);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}

                          {onResolveAlert && (role === 'admin' || role === 'manager') && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onResolveAlert(alt.id);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                              title="Mark resolved in database"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {activeAlerts.length > 5 && (
                <div className="border-t border-slate-100 pt-2 text-center dark:border-slate-700">
                  <button
                    onClick={() => {
                      setAlertPopoverOpen(false);
                      onOpenAlerts();
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline dark:text-indigo-400"
                  >
                    +{activeAlerts.length - 5} more alerts in Alerts Center
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark/Light Mode Toggle (Visible on sm+ screens; hidden on mobile where it lives under Profile icon) */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="hidden sm:flex h-9 w-9 min-w-[36px] items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Profile Avatar & Interactive Dropdown (Houses all hidden mobile items) */}
        {user ? (
          <div ref={profileMenuRef} className="relative">
            <button
              id="profile-menu-button"
              onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="Open profile and settings menu"
              className="flex items-center gap-1.5 rounded-xl p-0.5 sm:p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <div className="relative">
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  size="sm"
                  className="border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
              </div>
              <div className="hidden text-left xl:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {user.department || 'Active'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block shrink-0" />
            </button>

            {/* Comprehensive Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-1 w-[calc(100vw-1rem)] max-w-xs sm:max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* 1. User Identity Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    size="md"
                    className="border-2 border-indigo-500/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-900 truncate dark:text-white text-sm">
                        {user.name}
                      </h4>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${roleColors[role].bg} ${roleColors[role].text}`}>
                        {role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {user.department}
                    </p>
                  </div>
                </div>

                {/* 2. User Role & Permissions */}
                <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      User Role
                    </span>
                  </div>
                  <div className={`rounded-xl border p-2.5 ${roleColors[role].bg} ${roleColors[role].border}`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-4 w-4 shrink-0 ${roleColors[role].text}`} />
                      <div>
                        <p className={`text-xs font-bold capitalize ${roleColors[role].text}`}>
                          {role === 'admin' ? 'Administrator' : role === 'manager' ? 'Inventory Manager' : role === 'technician' ? 'Technician' : 'Viewer'}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {role === 'admin' && 'Full access: parts, stock, orders & users'}
                          {role === 'manager' && 'Can add parts, update stock & place orders'}
                          {role === 'technician' && 'Can record parts used and check stock'}
                          {role === 'viewer' && 'Can view parts and download reports'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Profile & Password Button */}
                <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <button
                    id="navbar-profile-settings-btn"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-indigo-50/90 px-3 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 min-h-[40px] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      <span>Edit Profile & Password</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </button>
                </div>

                {/* 3. Appearance Theme & Quick Controls */}
                <div className="py-2 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                      {theme === 'dark' ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                      <span>Theme</span>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <span className="capitalize">{theme}</span>
                    </button>
                  </div>

                  {/* Quick Alerts shortcut */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenAlerts();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-slate-500" />
                      <span>Inventory Alerts</span>
                    </div>
                    {activeAlerts.length > 0 ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${criticalCount > 0 ? 'bg-rose-600' : 'bg-amber-500'}`}>
                        {activeAlerts.length} active
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-500 font-medium">All Good</span>
                    )}
                  </button>
                </div>

                {/* 4. Sign Out */}
                <div className="pt-2">
                  <button
                    id="profile-logout-btn"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/50 min-h-[40px] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            id="login-open-btn"
            onClick={() => setLoginModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 min-h-[36px]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
