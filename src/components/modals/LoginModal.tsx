import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import { ToprunLogo } from '../ToprunLogo.tsx';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  X, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const isDev = import.meta.env.DEV;
  const [email, setEmail] = useState(isDev ? 'admin@toprun.com' : '');
  const [password, setPassword] = useState(isDev ? 'password123' : '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid enterprise credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ToprunLogo className="h-8 w-8 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Toprun Sign In
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authenticate with corporate credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Work Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@toprun.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Directory Accounts for Testing (DEV MODE ONLY) */}
        {isDev ? (
          <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Dev Mode Accounts
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                PW: password123
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@toprun.com')}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Admin</p>
                  <p className="text-[10px] text-slate-400 truncate">admin@toprun.com</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('manager@toprun.com')}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Manager</p>
                  <p className="text-[10px] text-slate-400 truncate">manager@toprun.com</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('tech@toprun.com')}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Technician</p>
                  <p className="text-[10px] text-slate-400 truncate">tech@toprun.com</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('viewer@toprun.com')}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Viewer</p>
                  <p className="text-[10px] text-slate-400 truncate">viewer@toprun.com</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Protected by Enterprise Corporate SSO & IEC 62443 Security Standards
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
