'use client';

import { useMemo, useState } from 'react';
import { GraduationCap, MapPin, Video, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type Column } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { timeAgo } from '@/lib/utils';
import { useGuideApplications, useGuideApplicationActions, type GuideApplication } from '@/lib/queries';

type Status = GuideApplication['status'];
type Filter = 'ALL' | Status;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

// Field key → label, in the order shown in the detail view (empty values skipped).
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

export default function ApplicationsPage() {
  const { data: rows = [], isLoading: loading } = useGuideApplications();
  const { approve, reject } = useGuideApplicationActions();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<GuideApplication | null>(null);

  const { success, error } = useToast();
  const confirm = useConfirm();

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<Filter, number>>(
        (acc, f) => {
          acc[f.value] = f.value === 'ALL' ? rows.length : rows.filter((r) => r.status === f.value).length;
          return acc;
        },
        { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 },
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'ALL' && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.applicant.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.school.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  async function onApprove(app: GuideApplication) {
    try {
      await approve.mutateAsync(app.id);
      setActive(null);
      success('Application approved', `${app.applicant}'s guide profile is now live. They've been emailed.`);
    } catch (e) {
      error((e as Error).message);
    }
  }

  async function onReject(app: GuideApplication) {
    const { confirmed } = await confirm({
      title: 'Reject application',
      description: `This suspends ${app.applicant}'s guide profile. They will be notified by email.`,
      confirmLabel: 'Reject application',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await reject.mutateAsync(app.id);
      setActive(null);
      success('Application rejected', `${app.applicant} was notified by email.`);
    } catch (e) {
      error((e as Error).message);
    }
  }

  const columns: Column<GuideApplication>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.applicant} size={38} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{a.applicant}</p>
            <p className="truncate text-xs text-ink-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'school', header: 'School', hideOnMobile: true, cell: (a) => <span className="text-ink-700">{a.school}</span> },
    {
      key: 'tourTypes',
      header: 'Tour types',
      hideOnMobile: true,
      cell: (a) => <span className="text-ink-600">{a.tourTypes.join(', ') || '—'}</span>,
    },
    { key: 'submitted', header: 'Submitted', hideOnMobile: true, cell: (a) => <span className="text-ink-500">{a.submittedAt ? timeAgo(a.submittedAt) : '—'}</span> },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Button variant="outline" size="sm" onClick={() => setActive(a)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['applications.decide']}>
      <div className="space-y-6">
        <PageHeader
          title="Guide applications"
          description="Review become-a-guide submissions — read every answer, view photos, then approve (publish) or reject."
        />

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                value={filter}
                onChange={(v) => setFilter(v as Filter)}
                tabs={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] }))}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search applicant, email, or school…"
                className="sm:w-72"
              />
            </div>

            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(a) => a.id}
              onRowClick={(a) => setActive(a)}
              empty={{
                title: query ? 'No matching applications' : 'No guide applications yet',
                description: query
                  ? 'Try a different name, email, or school.'
                  : 'Become-a-guide submissions will appear here for review.',
              }}
            />
          </div>
        )}

        <ApplicationDetailModal app={active} onClose={() => setActive(null)} onApprove={onApprove} onReject={onReject} />
      </div>
    </RequirePermission>
  );
}

function ApplicationDetailModal({
  app,
  onClose,
  onApprove,
  onReject,
}: {
  app: GuideApplication | null;
  onClose: () => void;
  onApprove: (a: GuideApplication) => void;
  onReject: (a: GuideApplication) => void;
}) {
  const rows = app ? DETAIL_FIELDS.map(([k, label]) => [label, asText(app.details[k])] as const).filter(([, v]) => v) : [];
  const photos = app ? app.photos.filter(httpPhoto) : [];
  const title = app ? asText(app.details.listingTitle) || 'Guide application' : '';

  return (
    <Modal
      open={!!app}
      onClose={onClose}
      size="lg"
      title="Guide application"
      footer={
        app ? (
          <div className="flex w-full items-center justify-end gap-2.5">
            {app.status === 'REJECTED' || app.status === 'PENDING' ? (
              <Can perm="applications.decide">
                {app.status === 'PENDING' && (
                  <Button variant="danger-outline" size="sm" onClick={() => onReject(app)}>
                    Reject
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={() => onApprove(app)}>
                  {app.status === 'REJECTED' ? 'Re-approve (publish)' : 'Approve'}
                </Button>
              </Can>
            ) : (
              <Can perm="applications.decide">
                <Button variant="danger-outline" size="sm" onClick={() => onReject(app)}>
                  Suspend
                </Button>
              </Can>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : null
      }
    >
      {app && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar name={app.applicant} size={56} ring />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-ink-900">{app.applicant}</h3>
                <StatusBadge status={app.status} />
              </div>
              <p className="mt-0.5 text-sm text-ink-600">{app.email}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                <GraduationCap size={15} className="text-brand-800" /> {app.school}
              </p>
            </div>
          </div>

          {/* Proof of identity — the ID the admin verifies to approve */}
          <section>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-500">Proof of identity · student ID</p>
            {httpPhoto(app.details.idPhoto) ? (
              <a
                href={app.details.idPhoto}
                target="_blank"
                rel="noreferrer"
                className="block max-w-xs overflow-hidden rounded-xl border border-ink-200/70 bg-ink-50 transition-opacity hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={app.details.idPhoto} alt="Student ID" className="w-full object-contain" />
              </a>
            ) : (
              <p className="rounded-xl border border-dashed border-ink-300 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-400">
                No student ID was uploaded with this application.
              </p>
            )}
          </section>

          {/* Listing title + intro + tour types */}
          <section>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Listing</p>
            <p className="mt-1 font-semibold text-ink-900">{title}</p>
            {app.intro && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-600">{app.intro}</p>}
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

          {/* All answers */}
          <section>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-500">Application answers</p>
            <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Photos */}
          {photos.length > 0 && (
            <section>
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-500">Photos ({photos.length})</p>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((src, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-xl bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
