import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, setToken, setUnauthorizedHandler } from '@/services/api';
import { authService } from '@/services/auth';
import { KEYS, storage } from '@/services/storage';
import type { User } from '@/services/types';

type AuthValue = {
  user: User | null;
  loading: boolean; // true selama memulihkan sesi dari penyimpanan
  signIn: (p: { login: string; password: string; captchaId: string; captcha: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocal = useCallback(async () => {
    setToken(null);
    await storage.remove(KEYS.token);
    setUser(null);
  }, []);

  // Token ditolak server (kadaluarsa / dicabut) -> kembali ke login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearLocal();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocal]);

  // Pulihkan sesi saat aplikasi dibuka
  useEffect(() => {
    (async () => {
      const saved = await storage.get(KEYS.token);
      if (saved) {
        setToken(saved);
        try {
          setUser(await authService.me());
        } catch (e) {
          // 401 sudah ditangani handler. Gangguan jaringan: tetap di login, token disimpan untuk percobaan berikutnya.
          if (e instanceof ApiError && e.status === 401) await clearLocal();
          else setToken(null);
        }
      }
      setLoading(false);
    })();
  }, [clearLocal]);

  const signIn = useCallback<AuthValue['signIn']>(async (p) => {
    const res = await authService.login(p);
    setToken(res.token);
    await storage.set(KEYS.token, res.token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    await clearLocal();
  }, [clearLocal]);

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth harus di dalam AuthProvider');
  return v;
}
