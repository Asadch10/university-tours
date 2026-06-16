import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold leading-none transition-colors',
  {
    variants: {
      variant: {
        maroon: 'bg-maroon-50 text-maroon-800 ring-1 ring-inset ring-maroon-900/10',
        gold: 'bg-gold-100 text-gold-800 ring-1 ring-inset ring-gold-600/20',
        verified: 'bg-verified/10 text-verified ring-1 ring-inset ring-verified/20',
        neutral: 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-300/40',
        light: 'bg-white/15 text-ivory ring-1 ring-inset ring-white/25 backdrop-blur',
      },
      size: {
        sm: 'px-2.5 py-1 text-2xs uppercase tracking-wider',
        md: 'px-3 py-1.5 text-xs',
      },
    },
    defaultVariants: { variant: 'maroon', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
