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
  /**
   * Label for this column in the mobile card view. Defaults to `header` when that is a
   * plain string. Set `''` to render the value with no label (used for action buttons).
   */
  mobileLabel?: string;
  /**
   * Render this column as the card's headline instead of a label/value row. Defaults to
   * the first column when no column opts in.
   */
  mobilePrimary?: boolean;
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

/** Best-effort label for the stacked mobile view. */
function labelFor<T>(c: Column<T>): string {
  if (c.mobileLabel !== undefined) return c.mobileLabel;
  return typeof c.header === 'string' ? c.header : '';
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

  // Mobile card composition. `hideOnMobile` columns are dropped entirely — they are
  // secondary by definition — and the first column (or the one flagged `mobilePrimary`)
  // becomes the headline so each card reads as a record rather than a list of fields.
  const cardCols = columns.filter((c) => !c.hideOnMobile);
  const primary = cardCols.find((c) => c.mobilePrimary) ?? cardCols[0];
  const restCols = cardCols.filter((c) => c !== primary);

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200/70 bg-surface shadow-soft">
      {/* ── Mobile: stacked cards ───────────────────────────────────────────
          A 640px-wide table forces horizontal scrolling on every phone, which
          makes rows very hard to scan. Below `lg` each row becomes a card. */}
      <ul className="divide-y divide-ink-200/60 lg:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'flex flex-col gap-2.5 px-4 py-3.5 transition-colors',
              onRowClick && 'cursor-pointer active:bg-brand-50/40',
            )}
          >
            {primary && <div className="min-w-0 text-ink-900">{primary.cell(row)}</div>}

            {restCols.length > 0 && (
              <dl className="flex flex-col gap-1.5">
                {restCols.map((c) => {
                  const label = labelFor(c);
                  return (
                    <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                      {label && (
                        <dt className="shrink-0 text-2xs font-semibold uppercase tracking-wider text-ink-500">
                          {label}
                        </dt>
                      )}
                      <dd className={cn('min-w-0 text-ink-700', label ? 'text-right' : 'w-full')}>
                        {c.cell(row)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </li>
        ))}
      </ul>

      {/* ── lg+: full table ─────────────────────────────────────────────── */}
      <div className="scroll-branded hidden overflow-x-auto lg:block">
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
                  onRowClick && 'cursor-pointer hover:bg-brand-50/40',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3 align-middle text-ink-700',
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
        <div className="flex flex-col gap-2 border-t border-ink-200/60 bg-ink-50/30 px-4 py-3 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
