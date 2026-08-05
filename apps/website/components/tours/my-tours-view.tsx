'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarRange, Loader2, Footprints, Video, MessageSquare, CalendarDays, Clock, Users,
  GraduationCap, User, Check, Ban, CheckCircle2, ArrowLeft, Link2, ExternalLink, Star,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { bookingsApi, friendlyError, tokenStore, type BookingDto, type BookingStatus } from '@/lib/client-api';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/lib/toast';
import { SERVICE_LABEL } from '@/lib/tour-types';

type View = 'guest' | 'guide' | 'counselor';
type TabKey = 'requests' | 'confirmed' | 'past' | 'canceled';

const VIEWS: { key: View; label: string }[] = [
  { key: 'guest', label: 'As guest' },
  { key: 'guide', label: 'As guide' },
  { key: 'counselor', label: 'As counselor' },
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

/** Human-friendly booking reference, e.g. "B-1". */
function bookingRef(n: number) {
  return `B-${n}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function serviceMeta(t: BookingDto['serviceType']) {
  if (t === 'VIDEO_CONSULTATION') return { Icon: Video, label: SERVICE_LABEL.VIDEO_CONSULTATION };
  if (t === 'CONSULTATION') return { Icon: MessageSquare, label: SERVICE_LABEL.CONSULTATION };
  return { Icon: Footprints, label: SERVICE_LABEL.CAMPUS_TOUR };
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

  // A selected booking opens a full detail screen (not a modal), so it reads well
  // on mobile and desktop, locally and live.
  if (selected) {
    return (
      <BookingDetail
        booking={selected}
        view={view}
        onBack={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-surface pt-[var(--header-h)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* Left rail — title + perspective switch */}
        <aside className="border-b border-ink-200/70 bg-canvas-alt px-6 py-10 lg:min-h-[calc(100dvh-var(--header-h))] lg:border-b-0 lg:border-r lg:px-8">
          <h1 className="font-display text-3xl font-semibold text-ink-900">My bookings</h1>

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
                    on ? 'text-brand' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
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
                    on ? 'text-brand' : 'text-ink-500 hover:text-ink-800',
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
              <Loader2 className="animate-spin text-brand" size={26} />
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
                <CalendarRange size={26} />
              </span>
              <p className="text-lg font-semibold text-ink-900">No bookings yet</p>
              <p className="max-w-sm text-sm text-ink-500">
                {view === 'guest'
                  ? 'Tours and consultations you book will show up here.'
                  : view === 'counselor'
                    ? 'Consultation requests from families will show up here once your counselor profile is live.'
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
                      className="flex w-full items-center gap-4 rounded-2xl border border-ink-200/70 bg-surface p-4 text-left shadow-soft transition-colors hover:border-brand/40 hover:bg-ink-50/50"
                    >
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink-900">
                          {b.listing?.title ?? b.listingTitle ?? serviceLabel}
                        </p>
                        <p className="font-mono text-xs font-semibold text-brand">{bookingRef(b.bookingNo)}</p>
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
    </main>
  );
}

/* ═══ Booking detail screen ════════════════════════════════════════════ */

function BookingDetail({
  booking: b,
  view,
  onBack,
  onChanged,
}: {
  booking: BookingDto;
  view: View;
  onBack: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<null | 'accept' | 'decline' | 'complete'>(null);
  const [meetingLink, setMeetingLink] = useState(b.videoLink ?? '');
  // Review (guest → guide, completed bookings). localReview reflects a just-submitted one.
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [localReview, setLocalReview] = useState<{ rating: number; text: string | null } | null>(null);
  const { Icon, label: serviceLabel } = serviceMeta(b.serviceType);
  const st = STATUS_STYLE[b.status];

  // Only the host can change status, and only on their own bookings. Both the guide
  // and the counselor perspective are the seller side — gating on 'guide' alone would
  // leave a counselor able to see a request but not accept it.
  const isGuide = view !== 'guest';
  const canAcceptDecline = isGuide && b.status === 'PENDING';
  const canComplete = isGuide && b.status === 'CONFIRMED';
  // Video chat & consultancy are online — a meeting link is required to confirm.
  const needsLink = b.serviceType === 'VIDEO_CONSULTATION' || b.serviceType === 'CONSULTATION';
  const validLink = /^https?:\/\/.+/i.test(meetingLink.trim());

  async function act(action: 'accept' | 'decline' | 'complete') {
    if (action === 'accept' && needsLink && !validLink) {
      toast.error('Meeting link required', 'Paste a valid Google Meet or Zoom link before confirming.');
      return;
    }
    setBusy(action);
    try {
      if (action === 'accept') await bookingsApi.accept(b.id, needsLink ? meetingLink.trim() : undefined);
      else if (action === 'decline') await bookingsApi.decline(b.id);
      else await bookingsApi.complete(b.id);
      toast.success(
        action === 'accept' ? 'Booking confirmed' : action === 'decline' ? 'Booking rejected' : 'Marked complete',
        action === 'accept'
          ? needsLink
            ? 'Payment captured. The guest got the meeting link by email.'
            : 'Payment captured. The guest has been notified by email.'
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

  async function submitReview() {
    // Reviewing is a guest action. If the user is currently in guide role, guide
    // them to switch in College status rather than failing.
    if (tokenStore.user?.role === 'SELLER') {
      toast.toast({
        variant: 'warning',
        title: 'Switch to guest to leave a review',
        description: 'You’re currently set as a guide. Change your role to guest in College status, then review.',
        action: { label: 'Go to College status', href: '/settings?section=college' },
      });
      return;
    }
    if (rating < 1) {
      toast.error('Pick a rating', 'Select 1 to 5 stars before submitting.');
      return;
    }
    setSubmittingReview(true);
    try {
      await bookingsApi.review(b.id, rating, reviewText.trim() || undefined);
      setLocalReview({ rating, text: reviewText.trim() || null });
      toast.success('Review submitted', 'Thanks — your feedback is now on the guide’s profile.');
    } catch (e) {
      toast.error('Could not submit review', friendlyError(e));
    } finally {
      setSubmittingReview(false);
    }
  }

  const title = b.listing?.title ?? b.listingTitle ?? serviceLabel;
  const school = b.listing?.school?.name ?? b.schoolName;
  const other = view === 'guest' ? b.seller?.name : b.buyer?.name;
  // As a guest the other party is whoever is hosting; from either host perspective
  // it's the family who booked.
  const otherRole = view === 'guest' ? (view === 'guest' && b.kind === 'COUNSELOR' ? 'Counselor' : 'Guide') : 'Guest';
  const otherFirst = other?.split(' ')[0] ?? (view === 'guest' ? 'the host' : 'the guest');
  const duration = fmtDuration(b.durationMinutes);

  const rows: { icon: typeof User; label: string; value: string }[] = [
    ...(other ? [{ icon: User, label: otherRole, value: other }] : []),
    ...(school ? [{ icon: GraduationCap, label: 'School', value: school }] : []),
    { icon: CalendarDays, label: 'Date', value: `${fmtDate(b.scheduledDate)}${b.scheduledTime ? ` · ${b.scheduledTime}` : ''}` },
    ...(duration ? [{ icon: Clock, label: 'Duration', value: duration }] : []),
    { icon: Users, label: 'Guests', value: `${b.guestCount} guest${b.guestCount > 1 ? 's' : ''}` },
  ];

  const showConfirmedLink = b.status === 'CONFIRMED' && needsLink && !!b.videoLink;

  return (
    <main className="min-h-dvh bg-surface pt-[var(--header-h)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand"
        >
          <ArrowLeft size={16} /> Back to My bookings
        </button>

        <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-surface shadow-soft">
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-ink-100 p-6">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-tint text-brand">
              <Icon size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                {serviceLabel} · <span className="font-mono text-brand">{bookingRef(b.bookingNo)}</span>
              </p>
              <h1 className="mt-0.5 font-display text-2xl font-semibold text-ink-900">{title}</h1>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-5 p-6">
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
              <span className="font-mono text-lg font-semibold text-ink-900">{formatPrice(b.grossCents)}</span>
            </div>

            <dl className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 px-4 py-3.5">
                  <r.icon size={16} className="shrink-0 text-ink-400" />
                  <dt className="w-24 shrink-0 text-sm text-ink-500">{r.label}</dt>
                  <dd className="min-w-0 flex-1 text-right text-sm font-medium text-ink-900">{r.value}</dd>
                </div>
              ))}
            </dl>

            {/* Meeting link — confirmed online booking (visible to guest & guide) */}
            {showConfirmedLink && (
              <div className="rounded-2xl border border-verified/30 bg-verified/5 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <Link2 size={16} className="text-verified" /> Meeting link
                </p>
                <a
                  href={b.videoLink!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-900 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-800"
                >
                  <Video size={16} /> Join meeting <ExternalLink size={14} />
                </a>
                <p className="mt-2 break-all text-center text-xs text-ink-500">{b.videoLink}</p>
              </div>
            )}

            {/* Meeting link input — guide confirming an online booking */}
            {canAcceptDecline && needsLink && (
              <div className="rounded-2xl border border-ink-200 bg-surface-2/60 p-4">
                <label htmlFor="meetingLink" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <Link2 size={16} className="text-brand" /> Meeting link (Google Meet or Zoom)
                </label>
                <input
                  id="meetingLink"
                  type="url"
                  inputMode="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="mt-2 w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
                <p className="mt-2 text-xs text-ink-500">
                  Create the meeting for the scheduled time, paste the link here, then confirm. {otherFirst} gets it by
                  email and here in My bookings.
                </p>
              </div>
            )}

            {/* Guest waiting note for online bookings */}
            {!isGuide && b.status === 'PENDING' && needsLink && (
              <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-center text-xs text-ink-500">
                Once {otherFirst} confirms, your meeting link will appear here and in your email.
              </p>
            )}

            <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-center text-xs text-ink-500">
              {b.status === 'PENDING'
                ? view === 'guest'
                  ? 'You’ve paid — the amount is held and only charged once the guide confirms.'
                  : 'The guest has already paid. Confirm to capture the payment, or reject to release the hold.'
                : b.status === 'CONFIRMED'
                  ? 'Confirmed — you’re all set. Check your email for details.'
                  : `This booking is ${st.label.toLowerCase()}.`}
            </p>

            {/* Review — guest leaves one for the guide after a completed booking;
                both sides see it once left. */}
            {b.status === 'COMPLETED' &&
              (() => {
                const existing = localReview ?? b.review;
                if (existing) {
                  return (
                    <div className="rounded-2xl border border-ink-200 bg-surface-2/60 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                        <Star size={16} className="fill-gold-500 text-gold-500" />
                        {isGuide ? `${otherFirst}’s review` : 'Your review'}
                      </p>
                      <div className="mt-3">
                        <StarRating value={existing.rating} />
                        {existing.text && (
                          <p className="mt-2 text-sm italic leading-relaxed text-ink-700">“{existing.text}”</p>
                        )}
                      </div>
                    </div>
                  );
                }
                if (isGuide) {
                  return (
                    <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-center text-xs text-ink-500">
                      No review yet — {otherFirst} can leave one from their My bookings.
                    </p>
                  );
                }
                return (
                  <div className="rounded-2xl border border-ink-200 bg-surface-2/60 p-4">
                    <p className="text-sm font-semibold text-ink-900">Leave a review for {otherFirst}</p>
                    <div className="mt-3 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(n)}
                          aria-label={`${n} star${n > 1 ? 's' : ''}`}
                          className="p-0.5"
                        >
                          <Star
                            size={30}
                            className={cn(
                              (hoverRating || rating) >= n
                                ? 'fill-gold-500 text-gold-500'
                                : 'fill-ink-300/60 text-ink-300/60',
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={`Share how your ${serviceLabel.toLowerCase()} with ${otherFirst} went…`}
                      className="mt-3 min-h-[90px] w-full resize-y rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                    />
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={submittingReview || rating < 1}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-900 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingReview ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                      Submit review
                    </button>
                  </div>
                );
              })()}

            {/* Guide-only status actions */}
            {(canAcceptDecline || canComplete) && (
              <div className="grid gap-2 pt-1">
                {canAcceptDecline && (
                  <>
                    <button
                      type="button"
                      onClick={() => act('accept')}
                      disabled={!!busy || (needsLink && !validLink)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-900 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy === 'accept' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Confirm booking
                    </button>
                    <button
                      type="button"
                      onClick={() => act('decline')}
                      disabled={!!busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-3.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-900 py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-800 disabled:opacity-60"
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
    </main>
  );
}
