'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox, Mail } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useContactMessages } from '@/lib/queries';
import type { ContactMessage } from '@/lib/data';
import { cn, formatDateTime } from '@/lib/utils';

const TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'READ', label: 'Read' },
];

export default function ContactPage() {
  const router = useRouter();
  const { data: rows = [], isLoading: loading } = useContactMessages();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('ALL');

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      NEW: rows.filter((m) => m.status !== 'read').length,
      READ: rows.filter((m) => m.status === 'read').length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((m) => {
      if (tab === 'NEW' && m.status === 'read') return false;
      if (tab === 'READ' && m.status !== 'read') return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        `c-${m.contactNo}`.includes(q)
      );
    });
  }, [rows, query, tab]);

  return (
    <RequirePermission anyOf={['contact.view']}>
      <div className="space-y-6">
        <PageHeader
          title="Contact us"
          description="Messages submitted from the website contact form. Open one to read it in full and reply."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value as keyof typeof counts] }))} value={tab} onChange={setTab} />
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, topic, C-3…" className="lg:w-72" />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No messages found"
            description={query || tab !== 'ALL' ? 'Try adjusting your search or filter.' : 'Messages sent from the website contact form will appear here.'}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <MessageCard key={m.id} message={m} onOpen={() => router.push(`/contact/C-${m.contactNo}`)} />
            ))}
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

function MessageCard({ message: m, onOpen }: { message: ContactMessage; onOpen: () => void }) {
  const isNew = m.status !== 'read';
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex flex-col rounded-2xl border bg-surface p-5 text-left shadow-soft transition-shadow hover:shadow-card',
        isNew ? 'border-brand-200' : 'border-ink-200/70',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-semibold text-brand-900">C-{m.contactNo}</span>
        <div className="flex items-center gap-2">
          <Badge variant="gold">{m.topic}</Badge>
          {isNew ? (
            <Badge variant="success" dot>New</Badge>
          ) : (
            <Badge variant="neutral">Read</Badge>
          )}
        </div>
      </div>

      <p className="text-sm font-semibold text-ink-900">{m.name}</p>
      <p className="inline-flex items-center gap-1.5 text-xs text-ink-500">
        <Mail size={12} className="shrink-0 text-ink-400" /> {m.email}
      </p>

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-700">{m.message}</p>

      <p className="mt-4 border-t border-ink-200/60 pt-3 text-xs text-ink-400">{formatDateTime(m.createdAt)}</p>
    </button>
  );
}
