import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from './lib/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold',
    'rounded-[var(--bs-radius-md)] transition-colors',
    'focus-visible:outline-none focus-visible:shadow-[var(--bs-focus-ring)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'shrink-0 select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--bs-action)] text-[var(--bs-fg-on-action)] hover:bg-[var(--bs-action-hover)] active:bg-[var(--bs-action-active)]',
        secondary:
          'bg-[var(--bs-bg-surface)] text-[var(--bs-fg-default)] border border-[var(--bs-border-default)] hover:bg-[var(--bs-bg-surface-2)]',
        ghost:
          'bg-transparent text-[var(--bs-fg-default)] hover:bg-[var(--hover-bg,var(--bs-action-subtle))]',
        destructive:
          'bg-[var(--bs-danger-fg)] text-white hover:opacity-90',
        publish:
          'bg-[var(--bs-publish-bg)] text-[var(--bs-fg-on-warm)] shadow-[0_6px_18px_color-mix(in_srgb,var(--bs-publish-bg)_45%,transparent)] hover:brightness-95 active:brightness-90',
      },
      size: {
        sm: 'h-9 min-h-9 px-3 text-sm',
        md: 'h-11 min-h-11 px-4 text-sm',
        lg: 'h-[52px] min-h-[52px] px-5 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
