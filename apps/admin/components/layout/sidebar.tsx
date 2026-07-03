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
    <div className="flex h-full flex-col border-r border-ink-200/70 bg-ink-100/70 text-ink-700">
      {/* Brand */}
      <div className={cn('flex h-14 items-center border-b border-ink-200/70', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Logo showWordmark={!collapsed} />
      </div>

      {/* Nav */}
      <nav className="scroll-branded flex-1 space-y-4 overflow-y-auto px-2.5 py-4">
        {NAV.map((section) => {
          const items = section.items;
          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-2.5 pb-1.5 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
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
                          'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                          collapsed && 'justify-center',
                          active
                            ? 'text-white'
                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-brand-500 shadow-soft"
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          />
                        )}
                        <Icon
                          size={17}
                          className={cn('relative shrink-0', active ? 'text-white' : 'text-ink-400 group-hover:text-ink-600')}
                        />
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
        <div className="border-t border-ink-200/70 px-4 py-3">
          <p className="text-2xs leading-relaxed text-ink-400">
            Web-only console · deny-by-default · re-checked server-side.
          </p>
        </div>
      )}
    </div>
  );
}
