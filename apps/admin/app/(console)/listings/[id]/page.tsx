'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  MapPin,
  CalendarCheck,
  GraduationCap,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Select, Field } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { TourTypeBadges, ListingDetails } from '@/components/listings/listing-details';
import { useLightbox, ImageThumb } from '@/components/ui/lightbox';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import type { ListingStatus } from '@/lib/data';
import { useListingDetail, useListingActions, useListings } from '@/lib/queries';
import { usePageBreadcrumb } from '@/components/layout/breadcrumb';
import { formatDate } from '@/lib/utils';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading: loading, error } = useListingDetail(id);
  const { moderate } = useListingActions();
  // Sequential "L-<n>" from the listings list (same order as the table).
  const { data: listings = [] } = useListings();
  const listingNo = listings.find((l) => l.id === id)?.listingNo ?? null;
  usePageBreadcrumb(listingNo ? `L-${listingNo}` : null);

  const toast = useToast();
  const confirm = useConfirm();

  const [editStatus, setEditStatus] = useState<ListingStatus>('UNDER_REVIEW');
  const [saving, setSaving] = useState(false);
  const { open: openImage, node: lightbox } = useLightbox();

  useEffect(() => {
    if (listing) setEditStatus(listing.status as ListingStatus);
  }, [listing]);

  async function handleSave() {
    if (!listing) return;
    setSaving(true);
    try {
      await moderate.mutateAsync({ id: listing.id, status: editStatus });
      toast.success('Listing updated', 'Your changes have been saved.');
    } catch (e) {
      toast.error('Could not update listing', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!listing) return;
    const { confirmed } = await confirm({
      title: `Publish “${listing.title}”?`,
      description: `${listing.user.name}'s listing will go live on the website immediately.`,
      confirmLabel: 'Approve & publish',
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ id: listing.id, status: 'PUBLISHED' });
      toast.success('Listing published', `“${listing.title}” is now live on the website.`);
    } catch (e) {
      toast.error('Could not publish listing', (e as Error).message);
    }
  }

  async function handleSuspend() {
    if (!listing) return;
    const { confirmed, reason } = await confirm({
      title: `Suspend “${listing.title}”?`,
      description:
        'Suspending removes this listing from the public website immediately. The guide will be notified.',
      confirmLabel: 'Suspend listing',
      tone: 'danger',
      reason: { label: 'Reason (shown in the audit log)', placeholder: 'e.g. Misleading title or policy violation', required: false },
    });
    if (!confirmed) return;
    try {
      await moderate.mutateAsync({ id: listing.id, status: 'SUSPENDED' });
      toast.warning('Listing suspended', reason ? `Reason: ${reason}` : `“${listing.title}” is no longer visible on the website.`);
    } catch (e) {
      toast.error('Could not suspend listing', (e as Error).message);
    }
  }

  if (loading) {
    return (
      <RequirePermission anyOf={['listings.moderate']}>
        <div className="space-y-6">
          <TableSkeleton cols={3} />
        </div>
      </RequirePermission>
    );
  }

  if (error || !listing) {
    return (
      <RequirePermission anyOf={['listings.moderate']}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink-900">Listing not found</p>
            <p className="mt-1 text-sm text-ink-500">
              It may have been deleted by the guide on the website.
            </p>
            <Button variant="outline" size="sm" className="mt-5" onClick={() => router.push('/listings')}>
              <ArrowLeft size={15} /> Back to listings
            </Button>
          </div>
        </div>
      </RequirePermission>
    );
  }

  const l = listing;
  const status = l.status as ListingStatus;

  return (
    <RequirePermission anyOf={['listings.moderate']}>
      <div className="space-y-6">
        <PageHeader
          title={l.title}
          description={`${l.school ?? '—'} · by ${l.user.name}`}
          actions={
            <Can perm="listings.moderate">
              <div className="flex items-center gap-2">
                {(status === 'UNDER_REVIEW' || status === 'SUSPENDED') && (
                  <Button variant="primary" size="sm" onClick={handlePublish}>
                    <CheckCircle2 size={15} /> {status === 'UNDER_REVIEW' ? 'Approve & publish' : 'Re-publish'}
                  </Button>
                )}
                {status === 'PUBLISHED' && (
                  <Button variant="danger-outline" size="sm" onClick={handleSuspend}>
                    <Ban size={15} /> Suspend
                  </Button>
                )}
              </div>
            </Can>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Left: the listing as submitted on the website ── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/50 p-4">
              <Avatar name={l.user.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{l.user.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-ink-500">
                  <MapPin size={12} /> {l.school ?? '—'}
                </p>
              </div>
              <TourTypeBadges tourTypes={l.tourTypes} />
              <StatusBadge status={l.status} />
            </div>

            {/* Photos */}
            {l.photos.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {l.photos.map((src) => (
                  <ImageThumb key={src} src={src} alt="Listing photo" onOpen={() => openImage(src)} className="h-28 w-28" />
                ))}
              </div>
            )}

            {/* Intro */}
            {l.intro && (
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Introduction</p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{l.intro}</p>
              </div>
            )}

            {/* Full application answers from the website form */}
            <ListingDetails details={l.details} onImageOpen={openImage} />
          </div>

          {/* ── Right: moderation + account + guide profile ── */}
          <div className="space-y-5">
            {/* Moderation */}
            <Can perm="listings.moderate">
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-sm font-semibold text-ink-900">Moderation</p>
                <div className="mt-3 space-y-3">
                  <Field
                    label="Status"
                    htmlFor="listing-status"
                    hint="Published listings are live on the website; suspended ones are hidden."
                  >
                    <Select
                      id="listing-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ListingStatus)}
                    >
                      <option value="UNDER_REVIEW">Under review</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="SUSPENDED">Suspended</option>
                      {status === 'DRAFT' && <option value="DRAFT">Draft</option>}
                    </Select>
                  </Field>
                  <Button variant="primary" size="sm" className="w-full" loading={saving} onClick={handleSave}>
                    Save changes
                  </Button>
                </div>
              </div>
            </Can>

            {/* Listing stats */}
            <div className="rounded-xl border border-ink-200 p-4">
              <p className="text-sm font-semibold text-ink-900">Listing</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <DetailRow label="Bookings">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
                    <CalendarCheck size={14} className="text-brand-800" /> {l.bookings}
                  </span>
                </DetailRow>
                <DetailRow label="Submitted">{l.submittedAt ? formatDate(l.submittedAt) : '—'}</DetailRow>
                <DetailRow label="Published">{l.publishedAt ? formatDate(l.publishedAt) : '—'}</DetailRow>
              </dl>
            </div>

            {/* User account (same data as the Users page) */}
            <div className="rounded-xl border border-ink-200 p-4">
              <p className="text-sm font-semibold text-ink-900">User account</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={l.user.name} size={38} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{l.user.name}</p>
                  <p className="truncate text-xs text-ink-500">{l.user.email}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <DetailRow label="Role">
                  <Badge variant={l.user.role === 'SELLER' ? 'brand' : 'neutral'}>
                    {l.user.role === 'SELLER' ? 'Guide' : 'Guest'}
                  </Badge>
                </DetailRow>
                <DetailRow label="Account status">
                  <StatusBadge status={l.user.status} />
                </DetailRow>
                <DetailRow label="Email">
                  {l.user.emailVerified ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-success">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-warn">
                      <AlertTriangle size={14} /> Unverified
                    </span>
                  )}
                </DetailRow>
                <DetailRow label="Joined">{formatDate(l.user.joinedAt)}</DetailRow>
                <DetailRow label="Bookings as guest">{l.user.buyerBookings}</DetailRow>
              </dl>
            </div>

            {/* Seller / guide profile, when one exists */}
            {l.sellerProfile && (
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-sm font-semibold text-ink-900">Guide profile</p>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <DetailRow label="School">
                    <span className="inline-flex items-center gap-1.5">
                      {l.sellerProfile.school && <GraduationCap size={14} className="text-ink-400" />}
                      {l.sellerProfile.school ?? '—'}
                    </span>
                  </DetailRow>
                  <DetailRow label="Major">{l.sellerProfile.major ?? '—'}</DetailRow>
                  <DetailRow label="Grad year">{l.sellerProfile.gradYear ?? '—'}</DetailRow>
                  <DetailRow label="Application">
                    <StatusBadge status={l.sellerProfile.applicationStatus === 'SUBMITTED' ? 'PENDING' : l.sellerProfile.applicationStatus} />
                  </DetailRow>
                  <DetailRow label="Approved">
                    {l.sellerProfile.approvedAt ? formatDate(l.sellerProfile.approvedAt) : '—'}
                  </DetailRow>
                  <DetailRow label="Rating">
                    {l.sellerProfile.ratingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink-900">
                        <Star size={14} className="fill-gold-500 text-gold-500" />
                        {l.sellerProfile.ratingAvg.toFixed(1)}
                        <span className="font-normal text-ink-500">({l.sellerProfile.ratingCount})</span>
                      </span>
                    ) : (
                      'No reviews yet'
                    )}
                  </DetailRow>
                </dl>
                {l.sellerProfile.bio && (
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-ink-50 px-3 py-2.5 text-sm leading-relaxed text-ink-700">
                    {l.sellerProfile.bio}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {lightbox}
    </RequirePermission>
  );
}


function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 text-right text-ink-800">{children}</dd>
    </div>
  );
}
