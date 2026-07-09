'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarRange, Loader2, Footprints, Video, MessageSquare, X, CalendarDays, Clock, Users,
  GraduationCap, User, Check, Ban, CheckCircle2,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { bookingsApi, friendlyError, tokenStore, type BookingDto, type BookingStatus } from '@/lib/client-api';
import { useToast } from '@/lib/toast';

type View = 'guest' | 'guide';
type TabKey = 'requests' | 'confirmed' | 'past' | 'canceled';

const VIEWS: { key: View; label: string }[] = [
  { key: 'guest', label: 'As guest' },
  { key: 'guide', label: 'As guide' },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'requests', label: 'Requests' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'past', label: 'Past' },
  { key: 'canceled', label: 'Canceled' },
];

// Which booking statuses belong to each tab.
const TAB_STATUSES: Record<TabKey, BookingStatus[]> = {
  requests: ['PENDING'],
  confirmed: ['CONFIRMED'],
  past: ['COMPLETED'],
  canceled: ['CANCELLED', 'DECLINED', 'EXPIRED'],
};

const STATUS_STYLE: Record<BookingStatus, { label: string; cls: string }> = {
  // Never surfaced (unpaid bookings are filtered out server-side) — present only to satisfy the Record type.
  PENDING_PAYMENT: { label: 'Awaiting payment', cls: 'bg-gold-100 text-gold-800 ring-gold-600/20' },
  PENDING: { label: 'Pending', cls: 'bg-gold-100 text-gold-800 ring-gold-600/20' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-verified/10 text-verified ring-verified/20' },
  COMPLETED: { label: 'Completed', cls: 'bg-ink-100 text-ink-700 ring-ink-300/40' },
  DECLINED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-red-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-ink-100 text-ink-500 ring-ink-300/40' },
  CANCELLED: { label: 'Canceled', cls: 'bg-red-50 text-red-700 ring-red-200' },
};

/** True once the guest has paid (card authorized/held or captured). */
function guestPaid(status?: string | null): boolean {
  return status === 'requires_capture' || status === 'succeeded' || status === 'partially_refunded';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function serviceMeta(t: BookingDto['serviceType']) {
  if (t === 'VIDEO_CONSULTATION') return { Icon: Video, label: 'Video consultation' };
  if (t === 'CONSULTATION') return { Icon: MessageSquare, label: 'Consultancy' };
  return { Icon: Footprints, label: 'Campus tour' };
}

function fmtDuration(mins: number | null) {
  if (!mins) return null;
  return mins % 60 === 0 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`;
}

export function MyToursView() {
  const router = useRouter();
  const [view, setView] = useState<View>('guest');
  const [tab, setTab] = useState<TabKey>('requests');
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingDto | null>(null);

  const load = useCallback(() => {
    if (!tokenStore.user) return;
    setLoading(true);
    bookingsApi
      .list(view)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [view]);

  useEffect(() => {
    if (!tokenStore.user) {
      router.replace('/login');
      return;
    }
    load();
  }, [load, router]);

  const grouped = useMemo(() => {
    const g: Record<TabKey, BookingDto[]> = { requests: [], confirmed: [], past: [], canceled: [] };
    for (const b of bookings) {
      for (const t of TABS) {
        if (TAB_STATUSES[t.key].includes(b.status)) g[t.key].push(b);
      }
    }
    return g;
  }, [bookings]);

  const active = grouped[tab];

  return (
    <main className="min-h-dvh bg-white pt-[var(--header-h)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* Left rail — title + perspective switch */}
        <aside className="border-b border-ink-100 bg-ivory/40 px-6 py-10 lg:min-h-[calc(100dvh-var(--header-h))] lg:border-b-0 lg:border-r lg:px-8">
          <h1 className="font-display text-3xl font-semibold text-ink-900">My tours</h1>

          <nav className="mt-8 space-y-1" aria-label="Tours perspective">
            {VIEWS.map((v) => {
              const on = view === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => {
                    setView(v.key);
                    setTab('requests');
                  }}
                  className={cn(
                    'relative block w-full rounded-lg px-3 py-2.5 text-left text-lg font-medium transition-colors',
                    on ? 'text-maroon-900' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
                  )}
                >
                  {on && <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-maroon-900" aria-hidden />}
                  {v.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main — tabs + content */}
        <section className="px-6 py-8 sm:px-10">
          <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-ink-100">
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative -mb-px whitespace-nowrap pb-3 pt-1 text-base font-semibold transition-colors',
                    on ? 'text-maroon-900' : 'text-ink-500 hover:text-ink-800',
                  )}
                >
                  {t.label} ({loading ? '…' : grouped[t.key].length})
                  {on && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-maroon-900" aria-hidden />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-maroon-800" size={26} />
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-800">
                <CalendarRange size={26} />
              </span>
              <p className="text-lg font-semibold text-ink-900">No tours yet</p>
              <p className="max-w-sm text-sm text-ink-500">
                {view === 'guest'
                  ? 'Tours you book with student guides will show up here.'
                  : 'Tour requests from families will show up here once you’re listed as a guide.'}
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {active.map((b) => {
                const { Icon, label: serviceLabel } = serviceMeta(b.serviceType);
                const other = view === 'guest' ? b.seller?.name : b.buyer?.name;
                const otherLabel = view === 'guest' ? 'with' : 'for';
                const st = STATUS_STYLE[b.status];
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(b)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-ink-200/70 bg-white p-4 text-left shadow-soft transition-colors hover:border-maroon-800/40 hover:bg-ink-50/50"
                    >
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink-900">
                          {b.listing?.title ?? b.listingTitle ?? serviceLabel}
                        </p>
                        <p className="truncate text-sm text-ink-500">
                          {other ? `${otherLabel} ${other}` : ''}
                          {(b.listing?.school?.name ?? b.schoolName)
                            ? ` · ${b.listing?.school?.name ?? b.schoolName}`
                            : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {fmtDate(b.scheduledDate)}
                          {b.scheduledTime ? ` · ${b.scheduledTime}` : ''} · {b.guestCount} guest{b.guestCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="font-mono text-sm font-semibold text-ink-900">{formatPrice(b.grossCents)}</p>
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', st.cls)}>
                          {st.label}
                        </span>
                        {guestPaid(b.payment?.status) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-verified/10 px-2 py-0.5 text-[0.65rem] font-semibold text-verified ring-1 ring-inset ring-verified/20">
                            <Check size={10} /> Paid
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {selected && (
        <BookingModal
          booking={selected}
          view={view}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </main>
  );
}

/* ═══ Booking detail modal ═════════════════════════════════════════════ */

function BookingModal({
  booking: b,
  view,
  onClose,
  onChanged,
}: {
  booking: BookingDto;
  view: View;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<null | 'accept' | 'decline' | 'complete'>(null);
  const { Icon, label: serviceLabel } = serviceMeta(b.serviceType);
  const st = STATUS_STYLE[b.status];

  // Only the guide can change status, and only on their own tours.
  const isGuide = view === 'guide';
  const canAcceptDecline = isGuide && b.status === 'PENDING';
  const canComplete = isGuide && b.status === 'CONFIRMED';

  async function act(action: 'accept' | 'decline' | 'complete') {
    setBusy(action);
    try {
      if (action === 'accept') await bookingsApi.accept(b.id);
      else if (action === 'decline') await bookingsApi.decline(b.id);
      else await bookingsApi.complete(b.id);
      toast.success(
        action === 'accept' ? 'Booking confirmed' : action === 'decline' ? 'Booking rejected' : 'Marked complete',
        action === 'accept'
          ? 'Payment captured. The guest has been notified by email.'
          : action === 'decline'
            ? 'The payment hold was released. The guest has been notified.'
            : 'The guest has been notified by email.',
      );
      onChanged();
    } catch (e) {
      setBusy(null);
      toast.error('Something went wrong', friendlyError(e));
    }
  }
  const title = b.listing?.title ?? b.listingTitle ?? serviceLabel;
  const school = b.listing?.school?.name ?? b.schoolName;
  const other = view === 'guest' ? b.seller?.name : b.buyer?.name;
  const otherRole = view === 'guest' ? 'Guide' : 'Guest';
  const duration = fmtDuration(b.durationMinutes);

  const rows: { icon: typeof User; label: string; value: string }[] = [
    ...(other ? [{ icon: User, label: otherRole, value: other }] : []),
    ...(school ? [{ icon: GraduationCap, label: 'School', value: school }] : []),
    { icon: CalendarDays, label: 'Date', value: `${fmtDate(b.scheduledDate)}${b.scheduledTime ? ` · ${b.scheduledTime}` : ''}` },
    ...(duration ? [{ icon: Clock, label: 'Duration', value: duration }] : []),
    { icon: Users, label: 'Guests', value: `${b.guestCount} guest${b.guestCount > 1 ? 's' : ''}` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Booking details"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-ink-100 p-5">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-800">
            <Icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">{serviceLabel}</p>
            <h2 className="mt-0.5 truncate font-display text-lg font-semibold text-ink-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset', st.cls)}>
                {st.label}
              </span>
              {guestPaid(b.payment?.status) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-verified/10 px-2.5 py-1 text-xs font-semibold text-verified ring-1 ring-inset ring-verified/20">
                  <Check size={12} /> Paid
                </span>
              )}
            </div>
            <span className="font-mono text-base font-semibold text-ink-900">{formatPrice(b.grossCents)}</span>
          </div>

          <dl className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                <r.icon size={16} className="shrink-0 text-ink-400" />
                <dt className="w-24 shrink-0 text-sm text-ink-500">{r.label}</dt>
                <dd className="min-w-0 flex-1 text-right text-sm font-medium text-ink-900">{r.value}</dd>
              </div>
            ))}
          </dl>

          <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-center text-xs text-ink-500">
            {b.status === 'PENDING'
              ? view === 'guest'
                ? 'You’ve paid — the amount is held and only charged once the guide confirms.'
                : 'The guest has already paid. Confirm to capture the payment, or reject to release the hold.'
              : b.status === 'CONFIRMED'
                ? 'Confirmed — you’re all set. Check your email for details.'
                : `This booking is ${st.label.toLowerCase()}.`}
          </p>

          {/* Guide-only status actions */}
          {(canAcceptDecline || canComplete) && (
            <div className="grid gap-2 pt-1">
              {canAcceptDecline && (
                <>
                  <button
                    type="button"
                    onClick={() => act('accept')}
                    disabled={!!busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-900 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-800 disabled:opacity-60"
                  >
                    {busy === 'accept' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Confirm booking
                  </button>
                  <button
                    type="button"
                    onClick={() => act('decline')}
                    disabled={!!busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy === 'decline' ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                    Reject
                  </button>
                </>
              )}
              {canComplete && (
                <button
                  type="button"
                  onClick={() => act('complete')}
                  disabled={!!busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-900 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-800 disabled:opacity-60"
                >
                  {busy === 'complete' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Mark as complete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
