'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Logo } from '@/components/brand/logo';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth guard — bounce to login when there is no session.
  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="animate-pulse">
          <Logo />
        </div>
      </div>
    );
  }

  const sidebarW = collapsed ? 'lg:w-[var(--sidebar-w-collapsed)]' : 'lg:w-[var(--sidebar-w)]';

  return (
    <div className="min-h-dvh bg-cream">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-300 ease-premium lg:block ${sidebarW}`}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[17rem] overflow-hidden"
            >
              <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className={`flex min-h-dvh flex-col transition-[padding] duration-300 ease-premium ${collapsed ? 'lg:pl-[var(--sidebar-w-collapsed)]' : 'lg:pl-[var(--sidebar-w)]'}`}>
        <Topbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="scroll-branded flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
