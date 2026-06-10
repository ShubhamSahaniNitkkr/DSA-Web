import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setToken, clearToken, type User } from '../../lib/api';
import { markSessionStart, clearSession } from '../../hooks/useSessionTime';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const data = await api.getMe();
    setUser(data.user);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ss_token');
    if (!token) { setLoading(false); return; }
    api.getMe().then((d) => setUser(d.user)).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    markSessionStart();
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.register(name, email, password);
    setToken(data.token);
    setUser(data.user);
    markSessionStart();
  };

  const logout = () => { clearToken(); clearSession(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
};
