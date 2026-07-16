'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  GraduationCap,
  Video,
  MapPin,
  Wallet,
  Ban,
  Sparkles,
  X,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { accountApi, friendlyError, tokenStore } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { ListingProgress, reviewStepsFor } from '@/components/listing/listing-progress';
import {
  parseAvailability,
  labelForDate,
  SERVICE_TYPES,
  TOUR_TYPE_LABELS,
  type Availability,
} from '@/lib/availability';

interface GuideListing {
  listingTitle?: string;
  intro?: string;
  school?: string;
  tourTypes?: string[];
  photos?: string[];
  idPhoto?: string; // proof of identity (student ID)
  status?: string;
  submittedAt?: string;
  publishedAt?: string;
  completedStep?: string;
  // ── Full "About you" details captured in step 1 ──
  gender?: string;
  academicYear?: string;
  age?: string;
  admissionType?: string;
  hometown?: string;
  academicFocus?: string;
  majors?: string;
  minors?: string;
  extracurriculars?: string[];
  clubs?: string;
  housing?: string[];
  personality?: string;
  experienceRating?: string;
  describeExperience?: string;
  tip?: string;
  favoriteClass?: string;
  careerGoals?: string;
  freeNight?: string;
  highSchool?: string;
  previousCollege?: string;
  groupTours?: string;
  referral?: string;
  // Per-tour-type dates + times the guide offers (drives the guest booking widget).
  availability?: Availability;
  // Answers to the admin-managed questionnaire questions.
  answers?: { questionId: string; key?: string | null; label: string; type: string; value: string | string[] }[];
  // ── Agreements captured in steps 1 & 2 ──
  agreedContract?: boolean;
  agreedGuidelines?: boolean;
}

/* Photos are object URLs during the session; they don't survive a reload. */
const usablePhoto = (p?: string) => (p && !p.startsWith('blob:') ? p : null);

export function ManageListingView() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [listing, setListing] = useState<GuideListing | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!tokenStore.user) {
      router.replace('/login');
      return;
    }
    setName(tokenStore.user.name ?? '');
    accountApi
      .getMe()
      .then((me) => {
        setName(me.name ?? '');
        const p = (me.profileJson ?? {}) as Record<string, unknown>;
        const gl = p.guideListing as GuideListing | undefined;
        setListing(gl ?? null);
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function del() {
    setDeleting(true);
    try {
      const res = await accountApi.deleteGuideListing();
      updateSessionUser({ hasListing: false, role: res.role ?? 'BUYER' });
      setListing(null);
      setConfirmOpen(false);
      toast.success('Listing deleted', 'Your listing has been removed.');
    } catch (e) {
      toast.error('Could not delete listing', friendlyError(e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white">
        <Loader2 className="animate-spin text-maroon-800" size={28} />
      </main>
    );
  }

  const status = listing?.status ?? null;
  const isDraft = !!listing && status === 'draft';
  const submitted = !!listing && !isDraft;

  return (
    <main className="min-h-dvh bg-ivory/60 pb-24 pt-[calc(var(--header-h)+2.5rem)]">
      <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
              Manage listing
            </h1>
            <p className="mt-2 text-[0.95rem] text-ink-500">
              {submitted
                ? 'Your guide listing, its review status, and everything guests will see.'
                : 'Set up your guide listing and start hosting future students.'}
            </p>
          </div>

          {submitted && (
            <div className="flex shrink-0 gap-2.5">
              <Link
                href="/become-a-guide"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition-colors hover:bg-ink-50"
              >
                <Pencil size={15} /> Edit
              </Link>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-soft transition-colors hover:bg-red-50"
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Content by state ────────────────────────────────────────── */}
        <div className="mt-8">
          {!listing && <EmptyState />}
          {isDraft && <DraftState listing={listing!} onDelete={() => setConfirmOpen(true)} />}
          {submitted && <SubmittedState listing={listing!} name={name} />}
        </div>
      </div>

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">Delete listing?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              This permanently removes your listing and everything you’ve entered. This action
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={del}
                className={cn(
                  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors',
                  deleting ? 'cursor-not-allowed bg-red-400' : 'bg-red-600 hover:bg-red-700',
                )}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  'Delete listing'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ═══ No listing yet — invite the user to become a guide ═══════════════ */

function EmptyState() {
  const perks = [
    { icon: Wallet, title: 'Earn on your schedule', body: 'Set your availability and host tours whenever it suits your classes.' },
    { icon: Video, title: 'In person or over video', body: 'Walk families around campus, or answer questions from your dorm.' },
    { icon: ShieldCheck, title: 'Verified and trusted', body: 'Our team reviews every listing so guests can book with confidence.' },
  ];

  return (
    <section className="overflow-hidden rounded-3xl bg-maroon-gradient shadow-card">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="p-8 sm:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-ivory ring-1 ring-inset ring-white/25">
            <Sparkles size={12} /> Become a guide
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ivory sm:text-4xl">
            Share your campus with the students who come next.
          </h2>
          <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ivory/75">
            Create your listing once — tell your story, add photos, and choose how you want to
            host. It takes about 10 minutes.
          </p>
          <Link
            href="/become-a-guide"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-maroon-900 shadow-sm transition-colors hover:bg-ivory"
          >
            Start your listing <ArrowRight size={15} />
          </Link>
        </div>

        <div className="flex flex-col justify-center gap-5 border-t border-white/10 p-8 sm:p-10 lg:border-l lg:border-t-0">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-inset ring-white/15">
                <p.icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ivory">{p.title}</p>
                <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ivory/65">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ Draft — resume the multi-step form ═══════════════════════════════ */

function DraftState({ listing, onDelete }: { listing: GuideListing; onDelete: () => void }) {
  const steps = [
    { key: 'details', label: 'About you & your school' },
    { key: 'paid', label: 'Getting paid' },
    { key: 'photos', label: 'Photos & publish' },
  ];
  const doneCount = listing.completedStep === 'paid' ? 2 : listing.completedStep === 'details' ? 1 : 0;

  return (
    <section className="rounded-3xl border border-ink-200/70 bg-white p-8 shadow-card sm:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-800 ring-1 ring-inset ring-gold-600/20">
            <Clock size={12} /> Draft in progress
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            {listing.listingTitle?.trim() || 'Pick up where you left off'}
          </h2>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-500">
            Your progress is saved. Finish the remaining steps and submit your listing for review.
          </p>

          {/* Steps */}
          <ol className="mt-6 space-y-3">
            {steps.map((s, i) => {
              const done = i < doneCount;
              const current = i === doneCount;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      done && 'bg-maroon-900 text-white',
                      current && 'bg-maroon-50 text-maroon-900 ring-2 ring-maroon-900',
                      !done && !current && 'bg-ink-100 text-ink-400',
                    )}
                  >
                    {done ? <CheckCircle2 size={15} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      done && 'text-ink-500 line-through decoration-ink-300',
                      current && 'font-semibold text-ink-900',
                      !done && !current && 'text-ink-400',
                    )}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-3 lg:w-64">
          {/* Progress */}
          <div className="rounded-2xl bg-ink-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink-500">Progress</span>
              <span className="text-maroon-900">{Math.round((doneCount / steps.length) * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-200">
              <div
                className="h-full rounded-full bg-maroon-gradient transition-[width] duration-300"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </div>
          </div>
          <Link
            href="/become-a-guide"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-maroon-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
          >
            Continue your listing <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer rounded-xl py-2 text-center text-xs font-semibold text-ink-400 transition-colors hover:text-red-600"
          >
            Discard draft
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══ Submitted — photo slider + progress ══════════════════════════════ */

function SubmittedState({ listing, name }: { listing: GuideListing; name: string }) {
  const status = listing.status ?? 'under_review';
  const [detailsOpen, setDetailsOpen] = useState(false);
  const photos = (listing.photos ?? []).map(usablePhoto).filter((p): p is string => !!p);

  return (
    <div className="space-y-6">
      {/* ── Progress / status on top ── */}
      <StatusPanel status={status} submittedAt={listing.submittedAt} publishedAt={listing.publishedAt} />

      {/* ── Compact listing card with photo slider ── */}
      <section className="max-w-sm overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
        <PhotoSlider photos={photos} status={status} fallbackInitial={(name.trim()[0] ?? 'U').toUpperCase()} />
        <div className="p-5 sm:p-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
            {name || 'Your name'}
          </p>
          <p className="mt-1.5 font-display text-xl font-semibold leading-snug text-ink-900">
            {listing.listingTitle?.trim() || 'Untitled listing'}
          </p>
          {listing.school && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-500">
              <GraduationCap size={14} className="shrink-0 text-ink-400" /> {listing.school}
            </p>
          )}
          {!!listing.tourTypes?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {listing.tourTypes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-maroon-50 px-2.5 py-1 text-xs font-medium text-maroon-900"
                >
                  {t === 'Video chat' ? <Video size={11} /> : t === 'Consultancy' ? <MessageSquare size={11} /> : <MapPin size={11} />} {t}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-maroon-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
          >
            <Eye size={15} /> View details
          </button>
        </div>
      </section>

      {detailsOpen && (
        <DetailsModal listing={listing} name={name} onClose={() => setDetailsOpen(false)} />
      )}
    </div>
  );
}

/* ═══ Photo slider — prev / next + dots ════════════════════════════════ */

function PhotoSlider({ photos, status, fallbackInitial }: { photos: string[]; status: string; fallbackInitial: string }) {
  const [i, setI] = useState(0);
  const count = photos.length;
  const idx = count ? ((i % count) + count) % count : 0;

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
      {count ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photos[idx]} alt={`Listing photo ${idx + 1}`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-maroon-gradient font-display text-5xl font-bold text-ivory">
          {fallbackInitial}
        </div>
      )}

      <StatusChip status={status} />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => setI((c) => c - 1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-md transition hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setI((c) => c + 1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-md transition hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>
          <span className="absolute right-3 top-3 rounded-full bg-ink-900/60 px-2 py-0.5 text-xs font-semibold text-white">
            {idx + 1} / {count}
          </span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Go to photo ${k + 1}`}
                className={cn('h-1.5 rounded-full transition-all', k === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ Full-detail modal — mirrors the admin application review ══════════ */

const ANSWER_ROWS: [keyof GuideListing, string][] = [
  ['gender', 'Gender'],
  ['academicYear', 'Academic year'],
  ['age', 'Age'],
  ['admissionType', 'Admission type'],
  ['hometown', 'Hometown'],
  ['academicFocus', 'Academic focus'],
  ['majors', 'Major(s)'],
  ['minors', 'Minor(s)'],
  ['extracurriculars', 'Extracurriculars'],
  ['clubs', 'Clubs & involvement'],
  ['housing', 'Housing'],
  ['personality', 'Personality'],
  ['experienceRating', 'Experience rating'],
  ['describeExperience', 'College experience'],
  ['tip', 'Tip for future students'],
  ['favoriteClass', 'Favorite class'],
  ['careerGoals', 'Career goals'],
  ['freeNight', 'Ideal free night'],
  ['highSchool', 'High school'],
  ['previousCollege', 'Previous college'],
  ['groupTours', 'Open to group tours'],
  ['referral', 'How they heard about us'],
];

const asText = (v: unknown): string =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === 'string' && x.trim()).join(', ')
    : typeof v === 'string'
      ? v.trim()
      : '';

function statusPill(status: string) {
  return status === 'published'
    ? { label: 'Live', cls: 'bg-emerald-100 text-emerald-700' }
    : status === 'suspended'
      ? { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
      : { label: 'Under review', cls: 'bg-gold-100 text-gold-800' };
}

function DetailsModal({ listing, name, onClose }: { listing: GuideListing; name: string; onClose: () => void }) {
  const photos = (listing.photos ?? []).map(usablePhoto).filter((p): p is string => !!p);
  const idPhoto = usablePhoto(listing.idPhoto);
  const st = statusPill(listing.status ?? 'under_review');
  const rows = ANSWER_ROWS.map(([k, label]) => [label, asText(listing[k])] as const).filter(([, v]) => v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Guide listing details"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed; only the body below scrolls */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-100 bg-white px-6 py-4 sm:px-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-display text-lg font-semibold text-ink-900">
                {listing.listingTitle?.trim() || 'Your guide profile'}
              </h2>
              <span className={cn('inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', st.cls)}>
                {st.label}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-ink-500">
              {name || 'Guide'}
              {listing.school ? ` · ${listing.school}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-7">
          {/* Proof of identity */}
          <section>
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
              Proof of identity · student ID
            </p>
            {idPhoto ? (
              <a
                href={idPhoto}
                target="_blank"
                rel="noreferrer"
                className="block max-w-xs overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 transition-opacity hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={idPhoto} alt="Student ID" className="w-full object-contain" />
              </a>
            ) : (
              <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
                No student ID on file yet.
              </p>
            )}
          </section>

          {/* About + tour types */}
          {(listing.intro?.trim() || listing.tourTypes?.length) && (
            <section className="border-t border-ink-100 pt-6">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">About</p>
              {listing.intro?.trim() && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{listing.intro}</p>
              )}
              {!!listing.tourTypes?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {listing.tourTypes.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-maroon-50 px-2.5 py-1 text-xs font-medium text-maroon-900"
                    >
                      {t === 'Video chat' ? <Video size={11} /> : t === 'Consultancy' ? <MessageSquare size={11} /> : <MapPin size={11} />} {t}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Availability (per tour type) */}
          {(() => {
            const availability = parseAvailability(listing.availability);
            const services = SERVICE_TYPES.filter((s) => availability[s]);
            if (!services.length) return null;
            return (
              <section className="border-t border-ink-100 pt-6">
                <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">Availability</p>
                <div className="space-y-4">
                  {services.map((s) => {
                    const a = availability[s]!;
                    return (
                      <div key={s}>
                        <p className="text-sm font-bold text-maroon-900">{TOUR_TYPE_LABELS[s]}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {a.dates.map((d) => (
                            <span
                              key={d}
                              className="inline-flex rounded-full bg-maroon-50 px-2.5 py-1 text-xs font-medium text-maroon-900"
                            >
                              {labelForDate(d)}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {a.times.map((t) => (
                            <span
                              key={t}
                              className="inline-flex rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium tabular-nums text-ink-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* Application answers */}
          {rows.length > 0 && (
            <section className="border-t border-ink-100 pt-6">
              <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">Application answers</p>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</dt>
                    <dd className="mt-1 whitespace-pre-line text-sm font-medium text-ink-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Custom (keyless) questionnaire answers — keyed ones show above via
              the fixed "Application answers" list. */}
          {!!listing.answers?.filter((a) => !a.key).length && (
            <section className="border-t border-ink-100 pt-6">
              <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">More questions</p>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {listing.answers.filter((a) => !a.key).map((a) => (
                  <div key={a.questionId}>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{a.label}</dt>
                    <dd className="mt-1 whitespace-pre-line text-sm font-medium text-ink-800">
                      {Array.isArray(a.value) ? a.value.join(', ') : a.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <section className="border-t border-ink-100 pt-6">
              <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
                Photos ({photos.length})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((src, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-2xl bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Guide photo ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const cfg =
    status === 'published'
      ? { label: 'Live', cls: 'bg-emerald-600 text-white' }
      : status === 'suspended'
        ? { label: 'Suspended', cls: 'bg-red-600 text-white' }
        : { label: 'Under review', cls: 'bg-white/95 text-ink-800' };
  return (
    <span
      className={cn(
        'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur',
        cfg.cls,
      )}
    >
      {status === 'published' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      {cfg.label}
    </span>
  );
}

/* Status explainer with a 3-step review timeline */
function StatusPanel({
  status,
  submittedAt,
  publishedAt,
}: {
  status: string;
  submittedAt?: string;
  publishedAt?: string;
}) {
  if (status === 'suspended') {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <Ban size={16} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink-900">Listing suspended</h3>
            <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink-600">
              Your listing was taken off the site by our team. If you think this is a mistake, or
              want to know what to fix,{' '}
              <Link href="/contact" className="font-semibold text-maroon-900 underline-offset-2 hover:underline">
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    );
  }

  const published = status === 'published';

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        published ? 'border-emerald-200 bg-emerald-50/60' : 'border-gold-600/25 bg-gold-100/40',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            published ? 'bg-emerald-100 text-emerald-700' : 'bg-gold-100 text-gold-800',
          )}
        >
          {published ? <CheckCircle2 size={16} /> : <Clock size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-ink-900">
            {published ? 'Your listing is live' : 'Your listing is under review'}
          </h3>
          <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink-600">
            {published
              ? 'Families can now find you and request tours. Keep your profile fresh — great photos get more bookings.'
              : 'Our team is reviewing your listing to keep the marketplace safe. This usually takes up to 48 hours — we’ll publish it as soon as it’s approved.'}
          </p>

          {/* Timeline — steps are data, ready to come from the backend later */}
          <ListingProgress
            className="mt-3.5"
            tone={published ? 'emerald' : 'gold'}
            steps={reviewStepsFor({ status, submittedAt, publishedAt })}
          />
        </div>
      </div>
    </section>
  );
}
