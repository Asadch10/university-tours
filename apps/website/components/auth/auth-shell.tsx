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
export function AuthShell({ children }: { children: ReactNode }) {
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

      {/* Centered white card — gap from header on top, flush to bottom */}
      <div className="relative flex justify-center px-0 pt-6 sm:px-4 sm:pt-14">
        <div className="flex min-h-[calc(100dvh-var(--header-h)-1.5rem)] w-full max-w-[540px] flex-col bg-white px-5 py-8 shadow-[0_0_60px_rgba(0,0,0,0.18)] sm:min-h-[calc(100dvh-var(--header-h)-3.5rem)] sm:px-12 sm:py-10">

        {/* Tabs */}
        <div className="flex items-center gap-6 sm:gap-7">
          <Link
            href="/register"
            className={cn(
              'pb-2 font-display text-2xl font-bold transition-colors',
              !isLogin
                ? 'border-b-2 border-maroon-900 text-maroon-900'
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
                ? 'border-b-2 border-maroon-900 text-maroon-900'
                : 'text-ink-900 hover:text-ink-600',
            )}
          >
            Log in
          </Link>
        </div>

        {/* Form */}
        <div className="mt-8 sm:mt-10">{children}</div>
        </div>
      </div>
    </main>
  );
}

/* Shared input styling for the auth forms. */
export const authInputClasses =
  'w-full rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';
