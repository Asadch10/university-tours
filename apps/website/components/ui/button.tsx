import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/*
 * Dark-theme buttons.
 *
 * `disabled` uses explicit flat surface/text tokens rather than `opacity-50`: on a
 * near-black canvas a half-transparent brand fill turns muddy brown instead of
 * reading as inert, so the disabled state is painted rather than faded.
 *
 * `light` / `outline-light` stay deliberately light — they are the contrast anchors
 * on brand-filled CTA bands and photo overlays, and must not follow the canvas down.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:bg-none disabled:bg-surface-2 disabled:text-ink-300 disabled:shadow-none disabled:border-ink-200/70 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-maroon-gradient text-ivory shadow-soft hover:shadow-brand-glow hover:-translate-y-0.5 hover:brightness-110',
        gold: 'bg-gold-sheen text-maroon-950 shadow-soft hover:shadow-glow hover:-translate-y-0.5 hover:brightness-105',
        outline:
          'border border-brand/25 bg-surface-2/60 text-brand backdrop-blur hover:border-brand/50 hover:bg-surface-3 hover:text-ink-900',
        ghost: 'text-brand hover:bg-brand-tint hover:text-brand',
        light:
          'bg-ivory text-maroon-950 shadow-soft hover:-translate-y-0.5 hover:shadow-lift hover:bg-white',
        'outline-light':
          'border border-ivory/30 text-ivory hover:bg-ivory/10 hover:border-ivory/50',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-[3.25rem] px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & { className?: string };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonBaseProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    ButtonBaseProps {
  href: string;
}

export function ButtonLink({ className, variant, size, href, ...props }: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
