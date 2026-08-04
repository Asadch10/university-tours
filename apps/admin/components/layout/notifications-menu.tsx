'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, UserPlus, CalendarCheck, CreditCard, Star, CheckCheck, ClipboardCheck, Inbox, type LucideIcon } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { useNotifications } from '@/lib/queries';
import type { NotificationDto } from '@/lib/api';

const META: Record<NotificationDto['type'], { Icon: LucideIcon; cls: string }> = {
  signup: { Icon: UserPlus, cls: 'bg-blue-50 text-blue-600' },
  booking: { Icon: CalendarCheck, cls: 'bg-maroon-50 text-maroon-800' },
  payment: { Icon: CreditCard, cls: 'bg-emerald-50 text-emerald-600' },
  review: { Icon: Star, cls: 'bg-amber-50 text-amber-600' },
  listing: { Icon: ClipboardCheck, cls: 'bg-gold-100 text-gold-800' },
  contact: { Icon: Inbox, cls: 'bg-indigo-50 text-indigo-600' },
};

// The recent-activity feed is computed (not stored), so read-state lives client-side:
// we remember which notification ids the admin has already opened.
const READ_KEY = 'ucpt-admin-notif-read-ids';

export function NotificationsMenu() {
  const router = useRouter();
  const { data: items = [] } = useNotifications();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(READ_KEY) : null;
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const unread = items.filter((n) => !readIds.has(n.id)).length;

  // Persist, pruning to ids still in the current feed so storage can't grow forever.
  const persistRead = (next: Set<string>) => {
    const visible = new Set(items.map((n) => n.id));
    const pruned = new Set([...next].filter((id) => visible.has(id)));
    setReadIds(pruned);
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify([...pruned]));
    } catch {
      /* storage unavailable */
    }
  };

  const markRead = (ids: string[]) => {
    const next = new Set(readIds);
    ids.forEach((id) => next.add(id));
    persistRead(next);
  };

  const markAllRead = () => markRead(items.map((n) => n.id));

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Opening a notification marks just that one read (the count ticks down), then navigates.
  const openNotification = (n: NotificationDto) => {
    markRead([n.id]);
    setOpen(false);
    router.push(n.href);
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger-solid px-1 text-[0.6rem] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-ink-200/70 bg-surface shadow-lift"
          >
            <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-ink-900">
                Notifications{unread > 0 && <span className="ml-1.5 text-xs font-medium text-ink-400">({unread} new)</span>}
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-maroon-800 hover:underline"
                >
                  <CheckCheck size={13} /> Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[22rem] overflow-y-auto py-1">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-500">No recent activity</p>
              ) : (
                items.map((n) => {
                  const { Icon, cls } = META[n.type];
                  const isUnread = !readIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-50',
                        isUnread && 'bg-maroon-50/40',
                      )}
                    >
                      <span className={cn('mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cls)}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">{n.title}</span>
                        <span className="block truncate text-xs text-ink-500">{n.detail}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="whitespace-nowrap text-2xs text-ink-400">{timeAgo(n.createdAt)}</span>
                        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-danger-solid" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => go('/roles')}
              className="block w-full border-t border-ink-100 px-4 py-2.5 text-left text-sm font-medium text-maroon-800 transition-colors hover:bg-ink-50"
            >
              View all activity
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
