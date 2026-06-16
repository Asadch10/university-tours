import { cn } from '@/lib/utils';

/** Consistent section header: eyebrow + title + optional description. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  variant = 'default',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'left';
  variant?: 'default' | 'light';
  className?: string;
}) {
  const light = variant === 'light';
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'mx-auto max-w-2xl text-center items-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow && (
        <span className={cn('eyebrow', light && 'text-gold-300')}>
          <span className={cn('h-px w-6', light ? 'bg-gold-300/60' : 'bg-maroon-800/40')} />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'font-display text-3xl font-semibold sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]',
          light ? 'text-ivory' : 'text-ink-900',
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn('text-base leading-relaxed sm:text-lg', light ? 'text-ivory/70' : 'text-ink-600')}>
          {description}
        </p>
      )}
    </div>
  );
}
