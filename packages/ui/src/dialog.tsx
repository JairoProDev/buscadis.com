'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from './lib/cn';
import { IconButton } from './icon-button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[var(--bs-z-overlay)] bg-[var(--bs-bg-overlay)]',
      'data-[state=open]:animate-fade-in',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export type ModalSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<ModalSize, string> = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[480px]',
  lg: 'sm:max-w-[640px]',
};

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Desktop centered max-width. Mobile always bottom sheet. */
  size?: ModalSize;
  showClose?: boolean;
}

/**
 * Responsive modal: centered on sm+, bottom sheet on mobile (max 92vh).
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = 'md', showClose = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-[var(--bs-z-modal)] flex w-full flex-col bg-[var(--bs-bg-surface)] text-[var(--bs-fg-default)] shadow-[var(--bs-elevation-4)]',
        'focus:outline-none',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 max-h-[92vh] rounded-t-[var(--bs-radius-xl)]',
        // Desktop: centered
        'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--bs-radius-lg)]',
        sizeClass[size],
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close asChild>
          <IconButton
            aria-label="Cerrar"
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3"
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 px-6 pb-2 pt-6 pr-12', className)} {...props} />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--bs-fg-muted)]', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-6 py-3', className)} {...props} />
);

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 px-6 pb-6 pt-2 sm:flex-row sm:justify-end',
      className
    )}
    {...props}
  />
);

/** Convenience alias matching product vocabulary. */
export {
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
  DialogBody as ModalBody,
  DialogFooter as ModalFooter,
  DialogTrigger as ModalTrigger,
  DialogClose as ModalClose,
};
