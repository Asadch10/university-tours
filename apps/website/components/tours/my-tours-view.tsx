'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange, Loader2, Footprints, Video } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { bookingsApi, tokenStore, type BookingDto, type BookingStatus } from '@/lib/client-api';

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
  PENDING: { label: 'Pending', cls: 'bg-gold-100 text-gold-800 ring-gold-600/20' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-verified/10 text-verified ring-verified/20' },
  COMPLETED: { label: 'Completed', cls: 'bg-ink-100 text-ink-700 ring-ink-300/40' },
  DECLINED: { label: 'Declined', cls: 'bg-red-50 text-red-700 ring-red-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-ink-100 text-ink-500 ring-ink-300/40' },
  CANCELLED: { label: 'Canceled', cls: 'bg-red-50 text-red-700 ring-red-200' },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MyToursView() {
  const router = useRouter();
  const [view, setView] = useState<View>('guest');
  const [tab, setTab] = useState<TabKey>('requests');
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.user) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    bookingsApi
      .list(view)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [view, router]);

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
                const Icon = b.serviceType === 'VIDEO_CONSULTATION' ? Video : Footprints;
                const other = view === 'guest' ? b.seller?.name : b.buyer?.name;
                const otherLabel = view === 'guest' ? 'with' : 'for';
                const st = STATUS_STYLE[b.status];
                return (
                  <li key={b.id} className="flex items-center gap-4 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900">
                        {b.listing?.title ?? (b.serviceType === 'VIDEO_CONSULTATION' ? 'Video consultation' : 'Campus tour')}
                      </p>
                      <p className="truncate text-sm text-ink-500">
                        {other ? `${otherLabel} ${other}` : ''}
                        {b.listing?.school?.name ? ` · ${b.listing.school.name}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {fmtDate(b.scheduledDate)}
                        {b.scheduledTime ? ` · ${b.scheduledTime}` : ''} · {b.guestCount} guest{b.guestCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-semibold text-ink-900">{formatPrice(b.grossCents)}</p>
                      <span className={cn('mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', st.cls)}>
                        {st.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
