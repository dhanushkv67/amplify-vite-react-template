import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, authApi, type User } from '../lib/api';

type AuthState = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setUser(await authApi.me()); }
    catch (error) {
      setUser(null);
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh().catch(() => { /* keep UI usable after network failure */ }); }, [refresh]);
  const login = async (email: string, password: string) => { setUser(await authApi.login(email, password)); };
  const signup = async (email: string, password: string) => {
    await authApi.signup(email, password);
    setUser(await authApi.login(email, password));
  };
  const logout = async () => { await authApi.logout(); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, refresh, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useOptionalAuth(): AuthState | null { return useContext(AuthContext); }

export function useAuth(): AuthState {
  const context = useOptionalAuth();
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
