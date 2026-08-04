'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  PauseCircle,
  PlayCircle,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Star,
  CalendarCheck,
  Mail,
  Phone,
  Footprints,
  Video,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useUserDetail, useUserActions } from '@/lib/queries';
import type { UserDetailBooking, UserDetailReview } from '@/lib/api';
import { formatDate, formatPrice, humanize } from '@/lib/utils';
import { SERVICE_LABEL as SERVICE_TEXT } from '@/lib/tour-types';

const SERVICE_LABEL: Record<string, { label: string; icon: typeof Footprints }> = {
  CAMPUS_TOUR: { label: SERVICE_TEXT.CAMPUS_TOUR, icon: Footprints },
  VIDEO_CONSULTATION: { label: SERVICE_TEXT.VIDEO_CONSULTATION, icon: Video },
  CONSULTATION: { label: SERVICE_TEXT.CONSULTATION, icon: MessageSquare },
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading: loading, error } = useUserDetail(id);
  const { setStatus, resetPassword: resetPasswordMut } = useUserActions();
  const toast = useToast();
  const confirm = useConfirm();

  async function applyStatus(status: string, label: string) {
    if (!user) return;
    try {
      await setStatus.mutateAsync({ id: user.id, status });
      toast.success(label, `${user.name} is now ${humanize(status).toLowerCase()}.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function suspend() {
    const { confirmed } = await confirm({
      title: `Suspend ${user!.name}?`,
      description: 'Suspended users cannot book or host until reactivated.',
      confirmLabel: 'Suspend user',
      reason: { label: 'Reason for suspension', placeholder: 'Shared in the audit log…', required: true },
    });
    if (confirmed) applyStatus('SUSPENDED', 'User suspended');
  }
  async function ban() {
    const { confirmed } = await confirm({
      title: `Ban ${user!.name}?`,
      description: 'Banning permanently revokes access to the platform. This is a serious action.',
      confirmLabel: 'Ban user',
      tone: 'danger',
      reason: { label: 'Reason for ban', placeholder: 'Shared in the audit log…', required: true },
    });
    if (confirmed) applyStatus('BANNED', 'User banned');
  }
  async function reactivate() {
    const { confirmed } = await confirm({
      title: `Reactivate ${user!.name}?`,
      description: 'Restores full access to book and host.',
      confirmLabel: 'Reactivate',
    });
    if (confirmed) applyStatus('ACTIVE', 'User reactivated');
  }
  async function resetPassword() {
    const { confirmed } = await confirm({
      title: `Send password reset to ${user!.name}?`,
      description: `A reset link will be emailed to ${user!.email}.`,
      confirmLabel: 'Send reset link',
    });
    if (!confirmed) return;
    try {
      const res = await resetPasswordMut.mutateAsync(user!.id);
      if (res.sent) toast.success('Reset link sent', `A password reset link was emailed to ${res.email}.`);
      else toast.warning('No email sent', `${user!.name} is ${humanize(user!.status).toLowerCase()} — reset links only go to active accounts.`);
    } catch (e) {
      toast.error('Could not send reset link', (e as Error).message);
    }
  }

  if (loading) {
    return (
      <RequirePermission anyOf={['users.manage']}>
        <div className="space-y-6">
          <BackLink />
          <TableSkeleton cols={4} />
        </div>
      </RequirePermission>
    );
  }

  if (error || !user) {
    return (
      <RequirePermission anyOf={['users.manage']}>
        <div className="space-y-6">
          <BackLink />
          <div className="rounded-2xl border border-ink-200 bg-surface p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink-900">User not found</p>
            <p className="mt-1 text-sm text-ink-500">This account may have been removed.</p>
            <Button variant="outline" size="sm" className="mt-5" onClick={() => router.push('/users')}>
              <ArrowLeft size={15} /> Back to users
            </Button>
          </div>
        </div>
      </RequirePermission>
    );
  }

  const u = user;
  const roleLabel = u.isAdmin ? 'Admin' : u.role === 'SELLER' ? 'Guide' : 'Guest';

  const bookingCols: Column<UserDetailBooking>[] = [
    {
      key: 'no',
      header: 'Booking',
      cell: (b) => <span className="font-mono text-xs font-semibold text-brand-900">B-{b.bookingNo}</span>,
    },
    {
      key: 'side',
      header: 'As',
      cell: (b) => (
        <Badge variant={b.side === 'guide' ? 'brand' : 'neutral'} size="sm">
          {b.side === 'guide' ? 'Guide' : 'Guest'}
        </Badge>
      ),
    },
    { key: 'with', header: 'With', cell: (b) => <span className="text-ink-700">{b.counterparty}</span> },
    {
      key: 'service',
      header: 'Service',
      hideOnMobile: true,
      cell: (b) => <span className="text-ink-600">{SERVICE_LABEL[b.serviceType]?.label ?? humanize(b.serviceType)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      hideOnMobile: true,
      cell: (b) => <span className="whitespace-nowrap text-ink-600">{formatDate(b.scheduledDate)}</span>,
    },
    { key: 'amount', header: 'Amount', align: 'right', cell: (b) => <span className="font-semibold text-ink-800">{formatPrice(b.grossCents)}</span> },
    { key: 'status', header: 'Status', cell: (b) => <StatusBadge status={b.status} size="sm" /> },
  ];

  return (
    <RequirePermission anyOf={['users.manage']}>
      <div className="space-y-6">
        <BackLink />

        <PageHeader
          title={u.name}
          description={u.email}
          actions={
            <Can perm="users.manage">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={resetPassword}>
                  <KeyRound size={15} /> Reset password
                </Button>
                {u.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm" onClick={suspend}>
                    <PauseCircle size={15} /> Suspend
                  </Button>
                )}
                {u.status !== 'ACTIVE' && (
                  <Button variant="primary" size="sm" onClick={reactivate}>
                    <PlayCircle size={15} /> Reactivate
                  </Button>
                )}
                {u.status !== 'BANNED' && (
                  <Button variant="danger-outline" size="sm" onClick={ban}>
                    <Ban size={15} /> Ban
                  </Button>
                )}
              </div>
            </Can>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Left: bookings + reviews ── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Identity strip */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/50 p-4">
              <Avatar name={u.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{u.name}</p>
                <p className="truncate text-xs text-ink-500">{u.email}</p>
              </div>
              <Badge variant={u.role === 'SELLER' ? 'brand' : 'neutral'}>{roleLabel}</Badge>
              <StatusBadge status={u.status} />
            </div>

            {/* Bookings */}
            <div className="rounded-xl border border-ink-200 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Bookings ({u.bookings.length})</p>
                <span className="text-xs text-ink-500">
                  {u.counts.asGuest} as guest · {u.counts.asGuide} as guide
                </span>
              </div>
              {u.bookings.length ? (
                <DataTable
                  columns={bookingCols}
                  rows={u.bookings}
                  rowKey={(b) => b.id}
                  onRowClick={(b) => router.push(`/bookings/${b.id}`)}
                />
              ) : (
                <EmptyLine>No bookings yet.</EmptyLine>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-xl border border-ink-200 p-4 sm:p-5">
              <p className="mb-3 text-sm font-semibold text-ink-900">Reviews ({u.reviews.length})</p>
              {u.reviews.length ? (
                <div className="space-y-3">
                  {u.reviews.map((r) => (
                    <ReviewRow key={r.id} r={r} />
                  ))}
                </div>
              ) : (
                <EmptyLine>No reviews yet.</EmptyLine>
              )}
            </div>
          </div>

          {/* ── Right: account + guide info ── */}
          <div className="space-y-5">
            {/* Account */}
            <div className="rounded-xl border border-ink-200 p-4">
              <p className="text-sm font-semibold text-ink-900">Account</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <Row label="Role">
                  <Badge variant={u.role === 'SELLER' ? 'brand' : 'neutral'}>{roleLabel}</Badge>
                </Row>
                <Row label="Status">
                  <StatusBadge status={u.status} />
                </Row>
                <Row label="Email">
                  {u.emailVerified ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-success">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-warn">
                      <AlertTriangle size={14} /> Unverified
                    </span>
                  )}
                </Row>
                <Row label="Contact">
                  <span className="inline-flex items-center gap-1.5 text-ink-800">
                    <Mail size={13} className="text-ink-400" /> {u.email}
                  </span>
                </Row>
                {u.phone && (
                  <Row label="Phone">
                    <span className="inline-flex items-center gap-1.5 text-ink-800">
                      <Phone size={13} className="text-ink-400" /> {u.phone}
                    </span>
                  </Row>
                )}
                <Row label="Joined">{formatDate(u.joinedAt)}</Row>
                <Row label="Bookings">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
                    <CalendarCheck size={14} className="text-brand-800" /> {u.counts.asGuest + u.counts.asGuide}
                  </span>
                </Row>
              </dl>
            </div>

            {/* Guide listing */}
            {u.guideListing && (
              <div className="rounded-xl border border-ink-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">Guide listing</p>
                  <Link
                    href={`/listings/${u.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:underline"
                  >
                    Open <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="mt-2 font-semibold text-ink-900">{u.guideListing.title}</p>
                {u.guideListing.school && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
                    <GraduationCap size={14} className="text-ink-400" /> {u.guideListing.school}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={u.guideListing.status} size="sm" />
                  {u.guideListing.tourTypes.map((t) => (
                    <Badge key={t} variant="info" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Guide profile / rating */}
            {u.sellerProfile && (
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-sm font-semibold text-ink-900">Guide profile</p>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <Row label="School">{u.sellerProfile.school ?? u.guideListing?.school ?? '—'}</Row>
                  <Row label="Major">{u.sellerProfile.major ?? '—'}</Row>
                  <Row label="Grad year">{u.sellerProfile.gradYear ?? '—'}</Row>
                  <Row label="Rating">
                    {u.sellerProfile.ratingCount && u.sellerProfile.ratingCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink-900">
                        <Star size={14} className="fill-gold-500 text-gold-500" />
                        {(u.sellerProfile.ratingAvg ?? 0).toFixed(1)}
                        <span className="font-normal text-ink-500">({u.sellerProfile.ratingCount})</span>
                      </span>
                    ) : (
                      'No reviews yet'
                    )}
                  </Row>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequirePermission>
  );
}

function ReviewRow({ r }: { r: UserDetailReview }) {
  return (
    <div className="rounded-lg border border-ink-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-gold-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} className={i < r.rating ? 'fill-gold-500 text-gold-500' : 'text-ink-300'} />
            ))}
          </span>
          <Badge variant={r.side === 'received' ? 'brand' : 'neutral'} size="sm">
            {r.side === 'received' ? 'Received' : 'Written'}
          </Badge>
          {r.hidden && (
            <Badge variant="warning" size="sm">
              Hidden
            </Badge>
          )}
        </div>
        {r.bookingId && (
          <Link href={`/bookings/${r.bookingId}`} className="font-mono text-2xs font-semibold text-brand-800 hover:underline">
            B-{r.bookingNo}
          </Link>
        )}
      </div>
      {r.text && <p className="mt-1.5 text-sm leading-relaxed text-ink-700">“{r.text}”</p>}
      <p className="mt-1.5 text-xs text-ink-500">
        {r.side === 'received' ? 'From' : 'About'} {r.counterparty} · {formatDate(r.createdAt)}
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/users"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition-colors hover:text-ink-900"
    >
      <ArrowLeft size={15} /> All users
    </Link>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 text-right text-ink-800">{children}</dd>
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-sm text-ink-400">{children}</p>;
}
