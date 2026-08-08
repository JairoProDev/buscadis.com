import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/cn';

const chipVariants = cva(
  [
    'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:shadow-[var(--bs-focus-ring)]',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      selected: {
        true: 'border-[var(--bs-action)] bg-[var(--bs-action-subtle)] text-[var(--bs-action)]',
        false:
          'border-[var(--bs-border-default)] bg-[var(--bs-bg-surface)] text-[var(--bs-fg-default)] hover:bg-[var(--bs-bg-surface-2)]',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  count?: number;
  icon?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, count, icon, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected ? true : undefined}
      className={cn(chipVariants({ selected }), className)}
      {...props}
    >
      {icon}
      {children}
      {count != null && (
        <span className="rounded-full bg-[var(--bs-bg-sunken)] px-1.5 text-xs tabular-nums text-[var(--bs-fg-muted)]">
          {count}
        </span>
      )}
    </button>
  )
);
Chip.displayName = 'Chip';

export { chipVariants };
