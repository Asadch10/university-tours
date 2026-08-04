import Image from 'next/image';
import { cn } from '@/lib/utils';
import adminLogo from '@/public/admin-logo.png';

/** University crest mark + wordmark. `light` variant for dark (brand) surfaces. */
export function Logo({
  variant = 'default',
  showWordmark = true,
  className,
  size = 40,
}: {
  variant?: 'default' | 'light';
  showWordmark?: boolean;
  className?: string;
  /** Crest size in px (default 40). */
  size?: number;
}) {
  const light = variant === 'light';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {/* No tile or ring — admin-logo.png is transparent RGBA, so the crest sits directly
          on whatever surface it is placed on, in both themes. */}
      <span className="relative inline-flex shrink-0" style={{ height: size, width: size }}>
        <Image
          src={adminLogo}
          alt="Campus Private Tours"
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority
        />
      </span>
      {showWordmark && (
        // Full wordmark, matching the public site. Sized to stay on ONE line inside the
        // 15.5rem sidebar next to the crest — wrapping would overflow the h-14 brand row.
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className={cn(
              'whitespace-nowrap font-display text-[0.8rem] font-bold tracking-tight',
              light ? 'text-ivory' : 'text-ink-900',
            )}
          >
            Campus Private Tours
          </span>
          <span
            className={cn(
              'mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em]',
              light ? 'text-ivory/60' : 'text-brand-800',
            )}
          >
            Admin
          </span>
        </span>
      )}
    </span>
  );
}
