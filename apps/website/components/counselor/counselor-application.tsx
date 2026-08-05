'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ImagePlus, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  accountApi,
  friendlyError,
  questionnaireApi,
  type QuestionnaireQuestion,
} from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { TOUR_TYPE_OPTIONS } from '@/lib/tour-types';
import { AvailabilityPicker } from '@/components/guide/availability-picker';
import {
  parseAvailability,
  cleanAvailability,
  missingAvailability,
  labelToService,
  TOUR_TYPE_LABELS,
  type Availability,
  type ServiceType,
} from '@/lib/availability';

/**
 * Become a College Counselor — the signed-in application form.
 *
 * The counselor counterpart of GuideApplication. It follows the same contract:
 * questions come from the admin-managed questionnaire (kind=COUNSELOR), progress is
 * saved as a draft into `profileJson.counselorListing`, and submitting flips the
 * listing to `under_review` so it lands in the admin queue.
 *
 * It is deliberately a single step rather than the guide form's three: counselors have
 * no availability grid, no tour types, and no campus photo gallery to fill in.
 */

const inp =
  'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';
const sel = `${inp} cursor-pointer`;
const area = `${inp} min-h-[110px] resize-y leading-relaxed`;

type ListingStatus = 'draft' | 'under_review' | 'published' | 'suspended' | 'rejected';

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
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
    return (
      <textarea
        className={area}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here…"
      />
    );
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
  return (
    <input
      className={inp}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your answer here…"
    />
  );
}

/* ─── Status screens (post-submission) ───────────────────────────────── */

function StatusScreen({
  icon,
  tone,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  tone: 'review' | 'approved' | 'rejected';
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const ring = {
    review: 'bg-gold-100 text-gold-700',
    approved: 'bg-verified-soft text-verified',
    rejected: 'bg-red-100 text-red-700',
  }[tone];

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-ink-200/70 bg-surface p-8 text-center shadow-soft sm:p-10">
        <span className={cn('mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full', ring)}>
          {icon}
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 leading-relaxed text-ink-600">{body}</p>
        {action && <div className="mt-8">{action}</div>}
      </div>
    </div>
  );
}

/* ─── Application ────────────────────────────────────────────────────── */

export function CounselorApplication() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<ListingStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [agree, setAgree] = useState(false);
  // Services + availability work exactly as they do for guides — same options, same
  // picker, same storage shape — so a booked counselor session can only land on a
  // slot they actually offered.
  const [tourTypes, setTourTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>({});

  // Load the counselor questionnaire and any saved draft together.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      questionnaireApi.active('COUNSELOR').catch(() => ({ questions: [], requiredPhotos: 0 })),
      accountApi.getMe().catch(() => null),
    ])
      .then(([q, me]) => {
        if (cancelled) return;
        setQuestions(q.questions ?? []);

        const profile = (me?.profileJson ?? {}) as Record<string, unknown>;
        const draft = (profile.counselorListing ?? null) as Record<string, unknown> | null;
        if (draft) {
          setStatus((draft.status as ListingStatus) ?? 'draft');
          setRejectionReason(typeof draft.rejectionReason === 'string' ? draft.rejectionReason : '');
          if (typeof draft.photo === 'string') setPhoto(draft.photo);
          if (draft.agreedTerms === true) setAgree(true);
          if (Array.isArray(draft.tourTypes)) {
            setTourTypes(draft.tourTypes.filter((t): t is string => typeof t === 'string'));
          }
          setAvailability(parseAvailability(draft.availability));

          // Answers are stored under each question's stable fieldKey when it has one,
          // falling back to the question id — mirroring how the guide form restores.
          const saved = (draft.answers ?? {}) as Record<string, unknown>;
          const restored: Record<string, string | string[]> = {};
          for (const question of q.questions ?? []) {
            const key = question.key ?? question.id;
            const v = saved[key] ?? saved[question.id];
            if (Array.isArray(v)) restored[question.id] = v.filter((x): x is string => typeof x === 'string');
            else if (typeof v === 'string') restored[question.id] = v;
          }
          setAnswers(restored);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setAnswer(id: string, v: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
  }

  /** Store answers under fieldKey when present, so the profile can read them by name. */
  function answersForSave() {
    const out: Record<string, string | string[]> = {};
    for (const q of questions) {
      const v = answers[q.id];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      out[q.key ?? q.id] = v;
    }
    return out;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const q of questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) errs[q.id] = 'This question is required.';
    }
    if (!tourTypes.length) errs['tourType'] = 'Please select at least one service.';
    const services = tourTypes.map(labelToService).filter((s): s is ServiceType => s !== null);
    const missing = missingAvailability(availability, services);
    if (services.length && missing.length) {
      errs['availability'] = `Add dates and times for ${missing.map((s) => TOUR_TYPE_LABELS[s]).join(', ')}.`;
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please complete the required fields.');
      return false;
    }
    if (!agree) {
      toast.error('Please confirm the counselor agreement before submitting.');
      return false;
    }
    return true;
  }

  /** Services + availability are saved alongside the answers, in the guide's shape. */
  function listingPayload() {
    const services = tourTypes.map(labelToService).filter((s): s is ServiceType => s !== null);
    return {
      answers: answersForSave(),
      photo,
      agreedTerms: agree,
      tourTypes,
      availability: cleanAvailability(availability, services),
    };
  }

  async function saveDraft() {
    try {
      await accountApi.saveCounselorListing({ ...listingPayload(), status: 'draft' });
      toast.success('Draft saved', 'Come back any time to finish.');
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Anything other than 'draft' submits for review — the backend sets
      // 'under_review' itself and notifies the admin team.
      const res = await accountApi.saveCounselorListing({ ...listingPayload(), status: 'submitted' });
      updateSessionUser({ hasCounselorListing: true, role: res.role ?? 'SELLER' });
      setStatus('under_review');
      toast.success('Application submitted', 'Our team will review your credentials.');
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-[var(--header-h)]">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    );
  }

  // Already submitted / decided — show status rather than the form.
  if (status === 'under_review') {
    return (
      <div className="pt-[var(--header-h)]">
        <StatusScreen
          tone="review"
          icon={<Clock size={26} />}
          title="Your application is under review"
          body="Our team is verifying your credentials. We'll email you as soon as there's a decision — usually within a few business days."
          action={
            <Link href="/" className="text-sm font-semibold text-brand hover:underline">
              Back to home
            </Link>
          }
        />
      </div>
    );
  }

  if (status === 'published') {
    return (
      <div className="pt-[var(--header-h)]">
        <StatusScreen
          tone="approved"
          icon={<CheckCircle2 size={26} />}
          title="You're an approved college counselor"
          body="Your profile is live in the directory and families can book consultations with you."
          action={
            <Link
              href="/manage-listing"
              className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-800"
            >
              Manage your counselor profile
            </Link>
          }
        />
      </div>
    );
  }

  if (status === 'rejected' || status === 'suspended') {
    return (
      <div className="pt-[var(--header-h)]">
        <StatusScreen
          tone="rejected"
          icon={<AlertTriangle size={26} />}
          title={status === 'rejected' ? 'Application not approved' : 'Your profile is suspended'}
          body={
            rejectionReason ||
            'Our team reviewed your application and could not approve it at this time. Contact support if you think this was a mistake.'
          }
          action={
            <Link href="/contact" className="text-sm font-semibold text-brand hover:underline">
              Contact support
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="pt-[var(--header-h)]">
      <div className="container-page max-w-3xl py-10 sm:py-14">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand">
          Counselor application
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Tell us about your practice
        </h1>
        <p className="mt-3 leading-relaxed text-ink-600">
          Our team reviews every counselor before their profile goes live. This usually
          takes a few business days.
        </p>

        {/* Profile photo */}
        <div className="mt-10">
          <span className="mb-1.5 block text-sm font-semibold text-ink-800">Profile photo</span>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-ink-200 bg-canvas-alt">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-ink-400">
                  <ImagePlus size={22} />
                </span>
              )}
            </div>
            <label className="cursor-pointer text-sm font-semibold text-brand hover:underline">
              {uploadingPhoto ? 'Uploading…' : photo ? 'Replace photo' : 'Upload a photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploadingPhoto(true);
                  try {
                    setPhoto(await accountApi.uploadPhoto(f));
                  } catch (err) {
                    toast.error(friendlyError(err));
                  } finally {
                    setUploadingPhoto(false);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Services offered — same three options and wording as become-a-guide. */}
        <div className="mt-8 space-y-6">
          <Field
            label="Services you offer"
            required
            error={fieldErrors['tourType']}
          >
            <p className="mb-2 text-xs leading-relaxed text-ink-500">
              Select what you can provide. Select more than one to increase your likelihood
              of getting bookings.
            </p>
            <div className="space-y-1">
              {TOUR_TYPE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-800"
                >
                  <input
                    type="checkbox"
                    checked={tourTypes.includes(o.value)}
                    onChange={(e) => {
                      setFieldErrors((prev) => {
                        const { tourType: _d, ...rest } = prev;
                        return rest;
                      });
                      setTourTypes((prev) =>
                        e.target.checked ? [...prev, o.value] : prev.filter((t) => t !== o.value),
                      );
                    }}
                    className="h-4 w-4 rounded border-ink-300 text-brand accent-brand"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Your availability" required error={fieldErrors['availability']}>
            <p className="mb-2 text-xs leading-relaxed text-ink-500">
              For each service you selected, choose the dates you can take sessions and the
              times you&rsquo;re free. The times you pick apply to every date for that service.
              Families can only book what you set here.
            </p>
            <AvailabilityPicker
              types={tourTypes.map(labelToService).filter((s): s is ServiceType => s !== null)}
              value={availability}
              onChange={(v) => {
                setFieldErrors((prev) => {
                  const { availability: _d, ...rest } = prev;
                  return rest;
                });
                setAvailability(v);
              }}
            />
          </Field>
        </div>

        {/* Admin-managed questions */}
        <div className="mt-8 space-y-6">
          {questions.length === 0 ? (
            <p className="rounded-xl border border-ink-200 bg-canvas-alt p-4 text-sm text-ink-600">
              The counselor application isn&rsquo;t available yet. Please check back shortly.
            </p>
          ) : (
            questions.map((q) => (
              <Field key={q.id} label={q.label} required={q.required} error={fieldErrors[q.id]}>
                <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
              </Field>
            ))
          )}
        </div>

        {/* Agreement */}
        {questions.length > 0 && (
          <>
            <label className="mt-8 flex cursor-pointer select-none items-start gap-3 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand accent-brand"
              />
              <span>
                I confirm the information above is accurate and I agree to the{' '}
                <Link href="/terms" className="font-semibold text-brand hover:underline">
                  counselor terms
                </Link>
                .
              </span>
            </label>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
              <button
                type="button"
                onClick={saveDraft}
                className="text-sm font-semibold text-ink-700 hover:text-ink-900"
              >
                Save and finish later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
