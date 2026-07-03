'use client';

import dynamic from 'next/dynamic';

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
  onPublished?: () => void;
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
        <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden bg-[var(--bg-primary)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
      <div className="h-full flex flex-col p-3 overflow-hidden">
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
    <PublishStudio
      compact={compact}
      initialText={initialText}
      initialImageUrl={initialImageUrl}
      initialContacto={initialContacto}
      onNotify={onNotify}
      onPublished={onPublished}
    />
  );
}
