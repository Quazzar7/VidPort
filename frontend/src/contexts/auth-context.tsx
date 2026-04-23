'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '@/lib/api';

export type UserRole = 'Creator' | 'Recruiter' | 'Admin';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: number) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeRole(token: string): UserRole | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    return (payload[roleKey] ?? payload['role']) as UserRole | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  const restoreSession = useCallback(async () => {
    try {
      const { accessToken } = await api.auth.refresh();
      setAccessToken(accessToken);
      setIsAuthenticated(true);
      setRole(decodeRole(accessToken));
      document.cookie = 'vid_logged_in=1; path=/; max-age=604800; samesite=strict';
    } catch {
      setAccessToken(null);
      setIsAuthenticated(false);
      setRole(null);
      document.cookie = 'vid_logged_in=; path=/; max-age=0';
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await api.auth.login(email, password);
    setAccessToken(accessToken);
    setIsAuthenticated(true);
    setRole(decodeRole(accessToken));
    document.cookie = 'vid_logged_in=1; path=/; max-age=604800; samesite=strict';
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setAccessToken(null);
    setIsAuthenticated(false);
    setRole(null);
    document.cookie = 'vid_logged_in=; path=/; max-age=0';
  }, []);

  const register = useCallback(async (email: string, password: string, role: number) => {
    const { userId } = await api.auth.register(email, password, role);
    return userId;
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, role, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
