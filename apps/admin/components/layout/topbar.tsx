'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, PanelLeftClose, PanelLeft, Bell, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navItemForPath, sectionForPath } from '@/lib/nav';
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
  const section = sectionForPath(pathname);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-ink-200/70 bg-white/90 px-3 backdrop-blur-xl sm:px-5">
      {/* Mobile menu / desktop collapse */}
      <button
        type="button"
        onClick={onOpenMobile}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <button
        type="button"
        onClick={onToggleCollapse}
        className="hidden h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:inline-flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
      </button>

      {/* Breadcrumb — a compact context trail, distinct from the page's own hero header */}
      <nav className="ml-1 min-w-0 flex-1" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          {section && (
            <>
              <li className="hidden shrink-0 text-ink-500 sm:block">{section}</li>
              <li className="hidden shrink-0 text-ink-300 sm:block" aria-hidden>
                <ChevronRight size={14} />
              </li>
            </>
          )}
          <li className="min-w-0 truncate font-semibold text-ink-900">
            {current?.label ?? 'Console'}
          </li>
        </ol>
      </nav>

      {/* Notifications */}
      <Dropdown
        align="right"
        trigger={
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100">
            <Bell size={17} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
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
          <span className="ml-0.5 flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-ink-100">
            <Avatar name={user.name} src={user.avatar} size={30} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-semibold text-ink-900">{user.name}</span>
              <span className="block text-2xs text-ink-500">{user.email}</span>
            </span>
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
