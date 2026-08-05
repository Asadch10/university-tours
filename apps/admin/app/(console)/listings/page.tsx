'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Ban, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { TourTypeBadges } from '@/components/listings/listing-details';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import type { Listing, ListingStatus } from '@/lib/data';
import { useListings, useListingActions, LISTING_PREFIX, type ApplicantKind } from '@/lib/queries';
import { cn, formatDate } from '@/lib/utils';
import { TOUR_TYPE_LABEL } from '@/lib/tour-types';

type StatusFilter = 'all' | ListingStatus;

const KIND_TABS: { value: ApplicantKind; label: string }[] = [
  { value: 'GUIDE', label: 'Guides' },
  { value: 'COUNSELOR', label: 'College counselors' },
];

export default function ListingsPage() {
  const router = useRouter();
  // Guide and counselor listings are separate queues behind one screen.
  const [kind, setKind] = useState<ApplicantKind>('GUIDE');
  const { data: rows = [], isLoading: loading } = useListings(kind);
  const { moderate } = useListingActions(kind);

  const toast = useToast();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [tourType, setTourType] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((l) => {
      if (status !== 'all' && l.status !== status) return false;
      if (tourType !== 'all' && !l.tourTypes.includes(tourType)) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.guide.toLowerCase().includes(q) ||
        l.school.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, tourType]);

  const tabs = useMemo(
    () => [
      { value: 'all', label: 'All', count: rows.length },
      { value: 'UNDER_REVIEW', label: 'Under review', count: rows.filter((l) => l.status === 'UNDER_REVIEW').length },
      { value: 'PUBLISHED', label: 'Published', count: rows.filter((l) => l.status === 'PUBLISHED').length },
      { value: 'DRAFT', label: 'Draft', count: rows.filter((l) => l.status === 'DRAFT').length },
      { value: 'SUSPENDED', label: 'Suspended', count: rows.filter((l) => l.status === 'SUSPENDED').length },
    ],
    [rows],
  );

  // Carry the queue through, so the detail page loads the right profileJson listing
  // for a user who holds both a guide and a counselor profile.
  const openDetails = (l: Listing) => router.push(`/listings/${l.id}?kind=${kind}`);

  async function handlePublish(l: Listing) {
    const { confirmed } = await confirm({
      title: `Publish “${l.title}”?`,
      description: `${l.guide}'s listing will go live on the website immediately.`,
      confirmLabel: 'Approve & publish',
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ id: l.id, status: 'PUBLISHED' });
      toast.success('Listing published', `“${l.title}” is now live on the website.`);
    } catch (e) {
      toast.error('Could not publish listing', (e as Error).message);
    }
  }

  async function handleSuspend(l: Listing) {
    const { confirmed, reason } = await confirm({
      title: `Suspend “${l.title}”?`,
      description:
        `Suspending removes this listing from the public website immediately. The ${kind === 'COUNSELOR' ? 'counselor' : 'guide'} will be notified.`,
      confirmLabel: 'Suspend listing',
      tone: 'danger',
      reason: { label: 'Reason (shown in the audit log)', placeholder: 'e.g. Misleading title or policy violation', required: false },
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ id: l.id, status: 'SUSPENDED' });
      toast.warning('Listing suspended', reason ? `Reason: ${reason}` : `“${l.title}” is no longer visible on the website.`);
    } catch (e) {
      toast.error('Could not suspend listing', (e as Error).message);
    }
  }

  const columns: Column<Listing>[] = [
    {
      key: 'listingNo',
      header: 'ID',
      hideOnMobile: true,
      cell: (l) => (
        <span className="font-mono text-xs font-semibold text-brand-900">
          {LISTING_PREFIX[kind]}-{l.listingNo}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Listing',
      mobilePrimary: true,
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{l.title}</p>
          <p className="truncate text-xs text-ink-500">by {l.guide}</p>
        </div>
      ),
    },
    {
      key: 'guide',
      header: kind === 'COUNSELOR' ? 'Counselor' : 'Guide',
      hideOnMobile: true,
      cell: (l) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={l.guide} src={l.guideAvatar} size={30} />
          <div className="min-w-0">
            <p className="truncate text-ink-800">{l.guide}</p>
            <p className="truncate text-xs text-ink-500">{l.guideEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'school',
      header: kind === 'COUNSELOR' ? 'Practice' : 'School',
      hideOnMobile: true,
      cell: (l) => <span className="text-ink-700">{l.school}</span>,
    },
    {
      key: 'tourTypes',
      header: kind === 'COUNSELOR' ? 'Specialties' : 'Tour types',
      cell: (l) => <TourTypeBadges tourTypes={l.tourTypes} />,
    },
    {
      key: 'bookings',
      header: 'Bookings',
      align: 'right',
      hideOnMobile: true,
      cell: (l) => <span className="font-medium text-ink-800">{l.bookings}</span>,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      hideOnMobile: true,
      cell: (l) => (
        <span className="whitespace-nowrap text-ink-600">
          {l.submittedAt ? formatDate(l.submittedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (l) => (
        <Can perm="listings.moderate">
          <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="View details"
              onClick={() => openDetails(l)}
            >
              <Eye size={15} />
            </Button>
            {(l.status === 'UNDER_REVIEW' || l.status === 'SUSPENDED') && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={l.status === 'UNDER_REVIEW' ? 'Approve & publish' : 'Re-publish'}
                className="text-success hover:bg-success-solid/10"
                onClick={() => handlePublish(l)}
              >
                <CheckCircle2 size={15} />
              </Button>
            )}
            {l.status === 'PUBLISHED' && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Suspend"
                className="text-danger hover:bg-danger-solid/10"
                onClick={() => handleSuspend(l)}
              >
                <Ban size={15} />
              </Button>
            )}
          </div>
        </Can>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['listings.moderate']}>
      <div className="space-y-6">
        <PageHeader
          title="Listings"
          description={
            kind === 'COUNSELOR'
              ? 'Review college counselor profiles submitted on the website — approve them to publish, or suspend anything that breaks policy.'
              : 'Review guide listings submitted on the website — approve them to publish, or suspend anything that breaks policy.'
          }
        />

        {/* Which listing queue is being moderated. */}
        <div
          role="tablist"
          aria-label="Listing type"
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
                  setStatus('all');
                  setQuery('');
                  setTourType('all');
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

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={tabs} value={status} onChange={(v) => setStatus(v as StatusFilter)} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={tourType}
              onChange={(e) => setTourType(e.target.value)}
              aria-label="Filter by tour type"
              className="sm:w-48"
            >
              <option value="all">All tour types</option>
              {/* value = the stored/wire string (frozen); text = display label. */}
              <option value="Campus tour">{TOUR_TYPE_LABEL['Campus tour']}</option>
              <option value="Video chat">{TOUR_TYPE_LABEL['Video chat']}</option>
              <option value="Consultancy">{TOUR_TYPE_LABEL.Consultancy}</option>
            </Select>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search title, guide, school…"
              className="sm:w-72"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton cols={6} />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(l) => l.id}
            onRowClick={openDetails}
            empty={{
              title: query || status !== 'all' || tourType !== 'all' ? 'No listings match' : 'No listings yet',
              description:
                query || status !== 'all' || tourType !== 'all'
                  ? 'Try clearing the search or adjusting the filters.'
                  : 'Listings appear here as guides create them on the website.',
            }}
          />
        )}
      </div>
    </RequirePermission>
  );
}
