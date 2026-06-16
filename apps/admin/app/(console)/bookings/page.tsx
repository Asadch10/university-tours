'use client';

import { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  Inbox,
  CheckCircle2,
  Eye,
  Ban,
  MoreHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatGridSkeleton } from '@/components/ui/skeleton';
import { DataTable, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Dropdown, type MenuAction } from '@/components/ui/dropdown';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import type { Booking, BookingStatus } from '@/lib/data';
import { useBookings, useBookingActions } from '@/lib/queries';
import { formatPrice, formatDateTime, timeAgo, humanize } from '@/lib/utils';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const cancellable = (s: BookingStatus) => s === 'REQUESTED' || s === 'UPCOMING';

export default function BookingsPage() {
  const { data: rows = [], isLoading: loading } = useBookings();
  const { forceCancel: forceCancelMutation } = useBookingActions();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [active, setActive] = useState<Booking | null>(null);

  const { can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const b of rows) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      upcoming: rows.filter((b) => b.status === 'UPCOMING').length,
      requested: rows.filter((b) => b.status === 'REQUESTED').length,
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

  async function forceCancel(b: Booking) {
    // Re-check permission at the action layer (production backend re-validates server-side).
    if (!can('bookings.forcecancel')) return;
    const { confirmed, reason } = await confirm({
      title: `Force-cancel ${b.id}?`,
      description:
        'This releases/refunds the payment authorization and notifies both the buyer and the guide. This cannot be undone.',
      confirmLabel: 'Force-cancel booking',
      tone: 'danger',
      reason: { label: 'Reason for cancellation', placeholder: 'Shared in the audit log…', required: true },
    });
    if (!confirmed) return;
    try {
      await forceCancelMutation.mutateAsync({ id: b.id, reason: reason ?? '' });
      setActive((prev) => (prev && prev.id === b.id ? null : prev));
      toast.success('Booking force-cancelled', `${b.id} — authorization released, both parties notified.`);
    } catch (e) {
      toast.error('Could not force-cancel booking', (e as Error).message);
    }
  }

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
    { key: 'buyer', header: 'Buyer', hideOnMobile: true, cell: (b) => <span className="text-ink-800">{b.buyer}</span> },
    { key: 'guide', header: 'Guide', hideOnMobile: true, cell: (b) => <span className="text-ink-800">{b.guide}</span> },
    { key: 'school', header: 'School', hideOnMobile: true, cell: (b) => <span className="text-ink-600">{b.school}</span> },
    {
      key: 'service',
      header: 'Service',
      cell: (b) => (
        <Badge variant={b.service === 'CAMPUS_TOUR' ? 'maroon' : 'info'}>{humanize(b.service)}</Badge>
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => {
        const items: (MenuAction | 'separator')[] = [
          { label: 'View details', icon: <Eye size={15} />, onClick: () => setActive(b) },
        ];
        if (cancellable(b.status) && can('bookings.forcecancel')) {
          items.push('separator', {
            label: 'Force-cancel',
            icon: <Ban size={15} />,
            tone: 'danger',
            onClick: () => forceCancel(b),
          });
        }
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                  <MoreHorizontal size={18} />
                </span>
              }
              items={items}
            />
          </div>
        );
      },
    },
  ];

  return (
    <RequirePermission anyOf={['bookings.view']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Bookings"
          description="Every campus tour and video consultation across the platform — monitor, inspect, and intervene when needed."
        />

        {loading ? (
          <StatGridSkeleton count={4} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total bookings" value={String(stats.total)} icon={CalendarCheck} hint="all statuses" />
            <StatCard label="Upcoming" value={String(stats.upcoming)} icon={CalendarClock} hint="accepted & scheduled" />
            <StatCard label="Awaiting accept" value={String(stats.requested)} icon={Inbox} hint="requested" />
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
            placeholder="Search id, buyer, guide, school…"
            className="lg:w-72"
          />
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(b) => b.id}
          loading={loading}
          onRowClick={(b) => setActive(b)}
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

      <BookingDetail
        booking={active}
        onClose={() => setActive(null)}
        canForceCancel={can('bookings.forcecancel')}
        onForceCancel={forceCancel}
      />
    </RequirePermission>
  );
}

function BookingDetail({
  booking,
  onClose,
  canForceCancel,
  onForceCancel,
}: {
  booking: Booking | null;
  onClose: () => void;
  canForceCancel: boolean;
  onForceCancel: (b: Booking) => void;
}) {
  if (!booking) return null;
  const b = booking;
  const commissionCents = Math.round((b.grossCents * b.commissionPct) / 100);
  const showCancel = cancellable(b.status) && canForceCancel;

  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2.5">
          <span className="font-mono text-base">{b.id}</span>
          <StatusBadge status={b.status} />
        </span>
      }
      description="Booking details"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          {showCancel && (
            <Button variant="danger" size="sm" onClick={() => onForceCancel(b)}>
              <Ban size={15} /> Force-cancel booking
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Buyer" value={b.buyer} />
          <Detail label="Guide" value={b.guide} />
          <Detail label="School" value={b.school} />
          <Detail label="Service" value={humanize(b.service)} />
          <Detail label="Scheduled" value={formatDateTime(b.scheduledAt)} />
          <Detail label="Requested" value={formatDateTime(b.createdAt)} />
        </dl>

        <div className="rounded-2xl border border-ink-200/70 bg-ink-50/40 p-4">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-500">Money breakdown</p>
          <div className="space-y-2 text-sm">
            <Money label="Gross (buyer paid)" value={formatPrice(b.grossCents)} />
            <Money label={`Platform commission (${b.commissionPct}%)`} value={`− ${formatPrice(commissionCents)}`} muted />
            <div className="my-1.5 h-px bg-ink-200/70" />
            <Money label="Guide net payout" value={formatPrice(b.netCents)} strong />
          </div>
        </div>

        {showCancel && (
          <p className="rounded-xl bg-danger/5 px-3.5 py-2.5 text-xs text-danger ring-1 ring-inset ring-danger/15">
            Force-cancelling releases/refunds the payment authorization and notifies both the buyer and the guide.
          </p>
        )}
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function Money({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-ink-500' : 'text-ink-700'}>{label}</span>
      <span className={strong ? 'font-display text-base font-bold text-maroon-900' : 'font-semibold text-ink-900'}>
        {value}
      </span>
    </div>
  );
}
