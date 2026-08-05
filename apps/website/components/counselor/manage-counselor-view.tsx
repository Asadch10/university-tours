'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Briefcase, Globe, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  accountApi,
  friendlyError,
  questionnaireApi,
  type QuestionnaireQuestion,
} from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { CvSection, StatusPanel, PhotoSlider } from '@/components/listing/manage-listing-view';
import {
  parseAvailability,
  labelForDate,
  SERVICE_TYPES,
  TOUR_TYPE_LABELS,
} from '@/lib/availability';
import { tourTypeLabel, TOUR_TYPE_OPTIONS } from '@/lib/tour-types';
import { AvailabilityPicker } from '@/components/guide/availability-picker';
import { cleanAvailability, labelToService, type Availability, type ServiceType } from '@/lib/availability';

/**
 * The counselor's own management screen.
 *
 * Deliberately built from the SAME components as the guide screen
 * (PhotoSlider / StatusPanel / CvSection) rather than a look-alike copy, so the two
 * tabs of Manage listing are visually identical and stay that way. What differs is
 * only the content: a counselor has credentials and specialties instead of a school,
 * availability grid, and student ID.
 */

type Status = 'draft' | 'under_review' | 'published' | 'suspended' | 'rejected';

interface CounselorListing {
  status?: Status;
  photo?: string;
  tourTypes?: string[];
  availability?: unknown;
  answers?: Record<string, string | string[]>;
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
}

const inp =
  'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';
const sel = `${inp} cursor-pointer`;
const area = `${inp} min-h-[110px] resize-y leading-relaxed`;

const asText = (v: unknown): string =>
  Array.isArray(v) ? v.filter(Boolean).join(', ') : typeof v === 'string' ? v.trim() : '';

/** Chips for the counselor's specialties — the counterpart of TourTypeChips. */
function SpecialtyChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: QuestionnaireQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  if (q.type === 'LONG_TEXT') {
    return <textarea className={area} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  if (q.type === 'SINGLE_CHOICE') {
    return (
      <select className={sel} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
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
  return <input className={inp} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

export function ManageCounselorView({ embedded = false }: { embedded?: boolean } = {}) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [listing, setListing] = useState<CounselorListing | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      accountApi.getMe().catch(() => null),
      questionnaireApi.active('COUNSELOR').catch(() => ({ questions: [], requiredPhotos: 0 })),
    ])
      .then(([me, q]) => {
        if (cancelled) return;
        setName(me?.name ?? '');
        setQuestions(q.questions ?? []);
        const p = (me?.profileJson ?? {}) as Record<string, unknown>;
        setListing((p.counselorListing ?? null) as CounselorListing | null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function del() {
    setDeleting(true);
    try {
      const res = await accountApi.deleteCounselorListing();
      updateSessionUser({ hasCounselorListing: false, role: res.role ?? 'BUYER' });
      setListing(null);
      setConfirmOpen(false);
      toast.success('Profile deleted', 'Your counselor profile has been removed.');
    } catch (e) {
      toast.error('Could not delete profile', friendlyError(e));
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
    <main
      className={cn(
        'min-h-dvh bg-canvas pb-24',
        // See ManageListingView — the tab wrapper already clears the fixed header.
        embedded ? 'pt-8' : 'pt-[calc(var(--header-h)+2.5rem)]',
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
              Manage counselor profile
            </h1>
            <p className="mt-2 text-[0.95rem] text-ink-500">
              {submitted
                ? 'Your counselor profile, its review status, and everything families will see.'
                : 'Set up your counselor profile and start advising families.'}
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
          {isDraft && <DraftState onDelete={() => setConfirmOpen(true)} />}
          {submitted && <SubmittedState listing={listing!} name={name} questions={questions} />}
        </div>
      </div>

      {/* ── Edit profile ────────────────────────────────────────────────── */}
      {editing && listing && (
        <EditCounselorModal
          listing={listing}
          questions={questions}
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
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">Delete profile?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              This permanently removes your counselor profile and everything you&rsquo;ve entered.
              This action cannot be undone.
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
                  'Delete profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ═══ No profile yet ═══════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <section className="rounded-3xl border border-ink-200/70 bg-surface p-10 text-center shadow-card">
      <h2 className="font-display text-2xl font-semibold text-ink-900">
        You don&rsquo;t have a counselor profile yet
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-600">
        Apply to become a college counselor and start taking consultations with families who are
        actively choosing a school.
      </p>
      <Link
        href="/become-a-counselor"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-maroon-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
      >
        Start your application
      </Link>
    </section>
  );
}

/* ═══ Draft — not yet submitted ════════════════════════════════════════ */

function DraftState({ onDelete }: { onDelete: () => void }) {
  return (
    <section className="rounded-3xl border border-ink-200/70 bg-surface p-8 shadow-card">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">Draft</p>
      <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink-900">
        Your application isn&rsquo;t submitted yet
      </h2>
      <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-600">
        Finish the remaining questions and submit — our team reviews credentials within a couple of
        business days.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/become-a-counselor"
          className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-800"
        >
          Continue application
        </Link>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-surface px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 size={15} /> Delete draft
        </button>
      </div>
    </section>
  );
}

/* ═══ Submitted — status + full profile ═══════════════════════════════ */

function SubmittedState({
  listing,
  name,
  questions,
}: {
  listing: CounselorListing;
  name: string;
  questions: QuestionnaireQuestion[];
}) {
  const status = listing.status ?? 'under_review';

  return (
    <div className="space-y-6">
      {/* Same rule as the guide screen: the review timeline only matters before
          approval — once published, the profile below is all there is to show. */}
      {status !== 'published' && (
        <StatusPanel status={status} submittedAt={listing.submittedAt} publishedAt={listing.publishedAt} />
      )}
      <CounselorResume listing={listing} name={name} questions={questions} />
    </div>
  );
}

/* ═══ The profile as a CV — mirrors ListingResume ══════════════════════ */

function CounselorResume({
  listing,
  name,
  questions,
}: {
  listing: CounselorListing;
  name: string;
  questions: QuestionnaireQuestion[];
}) {
  const a = listing.answers ?? {};
  const status = listing.status ?? 'under_review';
  const photos = typeof listing.photo === 'string' && /^https?:\/\//.test(listing.photo) ? [listing.photo] : [];

  const headline = asText(a.headline);
  const organization = asText(a.organization);
  const website = asText(a.website);
  const bio = asText(a.bio);
  const specialties = Array.isArray(a.specialties)
    ? a.specialties.filter((s): s is string => typeof s === 'string')
    : [];
  const services = Array.isArray(listing.tourTypes)
    ? listing.tourTypes.filter((t): t is string => typeof t === 'string')
    : [];
  const availability = parseAvailability(listing.availability);
  const availServices = SERVICE_TYPES.filter((sv) => availability[sv]);

  // Everything else the admin's questionnaire asked, in the order it was asked —
  // minus the fields already shown in the identity card and About section above.
  const SHOWN = new Set(['headline', 'organization', 'website', 'bio', 'specialties']);
  const rows = questions
    .map((q) => {
      const key = q.key ?? q.id;
      if (SHOWN.has(key)) return null;
      const value = asText(a[key]);
      return value ? ([q.label, value] as const) : null;
    })
    .filter((r): r is readonly [string, string] => r !== null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] xl:grid-cols-[minmax(0,400px)_1fr]">
      {/* ── Left: identity card (sticky on desktop) ── */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <section className="overflow-hidden rounded-3xl border border-ink-200/70 bg-surface shadow-card">
          <PhotoSlider photos={photos} status={status} fallbackInitial={(name.trim()[0] ?? 'C').toUpperCase()} />
          <div className="p-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">
              {name || 'Your name'}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold leading-snug text-ink-900">
              {headline || 'College counselor'}
            </h2>
            {organization && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-600">
                <Briefcase size={15} className="shrink-0 text-ink-400" /> {organization}
              </p>
            )}
            {website && (
              <p className="mt-1.5">
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                >
                  <Globe size={15} className="shrink-0" /> Visit website
                </a>
              </p>
            )}
            {services.length > 0 && (
              <div className="mt-4">
                <SpecialtyChips items={services.map(tourTypeLabel)} />
              </div>
            )}
            {specialties.length > 0 && (
              <div className="mt-3">
                <SpecialtyChips items={specialties} />
              </div>
            )}
          </div>
        </section>
      </aside>

      {/* ── Right: full details ── */}
      <div className="space-y-6">
        {bio && (
          <CvSection title="Counseling approach">
            <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-700">{bio}</p>
          </CvSection>
        )}

        {availServices.length > 0 && (
          <CvSection title="Availability">
            <div className="grid gap-5 sm:grid-cols-2">
              {availServices.map((sv) => {
                const av = availability[sv]!;
                return (
                  <div key={sv}>
                    <p className="text-sm font-bold text-brand">{TOUR_TYPE_LABELS[sv]}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {av.dates.map((d) => (
                        <span key={d} className="inline-flex rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand">
                          {labelForDate(d)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {av.times.map((t) => (
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

        {specialties.length > 0 && (
          <CvSection title="Specialties">
            <SpecialtyChips items={specialties} />
          </CvSection>
        )}

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
      </div>
    </div>
  );
}

/* ═══ Edit modal ═══════════════════════════════════════════════════════ */

function EditCounselorModal({
  listing,
  questions,
  onClose,
  onSaved,
}: {
  listing: CounselorListing;
  questions: QuestionnaireQuestion[];
  onClose: () => void;
  onSaved: (l: CounselorListing) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Record<string, string | string[]>>(listing.answers ?? {});
  const [photo, setPhoto] = useState<string | null>(listing.photo ?? null);
  const [tourTypes, setTourTypes] = useState<string[]>(
    Array.isArray(listing.tourTypes) ? listing.tourTypes.filter((t): t is string => typeof t === 'string') : [],
  );
  const [availability, setAvailability] = useState<Availability>(parseAvailability(listing.availability));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const keyOf = (q: QuestionnaireQuestion) => q.key ?? q.id;

  async function save() {
    setSaving(true);
    try {
      const services = tourTypes.map(labelToService).filter((sv): sv is ServiceType => sv !== null);
      const res = await accountApi.saveCounselorListing({
        answers: draft,
        photo,
        tourTypes,
        availability: cleanAvailability(availability, services),
        // Editing a live profile sends it back through review, same as the guide flow.
        status: listing.status === 'draft' ? 'draft' : 'submitted',
      });
      const next =
        ((res.profileJson?.['counselorListing'] as CounselorListing | undefined) ??
          ({ ...listing, answers: draft, photo: photo ?? undefined, tourTypes, availability } as CounselorListing));
      toast.success(
        'Profile updated',
        listing.status === 'published' ? 'Your changes go live once re-approved.' : undefined,
      );
      onSaved(next);
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-canvas/80 px-6 py-12 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Edit counselor profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Photo */}
        <div className="mt-6 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-ink-200 bg-canvas-alt">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink-400">
                Photo
              </span>
            )}
          </div>
          <label className="cursor-pointer text-sm font-semibold text-brand hover:underline">
            {uploading ? 'Uploading…' : photo ? 'Replace photo' : 'Upload a photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  setPhoto(await accountApi.uploadPhoto(f));
                } catch (err) {
                  toast.error(friendlyError(err));
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>

        {/* Services + availability — the same controls the application uses. */}
        <div className="mt-6">
          <span className="mb-1.5 block text-sm font-semibold text-ink-800">Services you offer</span>
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
        </div>

        <div className="mt-6">
          <span className="mb-1.5 block text-sm font-semibold text-ink-800">Your availability</span>
          <AvailabilityPicker
            types={tourTypes.map(labelToService).filter((sv): sv is ServiceType => sv !== null)}
            value={availability}
            onChange={setAvailability}
          />
        </div>

        {/* Questions */}
        <div className="mt-6 space-y-5">
          {questions.map((q) => {
            const k = keyOf(q);
            return (
              <label key={q.id} className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink-800">
                  {q.label}
                  {q.required && <span className="ml-0.5 text-brand">*</span>}
                </span>
                <QuestionInput
                  q={q}
                  value={draft[k]}
                  onChange={(v) => setDraft((prev) => ({ ...prev, [k]: v }))}
                />
              </label>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end gap-3">
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
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-maroon-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-60"
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
