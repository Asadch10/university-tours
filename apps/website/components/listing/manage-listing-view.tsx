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
  Camera,
  Sparkles,
} from 'lucide-react';
import { accountApi, friendlyError, tokenStore } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { ListingProgress, reviewStepsFor } from '@/components/listing/listing-progress';

interface GuideListing {
  listingTitle?: string;
  intro?: string;
  school?: string;
  tourTypes?: string[];
  photos?: string[];
  status?: string;
  submittedAt?: string;
  publishedAt?: string;
  completedStep?: string;
}

/* Photos are object URLs during the session; they don't survive a reload. */
const usablePhoto = (p?: string) => (p && !p.startsWith('blob:') ? p : null);

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

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

/* ═══ Submitted — preview + status panel ═══════════════════════════════ */

function SubmittedState({ listing, name }: { listing: GuideListing; name: string }) {
  const status = listing.status ?? 'under_review';
  const photo = usablePhoto(listing.photos?.find(usablePhoto) ?? undefined);
  const photoCount = (listing.photos ?? []).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* ── Listing preview card ── */}
      <section className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
        <div className="relative aspect-[4/3.4] overflow-hidden">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Listing photo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-maroon-gradient font-display text-5xl font-bold text-ivory">
              {(name.trim()[0] ?? 'U').toUpperCase()}
            </div>
          )}
          <StatusChip status={status} />
        </div>
        <div className="p-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
            {name || 'Your name'}
          </p>
          <p className="mt-1.5 font-display text-lg font-semibold leading-snug text-ink-900">
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
                  {t === 'Video chat' ? <Video size={11} /> : <MapPin size={11} />} {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Right column: status + details ── */}
      <div className="space-y-6">
        <StatusPanel status={status} submittedAt={listing.submittedAt} publishedAt={listing.publishedAt} />

        {/* Details */}
        <section className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card sm:p-7">
          <h3 className="font-display text-lg font-semibold text-ink-900">Listing details</h3>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <DetailItem label="School" value={listing.school || '—'} />
            <DetailItem label="Tour types" value={listing.tourTypes?.join(', ') || '—'} />
            <DetailItem label="Submitted" value={fmtDate(listing.submittedAt) ?? '—'} />
            <DetailItem
              label="Photos"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Camera size={14} className="text-ink-400" /> {photoCount} photo{photoCount !== 1 ? 's' : ''}
                </span>
              }
            />
          </dl>
          {listing.intro?.trim() && (
            <div className="mt-5 border-t border-ink-100 pt-5">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
                Introduction
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {listing.intro}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink-800">{value}</dd>
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
      <section className="rounded-3xl border border-red-200 bg-red-50/70 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Ban size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">Listing suspended</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
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
        'rounded-3xl border p-6 sm:p-7',
        published ? 'border-emerald-200 bg-emerald-50/60' : 'border-gold-600/25 bg-gold-100/40',
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            published ? 'bg-emerald-100 text-emerald-700' : 'bg-gold-100 text-gold-800',
          )}
        >
          {published ? <CheckCircle2 size={20} /> : <Clock size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink-900">
            {published ? 'Your listing is live' : 'Your listing is under review'}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            {published
              ? 'Families can now find you and request tours. Keep your profile fresh — great photos get more bookings.'
              : 'Our team is reviewing your listing to keep the marketplace safe. This usually takes up to 48 hours — we’ll publish it as soon as it’s approved.'}
          </p>

          {/* Timeline — steps are data, ready to come from the backend later */}
          <ListingProgress
            className="mt-5"
            tone={published ? 'emerald' : 'gold'}
            steps={reviewStepsFor({ status, submittedAt, publishedAt })}
          />
        </div>
      </div>
    </section>
  );
}
