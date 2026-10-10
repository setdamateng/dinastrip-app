import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { KEYS, storage } from '@/services/storage';
import { Palette, palettes } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeValue = {
  c: Palette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    storage.get(KEYS.theme).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    storage.set(KEYS.theme, m);
  }, []);

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      c: isDark ? palettes.dark : palettes.light,
      isDark,
      mode,
      setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark'),
    }),
    [isDark, mode, setMode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme harus di dalam ThemeProvider');
  return v;
}
