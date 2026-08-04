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
import { timeAgo } from '@/lib/utils';
import { useGuideApplications, type GuideApplication } from '@/lib/queries';

type Status = GuideApplication['status'];
type Filter = 'ALL' | Status;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function ApplicationsPage() {
  const router = useRouter();
  const { data: rows = [], isLoading: loading } = useGuideApplications();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const open = (a: GuideApplication) => router.push(`/applications/ID-${a.appNo}`);

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
      cell: (a) => <span className="font-mono text-xs font-semibold text-brand-900">ID-{a.appNo}</span>,
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
              onRowClick={open}
              empty={{
                title: query ? 'No matching applications' : 'No guide applications yet',
                description: query
                  ? 'Try a different name, email, or school.'
                  : 'Become-a-guide submissions will appear here for review.',
              }}
            />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
