'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Onboarding is a focused, full-screen welcome flow with its own branding — it
 * has no room for the marketing Navbar or Footer, and landing on it used to show
 * the site footer beneath the welcome screen (and the navbar overlapping its
 * top). Gating the chrome here removes both. Other auth pages (login, register,
 * verify-email, …) use AuthShell, which pads for the header on purpose, so they
 * are intentionally left with the chrome. usePathname resolves during SSR too,
 * so nothing is rendered then hidden — no hydration mismatch, no SEO impact
 * elsewhere.
 */
const FOCUSED_ROUTES = ['/onboarding'];

function isFocused(pathname: string) {
  return FOCUSED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isFocused(pathname)) return null;
  return <>{children}</>;
}
