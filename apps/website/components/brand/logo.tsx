import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand lockup: crest mark + wordmark. Uses /logo.svg (replace with your exact
 * PNG/SVG in /public to swap the mark). `variant` adapts colors for dark heroes.
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
      <span className="relative inline-flex h-11 w-[2.35rem] shrink-0 transition-transform duration-300 ease-premium group-hover:-translate-y-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
      </span>
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
