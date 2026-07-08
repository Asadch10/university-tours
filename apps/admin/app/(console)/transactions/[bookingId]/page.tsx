'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CreditCard, ExternalLink, Receipt, Code2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { RequirePermission } from '@/components/auth/permission-gate';
import type { BookingStatus } from '@/lib/data';
import { useInvoice, invoiceNo } from '@/lib/queries';
import { formatPrice, formatDateTime, humanize } from '@/lib/utils';

const paymentStatusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  succeeded: 'success',
  requires_capture: 'info',
  refunded: 'danger',
  partially_refunded: 'warning',
  canceled: 'neutral',
};

function fmtDuration(mins: number | null) {
  if (!mins) return null;
  return mins % 60 === 0 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data: inv, isLoading, isError } = useInvoice(bookingId);
  const [showRaw, setShowRaw] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={26} />
      </div>
    );
  }

  if (isError || !inv) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => router.push('/transactions')} />
        <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center">
          <p className="font-semibold text-ink-900">Invoice not found</p>
          <p className="mt-1 text-sm text-ink-500">It may have been removed, or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const pay = inv.payment;
  const commissionCents = inv.commissionCents ?? Math.round((inv.grossCents * (inv.commissionPctSnapshot ?? 0)) / 100);
  const netCents = inv.sellerNetCents ?? inv.grossCents - commissionCents;
  const card = pay?.cardBrand && pay.cardLast4 ? `${humanize(pay.cardBrand)} ···· ${pay.cardLast4}` : null;
  const piUrl = inv.stripePaymentIntentId ? `https://dashboard.stripe.com/test/payments/${inv.stripePaymentIntentId}` : null;

  return (
    <RequirePermission anyOf={['transactions.view']}>
      <div className="space-y-6">
        <BackLink onClick={() => router.push('/transactions')} />

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Receipt size={22} className="text-brand-700" />
          <h1 className="font-mono text-lg font-semibold text-ink-900">{invoiceNo(inv.id)}</h1>
          <StatusBadge status={inv.status as BookingStatus} />
          {pay && (
            <Badge variant={paymentStatusVariant[pay.status] ?? 'neutral'}>{humanize(pay.status)}</Badge>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* Parties */}
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Billed to / paid to</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <Party label="Guest" name={inv.buyer.name} email={inv.buyer.email} />
                <Party label="Guide" name={inv.seller.name} email={inv.seller.email} />
              </div>
            </section>

            {/* Booking details */}
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Booking</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Detail label="Service" value={humanize(inv.serviceType)} />
                {inv.schoolName && <Detail label="School" value={inv.schoolName} />}
                {inv.listingTitle && <Detail label="Listing" value={inv.listingTitle} />}
                <Detail
                  label="Scheduled"
                  value={`${formatDateTime(inv.scheduledDate)}${inv.scheduledTime ? ` · ${inv.scheduledTime}` : ''}`}
                />
                {fmtDuration(inv.durationMinutes) && <Detail label="Duration" value={fmtDuration(inv.durationMinutes)!} />}
                <Detail label="Guests" value={`${inv.guestCount} guest${inv.guestCount > 1 ? 's' : ''}`} />
                <Detail label="Requested" value={formatDateTime(inv.requestedAt)} />
                {inv.confirmedAt && <Detail label="Confirmed" value={formatDateTime(inv.confirmedAt)} />}
              </dl>
            </section>

            {/* Money breakdown */}
            <section className="rounded-2xl border border-ink-200/70 bg-ink-50/40 p-6">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Money breakdown</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Money label="Gross (guest paid)" value={formatPrice(inv.grossCents)} />
                <Money
                  label={`Platform commission (${inv.commissionPctSnapshot ?? 0}%)`}
                  value={`− ${formatPrice(commissionCents)}`}
                  muted
                />
                {pay && pay.amountRefundedCents > 0 && (
                  <Money label="Refunded" value={`− ${formatPrice(pay.amountRefundedCents)}`} muted />
                )}
                <div className="my-1.5 h-px bg-ink-200/70" />
                <Money label="Guide net payout" value={formatPrice(netCents)} strong />
              </div>
            </section>

            {/* Ledger */}
            {inv.ledger.length > 0 && (
              <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
                <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Ledger</h2>
                <div className="mt-3 divide-y divide-ink-100">
                  {inv.ledger.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                      <Badge variant={l.type === 'REFUND' ? 'warning' : 'success'} size="sm">{humanize(l.type)}</Badge>
                      <span className="text-ink-500">{formatDateTime(l.createdAt)}</span>
                      <span className="font-semibold text-ink-900">{formatPrice(l.grossCents)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Refunds */}
            {inv.refunds.length > 0 && (
              <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
                <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Refunds</h2>
                <div className="mt-3 divide-y divide-ink-100">
                  {inv.refunds.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{formatPrice(r.amountCents)}</p>
                        {r.reason && <p className="truncate text-ink-500">{r.reason}</p>}
                      </div>
                      <span className="shrink-0 text-ink-500">
                        {r.createdByUser?.name ?? 'System'} · {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Raw Stripe payload */}
            {pay?.rawJson != null && (
              <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
                <button
                  type="button"
                  onClick={() => setShowRaw((s) => !s)}
                  className="flex w-full items-center justify-between text-2xs font-semibold uppercase tracking-wider text-ink-500 hover:text-ink-800"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Code2 size={14} /> Stripe payment payload
                  </span>
                  <span className="text-ink-400">{showRaw ? 'Hide' : 'Show'}</span>
                </button>
                {showRaw && (
                  <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-ink-900 p-4 text-2xs leading-relaxed text-ink-100">
                    {JSON.stringify(pay.rawJson, null, 2)}
                  </pre>
                )}
              </section>
            )}
          </div>

          {/* Payment method card */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <CreditCard size={18} />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink-900">Payment method</h2>
              {pay ? (
                <dl className="mt-4 space-y-3 text-sm">
                  {card && <Detail label="Card" value={card} />}
                  {pay.cardExpMonth && pay.cardExpYear && (
                    <Detail label="Expiry" value={`${String(pay.cardExpMonth).padStart(2, '0')}/${pay.cardExpYear}`} />
                  )}
                  {pay.billingName && <Detail label="Cardholder" value={pay.billingName} />}
                  {pay.billingEmail && <Detail label="Billing email" value={pay.billingEmail} />}
                  <Detail label="Amount" value={`${formatPrice(pay.amountCents)} ${pay.currency.toUpperCase()}`} />
                  {pay.authorizedAt && <Detail label="Authorized" value={formatDateTime(pay.authorizedAt)} />}
                  {pay.capturedAt && <Detail label="Captured" value={formatDateTime(pay.capturedAt)} />}
                  <div>
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Payment intent</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs text-ink-700">{pay.stripePaymentIntentId}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-ink-500">
                  No Stripe payment is recorded for this booking (created before payments, or payment not completed).
                </p>
              )}

              <div className="mt-5 space-y-2">
                {pay?.receiptUrl && (
                  <a
                    href={pay.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                  >
                    <Receipt size={15} /> Stripe receipt
                  </a>
                )}
                {piUrl && (
                  <a
                    href={piUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
                  >
                    <ExternalLink size={15} /> View in Stripe
                  </a>
                )}
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
      <ArrowLeft size={16} /> Back to transactions
    </button>
  );
}

function Party({ label, name, email }: { label: string; name: string; email: string }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <div className="mt-2 flex items-center gap-2.5">
        <Avatar name={name} size={36} />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{name}</p>
          <p className="truncate text-xs text-ink-500">{email}</p>
        </div>
      </div>
    </div>
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
