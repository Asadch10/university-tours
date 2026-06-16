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
import { roleHas, roleHasAny, type Permission, type Role } from './rbac';
import { authApi, tokenStore, ApiError } from './api';

/**
 * Live authentication against the backend.
 *
 * `signIn` calls POST /api/v1/auth/login, persists the access + refresh tokens,
 * and hydrates the session from the returned user. On mount we restore the
 * session via GET /auth/me using the stored token. RBAC checks (`can`/`canAny`)
 * run client-side off the role for UX; the backend re-enforces every permission.
 */

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
  /** Dev-only: switch role locally to preview RBAC (does not change server perms). */
  setRole: (role: Role) => void;
  can: (perm: Permission) => boolean;
  canAny: (perms: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function roleFromAdminRoleName(name: string | null | undefined): Role {
  if (name === 'MANAGER' || name === 'SUPPORT') return name;
  return 'SUPER_ADMIN';
}

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

  // Restore session on mount: trust the cached user, then revalidate with /me.
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
              role: roleFromAdminRoleName(me.adminRoleName),
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
          role: roleFromAdminRoleName(res.user.adminRoleName),
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

  const setRole = useCallback(
    (role: Role) =>
      setUser((u) => {
        if (!u) return u;
        const next = { ...u, role };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn,
      signOut,
      setRole,
      can: (perm) => (user ? roleHas(user.role, perm) : false),
      canAny: (perms) => (user ? roleHasAny(user.role, perms) : false),
    }),
    [user, ready, signIn, signOut, setRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function useCan(perm: Permission) {
  return useAuth().can(perm);
}

export const DEMO_CREDENTIALS = { email: 'asadnaeem8@gmail.com', password: 'Test@123' };
