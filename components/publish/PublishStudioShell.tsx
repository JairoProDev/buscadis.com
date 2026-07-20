'use client';

import dynamic from 'next/dynamic';
import type { Adiso } from '@/types';

const PublishStudio = dynamic(() => import('./PublishStudio'), {
  loading: () => (
    <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Cargando Publish Studio…</div>
  ),
  ssr: false,
});

export type PublishStudioVariant = 'page' | 'modal' | 'sidebar';

interface PublishStudioShellProps {
  variant?: PublishStudioVariant;
  initialText?: string;
  initialImageUrl?: string | null;
  initialContacto?: string;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onPublished?: (adiso: Adiso) => void;
  onClose?: () => void;
}

export default function PublishStudioShell({
  variant = 'page',
  initialText,
  initialImageUrl,
  initialContacto,
  onNotify,
  onPublished,
  onClose,
}: PublishStudioShellProps) {
  const compact = variant === 'sidebar' || variant === 'modal';

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          aria-label="Cerrar"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg sm:max-w-xl max-h-[94vh] overflow-hidden bg-[var(--bg-primary)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
            <PublishStudio
              compact
              initialText={initialText}
              initialImageUrl={initialImageUrl}
              initialContacto={initialContacto}
              onNotify={onNotify}
              onPublished={onPublished}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="h-full flex flex-col min-h-0 relative overflow-hidden">
        <PublishStudio
          compact
          initialText={initialText}
          initialImageUrl={initialImageUrl}
          initialContacto={initialContacto}
          onNotify={onNotify}
          onPublished={onPublished}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full">
      <PublishStudio
        initialText={initialText}
        initialImageUrl={initialImageUrl}
        initialContacto={initialContacto}
        onNotify={onNotify}
        onPublished={onPublished}
      />
    </div>
  );
}
