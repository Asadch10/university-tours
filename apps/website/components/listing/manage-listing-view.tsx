'use client';

import { useEffect, useRef, useState } from 'react';
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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
} from 'lucide-react';
import {
  accountApi,
  friendlyError,
  tokenStore,
  questionnaireApi,
  type QuestionnaireQuestion,
} from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { ListingProgress, reviewStepsFor } from '@/components/listing/listing-progress';
import { AvailabilityPicker } from '@/components/guide/availability-picker';
import {
  parseAvailability,
  cleanAvailability,
  missingAvailability,
  labelForDate,
  labelToService,
  SERVICE_TYPES,
  TOUR_TYPE_LABELS,
  type Availability,
  type ServiceType,
} from '@/lib/availability';
import { TOUR_TYPE_OPTIONS, tourTypeLabel } from '@/lib/tour-types';

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
  const [editing, setEditing] = useState(false);

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
      <main className="flex min-h-dvh items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-brand" size={28} />
      </main>
    );
  }

  const status = listing?.status ?? null;
  const isDraft = !!listing && status === 'draft';
  const submitted = !!listing && !isDraft;

  return (
    <main className="min-h-dvh bg-canvas pb-24 pt-[calc(var(--header-h)+2.5rem)]">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
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
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-surface px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition-colors hover:bg-ink-50"
              >
                <Pencil size={15} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-surface px-4 py-2.5 text-sm font-semibold text-red-600 shadow-soft transition-colors hover:bg-red-50"
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

      {/* ── Edit listing ────────────────────────────────────────────────── */}
      {editing && listing && (
        <EditListingModal
          listing={listing}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setListing(updated);
            setEditing(false);
          }}
        />
      )}

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 px-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
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
                  deleting ? 'cursor-not-allowed bg-red-400' : 'bg-danger-solid hover:bg-red-500',
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
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ivory px-6 py-3.5 text-sm font-semibold text-maroon-950 shadow-soft transition-colors hover:bg-white"
          >
            Start your listing <ArrowRight size={15} />
          </Link>
        </div>

        <div className="flex flex-col justify-center gap-5 border-t border-white/10 p-8 sm:p-10 lg:border-l lg:border-t-0">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-onbrand-accent ring-1 ring-inset ring-white/15">
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
    <section className="rounded-3xl border border-ink-200/70 bg-surface p-8 shadow-card sm:p-10">
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
                      current && 'bg-brand-tint text-brand ring-2 ring-brand',
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
              <span className="text-brand">{Math.round((doneCount / steps.length) * 100)}%</span>
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

/* ═══ Submitted — progress + full CV/résumé of the whole listing ═══════ */

function SubmittedState({ listing, name }: { listing: GuideListing; name: string }) {
  const status = listing.status ?? 'under_review';

  return (
    <div className="space-y-6">
      {/* Progress/status only matters before approval: show the review timeline
          while under review (and the alert if suspended), but hide it once the
          listing is published/approved — the CV below is all that's left to show. */}
      {status !== 'published' && (
        <StatusPanel status={status} submittedAt={listing.submittedAt} publishedAt={listing.publishedAt} />
      )}

      {/* ── Full listing, laid out like a CV ── */}
      <ListingResume listing={listing} name={name} />
    </div>
  );
}

/* ═══ Photo slider — prev / next + dots ════════════════════════════════ */

function PhotoSlider({ photos, status, fallbackInitial }: { photos: string[]; status: string; fallbackInitial: string }) {
  const [i, setI] = useState(0);
  const count = photos.length;
  const idx = count ? ((i % count) + count) % count : 0;

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
      {count ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photos[idx]} alt={`Listing photo ${idx + 1}`} className="h-full w-full object-contain" />
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
            className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink-800 shadow-md transition hover:bg-surface"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setI((c) => c + 1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink-800 shadow-md transition hover:bg-surface"
          >
            <ChevronRight size={18} />
          </button>
          <span className="absolute right-3 top-3 rounded-full bg-canvas/80 px-2 py-0.5 text-xs font-semibold text-white">
            {idx + 1} / {count}
          </span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Go to photo ${k + 1}`}
                className={cn('h-1.5 rounded-full transition-all', k === idx ? 'w-5 bg-surface' : 'w-1.5 bg-surface/60 hover:bg-surface/80')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ Edit modal — inline editing of any listing field ═════════════════ */

const EDIT_INP =
  'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';
const EDIT_SEL = `${EDIT_INP} cursor-pointer`;
const EDIT_AREA = `${EDIT_INP} min-h-[100px] resize-y leading-relaxed`;
// TOUR_TYPE_OPTIONS is imported from lib/tour-types (stable value + display label).

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</label>
      {children}
    </div>
  );
}

/** One admin-managed question rendered by its type (mirrors the become-a-guide form). */
function EditQuestionInput({
  q,
  value,
  onChange,
}: {
  q: QuestionnaireQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  if (q.type === 'LONG_TEXT') {
    return <textarea className={EDIT_AREA} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  if (q.type === 'SINGLE_CHOICE') {
    return (
      <select className={EDIT_SEL} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {q.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (q.type === 'MULTI_CHOICE') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-1">
        {q.options.map((o) => (
          <label key={o} className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={arr.includes(o)}
              onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
              className="h-4 w-4 rounded border-ink-300 text-brand accent-brand"
            />
            {o}
          </label>
        ))}
      </div>
    );
  }
  // TEXT (and FILE fallback) → single-line input.
  return <input className={EDIT_INP} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

function EditListingModal({
  listing,
  onClose,
  onSaved,
}: {
  listing: GuideListing;
  onClose: () => void;
  onSaved: (updated: GuideListing) => void;
}) {
  const toast = useToast();
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [saving, setSaving] = useState(false);

  const [listingTitle, setListingTitle] = useState(listing.listingTitle ?? '');
  const [intro, setIntro] = useState(listing.intro ?? '');
  const [school, setSchool] = useState(listing.school ?? '');
  const [tourTypes, setTourTypes] = useState<string[]>(listing.tourTypes ?? []);
  const [availability, setAvailability] = useState<Availability>(parseAvailability(listing.availability));
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // Profile photos + the student-ID (proof of identity) — editable here too.
  const [photos, setPhotos] = useState<string[]>(
    (listing.photos ?? []).filter((p): p is string => typeof p === 'string' && /^https?:\/\//.test(p)),
  );
  const [idPhoto, setIdPhoto] = useState<string | null>(
    typeof listing.idPhoto === 'string' && /^https?:\/\//.test(listing.idPhoto) ? listing.idPhoto : null,
  );
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const photosInput = useRef<HTMLInputElement>(null);
  const idInput = useRef<HTMLInputElement>(null);

  async function onAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photosInput.current) photosInput.current.value = '';
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const urls = await Promise.all(files.map((f) => accountApi.uploadPhoto(f)));
      setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      toast.error('Couldn’t upload photo', friendlyError(err));
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function onReplaceId(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (idInput.current) idInput.current.value = '';
    if (!f) return;
    setUploadingId(true);
    try {
      const url = await accountApi.uploadPhoto(f);
      setIdPhoto(url);
    } catch (err) {
      toast.error('Couldn’t upload your ID', friendlyError(err));
    } finally {
      setUploadingId(false);
    }
  }

  // Load the admin questionnaire and seed each answer from the listing's stored key.
  useEffect(() => {
    let active = true;
    questionnaireApi
      .active()
      .then((q) => {
        if (!active) return;
        setQuestions(q.questions);
        setAnswers((prev) => {
          const next = { ...prev };
          const src = listing as Record<string, unknown>;
          for (const question of q.questions) {
            if (next[question.id] !== undefined) continue;
            const raw = src[question.key ?? question.id];
            if (raw === undefined || raw === null) continue;
            next[question.id] = Array.isArray(raw)
              ? raw.filter((x): x is string => typeof x === 'string')
              : String(raw);
          }
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingQ(false);
      });
    return () => {
      active = false;
    };
  }, [listing]);

  const services = tourTypes.map(labelToService).filter((s): s is ServiceType => s !== null);

  async function save() {
    if (!listingTitle.trim()) {
      toast.error('Title required', 'Give your listing a title guests will see.');
      return;
    }
    if (!school.trim()) {
      toast.error('School required', 'Add the school you can show guests around.');
      return;
    }
    if (!tourTypes.length) {
      toast.error('Tour type required', 'Select at least one way you can host.');
      return;
    }
    const missing = missingAvailability(availability, services);
    if (missing.length) {
      toast.error(
        'Availability required',
        `Add at least one date and time for: ${missing.map((s) => TOUR_TYPE_LABELS[s]).join(', ')}.`,
      );
      return;
    }
    const missingQ = questions.find((q) => {
      if (!q.required) return false;
      const v = answers[q.id];
      return Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim();
    });
    if (missingQ) {
      toast.error('Answer required', `Please answer: “${missingQ.label}”.`);
      return;
    }

    // Each answer is stored under its stable key (e.g. "gender") so the guide
    // profile reads it exactly as before; a label/type snapshot drives display.
    const byKey: Record<string, string | string[]> = {};
    const snapshot: { questionId: string; key: string | null; label: string; type: string; value: string | string[] }[] = [];
    for (const q of questions) {
      const value = answers[q.id] ?? (q.type === 'MULTI_CHOICE' ? [] : '');
      byKey[q.key || q.id] = value;
      snapshot.push({ questionId: q.id, key: q.key, label: q.label, type: q.type, value });
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        listingTitle: listingTitle.trim(),
        intro: intro.trim(),
        school: school.trim(),
        tourTypes,
        ...byKey,
        availability: cleanAvailability(availability, services),
        answers: snapshot.filter((a) => (Array.isArray(a.value) ? a.value.length > 0 : String(a.value).trim() !== '')),
        photos,
        idPhoto,
        // Editing an approved listing re-submits it for admin review.
        status: 'under_review',
      };
      const res = await accountApi.saveGuideListing(payload);
      const updated =
        ((res.profileJson?.['guideListing'] as GuideListing | undefined) ?? ({ ...listing, ...payload } as GuideListing));
      toast.success('Changes saved', 'Your updated listing was sent for review.');
      onSaved(updated);
    } catch (e) {
      toast.error('Could not save changes', friendlyError(e));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Edit listing"
      onClick={() => !saving && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-100 bg-surface px-6 py-4 sm:px-7">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Edit listing</h2>
            <p className="mt-0.5 text-sm text-ink-500">Saving sends your listing back for review.</p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-7">
          <EditField label="Listing title">
            <input className={EDIT_INP} value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} />
          </EditField>

          <EditField label="About you (intro)">
            <textarea className={EDIT_AREA} value={intro} onChange={(e) => setIntro(e.target.value)} />
          </EditField>

          <EditField label="School">
            <input className={EDIT_INP} value={school} onChange={(e) => setSchool(e.target.value)} />
          </EditField>

          <EditField label="Tour type">
            <div className="space-y-1">
              {TOUR_TYPE_OPTIONS.map((o) => (
                <label key={o.value} className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-800">
                  <input
                    type="checkbox"
                    checked={tourTypes.includes(o.value)}
                    onChange={(e) =>
                      setTourTypes((prev) =>
                        e.target.checked ? [...prev, o.value] : prev.filter((t) => t !== o.value),
                      )
                    }
                    className="h-4 w-4 rounded border-ink-300 text-brand accent-brand"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </EditField>

          <EditField label="Your availability">
            <AvailabilityPicker types={services} value={availability} onChange={setAvailability} />
          </EditField>

          {/* Admin-managed questions */}
          {!loadingQ &&
            questions.map((q) => (
              <EditField key={q.id} label={q.label}>
                <EditQuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
              </EditField>
            ))}

          {/* Profile photos — replace, remove, or add */}
          <EditField label="Photos">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-red-600 shadow-soft transition-opacity hover:bg-surface"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photosInput.current?.click()}
                disabled={uploadingPhotos}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-300 text-center transition-colors hover:border-brand-muted hover:bg-brand-tint/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingPhotos ? (
                  <Loader2 size={20} className="animate-spin text-brand" />
                ) : (
                  <>
                    <ImagePlus size={20} className="text-ink-400" />
                    <span className="text-xs font-semibold text-ink-900">Add photo</span>
                  </>
                )}
              </button>
            </div>
            <input ref={photosInput} type="file" accept="image/*" multiple className="hidden" onChange={onAddPhotos} />
          </EditField>

          {/* Student ID — proof of identity; tap to replace */}
          <EditField label="Student ID (proof of identity)">
            <button
              type="button"
              onClick={() => idInput.current?.click()}
              disabled={uploadingId}
              className="flex aspect-[16/10] w-full max-w-xs flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 text-center transition-colors hover:border-brand-muted hover:bg-brand-tint/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingId ? (
                <>
                  <Loader2 size={22} className="animate-spin text-brand" />
                  <span className="text-xs text-ink-400">Uploading…</span>
                </>
              ) : idPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={idPhoto} alt="Student ID" className="h-full w-full object-contain" />
              ) : (
                <>
                  <ImagePlus size={22} className="text-ink-400" />
                  <span className="text-xs font-semibold text-ink-900">Add a photo…</span>
                </>
              )}
            </button>
            {idPhoto && (
              <button
                type="button"
                onClick={() => idInput.current?.click()}
                className="mt-2 text-sm font-semibold text-brand hover:underline"
              >
                Replace ID photo
              </button>
            )}
            <input ref={idInput} type="file" accept="image/*" className="hidden" onChange={onReplaceId} />
          </EditField>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-ink-100 bg-surface px-6 py-4 sm:px-7">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors',
              saving ? 'cursor-not-allowed bg-maroon-400' : 'bg-maroon-900 hover:bg-maroon-800',
            )}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Listing résumé — the whole listing laid out inline (was a modal) ══ */

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

/** A titled white card used for each résumé section. */
function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink-200/70 bg-surface p-6 shadow-card sm:p-7">
      <p className="mb-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{title}</p>
      {children}
    </section>
  );
}

function TourTypeChips({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand"
        >
          {t === 'Video chat' ? <Video size={11} /> : t === 'Consultancy' ? <MessageSquare size={11} /> : <MapPin size={11} />}{' '}
          {tourTypeLabel(t)}
        </span>
      ))}
    </div>
  );
}

/**
 * The full listing shown inline as a CV — identity card with the photo slider on
 * the left, and every detail (about, availability, answers, photos, ID) on the
 * right. This replaces the old "View details" modal so a guide always sees their
 * complete listing, especially once it's approved.
 */
function ListingResume({ listing, name }: { listing: GuideListing; name: string }) {
  const photos = (listing.photos ?? []).map(usablePhoto).filter((p): p is string => !!p);
  const idPhoto = usablePhoto(listing.idPhoto);
  const status = listing.status ?? 'under_review';
  const rows = ANSWER_ROWS.map(([k, label]) => [label, asText(listing[k])] as const).filter(([, v]) => v);
  const availability = parseAvailability(listing.availability);
  const availServices = SERVICE_TYPES.filter((s) => availability[s]);
  const customAnswers = (listing.answers ?? []).filter((a) => !a.key);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] xl:grid-cols-[minmax(0,400px)_1fr]">
      {/* ── Left: identity card (sticky on desktop) ── */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <section className="overflow-hidden rounded-3xl border border-ink-200/70 bg-surface shadow-card">
          <PhotoSlider photos={photos} status={status} fallbackInitial={(name.trim()[0] ?? 'U').toUpperCase()} />
          <div className="p-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{name || 'Your name'}</p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold leading-snug text-ink-900">
              {listing.listingTitle?.trim() || 'Untitled listing'}
            </h2>
            {listing.school && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-600">
                <GraduationCap size={15} className="shrink-0 text-ink-400" /> {listing.school}
              </p>
            )}
            {!!listing.tourTypes?.length && (
              <div className="mt-4">
                <TourTypeChips types={listing.tourTypes} />
              </div>
            )}
          </div>
        </section>
      </aside>

      {/* ── Right: full details ── */}
      <div className="space-y-6">
        {/* About */}
        {listing.intro?.trim() && (
          <CvSection title="About">
            <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-700">{listing.intro}</p>
          </CvSection>
        )}

        {/* Availability (per tour type) */}
        {availServices.length > 0 && (
          <CvSection title="Availability">
            <div className="grid gap-5 sm:grid-cols-2">
              {availServices.map((s) => {
                const a = availability[s]!;
                return (
                  <div key={s}>
                    <p className="text-sm font-bold text-brand">{TOUR_TYPE_LABELS[s]}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {a.dates.map((d) => (
                        <span key={d} className="inline-flex rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand">
                          {labelForDate(d)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {a.times.map((t) => (
                        <span key={t} className="inline-flex rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium tabular-nums text-ink-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CvSection>
        )}

        {/* Application answers */}
        {rows.length > 0 && (
          <CvSection title="Application details">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</dt>
                  <dd className="mt-1 whitespace-pre-line text-sm font-medium text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </CvSection>
        )}

        {/* Custom (keyless) questionnaire answers */}
        {customAnswers.length > 0 && (
          <CvSection title="More questions">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {customAnswers.map((a) => (
                <div key={a.questionId}>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{a.label}</dt>
                  <dd className="mt-1 whitespace-pre-line text-sm font-medium text-ink-800">
                    {Array.isArray(a.value) ? a.value.join(', ') : a.value}
                  </dd>
                </div>
              ))}
            </dl>
          </CvSection>
        )}

        {/* Proof of identity */}
        <CvSection title="Proof of identity · student ID">
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
        </CvSection>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const cfg =
    status === 'published'
      ? { label: 'Live', cls: 'bg-verified-solid text-white' }
      : status === 'suspended'
        ? { label: 'Suspended', cls: 'bg-danger-solid text-white' }
        : { label: 'Under review', cls: 'bg-surface/95 text-ink-800' };
  return (
    <span
      className={cn(
        'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur',
        cfg.cls,
      )}
    >
      {status === 'published' && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
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
              <Link href="/contact" className="font-semibold text-brand underline-offset-2 hover:underline">
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
            published ? 'bg-emerald-100 text-emerald-300' : 'bg-gold-100 text-gold-800',
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
