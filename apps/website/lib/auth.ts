'use client';

import { useEffect, useState } from 'react';

/**
 * DEMO AUTH — a lightweight, client-only auth signal backed by localStorage.
 *
 * There is no real backend session yet, so the website treats "has a saved
 * account in localStorage" as "logged in". When the real auth flow (JWT access
 * + refresh via @ucpt/sdk) is wired up, replace getAuthUser/signIn/signOut with
 * calls to the SDK and keep `useAuthUser` as the React binding.
 */

export type Role = 'BUYER' | 'SELLER';

export interface AuthUser {
  name: string;
  email: string;
  role: Role | null;
}

const AUTH_EVENT = 'ucpt-auth-change';

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const name = localStorage.getItem('ucpt_name') ?? '';
    const email = localStorage.getItem('ucpt_email') ?? '';
    const role = localStorage.getItem('ucpt_role');
    if (!name && !email) return null;
    return {
      name,
      email,
      role: role === 'SELLER' || role === 'BUYER' ? role : null,
    };
  } catch {
    return null;
  }
}

export function signIn(user: { name?: string; email?: string; role?: Role | null }) {
  try {
    if (user.name) localStorage.setItem('ucpt_name', user.name);
    if (user.email) localStorage.setItem('ucpt_email', user.email);
    if (user.role) localStorage.setItem('ucpt_role', user.role);
  } catch {
    /* storage unavailable — nothing else to do */
  }
  notify();
}

export function signOut() {
  try {
    localStorage.removeItem('ucpt_name');
    localStorage.removeItem('ucpt_email');
    localStorage.removeItem('ucpt_role');
  } catch {
    /* storage unavailable */
  }
  notify();
}

function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_EVENT));
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
 * Reactive auth state for components. Returns `null` on the server and on the
 * first client render (so SSR markup matches), then syncs from localStorage and
 * stays updated via same-tab (custom event) and cross-tab (storage) changes.
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
