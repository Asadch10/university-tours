'use client';

/**
 * Data-driven progress timeline for the listing lifecycle.
 *
 * The UI renders whatever `steps` array it is given — nothing about the stages
 * is hardcoded in the markup. Today the steps are computed locally by
 * `reviewStepsFor()`; to make this fully dynamic later, have the backend return
 * the same `ProgressStep[]` shape (e.g. from listing events / audit log) and
 * pass it straight in. Extra stages (identity check, photo review, …) will
 * render without any UI changes.
 */

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'done' | 'active' | 'pending';

export interface ProgressStep {
  /** Stable id — safe to use as a React key and for analytics. */
  key: string;
  label: string;
  state: StepState;
  /** Small line under the label: a date, an ETA, a note. */
  hint?: string;
}

export type ProgressTone = 'gold' | 'emerald' | 'red';

const TONE = {
  gold: { dot: 'bg-gold-500 text-maroon-950', ring: 'ring-gold-600', pulse: 'bg-gold-600', line: 'bg-gold-500' },
  emerald: { dot: 'bg-verified-solid text-white', ring: 'ring-verified-solid', pulse: 'bg-verified-solid', line: 'bg-emerald-400' },
  red: { dot: 'bg-danger-solid text-white', ring: 'ring-danger-solid', pulse: 'bg-danger-solid', line: 'bg-red-400' },
} as const;

/** How complete the journey is, 0–1 (active steps count as half). */
export function progressRatio(steps: ProgressStep[]): number {
  if (!steps.length) return 0;
  const score = steps.reduce((s, step) => s + (step.state === 'done' ? 1 : step.state === 'active' ? 0.5 : 0), 0);
  return score / steps.length;
}

export function ListingProgress({
  steps,
  tone = 'gold',
  className,
}: {
  steps: ProgressStep[];
  tone?: ProgressTone;
  className?: string;
}) {
  const t = TONE[tone];

  return (
    <ol className={cn('flex flex-col gap-0 sm:flex-row sm:items-start', className)}>
      {steps.map((s, i) => {
        const next = steps[i + 1];
        const lineLit = s.state === 'done' && next && next.state !== 'pending';
        return (
          <li key={s.key} className="relative flex flex-1 gap-3 pb-5 last:pb-0 sm:flex-col sm:gap-2 sm:pb-0">
            {/* Connector to the next step (vertical on mobile, horizontal on sm+) */}
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'absolute left-[9px] top-6 h-[calc(100%-1.25rem)] w-0.5 sm:left-[calc(50%+14px)] sm:right-0 sm:top-[9px] sm:h-0.5 sm:w-[calc(100%-28px)]',
                  lineLit ? t.line : 'bg-ink-200',
                )}
                aria-hidden
              />
            )}

            {/* Node */}
            <span
              className={cn(
                'relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full sm:mx-auto',
                s.state === 'done' && t.dot,
                s.state === 'active' && cn('bg-surface ring-2', t.ring),
                s.state === 'pending' && 'bg-ink-200',
              )}
            >
              {s.state === 'done' && <CheckCircle2 size={12} />}
              {s.state === 'active' && (
                <span className={cn('h-2 w-2 animate-pulse rounded-full motion-reduce:animate-none', t.pulse)} />
              )}
            </span>

            {/* Label + hint */}
            <span className="min-w-0 sm:text-center">
              <span
                className={cn(
                  'block text-sm font-semibold',
                  s.state === 'pending' ? 'text-ink-400' : 'text-ink-900',
                )}
              >
                {s.label}
              </span>
              {s.hint && <span className="mt-0.5 block text-xs text-ink-500">{s.hint}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Today's local step builder ──────────────────────────────────────────
   Swap this for an API response later: the backend can return ProgressStep[]
   built from real listing events, and the component above needs no changes. */

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : undefined;

export function reviewStepsFor(listing: {
  status?: string;
  submittedAt?: string;
  publishedAt?: string;
}): ProgressStep[] {
  const published = listing.status === 'published';
  return [
    { key: 'submitted', label: 'Submitted', state: 'done', hint: fmtDate(listing.submittedAt) },
    published
      ? { key: 'review', label: 'In review', state: 'done', hint: 'Approved' }
      : { key: 'review', label: 'In review', state: 'active', hint: 'Up to 48 hours' },
    published
      ? { key: 'published', label: 'Published', state: 'done', hint: fmtDate(listing.publishedAt) ?? 'Live now' }
      : { key: 'published', label: 'Published', state: 'pending' },
  ];
}
