'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from './lib/cn';
import { IconButton } from './icon-button';
import { DialogOverlay, DialogPortal } from './dialog';

export type DrawerSide = 'left' | 'right' | 'bottom';

const sideClass: Record<DrawerSide, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-[420px] rounded-r-[var(--bs-radius-lg)] data-[state=open]:animate-slide-right',
  right:
    'inset-y-0 right-0 h-full w-full max-w-[420px] rounded-l-[var(--bs-radius-lg)] data-[state=open]:animate-slide-left',
  bottom:
    'inset-x-0 bottom-0 max-h-[92vh] w-full rounded-t-[var(--bs-radius-xl)] sm:max-w-[420px] sm:left-auto sm:right-0 sm:inset-y-0 sm:max-h-none sm:h-full sm:rounded-l-[var(--bs-radius-lg)] sm:rounded-tr-none',
};

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: DrawerSide;
  showClose?: boolean;
}

/**
 * Drawer: side panel on desktop (420px), bottom sheet on mobile when side=bottom.
 */
export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = 'right', showClose = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-[var(--bs-z-modal)] flex flex-col bg-[var(--bs-bg-surface)] text-[var(--bs-fg-default)] shadow-[var(--bs-elevation-4)]',
        'focus:outline-none',
        sideClass[side],
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
DrawerContent.displayName = 'DrawerContent';

export const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 px-6 pb-2 pt-6 pr-12', className)} {...props} />
);

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--bs-fg-muted)]', className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto px-6 py-3', className)} {...props} />
);

export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 px-6 pb-6 pt-2', className)} {...props} />
);
