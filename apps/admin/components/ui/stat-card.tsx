import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: { value: string; positive: boolean };
  hint?: string;
}) {
  return (
    <div className="group rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 font-display text-[1.75rem] font-bold leading-none text-ink-900">{value}</p>
      <div className="mt-3 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold',
              delta.positive ? 'text-success' : 'text-danger',
            )}
          >
            {delta.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
    </div>
  );
}
