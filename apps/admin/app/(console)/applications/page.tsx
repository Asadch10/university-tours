'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type Column } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission } from '@/components/auth/permission-gate';
import { cn, timeAgo } from '@/lib/utils';
import { useGuideApplications, APPLICATION_PREFIX, type GuideApplication, type ApplicantKind } from '@/lib/queries';

type Status = GuideApplication['status'];
type Filter = 'ALL' | Status;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const KIND_TABS: { value: ApplicantKind; label: string }[] = [
  { value: 'GUIDE', label: 'Guides' },
  { value: 'COUNSELOR', label: 'College counselors' },
];

export default function ApplicationsPage() {
  const router = useRouter();
  // Two independent submission queues behind one screen.
  const [kind, setKind] = useState<ApplicantKind>('GUIDE');
  const { data: rows = [], isLoading: loading } = useGuideApplications(kind);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  // The prefix carries the queue, so the detail page knows which one to load.
  const open = (a: GuideApplication) => router.push(`/applications/${APPLICATION_PREFIX[kind]}-${a.appNo}`);

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

  const columns: Column<GuideApplication>[] = [
    {
      key: 'appNo',
      header: 'ID',
      hideOnMobile: true,
      cell: (a) => (
        <span className="font-mono text-xs font-semibold text-brand-900">
          {APPLICATION_PREFIX[kind]}-{a.appNo}
        </span>
      ),
    },
    {
      key: 'applicant',
      header: 'Applicant',
      mobilePrimary: true,
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
    {
      key: 'school',
      // Counselors aren't campus-bound — the same column carries their practice.
      header: kind === 'COUNSELOR' ? 'Practice' : 'School',
      hideOnMobile: true,
      cell: (a) => <span className="text-ink-700">{a.school}</span>,
    },
    {
      key: 'tourTypes',
      header: kind === 'COUNSELOR' ? 'Specialties' : 'Tour types',
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
        <Button variant="outline" size="sm" onClick={() => open(a)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['applications.decide']}>
      <div className="space-y-6">
        <PageHeader
          title="Applications"
          description={
            kind === 'COUNSELOR'
              ? 'Review become-a-college-counselor submissions — read every answer, then approve (publish) or reject.'
              : 'Review become-a-guide submissions — read every answer, view photos, then approve (publish) or reject.'
          }
        />

        {/* Which submission queue is being reviewed. */}
        <div
          role="tablist"
          aria-label="Application type"
          className="inline-flex w-full gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-surface-2 p-1 sm:w-auto"
        >
          {KIND_TABS.map((k) => {
            const active = kind === k.value;
            return (
              <button
                key={k.value}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setKind(k.value);
                  setFilter('ALL');
                  setQuery('');
                }}
                className={cn(
                  'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-surface-3 hover:text-ink-900',
                )}
              >
                {k.label}
              </button>
            );
          })}
        </div>

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
                placeholder={kind === 'COUNSELOR' ? 'Search applicant, email, or practice…' : 'Search applicant, email, or school…'}
                className="sm:w-72"
              />
            </div>

            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(a) => a.id}
              onRowClick={open}
              empty={{
                title: query
                  ? 'No matching applications'
                  : kind === 'COUNSELOR'
                    ? 'No counselor applications yet'
                    : 'No guide applications yet',
                description: query
                  ? 'Try a different name, email, or school.'
                  : kind === 'COUNSELOR'
                    ? 'Become-a-college-counselor submissions will appear here for review.'
                    : 'Become-a-guide submissions will appear here for review.',
              }}
            />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
