import type { LucideIcon } from 'lucide-react';
import { Inbox, AlertCircle, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/** Empty state — no data yet, or filters returned nothing. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white/60 px-6 py-16 text-center',
        className,
      )}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <Icon size={26} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Error state with retry. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this data. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-danger/25 bg-danger/5 px-6 py-16 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertCircle size={26} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Permission-denied state for gated pages. */
export function ForbiddenState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-200/70 bg-white px-6 py-20 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-800">
        <Lock size={26} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">You don’t have access</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        This area is restricted by your role. If you need access, ask a Super Admin to update your
        permissions.
      </p>
    </div>
  );
}
