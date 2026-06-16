'use client';

import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

/** Segmented filter tabs (used for status filters across list modules). */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1 rounded-xl bg-ink-100 p-1', className)}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              active
                ? 'bg-white text-maroon-900 shadow-sm'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-2xs font-semibold',
                  active ? 'bg-maroon-50 text-maroon-800' : 'bg-ink-200/70 text-ink-600',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
