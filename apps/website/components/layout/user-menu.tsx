'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { signOut, initialsOf, type AuthUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

/** Authenticated account dropdown for the desktop navbar. */
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

  const displayName = user.name || user.email.split('@')[0] || 'Account';
  const roleLabel = user.role === 'SELLER' ? 'Current Student' : 'Family / Student';

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
        className="flex items-center gap-2 rounded-full border border-ink-200/70 bg-white/70 py-1 pl-1 pr-2.5 text-sm font-medium text-ink-800 shadow-soft transition-colors hover:border-maroon-800/30 hover:bg-white cursor-pointer"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-maroon-gradient font-display text-xs font-bold text-ivory">
          {initialsOf(user.name, user.email)}
        </span>
        <span className="max-w-[7.5rem] truncate">{displayName}</span>
        <ChevronDown
          size={16}
          className={cn('text-ink-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+0.6rem)] w-64 overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon-gradient font-display text-sm font-bold text-ivory">
                {initialsOf(user.name, user.email)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{displayName}</p>
                <p className="truncate text-xs text-ink-500">{user.email || roleLabel}</p>
              </div>
            </div>

            <div className="p-1.5">
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-maroon-50 hover:text-maroon-900"
              >
                <UserIcon size={16} /> Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-maroon-50 hover:text-maroon-900 cursor-pointer"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
