import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold leading-none ring-1 ring-inset',
  {
    variants: {
      variant: {
        maroon: 'bg-maroon-50 text-maroon-800 ring-maroon-900/10',
        gold: 'bg-gold-100 text-gold-800 ring-gold-600/20',
        verified: 'bg-verified/10 text-verified ring-verified/20',
        neutral: 'bg-ink-100 text-ink-700 ring-ink-300/40',
        success: 'bg-success/10 text-success ring-success/20',
        warning: 'bg-warn/10 text-warn ring-warn/25',
        danger: 'bg-danger/10 text-danger ring-danger/20',
        info: 'bg-info/10 text-info ring-info/20',
      },
      size: {
        sm: 'px-2.5 py-1 text-2xs uppercase tracking-wider',
        md: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Render a small leading dot. */
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { badgeVariants };
