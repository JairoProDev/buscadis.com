'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCamera, IconMegaphone, IconMicrophone, IconSend } from '@/components/Icons';
import PublishMediaSheet from './PublishMediaSheet';
import { publishUi } from '@/lib/bs-tokens';

interface PublishStudioComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSendToAi: () => void;
  onPublish: () => void;
  onUploadFiles: (files: FileList) => void;
  onVoice: () => void;
  galleryUrls: string[];
  uploadingImage?: boolean;
  publishing?: boolean;
  aiWorking?: boolean;
  voiceActive?: boolean;
}

export default function PublishStudioComposer({
  value,
  onChange,
  onSendToAi,
  onPublish,
  onUploadFiles,
  onVoice,
  galleryUrls,
  uploadingImage,
  publishing,
  aiWorking,
  voiceActive,
}: PublishStudioComposerProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const hasText = value.trim().length > 0;
  const canSendToAi = hasText || galleryUrls.length > 0;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const fileInputs =
    portalReady && typeof document !== 'undefined'
      ? createPortal(
          <>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) onUploadFiles(files);
                e.target.value = '';
                setMediaOpen(false);
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) onUploadFiles(files);
                e.target.value = '';
                setMediaOpen(false);
              }}
            />
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {fileInputs}
      <div className="space-y-2 px-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-full bg-[var(--bg-secondary)] pl-4 pr-1">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Escribe tu aviso y la IA lo mejorará"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              aria-label="Mensaje para la IA"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && canSendToAi) {
                  event.preventDefault();
                  onSendToAi();
                }
              }}
            />
            <button
              type="button"
              onClick={() => setMediaOpen(true)}
              disabled={uploadingImage}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--text-secondary)] disabled:opacity-40"
              aria-label="Fotos"
              title="Fotos"
            >
              <IconCamera size={20} />
            </button>
            <button
              type="button"
              onClick={onVoice}
              disabled={publishing}
              className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                voiceActive ? 'animate-pulse text-red-500' : 'text-[var(--text-secondary)]'
              }`}
              aria-label={voiceActive ? 'Detener dictado' : 'Dictar'}
              title={voiceActive ? 'Detener' : 'Dictar'}
            >
              <IconMicrophone size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={onSendToAi}
            disabled={!canSendToAi || aiWorking || uploadingImage}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-md disabled:opacity-35"
            aria-label="Enviar a la IA"
            title="Enviar a la IA"
          >
            <IconSend size={17} color={publishUi.onDark} />
          </button>
        </div>

        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-blue)] text-sm font-bold text-white shadow-[0_8px_22px_-6px_rgba(var(--brand-primary-rgb),0.55)] transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          <IconMegaphone size={18} color={publishUi.onDark} />
          {publishing ? 'Publicando…' : 'Publicar aviso'}
        </button>
      </div>

      <PublishMediaSheet
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        galleryUrls={galleryUrls}
        uploading={uploadingImage}
        onPickCamera={() => cameraInputRef.current?.click()}
        onPickGallery={() => galleryInputRef.current?.click()}
        onSelectExisting={() => undefined}
      />
    </>
  );
}
