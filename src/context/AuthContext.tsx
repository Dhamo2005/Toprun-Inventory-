import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { localStore } from '../lib/localStore.ts';

interface AuthPermissions {
  canManageUsers: boolean;
  canEditPart: boolean;
  canDeletePart: boolean;
  canConsume: boolean;
  canRestock: boolean;
  canReorder: boolean;
  canResolveAlerts: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole;
  permissions: AuthPermissions;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
}

const DEFAULT_PERMISSIONS: AuthPermissions = {
  canManageUsers: false,
  canEditPart: false,
  canDeletePart: false,
  canConsume: false,
  canRestock: false,
  canReorder: false,
  canResolveAlerts: false,
};

function computePermissions(role: UserRole): AuthPermissions {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canEditPart: true,
        canDeletePart: true,
        canConsume: true,
        canRestock: true,
        canReorder: true,
        canResolveAlerts: true,
      };
    case 'manager':
      return {
        canManageUsers: false,
        canEditPart: true,
        canDeletePart: false,
        canConsume: true,
        canRestock: true,
        canReorder: true,
        canResolveAlerts: true,
      };
    case 'technician':
      return {
        canManageUsers: false,
        canEditPart: false,
        canDeletePart: false,
        canConsume: true,
        canRestock: false,
        canReorder: false,
        canResolveAlerts: false,
      };
    case 'viewer':
    default:
      return {
        canManageUsers: false,
        canEditPart: false,
        canDeletePart: false,
        canConsume: false,
        canRestock: false,
        canReorder: false,
        canResolveAlerts: false,
      };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('robopart_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch { return null; }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('robopart_token') || null;
  });

  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('robopart_user', JSON.stringify(user));
      localStorage.setItem('robopart_token', token);
    } else {
      localStorage.removeItem('robopart_user');
      localStorage.removeItem('robopart_token');
    }
  }, [user, token]);

  const role: UserRole = user?.role || 'viewer';
  const permissions = computePermissions(role);

  const login = async (email: string, password: string = '') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        setLoginModalOpen(false);
        return;
      }

      if (!res.ok && contentType.includes('application/json')) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to authenticate');
      }

      // If server returned non-JSON (e.g. Vercel 404 HTML: "The page could not be found")
      // Seamlessly authenticate using local client store
      const localResult = localStore.login(email, password);
      setUser(localResult.user);
      setToken(localResult.token);
      setLoginModalOpen(false);
    } catch (err: any) {
      if (err.message === 'User with this email not found' || err.message === 'Invalid or missing password') {
        throw err;
      }
      // On network failure or unexpected response, attempt local authentication
      try {
        const localResult = localStore.login(email, password);
        setUser(localResult.user);
        setToken(localResult.token);
        setLoginModalOpen(false);
      } catch (localErr: any) {
        throw new Error(localErr.message || err.message || 'Failed to authenticate');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role,
        permissions,
        login,
        logout,
        isLoginModalOpen,
        setLoginModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
