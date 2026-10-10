import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

type Scheme = 'light' | 'dark';

type ThemeModeContextValue = {
  scheme: Scheme;
  toggleScheme: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preferredScheme, setPreferredScheme] = useState<Scheme | null>(null);
  const scheme = preferredScheme ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const value = useMemo(
    () => ({
      scheme,
      toggleScheme: () => setPreferredScheme(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  const systemScheme = useColorScheme();

  return (
    context ?? {
      scheme: systemScheme === 'dark' ? 'dark' : 'light',
      toggleScheme: () => undefined,
    }
  );
}
