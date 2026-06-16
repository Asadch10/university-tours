import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-300 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-maroon-900 text-ivory shadow-soft hover:bg-maroon-800 hover:shadow-lift hover:-translate-y-0.5',
        gold: 'bg-gold-sheen text-maroon-950 shadow-soft hover:shadow-glow hover:-translate-y-0.5',
        outline:
          'border border-maroon-900/20 bg-white/60 text-maroon-900 backdrop-blur hover:border-maroon-900/40 hover:bg-white',
        ghost: 'text-maroon-900 hover:bg-maroon-50',
        light:
          'bg-ivory text-maroon-900 shadow-soft hover:-translate-y-0.5 hover:shadow-lift',
        'outline-light':
          'border border-ivory/30 text-ivory hover:bg-ivory/10',
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
