import Image from 'next/image';
import { cn } from '@/lib/utils';
import adminLogo from '@/public/admin-logo.png';

/** University crest mark + wordmark. `light` variant for dark (brand) surfaces. */
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
          'relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-inset',
          light ? 'ring-white/25' : 'ring-ink-200/70',
        )}
      >
        <Image
          src={adminLogo}
          alt="University Campus Private Tours"
          fill
          sizes="36px"
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
