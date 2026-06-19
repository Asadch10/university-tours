'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, PanelLeftClose, PanelLeft, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navItemForPath } from '@/lib/nav';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { timeAgo } from '@/lib/utils';
import { auditLogs } from '@/lib/data';

export function Topbar({
  collapsed,
  onToggleCollapse,
  onOpenMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const current = navItemForPath(pathname);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-ink-200/70 bg-cream/85 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile menu / desktop collapse */}
      <button
        type="button"
        onClick={onOpenMobile}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:inline-flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-base font-semibold text-ink-900">
          {current?.label ?? 'Console'}
        </h2>
      </div>

      {/* Notifications */}
      <Dropdown
        align="right"
        trigger={
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-cream" />
          </span>
        }
        items={[
          ...auditLogs.slice(0, 4).map((log) => ({
            label: `${log.action} · ${timeAgo(log.createdAt)}`,
            onClick: () => router.push('/roles'),
          })),
          'separator' as const,
          { label: 'View all activity', onClick: () => router.push('/roles') },
        ]}
      />

      {/* Profile */}
      <Dropdown
        align="right"
        trigger={
          <span className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-ink-100">
            <Avatar name={user.name} src={user.avatar} size={32} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink-900">{user.name}</span>
              <span className="block text-2xs leading-tight text-ink-500">{user.email}</span>
            </span>
            <ChevronDown size={14} className="hidden text-ink-400 sm:block" />
          </span>
        }
        items={[
          {
            label: 'Sign out',
            icon: <LogOut size={15} />,
            tone: 'danger',
            onClick: () => {
              signOut();
              router.replace('/login');
            },
          },
        ]}
      />
    </header>
  );
}
