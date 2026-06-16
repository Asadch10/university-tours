import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-maroon-900 text-ivory shadow-soft hover:bg-maroon-800 hover:shadow-lift',
        gold: 'bg-gold-sheen text-maroon-950 shadow-soft hover:shadow-glow',
        outline:
          'border border-ink-200 bg-white text-ink-800 hover:border-maroon-800/40 hover:bg-maroon-50/60',
        ghost: 'text-ink-700 hover:bg-ink-100',
        subtle: 'bg-maroon-50 text-maroon-900 hover:bg-maroon-100',
        danger: 'bg-danger text-white shadow-soft hover:brightness-95',
        'danger-outline': 'border border-danger/30 bg-white text-danger hover:bg-danger/5',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & { className?: string };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonBaseProps {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
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
