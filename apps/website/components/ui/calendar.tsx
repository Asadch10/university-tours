'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Month-grid date picker used by the homepage hero and the guide search bar.
 *
 * Deliberately not a native `<input type="date">`: the native control renders
 * inconsistently across browsers, only opens from its small indicator glyph, and can't
 * disable past dates — all three matter for a booking search.
 *
 * Values are plain `YYYY-MM-DD` strings parsed at local midnight, so a booking date never
 * shifts a day from a UTC round-trip.
 */

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Build a `YYYY-MM-DD` string (month is 0-indexed, matching Date). */
export function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** "Aug 15, 2026" for display; empty string passes through. */
export function formatDate(value: string) {
  if (!value) return '';
  const d = new Date(value + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Calendar({
  value,
  onSelect,
  className,
}: {
  value: string;
  onSelect: (v: string) => void;
  className?: string;
}) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [view, setView] = useState(() => {
    const base = value ? new Date(value + 'T00:00:00') : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Never let the user page back past the current month — every day there is unbookable.
  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      className={cn(
        'w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-ink-200/80 bg-surface p-5 shadow-lift',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setView(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
            canGoPrev ? 'text-brand hover:bg-ink-50' : 'cursor-not-allowed text-ink-300',
          )}
        >
          <ChevronLeft size={20} />
        </button>
        <p className="font-display text-lg font-bold text-ink-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand transition-colors hover:bg-ink-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day-of-week */}
      <div className="mt-4 grid grid-cols-7 text-center">
        {DOW.map((d) => (
          <span key={d} className="text-sm font-medium text-ink-500">
            {d}
          </span>
        ))}
      </div>

      {/* Days */}
      <div className="mt-2 grid grid-cols-7 gap-y-1.5 text-center">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = iso(year, month, day);
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const isSelected = value === dateStr;
          return (
            <div key={day} className="flex justify-center">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onSelect(dateStr)}
                aria-current={isToday ? 'date' : undefined}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                  isPast && 'cursor-not-allowed text-ink-300 line-through',
                  !isPast && !isSelected && 'text-ink-900 hover:bg-ink-100',
                  isSelected && 'bg-maroon-900 font-semibold text-white',
                  isToday && !isSelected && 'font-bold underline',
                )}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
