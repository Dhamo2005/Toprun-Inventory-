import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';

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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to authenticate');
    }

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    setLoginModalOpen(false);
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
