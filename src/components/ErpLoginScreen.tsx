import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { ToprunLogo } from './ToprunLogo.tsx';
import { UserAvatar } from './UserAvatar.tsx';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sun,
  Moon,
  Users,
  ToggleLeft,
  ToggleRight,
  Package,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types.ts';

interface TestAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roleTitle: string;
  canDo: string;
  avatar: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    name: 'Dr. Elena Vance',
    email: 'admin@toprun.com',
    password: 'password123',
    role: 'admin',
    roleTitle: 'Admin',
    canDo: 'Can do everything: add parts, update stock, make orders, and manage users.',
    avatar: ''
  },
  {
    name: 'Marcus Reyes',
    email: 'manager@toprun.com',
    password: 'password123',
    role: 'manager',
    roleTitle: 'Manager',
    canDo: 'Can add parts, update stock details, and create purchase orders.',
    avatar: ''
  },
  {
    name: 'Alex Mercer',
    email: 'tech@toprun.com',
    password: 'password123',
    role: 'technician',
    roleTitle: 'Technician',
    canDo: 'Can record parts used for repairs and check stock levels.',
    avatar: ''
  },
  {
    name: 'Sarah Jenkins',
    email: 'viewer@toprun.com',
    password: 'password123',
    role: 'viewer',
    roleTitle: 'Viewer',
    canDo: 'Can only view items and download reports (read only).',
    avatar: ''
  }
];

const roleBadges: Record<UserRole, { bg: string; text: string; border: string }> = {
  admin: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  manager: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  technician: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  viewer: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

export const ErpLoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Enable test accounts and demo credentials for easy preview & evaluation
  const [showDevDetails, setShowDevDetails] = useState(true);

  const [email, setEmail] = useState('admin@toprun.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleEnvironmentPreview = () => {
    setShowDevDetails(!showDevDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickAccount = (acc: TestAccount) => {
    if (!showDevDetails) return;
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <button
          type="button"
          onClick={() => { window.location.href = '/'; }}
          aria-label="Go to homepage"
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/40 rounded-xl p-1 -m-1 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ToprunLogo className="h-10 w-10 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg block">
              Toprun
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Robotics & Operations Platform
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Demo Mode toggle button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleEnvironmentPreview}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 min-h-[36px]"
              title="Toggle test demo accounts panel"
            >
              {showDevDetails ? (
                <>
                  <ToggleRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Demo Accounts (On)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 text-slate-400" />
                  <span className="hidden sm:inline">Show Demo Accounts</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[36px]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <div className={`grid grid-cols-1 ${showDevDetails ? 'lg:grid-cols-12' : 'max-w-md mx-auto w-full'} gap-8 items-start`}>
          
          {/* Sign In Form */}
          <div className={`${showDevDetails ? 'lg:col-span-5' : 'w-full'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md`}>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Sign In
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your work email and password to log in.
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@toprun.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {showDevDetails && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Dev default: password123
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-800 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? (
                  <span>Checking details...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Development Mode: Show test accounts with emails and passwords */}
          {showDevDetails && (
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Test Accounts
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Dev Mode Only
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click any account to fill the login form and test its permissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEST_ACCOUNTS.map((acc) => {
                  const isCurrentSelected = email === acc.email;
                  const bStyle = roleBadges[acc.role];

                  return (
                    <div
                      key={acc.email}
                      className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all text-left ${
                        isCurrentSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={acc.avatar}
                            name={acc.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {acc.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                              {acc.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}>
                            <ShieldCheck className="h-3 w-3" />
                            {acc.roleTitle}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          {acc.canDo}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                          Password: {acc.password}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePickAccount(acc)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all min-h-[32px] ${
                            isCurrentSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300 dark:border-slate-700 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isCurrentSelected ? 'Loaded' : 'Use Account'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                These test passwords and emails are visible in dev mode only. They are hidden when deployed in production.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        Toprun • Inventory Management System
      </footer>
    </div>
  );
};
