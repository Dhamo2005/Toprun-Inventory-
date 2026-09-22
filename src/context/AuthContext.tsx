import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { localStore } from '../lib/localStore.ts';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

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
  updateUserProfile: (updates: { name: string; email: string; department?: string; avatar?: string }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
    // Default active user so that any visitor on Vercel immediately sees the live application
    const defaultUser: User = {
      id: 'usr_admin',
      name: 'Dr. Elena Vance',
      email: 'admin@toprun.com',
      role: 'admin',
      department: 'Robotics Engineering & Operations',
      avatar: '',
      createdAt: '2025-01-10T08:00:00.000Z'
    };
    try {
      localStorage.setItem('robopart_user', JSON.stringify(defaultUser));
      localStorage.setItem('robopart_token', 'token_usr_admin');
    } catch {}
    return defaultUser;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('robopart_token') || 'token_usr_admin';
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
    const url = `${API_BASE}/api/auth/login`;
    try {
      const res = await fetch(url, {
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
    } catch {
      // Backend unreachable or offline on serverless, fallback to local login
    }

    // Always fall back smoothly to local authentication
    const localRes = localStore.localLogin(email, password);
    setUser(localRes.user);
    setToken(localRes.token);
    setLoginModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = async (updates: { name: string; email: string; department?: string; avatar?: string }): Promise<User> => {
    const url = `${API_BASE}/api/auth/profile`;
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('robopart_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch {
      // Fallback
    }

    // Local update fallback
    const updatedUser: User = {
      ...(user || {
        id: 'usr_admin',
        role: 'admin',
        createdAt: new Date().toISOString()
      }),
      name: updates.name,
      email: updates.email,
      department: updates.department || user?.department || 'Operations',
      avatar: updates.avatar || user?.avatar || ''
    };
    setUser(updatedUser);
    localStorage.setItem('robopart_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const url = `${API_BASE}/api/auth/change-password`;
    try {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
    } catch {
      // Gracefully resolve on offline / serverless
    }
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
        updateUserProfile,
        changePassword,
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
