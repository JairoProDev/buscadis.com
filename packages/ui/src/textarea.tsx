import * as React from 'react';
import { cn } from './lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[88px] w-full rounded-[var(--bs-radius-sm)] border bg-[var(--bs-bg-surface)] px-3 py-2.5 text-sm text-[var(--bs-fg-default)]',
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
Textarea.displayName = 'Textarea';
