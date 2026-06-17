'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable pagination control: Previous / page numbers (with ellipsis) / Next.
 * Renders nothing for a single page. Fully responsive — on small screens the
 * Prev/Next labels collapse to icons.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageList(currentPage, totalPages);

  const arrowClasses =
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 text-sm font-medium text-ink-700 transition-colors hover:border-maroon-800/40 hover:bg-maroon-50 hover:text-maroon-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200 disabled:hover:bg-white disabled:hover:text-ink-700 cursor-pointer';

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={arrowClasses}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ul className="flex items-center gap-1.5">
        {pages.map((p, i) =>
          p === '…' ? (
            <li
              key={`ellipsis-${i}`}
              className="px-1.5 text-sm text-ink-400 select-none"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors cursor-pointer',
                  p === currentPage
                    ? 'border-maroon-900 bg-maroon-900 text-ivory shadow-soft'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-maroon-800/40 hover:bg-maroon-50 hover:text-maroon-900',
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={arrowClasses}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

/** Build a compact page list: first, last, current ±1, with ellipses for gaps. */
function getPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');

  pages.push(total);
  return pages;
}
