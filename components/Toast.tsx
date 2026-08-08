'use client';

import { ToastItemData, ToastViewport } from '@buscadis/ui';
import { Toast } from '@/hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

/** App toast stack — wraps @buscadis/ui ToastViewport. */
export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  const items: ToastItemData[] = toasts.map((t) => ({
    id: t.id,
    message: t.message,
    type: t.type,
    duration: t.duration,
  }));

  return <ToastViewport toasts={items} onRemove={removeToast} max={3} />;
}

/** @deprecated Use ToastItem from @buscadis/ui */
export { ToastItem as default } from '@buscadis/ui';
