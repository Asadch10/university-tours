'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, GraduationCap, MapPin, Video, MessageSquare, Clock, ShieldCheck, ImageIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { timeAgo } from '@/lib/utils';
import { useGuideApplications, useGuideApplicationActions, type GuideApplication } from '@/lib/queries';

// Field key → label, in the order shown (empty values skipped).
const DETAIL_FIELDS: [string, string][] = [
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
  ['referral', 'Referred by'],
];

const asText = (v: unknown): string => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.trim()).join(', ');
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
};
const httpPhoto = (p: unknown): p is string => typeof p === 'string' && /^https?:\/\//.test(p);

export default function ApplicationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: rows = [], isLoading } = useGuideApplications();
  const { approve, reject } = useGuideApplicationActions();
  const { success, error } = useToast();
  const confirm = useConfirm();

  const app = rows.find((r) => r.id === id);

  async function onApprove() {
    if (!app) return;
    try {
      await approve.mutateAsync(app.id);
      success('Application approved', `${app.applicant}'s guide profile is now live. They've been emailed.`);
      router.push('/applications');
    } catch (e) {
      error((e as Error).message);
    }
  }

  async function onReject() {
    if (!app) return;
    const suspend = app.status === 'APPROVED';
    const { confirmed } = await confirm({
      title: suspend ? 'Suspend guide' : 'Reject application',
      description: `This ${suspend ? 'suspends' : 'rejects'} ${app.applicant}'s guide profile. They will be notified by email.`,
      confirmLabel: suspend ? 'Suspend' : 'Reject application',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await reject.mutateAsync(app.id);
      success(suspend ? 'Guide suspended' : 'Application rejected', `${app.applicant} was notified by email.`);
      router.push('/applications');
    } catch (e) {
      error((e as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={26} />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => router.push('/applications')} />
        <div className="rounded-2xl border border-ink-200/70 bg-white p-10 text-center">
          <p className="font-semibold text-ink-900">Application not found</p>
          <p className="mt-1 text-sm text-ink-500">It may have been removed, or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const rowsInfo = DETAIL_FIELDS.map(([k, label]) => [label, asText(app.details[k])] as const).filter(([, v]) => v);
  const answers = (
    (Array.isArray(app.details.answers) ? app.details.answers : []) as {
      questionId: string;
      key?: string | null;
      label: string;
      value: string | string[];
    }[]
  ).filter((a) => !a.key); // keyed answers already show in "Application answers"
  const photos = app.photos.filter(httpPhoto);
  const idPhoto = httpPhoto(app.details.idPhoto) ? app.details.idPhoto : null;
  const title = asText(app.details.listingTitle) || 'Guide application';

  const actions = (
    <Can perm="applications.decide">
      <div className="flex flex-wrap items-center gap-2.5">
        {app.status === 'APPROVED' ? (
          <Button variant="danger-outline" size="sm" onClick={onReject}>Suspend</Button>
        ) : (
          <>
            {app.status === 'PENDING' && (
              <Button variant="danger-outline" size="sm" onClick={onReject}>Reject</Button>
            )}
            <Button variant="primary" size="sm" onClick={onApprove}>
              {app.status === 'REJECTED' ? 'Re-approve (publish)' : 'Approve'}
            </Button>
          </>
        )}
      </div>
    </Can>
  );

  return (
    <RequirePermission anyOf={['applications.decide']}>
      <div className="space-y-6">
        <BackLink onClick={() => router.push('/applications')} />

        {/* Header */}
        <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={app.applicant} size={56} ring />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-semibold text-ink-900">{app.applicant}</h1>
                  <StatusBadge status={app.status} />
                </div>
                <p className="mt-0.5 text-sm text-ink-600">{app.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-brand-800" /> {app.school}
                  </span>
                  {app.submittedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} /> Submitted {timeAgo(app.submittedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0">{actions}</div>
          </div>
        </section>

        {/* Photos & identity — right under the header */}
        <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
          <p className="inline-flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-ink-500">
            <ImageIcon size={13} /> Photos &amp; identity
          </p>

          {/* Row 1 — student ID (inline thumbnail) */}
          <p className="mt-4 mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <ShieldCheck size={14} className="text-brand-800" /> Proof of identity · student ID
          </p>
          {idPhoto ? (
            <a
              href={idPhoto}
              target="_blank"
              rel="noreferrer"
              className="block w-fit overflow-hidden rounded-lg border border-ink-200/70 bg-ink-50 transition-opacity hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={idPhoto} alt="Student ID" className="h-32 w-auto object-cover" />
            </a>
          ) : (
            <p className="rounded-lg border border-dashed border-ink-300 bg-ink-50/60 px-4 py-4 text-center text-sm text-ink-400">
              No student ID was uploaded.
            </p>
          )}

          {/* Row 2 — profile photos */}
          <p className="mt-5 mb-2 text-xs font-semibold text-ink-700">Profile photos ({photos.length})</p>
          {photos.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {photos.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="group h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-ink-200/70 bg-ink-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-ink-300 bg-ink-50/60 px-4 py-4 text-center text-sm text-ink-400">
              No profile photos were uploaded.
            </p>
          )}
        </section>

        {/* Listing */}
        <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Listing</p>
          <p className="mt-1.5 text-lg font-semibold text-ink-900">{title}</p>
          {app.intro && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">{app.intro}</p>}
          {app.tourTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {app.tourTypes.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                  {t === 'Video chat' ? <Video size={11} /> : t === 'Consultancy' ? <MessageSquare size={11} /> : <MapPin size={11} />} {t}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Application answers */}
        {rowsInfo.length > 0 && (
          <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
            <p className="mb-4 text-2xs font-semibold uppercase tracking-wider text-ink-500">Application answers</p>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {rowsInfo.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Custom (keyless) questionnaire answers */}
        {answers.length > 0 && (
          <section className="rounded-2xl border border-ink-200/70 bg-white p-6">
            <p className="mb-4 text-2xs font-semibold uppercase tracking-wider text-ink-500">More questions</p>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {answers.map((a) => (
                <div key={a.questionId}>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">{a.label}</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm text-ink-800">
                    {Array.isArray(a.value) ? a.value.join(', ') : a.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

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
      <ArrowLeft size={16} /> Back to applications
    </button>
  );
}
