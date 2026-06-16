import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Accessible star rating. Decorative stars are aria-hidden; the value is announced via aria-label. */
export function StarRating({
  value,
  count,
  size = 16,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}
    >
      <span className="inline-flex" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(value);
          return (
            <Star
              key={i}
              size={size}
              className={cn(filled ? 'fill-gold-400 text-gold-400' : 'fill-ink-200 text-ink-200')}
            />
          );
        })}
      </span>
      <span className="text-sm font-semibold text-ink-900">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-sm text-ink-500">({count})</span>}
    </span>
  );
}
