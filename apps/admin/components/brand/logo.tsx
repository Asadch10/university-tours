import { cn } from '@/lib/utils';

/** Collegiate crest mark + wordmark. `light` variant for dark (maroon) surfaces. */
export function Logo({
  variant = 'default',
  showWordmark = true,
  className,
}: {
  variant?: 'default' | 'light';
  showWordmark?: boolean;
  className?: string;
}) {
  const light = variant === 'light';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-xl',
          light ? 'bg-white/10 ring-1 ring-inset ring-white/20' : 'bg-maroon-gradient',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 2.5 4 5.5v6c0 4.5 3.4 8.3 8 9.9 4.6-1.6 8-5.4 8-9.9v-6L12 2.5Z"
            className={light ? 'fill-ivory/95' : 'fill-gold-300'}
          />
          <path d="M12 6.5 8 8v3.2c0 2.3 1.7 4.3 4 5.1 2.3-.8 4-2.8 4-5.1V8l-4-1.5Z" className="fill-maroon-900" />
          <path d="M9.5 10.5h5M12 8.7v6" stroke="#eccb72" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-[0.95rem] font-bold tracking-tight',
              light ? 'text-ivory' : 'text-ink-900',
            )}
          >
            UCPT
          </span>
          <span
            className={cn(
              'text-[0.6rem] font-semibold uppercase tracking-[0.16em]',
              light ? 'text-ivory/60' : 'text-maroon-700',
            )}
          >
            Admin
          </span>
        </span>
      )}
    </span>
  );
}
