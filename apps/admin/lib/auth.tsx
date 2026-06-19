'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Permission, Role } from './rbac';
import { authApi, tokenStore, ApiError } from './api';

const STORAGE_KEY = 'ucpt.admin.user.v2';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  can: (_perm: Permission) => boolean;
  canAny: (_perms: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  const persist = useCallback((next: AdminUser | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw) as AdminUser);
      } catch {
        /* ignore */
      }
      if (tokenStore.access) {
        try {
          const me = await authApi.me();
          if (!cancelled) {
            persist({
              id: me.id,
              name: me.name,
              email: me.email,
              role: 'ADMIN',
              avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(me.email)}`,
            });
          }
        } catch {
          if (!cancelled) {
            tokenStore.clear();
            persist(null);
          }
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      try {
        const res = await authApi.login(email.trim().toLowerCase(), password);
        tokenStore.set(res.accessToken, res.refreshToken);
        persist({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: 'ADMIN',
          avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(res.user.email)}`,
        });
        return { ok: true };
      } catch (e) {
        const msg =
          e instanceof ApiError && e.status === 401
            ? 'Invalid email or password.'
            : e instanceof ApiError
              ? e.message
              : 'Could not reach the server. Is the backend running on :4000?';
        return { ok: false, error: msg };
      }
    },
    [persist],
  );

  const signOut = useCallback(() => {
    void authApi.logout().catch(() => {});
    tokenStore.clear();
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn,
      signOut,
      can: () => true,
      canAny: () => true,
    }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function useCan(_perm: Permission) {
  return true;
}

export const DEMO_CREDENTIALS = { email: 'asadnaeem8@gmail.com', password: 'Test@123' };
