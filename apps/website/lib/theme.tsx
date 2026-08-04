'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

/** Kept in sync with THEME_SCRIPT below — both read and write the same key. */
export const THEME_STORAGE_KEY = 'ucpt-theme';

/**
 * Runs before first paint, injected into <head> in app/layout.tsx.
 *
 * Dark is the default, so it only ever ADDS the `.light` class — meaning the server HTML
 * and a no-JS render are already correct for the common case. Without this executing
 * ahead of paint, every load would flash dark before switching to a light user's choice.
 */
export const THEME_SCRIPT = `(function(){try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light'){document.documentElement.classList.add('light')}}catch(e){}})()`;

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
} | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start on the default. The effect below reconciles with what the pre-paint script
  // actually applied, so the first client render always matches the server HTML.
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  // Keep multiple tabs in step.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next: Theme = e.newValue === 'light' ? 'light' : 'dark';
      setThemeState(next);
      applyTheme(next);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled — the choice just won't survive a reload.
    }
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'),
    [setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * Theme-aware value picker for the places Tailwind cannot reach — Stripe's iframe, the
 * Leaflet popup HTML string, canvas fills. Returns `dark` until mounted so it matches the
 * server render.
 */
export function useThemeValue<T>(darkValue: T, lightValue: T): T {
  const { theme } = useTheme();
  return theme === 'light' ? lightValue : darkValue;
}
