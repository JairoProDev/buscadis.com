'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCamera, IconImage, IconX } from '@/components/Icons';

interface PublishMediaSheetProps {
  open: boolean;
  onClose: () => void;
  galleryUrls: string[];
  uploading?: boolean;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onSelectExisting: (url: string) => void;
}

export default function PublishMediaSheet({
  open,
  onClose,
  galleryUrls,
  uploading,
  onPickCamera,
  onPickGallery,
  onSelectExisting,
}: PublishMediaSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[2100] bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fotos"
        className="fixed inset-x-0 bottom-0 z-[2101] rounded-t-2xl bg-[var(--bg-primary)] pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
          <p className="m-0 text-sm font-bold text-[var(--text-primary)]">Fotos</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)]"
            aria-label="Cerrar"
          >
            <IconX size={16} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-3">
          <button
            type="button"
            onClick={() => onPickCamera()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-[var(--bg-secondary)] px-3 py-3 text-left ring-1 ring-[var(--border-color)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-primary)] text-[var(--brand-blue)]">
              <IconCamera size={20} />
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Tomar foto</span>
          </button>

          {(galleryUrls.length > 0 || uploading) && (
            <div>
              <p className="m-0 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                En este aviso
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {uploading && (
                  <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-[var(--bg-secondary)] ring-1 ring-[var(--border-color)]" />
                )}
                {galleryUrls.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      onSelectExisting(url);
                      onClose();
                    }}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--border-color)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onPickGallery()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left ring-1 ring-[var(--border-color)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              <IconImage size={20} />
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Elegir de la galería</span>
            <span className="ml-auto text-[11px] text-[var(--text-tertiary)]">Varias fotos</span>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
