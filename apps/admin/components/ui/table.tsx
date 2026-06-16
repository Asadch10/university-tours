'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from './skeleton';
import { EmptyState, ErrorState } from './states';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide below the lg breakpoint to keep mobile tables readable. */
  hideOnMobile?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  /** Footer slot (e.g. pagination). */
  footer?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  onRowClick,
  empty,
  footer,
}: DataTableProps<T>) {
  if (loading) return <TableSkeleton cols={Math.min(columns.length, 6)} />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (rows.length === 0)
    return (
      <EmptyState
        title={empty?.title ?? 'Nothing here yet'}
        description={empty?.description}
        action={empty?.action}
      />
    );

  const align = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft">
      <div className="scroll-branded overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-200/60 bg-ink-50/50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-ink-500',
                    align(c.align),
                    c.hideOnMobile && 'hidden lg:table-cell',
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200/60">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-maroon-50/40',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3.5 align-middle text-ink-700',
                      align(c.align),
                      c.hideOnMobile && 'hidden lg:table-cell',
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-ink-200/60 bg-ink-50/30 px-4 py-3 text-sm text-ink-600">
          {footer}
        </div>
      )}
    </div>
  );
}
