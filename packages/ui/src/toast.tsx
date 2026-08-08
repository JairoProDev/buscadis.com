'use client';

import * as React from 'react';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { cn } from './lib/cn';
import { IconButton } from './icon-button';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastItemData {
  id: string;
  message: string;
  type: ToastTone;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

const TONE: Record<
  ToastTone,
  { border: string; icon: React.ReactNode; live: 'polite' | 'assertive' }
> = {
  success: {
    border: 'border-[var(--bs-success-fg)]',
    icon: <Check className="size-5 text-[var(--bs-success-fg)]" aria-hidden />,
    live: 'polite',
  },
  error: {
    border: 'border-[var(--bs-danger-fg)]',
    icon: <X className="size-5 text-[var(--bs-danger-fg)]" aria-hidden />,
    live: 'assertive',
  },
  warning: {
    border: 'border-[var(--bs-warning-fg)]',
    icon: <AlertTriangle className="size-5 text-[var(--bs-warning-fg)]" aria-hidden />,
    live: 'polite',
  },
  info: {
    border: 'border-[var(--bs-action)]',
    icon: <Info className="size-5 text-[var(--bs-action)]" aria-hidden />,
    live: 'polite',
  },
};

export interface ToastItemProps {
  toast: ToastItemData;
  onClose: () => void;
}

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const [visible, setVisible] = React.useState(false);
  const tone = TONE[toast.type];
  const duration = toast.duration ?? (toast.onAction ? 8000 : 5000);

  React.useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onClose, 280);
    }, duration);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(timer);
    };
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      aria-live={tone.live}
      aria-atomic="true"
      className={cn(
        'pointer-events-auto flex max-w-[400px] items-center gap-3 rounded-[var(--bs-radius-sm)] border-2 bg-[var(--bs-bg-surface)] px-4 py-3 shadow-[var(--bs-elevation-3)] transition-all duration-[var(--bs-dur-normal)]',
        tone.border,
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 sm:translate-x-4 sm:translate-y-0'
      )}
    >
      {tone.icon}
      <span className="flex-1 text-sm text-[var(--bs-fg-default)]">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          className="text-sm font-semibold text-[var(--bs-action)] underline"
          onClick={() => {
            toast.onAction?.();
            onClose();
          }}
        >
          {toast.actionLabel}
        </button>
      )}
      <IconButton
        aria-label="Cerrar notificación"
        variant="ghost"
        size="sm"
        className="!h-8 !w-8 !min-h-8 !min-w-8"
        onClick={() => {
          setVisible(false);
          window.setTimeout(onClose, 280);
        }}
      >
        <X className="size-3.5" aria-hidden />
      </IconButton>
    </div>
  );
}

export interface ToastViewportProps {
  toasts: ToastItemData[];
  onRemove: (id: string) => void;
  /** Max visible toasts (default 3). */
  max?: number;
}

/** Fixed stack — bottom center on mobile, bottom-right on desktop. Clears nav. */
export function ToastViewport({ toasts, onRemove, max = 3 }: ToastViewportProps) {
  const visible = toasts.slice(-max);
  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[var(--bs-z-toast)] flex flex-col gap-2',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 items-stretch',
        'sm:bottom-4 sm:left-auto sm:right-4 sm:items-end'
      )}
    >
      {visible.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}
