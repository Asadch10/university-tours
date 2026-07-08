'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Info, CreditCard, Receipt, ExternalLink, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { RequirePermission } from '@/components/auth/permission-gate';
import type { BookingStatus } from '@/lib/data';
import { useBookings, useInvoice } from '@/lib/queries';
import { formatPrice, formatDateTime, humanize, paymentStatusMeta } from '@/lib/utils';

// One-line explanation of what a payment status means in the authorize-then-capture flow.
const PAYMENT_HINT: Record<string, string> = {
  succeeded: 'Payment captured — funds have been collected.',
  requires_capture: 'Card authorized — the hold is captured automatically when the guide accepts.',
  partially_refunded: 'Payment captured, then partially refunded.',
  refunded: 'Payment was fully refunded.',
  canceled: 'The card hold was released — no charge was made.',
};

function fmtDuration(mins: number | null) {
  if (!mins) return null;
  return mins % 60 === 0 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: rows = [], isLoading } = useBookings();
  // Full invoice (payment payload) for the dynamic Payment section.
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);

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
  const pay = invoice?.payment ?? null;
  const payMeta = paymentStatusMeta(b.paymentStatus);
  const card =
    pay?.cardBrand && pay.cardLast4
      ? `${humanize(pay.cardBrand)} ···· ${pay.cardLast4}`
      : b.paymentCard;

  return (
    <RequirePermission anyOf={['bookings.view']}>
      <div className="space-y-6">
        <BackLink onClick={() => router.push('/bookings')} />

        {/* Header: booking id + booking status + payment status */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-lg font-semibold text-ink-900">{b.id}</h1>
          <StatusBadge status={b.status as BookingStatus} />
          <Badge variant={payMeta.variant}>Payment: {payMeta.label}</Badge>
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

            {/* Payment — fully dynamic from the stored Stripe payment record */}
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
                  <CreditCard size={14} /> Payment
                </h2>
                <Badge variant={payMeta.variant}>{payMeta.label}</Badge>
              </div>

              {invoiceLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-ink-400">
                  <Loader2 size={15} className="animate-spin" /> Loading payment…
                </div>
              ) : pay ? (
                <>
                  <p className="mt-2 text-sm text-ink-500">{PAYMENT_HINT[pay.status] ?? 'Payment recorded.'}</p>
                  <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {card && <Detail label="Card" value={card} />}
                    {pay.cardExpMonth && pay.cardExpYear && (
                      <Detail label="Expiry" value={`${String(pay.cardExpMonth).padStart(2, '0')}/${pay.cardExpYear}`} />
                    )}
                    <Detail label="Amount" value={`${formatPrice(pay.amountCents)} ${pay.currency.toUpperCase()}`} />
                    {pay.amountRefundedCents > 0 && (
                      <Detail label="Refunded" value={formatPrice(pay.amountRefundedCents)} />
                    )}
                    {pay.billingName && <Detail label="Cardholder" value={pay.billingName} />}
                    {pay.authorizedAt && <Detail label="Authorized" value={formatDateTime(pay.authorizedAt)} />}
                    {pay.capturedAt && <Detail label="Captured" value={formatDateTime(pay.capturedAt)} />}
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/transactions/${b.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                    >
                      <FileText size={15} /> View invoice
                    </Link>
                    {pay.receiptUrl && (
                      <a
                        href={pay.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                      >
                        <Receipt size={15} /> Receipt
                      </a>
                    )}
                    {pay.stripePaymentIntentId && (
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${pay.stripePaymentIntentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                      >
                        <ExternalLink size={15} /> Stripe
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-500">
                  No Stripe payment is recorded for this booking — it was created before payments were
                  enabled, or the guest hasn&apos;t completed checkout yet.
                </p>
              )}
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
