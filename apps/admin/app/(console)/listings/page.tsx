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
import { useListings, useListingActions } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

type StatusFilter = 'all' | ListingStatus;

export default function ListingsPage() {
  const router = useRouter();
  const { data: rows = [], isLoading: loading } = useListings();
  const { moderate } = useListingActions();

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

  const openDetails = (l: Listing) => router.push(`/listings/${l.id}`);

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
        'Suspending removes this listing from the public website immediately. The guide will be notified.',
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
      cell: (l) => <span className="font-mono text-xs font-semibold text-brand-900">L-{l.listingNo}</span>,
    },
    {
      key: 'title',
      header: 'Listing',
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{l.title}</p>
          <p className="truncate text-xs text-ink-500">by {l.guide}</p>
        </div>
      ),
    },
    {
      key: 'guide',
      header: 'Guide',
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
      header: 'School',
      hideOnMobile: true,
      cell: (l) => <span className="text-ink-700">{l.school}</span>,
    },
    {
      key: 'tourTypes',
      header: 'Tour types',
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
                className="text-success hover:bg-success/10"
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
                className="text-danger hover:bg-danger/10"
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
          description="Review guide listings submitted on the website — approve them to publish, or suspend anything that breaks policy."
        />

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
              <option value="Campus tour">In-person tour</option>
              <option value="Video chat">Video chat</option>
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
