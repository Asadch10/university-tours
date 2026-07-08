import { Badge, type BadgeProps } from './badge';
import { humanize } from '@/lib/utils';

type Variant = NonNullable<BadgeProps['variant']>;

/** Single source of truth for domain status → badge styling across every module. */
const STATUS_VARIANT: Record<string, Variant> = {
  // Bookings (same statuses guests/guides see in My tours; PENDING is shared below)
  PENDING_PAYMENT: 'neutral',
  COMPLETED: 'success',
  CONFIRMED: 'info',
  DECLINED: 'neutral',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
  // Users / admins
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  BANNED: 'danger',
  INVITED: 'info',
  DISABLED: 'neutral',
  // Applications
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CHANGES_REQUESTED: 'info',
  // Listings
  INACTIVE: 'neutral',
  UNDER_REVIEW: 'warning',
  // Refunds / payouts / campaigns
  PROCESSING: 'warning',
  SENT: 'success',
  SCHEDULED: 'info',
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

export function StatusBadge({ status, size }: { status: string; size?: BadgeProps['size'] }) {
  const variant = STATUS_VARIANT[status] ?? 'neutral';
  return (
    <Badge variant={variant} size={size} dot>
      {humanize(status)}
    </Badge>
  );
}
