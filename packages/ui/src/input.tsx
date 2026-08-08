import * as React from 'react';
import { cn } from './lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[var(--bs-radius-sm)] border bg-[var(--bs-bg-surface)] px-3 text-sm text-[var(--bs-fg-default)]',
          'placeholder:text-[var(--bs-fg-subtle)]',
          'focus-visible:outline-none focus-visible:shadow-[var(--bs-focus-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-[var(--bs-danger-fg)]'
            : 'border-[var(--bs-border-default)]',
          className
        )}
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
