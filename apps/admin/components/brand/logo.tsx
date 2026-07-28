import Image from 'next/image';
import { cn } from '@/lib/utils';
import adminLogo from '@/public/admin-logo.png';

/** University crest mark + wordmark. `light` variant for dark (brand) surfaces. */
export function Logo({
  variant = 'default',
  showWordmark = true,
  className,
  size = 36,
}: {
  variant?: 'default' | 'light';
  showWordmark?: boolean;
  className?: string;
  /** Crest size in px (default 36). */
  size?: number;
}) {
  const light = variant === 'light';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-inset',
          light ? 'ring-white/25' : 'ring-ink-200/70',
        )}
        style={{ height: size, width: size }}
      >
        <Image
          src={adminLogo}
          alt="University Campus Private Tours"
          fill
          sizes={`${size}px`}
          className="object-contain p-0.5"
          priority
        />
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
              light ? 'text-ivory/60' : 'text-brand-700',
            )}
          >
            Admin
          </span>
        </span>
      )}
    </span>
  );
}
