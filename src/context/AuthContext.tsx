import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';

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
    let res: Response;
    const url = `${API_BASE}/api/auth/login`;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (err: any) {
      throw new Error(`Cannot reach server at ${url}. Please ensure the backend server is running.`);
    }

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

    const text = await res.text();
    throw new Error(`Server returned status ${res.status}: ${text.slice(0, 100)}`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = async (updates: { name: string; email: string; department?: string; avatar?: string }): Promise<User> => {
    const url = `${API_BASE}/api/auth/profile`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(err.error || 'Failed to update profile');
    }

    const data = await res.json();
    setUser(data.user);
    localStorage.setItem('robopart_user', JSON.stringify(data.user));
    return data.user;
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const url = `${API_BASE}/api/auth/change-password`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update password' }));
      throw new Error(err.error || 'Failed to update password');
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
