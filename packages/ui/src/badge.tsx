import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-[var(--bs-bg-sunken)] text-[var(--bs-fg-muted)]',
        accent: 'bg-[var(--bs-action-subtle)] text-[var(--bs-action)]',
        success: 'bg-[var(--bs-success-bg)] text-[var(--bs-success-fg)]',
        warning: 'bg-[var(--bs-warning-bg)] text-[var(--bs-warning-fg)]',
        danger: 'bg-[var(--bs-danger-bg)] text-[var(--bs-danger-fg)]',
        category: 'bg-[var(--bs-bg-sunken)] text-[var(--bs-fg-default)]',
      },
      size: {
        sm: 'h-5 px-2 text-[11px]',
        md: 'h-6 px-2.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}

export { badgeVariants };
