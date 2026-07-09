'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CreditCard, Receipt, ExternalLink, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { RequirePermission } from '@/components/auth/permission-gate';
import type { BookingStatus } from '@/lib/data';
import { useBookings, useInvoice } from '@/lib/queries';
import { formatPrice, formatDateTime, humanize, paymentStatusMeta, guestHasPaid, paymentCaptured } from '@/lib/utils';

// One-line explanation of what a payment status means in the authorize-then-capture flow.
const PAYMENT_HINT: Record<string, string> = {
  succeeded: 'Funds captured — money has been collected.',
  requires_capture: 'Guest paid — funds are held and captured automatically when the guide confirms.',
  partially_refunded: 'Funds captured, then partially refunded.',
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

        {/* Header — the raw booking id is shown as a subtle, labelled reference. */}
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">Booking reference</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-ink-900">
            {b.service === 'CAMPUS_TOUR' ? 'Campus tour' : humanize(b.service)}
            <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-xs font-medium text-ink-500">{b.id}</span>
          </h1>
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
                  {/* Did the guest pay? — answered independently of the guide's decision. */}
                  <div className="mt-3 flex items-start gap-2">
                    {guestHasPaid(pay.status) ? (
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                    ) : (
                      <XCircle size={18} className="mt-0.5 shrink-0 text-ink-400" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {guestHasPaid(pay.status)
                          ? paymentCaptured(pay.status)
                            ? 'Guest paid — funds captured'
                            : 'Guest paid — funds held'
                          : 'Guest has not paid yet'}
                      </p>
                      <p className="text-sm text-ink-500">{PAYMENT_HINT[pay.status] ?? 'Payment recorded.'}</p>
                    </div>
                  </div>
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

          {/* Status — booking + payment as two independent states */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Status</h2>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Booking</p>
                    <p className="text-xs text-ink-500">Managed by the guide</p>
                  </div>
                  <StatusBadge status={b.status as BookingStatus} />
                </div>

                <div className="h-px bg-ink-100" />

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Payment</p>
                    <p className="text-xs text-ink-500">
                      {guestHasPaid(b.paymentStatus)
                        ? paymentCaptured(b.paymentStatus)
                          ? 'Funds captured'
                          : 'Funds held'
                        : 'Not paid yet'}
                    </p>
                  </div>
                  <Badge variant={payMeta.variant}>{payMeta.label}</Badge>
                </div>
              </div>

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
