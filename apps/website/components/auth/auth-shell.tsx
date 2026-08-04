'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/* University campus background — Stanford (Hoover Tower / Main Quad). */
const BG_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1920px-Stanford_University_campus_in_2016.jpg';

/**
 * Shared shell for the /login and /register pages: a full-bleed campus
 * background with a centered white card carrying the Sign up / Log in tabs.
 */
/**
 * When `heading` is provided, the Sign up / Log in tabs are replaced with a
 * plain title + optional subtitle — used by the password-reset screens, which
 * share the same shell but aren't login/register.
 */
export function AuthShell({
  children,
  heading,
  subtitle,
}: {
  children: ReactNode;
  heading?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith('/login');

  return (
    <main className="relative min-h-dvh pt-[var(--header-h)]">
      {/* Campus background */}
      <div className="absolute inset-0 top-[var(--header-h)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" aria-hidden />
      </div>

      {/* Centered white card — equal space above and below */}
      <div className="relative flex min-h-[calc(100dvh-var(--header-h))] items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[540px] rounded-2xl bg-surface px-5 py-8 shadow-[0_0_60px_rgba(0,0,0,0.18)] sm:px-12 sm:py-10">
          {heading ? (
            /* Reset-flow header — a title instead of the auth tabs */
            <div>
              <h1 className="font-display text-2xl font-bold text-brand sm:text-3xl">{heading}</h1>
              {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-600">{subtitle}</p>}
            </div>
          ) : (
            /* Tabs */
            <div className="flex items-center gap-6 sm:gap-7">
              <Link
                href="/register"
                className={cn(
                  'pb-2 font-display text-2xl font-bold transition-colors',
                  !isLogin
                    ? 'border-b-2 border-maroon-900 text-brand'
                    : 'text-ink-900 hover:text-ink-600',
                )}
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className={cn(
                  'pb-2 font-display text-2xl font-bold transition-colors',
                  isLogin
                    ? 'border-b-2 border-maroon-900 text-brand'
                    : 'text-ink-900 hover:text-ink-600',
                )}
              >
                Log in
              </Link>
            </div>
          )}

          {/* Form */}
          <div className="mt-8 sm:mt-10">{children}</div>
        </div>
      </div>
    </main>
  );
}

/* Shared input styling for the auth forms. */
export const authInputClasses =
  'w-full rounded-lg border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';
