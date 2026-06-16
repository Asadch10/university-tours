'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/universities', label: 'Universities' },
  { href: '/search', label: 'Find a Guide' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/become-a-guide', label: 'Become a Guide' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b border-ink-200/70 bg-ivory/95 backdrop-blur-xl transition-shadow duration-300 ease-premium',
        scrolled ? 'shadow-lift' : 'shadow-soft',
      )}
    >
      <nav className="container-page flex h-[var(--header-h)] items-center justify-between gap-6">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-maroon-50',
                  active ? 'text-maroon-900' : 'text-ink-600 hover:text-maroon-900',
                )}
              >
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold-sheen"
                  />
                ) : (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-gold-sheen transition-transform duration-200 ease-premium group-hover:scale-x-100" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" variant="primary" size="sm">
            Get started
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-maroon-900 transition-colors hover:bg-maroon-50 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden"
          >
            <div className="container-page border-t border-ink-200/70 bg-ivory/95 pb-6 pt-2 backdrop-blur-xl">
              <ul className="flex flex-col">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium text-ink-800 transition-colors hover:bg-maroon-50 hover:text-maroon-900"
                    >
                      {item.label}
                      <ChevronRight size={18} className="text-ink-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-2.5">
                <ButtonLink href="/login" variant="outline" size="lg">
                  Log in
                </ButtonLink>
                <ButtonLink href="/register" variant="primary" size="lg">
                  Get started
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
