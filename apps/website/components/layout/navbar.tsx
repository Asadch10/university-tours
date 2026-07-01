'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, ChevronRight, User as UserIcon, LogOut } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button, ButtonLink } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import { useAuthUser, signOut, initialsOf } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/universities', label: 'Explore schools' },
  { href: '/search', label: 'Browse tour guides' },
  { href: '/become-a-guide', label: 'Become a guide' },
];

const ABOUT_ITEMS = [
  { href: '/about', label: 'About us' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/for-parents', label: 'Parents' },
  { href: '/virtual-tours', label: 'Virtual tours' },
  { href: '/group-tours', label: 'Group tours' },
  { href: '/partnerships', label: 'School partnerships' },
  { href: '/refer', label: 'Refer a friend ($20)' },
  { href: '/blog', label: 'Blog' },
];

const HELP_ITEMS = [
  { href: '/help', label: 'Help Center' },
  { href: '/resources', label: 'Resource Center' },
  { href: '/trust-safety', label: 'Trust and safety' },
  { href: '/contact', label: 'Contact us' },
];

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string }[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isActive = items.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + '/'),
  );

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          'group relative flex items-center gap-1 text-sm font-medium transition-colors duration-150',
          isActive ? 'text-maroon-900' : 'text-ink-900 hover:text-ink-500',
        )}
      >
        {label}
        <ChevronDown
          size={14}
          className={cn(
            'mt-0.5 transition-transform duration-200',
            isActive ? 'text-maroon-900' : 'text-ink-500',
            open ? 'rotate-180' : '',
          )}
        />
        {isActive && (
          <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-maroon-900" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="absolute left-0 top-[calc(100%+0.4rem)] z-50 min-w-[200px] overflow-hidden rounded-2xl border border-ink-200/80 bg-white py-1.5 shadow-lift"
          >
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block px-5 py-2.5 text-sm transition-colors hover:bg-ink-50',
                    active ? 'font-semibold text-ink-900' : 'font-medium text-ink-700 hover:text-ink-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUser();

  function handleLogout() {
    setOpen(false);
    signOut();
    router.push('/');
  }

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-100 bg-white">
      <nav className="flex h-[var(--header-h)] w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        {/* Logo */}
        <Logo />

        {/* Desktop nav — plain text links, evenly spaced, grouped right */}
        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative text-sm font-medium transition-colors duration-150',
                  active ? 'text-maroon-900' : 'text-ink-900 hover:text-ink-500',
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-maroon-900" />
                )}
              </Link>
            );
          })}

          <NavDropdown label="About" items={ABOUT_ITEMS} pathname={pathname} />
          <NavDropdown label="Help" items={HELP_ITEMS} pathname={pathname} />

          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/register"
                className="text-sm font-medium text-ink-900 transition-colors duration-150 hover:text-ink-500"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-ink-900 transition-colors duration-150 hover:text-ink-500"
              >
                Log in
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-50 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden"
          >
            <div className="container-page border-t border-ink-100 bg-white pb-6 pt-2">
              <ul className="flex flex-col">
                {NAV_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      {item.label}
                      <ChevronRight size={16} className="text-ink-400" />
                    </Link>
                  </li>
                ))}

                <li>
                  <p className="mt-3 px-4 pb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-ink-400">
                    About
                  </p>
                  {ABOUT_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      {item.label}
                      <ChevronRight size={16} className="text-ink-400" />
                    </Link>
                  ))}
                </li>

                <li>
                  <p className="mt-3 px-4 pb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-ink-400">
                    Help
                  </p>
                  {HELP_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      {item.label}
                      <ChevronRight size={16} className="text-ink-400" />
                    </Link>
                  ))}
                </li>
              </ul>

              <div className="mt-5 flex flex-col gap-2.5">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-ink-200/70 bg-ink-50 px-4 py-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-gradient font-display text-xs font-bold text-ivory">
                        {initialsOf(user.name, user.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {user.name || user.email.split('@')[0] || 'Account'}
                        </p>
                        {user.email && (
                          <p className="truncate text-xs text-ink-500">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <ButtonLink href="/profile" variant="outline" size="lg">
                      <UserIcon size={17} /> Profile
                    </ButtonLink>
                    <Button variant="primary" size="lg" onClick={handleLogout}>
                      <LogOut size={17} /> Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <ButtonLink href="/register" variant="primary" size="lg">
                      Sign up
                    </ButtonLink>
                    <ButtonLink href="/login" variant="outline" size="lg">
                      Log in
                    </ButtonLink>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
