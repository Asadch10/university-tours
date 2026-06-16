import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg bg-ink-100', className)} />;
}

/** Placeholder rows for a loading table. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white">
      <div className="border-b border-ink-200/60 bg-ink-50/50 px-5 py-3">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-ink-200/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            {Array.from({ length: cols - 1 }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-40' : 'w-24')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder grid for loading KPI/stat cards. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-ink-200/70 bg-white p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
