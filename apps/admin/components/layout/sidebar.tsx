'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV } from '@/lib/nav';
import { Logo } from '@/components/brand/logo';

export function Sidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-maroon-gradient text-ivory">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />

      {/* Brand */}
      <div className={cn('relative flex h-16 items-center border-b border-white/10', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Logo variant="light" showWordmark={!collapsed} />
      </div>

      {/* Nav */}
      <nav className="scroll-branded relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((section) => {
          const items = section.items;
          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-ivory/45">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                          collapsed && 'justify-center',
                          active ? 'text-ivory' : 'text-ivory/70 hover:bg-white/10 hover:text-ivory',
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-xl bg-white/15 ring-1 ring-inset ring-white/15"
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          />
                        )}
                        <Icon size={18} className="relative shrink-0" />
                        {!collapsed && <span className="relative truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer note */}
      {!collapsed && (
        <div className="relative border-t border-white/10 px-5 py-4">
          <p className="text-2xs leading-relaxed text-ivory/45">
            Web-only console · deny-by-default · re-checked server-side.
          </p>
        </div>
      )}
    </div>
  );
}
