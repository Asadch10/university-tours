// Theme runtime: provider, hooks, and persistence. Mirrors the website's lib/theme.tsx.
//
// Dark is the default. The choice is stored via expo-secure-store (already a dependency
// for auth tokens, so this needs no new native module) and read once on boot.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PALETTES, type Palette, type ThemeName } from './theme';

const STORAGE_KEY = 'ucpt-mobile-theme';

interface ThemeCtx {
  theme: ThemeName;
  colors: Palette;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  /** False until the stored choice has been read — avoids a light flash on boot. */
  ready: boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((v) => {
        if (cancelled) return;
        if (v === 'light' || v === 'dark') setThemeState(v);
      })
      .catch(() => {
        // Storage unavailable — stay on the default.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {
      // Non-fatal: the choice just won't survive a restart.
    });
  }, []);

  const toggleTheme = useCallback(
    () => setThemeState((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
      return next;
    }),
    [],
  );

  const value = useMemo<ThemeCtx>(
    () => ({ theme, colors: PALETTES[theme], setTheme, toggleTheme, ready }),
    [theme, setTheme, toggleTheme, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Just the palette — the common case inside components. */
export function useThemeColors(): Palette {
  return useTheme().colors;
}

/**
 * Build a stylesheet from the active palette.
 *
 * `StyleSheet.create` at module scope runs once at import and would freeze the theme, so
 * screens export `makeStyles(c)` and call this instead. Memoised on the palette, so the
 * sheet is rebuilt only when the theme actually changes.
 */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  makeStyles: (c: Palette) => T,
): T {
  const colors = useThemeColors();
  return useMemo(() => makeStyles(colors), [makeStyles, colors]);
}
