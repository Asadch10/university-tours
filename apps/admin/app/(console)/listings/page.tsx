'use client';

import { useMemo, useState } from 'react';
import {
  Eye,
  Pencil,
  Ban,
  CheckCircle2,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { Select, Input, Field } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import type { Listing, ListingStatus, ServiceType } from '@/lib/data';
import { useListings, useListingActions } from '@/lib/queries';
import { formatPrice, formatDate } from '@/lib/utils';

type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'DISABLED';
type ServiceFilter = 'all' | ServiceType;

function ServiceBadge({ service }: { service: ServiceType }) {
  return service === 'CAMPUS_TOUR' ? (
    <Badge variant="maroon" size="md">In-person</Badge>
  ) : (
    <Badge variant="info" size="md">Video</Badge>
  );
}

export default function ListingsPage() {
  const { data: rows = [], isLoading: loading } = useListings();
  const { moderate } = useListingActions();

  const toast = useToast();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [service, setService] = useState<ServiceFilter>('all');

  // Detail / edit modal
  const [active, setActive] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(''); // dollars
  const [editStatus, setEditStatus] = useState<ListingStatus>('ACTIVE');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((l) => {
      if (status !== 'all' && l.status !== status) return false;
      if (service !== 'all' && l.service !== service) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.guide.toLowerCase().includes(q) ||
        l.school.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, service]);

  const tabs = useMemo(
    () => [
      { value: 'all', label: 'All', count: rows.length },
      { value: 'ACTIVE', label: 'Active', count: rows.filter((l) => l.status === 'ACTIVE').length },
      { value: 'INACTIVE', label: 'Inactive', count: rows.filter((l) => l.status === 'INACTIVE').length },
      { value: 'DISABLED', label: 'Disabled', count: rows.filter((l) => l.status === 'DISABLED').length },
    ],
    [rows],
  );

  function openDetails(l: Listing) {
    setActive(l);
    setEditTitle(l.title);
    setEditPrice((l.priceFrom / 100).toFixed(2));
    setEditStatus(l.status);
  }

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    try {
      await moderate.mutateAsync({ id: active.id, status: editStatus });
      setActive(null);
      toast.success('Listing updated', 'Your changes have been saved.');
    } catch (e) {
      toast.error('Could not update listing', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(l: Listing) {
    const { confirmed, reason } = await confirm({
      title: `Disable “${l.title}”?`,
      description:
        'Disabling removes this listing from search and the public marketplace immediately. The guide will be notified.',
      confirmLabel: 'Disable listing',
      tone: 'danger',
      reason: { label: 'Reason (shown in the audit log)', placeholder: 'e.g. Misleading title or policy violation', required: false },
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ id: l.id, status: 'DISABLED' });
      if (active?.id === l.id) setActive(null);
      toast.warning('Listing disabled', reason ? `Reason: ${reason}` : `“${l.title}” is no longer searchable.`);
    } catch (e) {
      toast.error('Could not disable listing', (e as Error).message);
    }
  }

  async function handleEnable(l: Listing) {
    const { confirmed } = await confirm({
      title: `Re-enable “${l.title}”?`,
      description: 'This listing will become active and discoverable in search again.',
      confirmLabel: 'Re-enable',
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ id: l.id, status: 'ACTIVE' });
      if (active?.id === l.id) setActive(null);
      toast.success('Listing re-enabled', `“${l.title}” is searchable again.`);
    } catch (e) {
      toast.error('Could not re-enable listing', (e as Error).message);
    }
  }

  const columns: Column<Listing>[] = [
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
          <span className="truncate text-ink-800">{l.guide}</span>
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
      key: 'service',
      header: 'Service',
      cell: (l) => <ServiceBadge service={l.service} />,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      hideOnMobile: true,
      cell: (l) => <span className="font-medium text-ink-900">{formatPrice(l.priceFrom)}</span>,
    },
    {
      key: 'bookings',
      header: 'Bookings',
      align: 'right',
      hideOnMobile: true,
      cell: (l) => <span className="font-medium text-ink-800">{l.bookings}</span>,
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
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit"
              onClick={() => openDetails(l)}
            >
              <Pencil size={14} />
            </Button>
            {l.status === 'DISABLED' ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Enable"
                className="text-success hover:bg-success/10"
                onClick={() => handleEnable(l)}
              >
                <CheckCircle2 size={15} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Disable"
                className="text-danger hover:bg-danger/10"
                onClick={() => handleDisable(l)}
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
          eyebrow="Marketplace"
          title="Listings"
          description="Moderate guide listings across every campus — review details, edit pricing, and remove anything that breaks policy."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={tabs} value={status} onChange={(v) => setStatus(v as StatusFilter)} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={service}
              onChange={(e) => setService(e.target.value as ServiceFilter)}
              aria-label="Filter by service"
              className="sm:w-48"
            >
              <option value="all">All services</option>
              <option value="CAMPUS_TOUR">In-person tour</option>
              <option value="VIDEO_CONSULTATION">Video consultation</option>
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
              title: 'No listings match',
              description: 'Try clearing the search or adjusting the filters.',
            }}
          />
        )}
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        size="lg"
        title={active ? 'Listing details' : ''}
        description={active ? `${active.school} · by ${active.guide}` : undefined}
        footer={
          active ? (
            <>
              <Can perm="listings.moderate">
                {active.status === 'DISABLED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-auto"
                    onClick={() => handleEnable(active)}
                  >
                    <CheckCircle2 size={15} /> Re-enable
                  </Button>
                ) : (
                  <Button
                    variant="danger-outline"
                    size="sm"
                    className="mr-auto"
                    onClick={() => handleDisable(active)}
                  >
                    <Ban size={15} /> Disable
                  </Button>
                )}
              </Can>
              <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
                Cancel
              </Button>
              <Can perm="listings.moderate" fallback={null}>
                <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                  Save changes
                </Button>
              </Can>
            </>
          ) : null
        }
      >
        {active && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/50 p-4">
              <Avatar name={active.guide} src={active.guideAvatar} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{active.guide}</p>
                <p className="flex items-center gap-1 truncate text-xs text-ink-500">
                  <MapPin size={12} /> {active.school}
                </p>
              </div>
              <ServiceBadge service={active.service} />
              <StatusBadge status={active.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-ink-200 p-3">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Bookings</p>
                <p className="mt-1 flex items-center gap-1.5 font-display text-lg font-bold text-ink-900">
                  <CalendarCheck size={16} className="text-maroon-800" /> {active.bookings}
                </p>
              </div>
              <div className="rounded-xl border border-ink-200 p-3">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Created</p>
                <p className="mt-1 font-display text-lg font-bold text-ink-900">{formatDate(active.createdAt)}</p>
              </div>
            </div>

            {/* Editable fields */}
            <Can
              perm="listings.moderate"
              fallback={
                <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
                  You can view this listing but don’t have permission to edit it.
                </p>
              }
            >
              <div className="space-y-4">
                <Field label="Title" htmlFor="listing-title">
                  <Input
                    id="listing-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price (USD)" htmlFor="listing-price" hint="Starting price for this listing.">
                    <Input
                      id="listing-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </Field>
                  <Field label="Status" htmlFor="listing-status">
                    <Select
                      id="listing-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ListingStatus)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="DISABLED">Disabled</option>
                    </Select>
                  </Field>
                </div>
              </div>
            </Can>
          </div>
        )}
      </Modal>
    </RequirePermission>
  );
}
