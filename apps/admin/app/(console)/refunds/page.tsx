'use client';

import { useMemo, useState } from 'react';
import { RotateCcw, DollarSign, Hash, CalendarRange } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatGridSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type Column } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { bookings, type Refund } from '@/lib/data';
import { useRefunds, useBookingActions } from '@/lib/queries';
import { formatPrice, formatDate } from '@/lib/utils';

const eligibleBookings = bookings.filter(
  (b) => b.status === 'COMPLETED' || b.status === 'UPCOMING',
);

export default function RefundsPage() {
  const { data: refundsData, isLoading: loading } = useRefunds();
  const { refund } = useBookingActions();
  const refunds = refundsData ?? [];
  const [open, setOpen] = useState(false);

  // Issue-refund form state
  const [bookingId, setBookingId] = useState('');
  const [type, setType] = useState<Refund['type']>('FULL');
  const [amountUsd, setAmountUsd] = useState('');
  const [reason, setReason] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  const stats = useMemo(
    () => ({
      total: refunds.reduce((s, r) => s + r.amountCents, 0),
      count: refunds.length,
    }),
    [refunds],
  );

  const selectedBooking = eligibleBookings.find((b) => b.id === bookingId) ?? null;

  function resetForm() {
    setBookingId('');
    setType('FULL');
    setAmountUsd('');
    setReason('');
  }

  function openModal() {
    resetForm();
    setOpen(true);
  }

  // Refund amount in cents: full = gross, partial = entered amount.
  const partialCents = Math.round(parseFloat(amountUsd || '0') * 100);
  const refundCents = selectedBooking
    ? type === 'FULL'
      ? selectedBooking.grossCents
      : partialCents
    : 0;

  const partialValid =
    type === 'FULL' ||
    (selectedBooking != null &&
      Number.isFinite(partialCents) &&
      partialCents > 0 &&
      partialCents <= selectedBooking.grossCents);

  const formValid = !!selectedBooking && partialValid && reason.trim().length > 0;

  async function submitRefund() {
    if (!selectedBooking || !formValid) return;
    const booking = selectedBooking;

    const { confirmed } = await confirm({
      title: 'Issue refund',
      description: `Refund ${formatPrice(refundCents)} to ${booking.buyer}? A compensating ledger entry will adjust commission and the guide balance.`,
      confirmLabel: 'Issue refund',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await refund.mutateAsync({
        id: booking.id,
        reason: reason.trim(),
        amountCents: type === 'FULL' ? undefined : refundCents,
      });
      setOpen(false);
      toast.success('Refund issued', `${formatPrice(refundCents)} to ${booking.buyer} is processing.`);
    } catch (e) {
      toast.error('Refund failed', e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  const columns: Column<Refund>[] = [
    {
      key: 'id',
      header: 'Refund',
      cell: (r) => <span className="font-mono text-xs text-ink-600">{r.id}</span>,
    },
    {
      key: 'booking',
      header: 'Booking',
      cell: (r) => <span className="font-mono text-xs text-ink-600">{r.bookingId}</span>,
    },
    {
      key: 'buyer',
      header: 'Buyer',
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-800">{r.buyer}</span>,
    },
    {
      key: 'guide',
      header: 'Guide',
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-600">{r.guide}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (r) => (
        <Badge variant={r.type === 'FULL' ? 'danger' : 'warning'}>{r.type}</Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (r) => <span className="font-semibold text-ink-900">{formatPrice(r.amountCents)}</span>,
    },
    {
      key: 'reason',
      header: 'Reason',
      hideOnMobile: true,
      className: 'max-w-[16rem]',
      cell: (r) => <span className="block truncate text-ink-600">{r.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-500">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <RequirePermission anyOf={['refunds.issue']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          title="Refunds"
          description="Issue full or partial refunds. Each refund posts a compensating ledger entry."
          actions={
            <Button variant="primary" onClick={openModal}>
              <RotateCcw size={16} /> Issue refund
            </Button>
          }
        />

        {loading ? (
          <StatGridSkeleton count={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total refunded" value={formatPrice(stats.total)} icon={DollarSign} hint="all-time" />
            <StatCard label="Refund count" value={String(stats.count)} icon={Hash} hint="all-time" />
            <StatCard label="This period" value={formatPrice(stats.total)} icon={CalendarRange} hint="current cycle" />
          </div>
        )}

        <DataTable
          columns={columns}
          rows={refunds}
          rowKey={(r) => r.id}
          loading={loading}
          empty={{
            title: 'No refunds yet',
            description: 'Issued refunds will appear here with their Stripe status.',
            action: (
              <Button variant="primary" size="sm" onClick={openModal}>
                <RotateCcw size={16} /> Issue refund
              </Button>
            ),
          }}
        />
      </div>

      {/* Issue refund modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Issue refund"
        description="Refunds run via Stripe; the buyer sees updated status and receipts."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={!formValid} onClick={submitRefund}>
              Issue refund
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Booking" htmlFor="refund-booking" required>
            <Select
              id="refund-booking"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            >
              <option value="">Select a booking…</option>
              {eligibleBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — {b.buyer} · {formatPrice(b.grossCents)}
                </option>
              ))}
            </Select>
          </Field>

          {selectedBooking && (
            <div className="rounded-xl border border-ink-200/70 bg-ink-50/50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Original charge</span>
                <span className="font-semibold text-ink-900">
                  {formatPrice(selectedBooking.grossCents)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-ink-500">Guide</span>
                <span className="text-ink-700">{selectedBooking.guide}</span>
              </div>
            </div>
          )}

          <Field label="Refund type" htmlFor="refund-type" required>
            <Select
              id="refund-type"
              value={type}
              onChange={(e) => setType(e.target.value as Refund['type'])}
              disabled={!selectedBooking}
            >
              <option value="FULL">Full refund</option>
              <option value="PARTIAL">Partial refund</option>
            </Select>
          </Field>

          {type === 'PARTIAL' && selectedBooking && (
            <Field
              label="Amount (USD)"
              htmlFor="refund-amount"
              required
              error={
                amountUsd && !partialValid
                  ? `Enter an amount between $0.01 and ${formatPrice(selectedBooking.grossCents)}.`
                  : undefined
              }
              hint={!amountUsd ? `Maximum ${formatPrice(selectedBooking.grossCents)}.` : undefined}
            >
              <Input
                id="refund-amount"
                type="number"
                inputMode="decimal"
                min={0.01}
                step={0.01}
                max={selectedBooking.grossCents / 100}
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
              />
            </Field>
          )}

          <Field label="Reason" htmlFor="refund-reason" required>
            <Textarea
              id="refund-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this refund being issued?"
            />
          </Field>

          {selectedBooking && partialValid && (
            <p className="text-sm text-ink-600">
              Refunding{' '}
              <span className="font-semibold text-maroon-900">{formatPrice(refundCents)}</span> to{' '}
              {selectedBooking.buyer}.
            </p>
          )}
        </div>
      </Modal>
    </RequirePermission>
  );
}
