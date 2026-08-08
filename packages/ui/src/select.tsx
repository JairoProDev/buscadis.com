'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './lib/cn';

/**
 * Radix Select for short lists (≤12 options recommended).
 * For longer lists, prefer a native <select> with the same visual tokens.
 */
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 w-full items-center justify-between gap-2 rounded-[var(--bs-radius-sm)] border border-[var(--bs-border-default)] bg-[var(--bs-bg-surface)] px-3 text-sm text-[var(--bs-fg-default)]',
      'focus-visible:outline-none focus-visible:shadow-[var(--bs-focus-ring)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[placeholder]:text-[var(--bs-fg-subtle)]',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 opacity-60 shrink-0" aria-hidden />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'z-[var(--bs-z-dropdown)] max-h-72 min-w-[8rem] overflow-hidden rounded-[var(--bs-radius-md)] border border-[var(--bs-border-default)] bg-[var(--bs-bg-surface)] text-[var(--bs-fg-default)] shadow-[var(--bs-elevation-3)]',
        position === 'popper' && 'data-[side=bottom]:translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-[var(--bs-radius-xs)] py-2 pl-8 pr-2 text-sm outline-none',
      'focus:bg-[var(--bs-action-subtle)] focus:text-[var(--bs-fg-default)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/** Native select with the same tokens — preferred when options.length > 12. */
export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-[var(--bs-radius-sm)] border bg-[var(--bs-bg-surface)] px-3 text-sm text-[var(--bs-fg-default)]',
        'focus-visible:outline-none focus-visible:shadow-[var(--bs-focus-ring)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-[var(--bs-danger-fg)]' : 'border-[var(--bs-border-default)]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
NativeSelect.displayName = 'NativeSelect';
