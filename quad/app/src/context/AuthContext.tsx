import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User, Stats } from "../api";
import { api } from "../api";

interface AuthState {
  user: User | null;
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  login: (identity: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const uid = localStorage.getItem("quad_user_id");
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const u = await api.me();
      setUser(u);
      const s = await api.stats();
      setStats(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (identity: string) => {
    setLoading(true);
    try {
      const res = await api.login(identity);
      localStorage.setItem("quad_user_id", res.user.id);
      localStorage.setItem("quad_token", res.token);
      setUser(res.user);
      const s = await api.stats();
      setStats(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("quad_user_id");
    localStorage.removeItem("quad_token");
    setUser(null);
    setStats(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, stats, loading, error, login, logout, refreshMe, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
