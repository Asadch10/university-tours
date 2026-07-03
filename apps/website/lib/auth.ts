'use client';

import { useEffect, useState } from 'react';
import { tokenStore, authApi, type AuthResponse, type SessionUser } from './client-api';

/**
 * Auth binding for the website. Backed by real JWT sessions (see `lib/client-api.ts`):
 * the access/refresh tokens + user are persisted in localStorage, so the session
 * survives reloads. `useAuthUser` keeps components in sync across tabs and after
 * sign-in / sign-out.
 */

export type Role = 'BUYER' | 'SELLER';

export interface AuthUser {
  name: string;
  email: string;
  role: Role | null;
  hasListing?: boolean;
}

const AUTH_EVENT = 'ucpt-auth-change';

function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAuthUser(): AuthUser | null {
  const u = tokenStore.user;
  if (!u) return null;
  return { name: u.name ?? '', email: u.email ?? '', role: u.role ?? null, hasListing: u.hasListing };
}

/** Persist a fresh session after login / register, then notify listeners. */
export function setSession(res: AuthResponse) {
  tokenStore.setSession(res);
  notify();
}

/** Update the cached user (e.g. after a profile save changes name/role). */
export function updateSessionUser(patch: Partial<SessionUser>) {
  const current = tokenStore.user;
  if (!current) return;
  tokenStore.setUser({ ...current, ...patch });
  notify();
}

export function signOut() {
  void authApi.logout();
  tokenStore.clear();
  notify();
}

/** Two initials from a name (falling back to the email handle). */
export function initialsOf(name: string, email = ''): string {
  const src = name.trim() || email.split('@')[0] || 'U';
  return (
    src
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  );
}

/**
 * Reactive auth state. Returns `null` on the server and first client render (so
 * SSR markup matches), then syncs from the token store and stays updated via
 * same-tab (custom event) and cross-tab (storage) changes.
 */
export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getAuthUser());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return user;
}
