import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand lockup: the crest badge at /logo.png + the "Campus Private Tours"
 * wordmark. `variant` adapts the wordmark colors for dark heroes.
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
      aria-label="Campus Private Tours — home"
      className={cn('group inline-flex items-center gap-3', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        className="h-12 w-12 shrink-0 object-contain transition-transform duration-300 ease-premium group-hover:-translate-y-0.5"
      />
      {showWordmark && (
        // Single-line wordmark in one colour. `ink-900` is the primary foreground token,
        // so this is white on the dark theme and near-black on the light theme — a
        // hard-coded white would disappear against the light theme's white header.
        <span
          className={cn(
            'font-display text-[1.05rem] font-bold leading-none tracking-tight',
            light ? 'text-ivory' : 'text-ink-900',
          )}
        >
          Campus Private Tours
        </span>
      )}
    </Link>
  );
}
