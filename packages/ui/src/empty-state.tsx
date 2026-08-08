import * as React from 'react';
import { cn } from './lib/cn';
import { Button, type ButtonProps } from './button';

export type EmptyStateVariant = 'first-run' | 'no-results' | 'error' | 'offline';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  variant?: EmptyStateVariant;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  variant = 'no-results',
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className
      )}
      data-variant={variant}
      {...props}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--bs-bg-sunken)] text-[var(--bs-fg-muted)]">
          {icon}
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="m-0 text-base font-semibold text-[var(--bs-fg-default)]">{title}</h3>
        {description && (
          <p className="m-0 text-sm text-[var(--bs-fg-muted)]">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant={action.variant ?? (variant === 'error' ? 'secondary' : 'primary')}
          size="md"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
