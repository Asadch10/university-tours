'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { RequirePermission } from '@/components/auth/permission-gate';
import type { BookingStatus } from '@/lib/data';
import { useBookings } from '@/lib/queries';
import { formatPrice, formatDateTime, humanize } from '@/lib/utils';

function fmtDuration(mins: number | null) {
  if (!mins) return null;
  return mins % 60 === 0 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: rows = [], isLoading } = useBookings();

  const b = rows.find((r) => r.id === id);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={26} />
      </div>
    );
  }

  if (!b) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => router.push('/bookings')} />
        <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center">
          <p className="font-semibold text-ink-900">Booking not found</p>
          <p className="mt-1 text-sm text-ink-500">It may have been removed, or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const commissionCents = Math.round((b.grossCents * b.commissionPct) / 100);

  return (
    <RequirePermission anyOf={['bookings.view']}>
      <div className="space-y-6">
        <BackLink onClick={() => router.push('/bookings')} />

        {/* Header (read-only — status is managed by the guide) */}
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-lg font-semibold text-ink-900">{b.id}</h1>
          <StatusBadge status={b.status as BookingStatus} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Booking details</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Detail label="Guest" value={b.buyer} />
                <Detail label="Guide" value={b.guide} />
                <Detail label="School" value={b.school} />
                <Detail label="Service" value={humanize(b.service)} />
                {b.title && <Detail label="Listing" value={b.title} />}
                <Detail label="Scheduled" value={`${formatDateTime(b.scheduledAt)}${b.scheduledTime ? ` · ${b.scheduledTime}` : ''}`} />
                {fmtDuration(b.durationMinutes) && <Detail label="Duration" value={fmtDuration(b.durationMinutes)!} />}
                <Detail label="Guests" value={`${b.guestCount} guest${b.guestCount > 1 ? 's' : ''}`} />
                <Detail label="Requested" value={formatDateTime(b.createdAt)} />
              </dl>
            </section>

            <section className="rounded-2xl border border-ink-200/70 bg-ink-50/40 p-6">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Money breakdown</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Money label="Gross (guest paid)" value={formatPrice(b.grossCents)} />
                <Money label={`Platform commission (${b.commissionPct}%)`} value={`− ${formatPrice(commissionCents)}`} muted />
                <div className="my-1.5 h-px bg-ink-200/70" />
                <Money label="Guide net payout" value={formatPrice(b.netCents)} strong />
              </div>
            </section>
          </div>

          {/* Read-only note — status authority belongs to the guide */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                <Info size={18} />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink-900">View only</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                Booking status is managed by the guide from their <span className="font-medium">My tours</span> —
                they accept, decline, or complete each request. This screen is for monitoring only.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </RequirePermission>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
    >
      <ArrowLeft size={16} /> Back to bookings
    </button>
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
      <span className={strong ? 'font-display text-base font-bold text-brand-900' : 'font-semibold text-ink-900'}>
        {value}
      </span>
    </div>
  );
}
