'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { signOut, initialsOf, type AuthUser } from '@/lib/auth';

/** Account menu items shown in the avatar dropdown (and mirrored in the mobile drawer). */
export const ACCOUNT_MENU = [
  { href: '/manage-listing', label: 'Manage listing' },
  { href: '/profile', label: 'Profile' },
  { href: '/refer', label: 'Refer a guide ($20)' },
  { href: '/settings', label: 'Settings' },
];

/** Authenticated account dropdown for the desktop navbar — a round avatar that opens the menu. */
export function UserMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function handleLogout() {
    setOpen(false);
    signOut();
    router.push('/');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-maroon-gradient font-display text-sm font-bold text-ivory ring-2 ring-transparent transition-all hover:ring-brand-muted focus-visible:outline-none focus-visible:ring-brand-muted"
      >
        {initialsOf(user.name, user.email)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+0.6rem)] w-60 overflow-hidden rounded-2xl border border-ink-200/70 bg-surface py-2 shadow-lift"
          >
            {ACCOUNT_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-tint hover:text-brand"
              >
                {item.label}
              </Link>
            ))}

            <div className="my-1.5 border-t border-ink-100" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="block w-full px-5 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-brand-tint hover:text-brand"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
