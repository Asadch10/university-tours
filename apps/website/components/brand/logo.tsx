import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand lockup: the crest badge at /logo.png + the "University · Campus Private
 * Tours" wordmark. `variant` adapts the wordmark colors for dark heroes.
 */
export function Logo({
  variant = 'default',
  className,
  showWordmark = true,
}: {
  variant?: 'default' | 'light';
  className?: string;
  showWordmark?: boolean;
}) {
  const light = variant === 'light';
  return (
    <Link
      href="/"
      aria-label="University Campus Private Tours — home"
      className={cn('group inline-flex items-center gap-3', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        className="h-12 w-12 shrink-0 object-contain transition-transform duration-300 ease-premium group-hover:-translate-y-0.5"
      />
      {showWordmark && (
        <span className="flex flex-col gap-1 leading-none">
          <span
            className={cn(
              'font-display text-[1.05rem] font-bold tracking-tight',
              light ? 'text-ivory' : 'text-ink-900',
            )}
          >
            University
          </span>
          <span
            className={cn(
              'text-[0.6rem] font-semibold uppercase tracking-[0.2em]',
              light ? 'text-gold-300' : 'text-maroon-800',
            )}
          >
            Campus Private Tours
          </span>
        </span>
      )}
    </Link>
  );
}
