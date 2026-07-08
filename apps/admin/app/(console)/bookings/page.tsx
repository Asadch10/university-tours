'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  CalendarClock,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatGridSkeleton } from '@/components/ui/skeleton';
import { DataTable, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs } from '@/components/ui/tabs';
import { RequirePermission } from '@/components/auth/permission-gate';
import type { Booking } from '@/lib/data';
import { useBookings } from '@/lib/queries';
import { formatPrice, formatDateTime, timeAgo, humanize } from '@/lib/utils';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function BookingsPage() {
  const router = useRouter();
  const { data: rows = [], isLoading: loading } = useBookings();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const b of rows) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      confirmed: rows.filter((b) => b.status === 'CONFIRMED').length,
      pending: rows.filter((b) => b.status === 'PENDING').length,
      completed: rows.filter((b) => b.status === 'COMPLETED').length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((b) => {
      if (status !== 'ALL' && b.status !== status) return false;
      if (!q) return true;
      return (
        b.id.toLowerCase().includes(q) ||
        b.buyer.toLowerCase().includes(q) ||
        b.guide.toLowerCase().includes(q) ||
        b.school.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  const open = (b: Booking) => router.push(`/bookings/${b.id}`);

  const columns: Column<Booking>[] = [
    {
      key: 'booking',
      header: 'Booking',
      cell: (b) => (
        <div className="min-w-0">
          <span className="font-mono text-xs font-semibold text-ink-900">{b.id}</span>
          <p className="text-2xs text-ink-400">created {timeAgo(b.createdAt)}</p>
        </div>
      ),
    },
    { key: 'guest', header: 'Guest', hideOnMobile: true, cell: (b) => <span className="text-ink-800">{b.buyer}</span> },
    { key: 'guide', header: 'Guide', hideOnMobile: true, cell: (b) => <span className="text-ink-800">{b.guide}</span> },
    { key: 'school', header: 'School', hideOnMobile: true, cell: (b) => <span className="text-ink-600">{b.school}</span> },
    {
      key: 'service',
      header: 'Service',
      cell: (b) => (
        <Badge variant={b.service === 'CAMPUS_TOUR' ? 'brand' : 'info'}>{humanize(b.service)}</Badge>
      ),
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      hideOnMobile: true,
      cell: (b) => <span className="whitespace-nowrap text-ink-600">{formatDateTime(b.scheduledAt)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (b) => <span className="font-semibold text-ink-900">{formatPrice(b.grossCents)}</span>,
    },
    { key: 'status', header: 'Status', cell: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <RequirePermission anyOf={['bookings.view']}>
      <div className="space-y-6">
        <PageHeader
          title="Bookings"
          description="Every campus tour, video chat, and consultancy across the platform — view only. Guides manage status from their My tours."
        />

        {loading ? (
          <StatGridSkeleton count={4} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total bookings" value={String(stats.total)} icon={CalendarCheck} hint="all statuses" />
            <StatCard label="Confirmed" value={String(stats.confirmed)} icon={CalendarClock} hint="accepted & scheduled" />
            <StatCard label="Pending" value={String(stats.pending)} icon={Inbox} hint="awaiting the guide" />
            <StatCard label="Completed" value={String(stats.completed)} icon={CheckCircle2} hint="fulfilled" />
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            tabs={STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] ?? 0 }))}
            value={status}
            onChange={setStatus}
          />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search id, guest, guide, school…"
            className="lg:w-72"
          />
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(b) => b.id}
          loading={loading}
          onRowClick={open}
          empty={{
            title: 'No bookings found',
            description: query || status !== 'ALL' ? 'Try adjusting your search or status filter.' : 'Bookings will appear here as they come in.',
          }}
          footer={
            !loading ? (
              <span>
                Showing <span className="font-semibold text-ink-800">{filtered.length}</span> of {rows.length} bookings
              </span>
            ) : undefined
          }
        />
      </div>
    </RequirePermission>
  );
}
