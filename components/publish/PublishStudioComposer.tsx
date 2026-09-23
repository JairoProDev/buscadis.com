'use client';

import { useRef, useState } from 'react';
import { IconCamera, IconMegaphone, IconMicrophone } from '@/components/Icons';
import PublishMediaSheet from './PublishMediaSheet';

interface PublishStudioComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPublish: () => void;
  onUploadFiles: (files: FileList) => void;
  onVoice: () => void;
  galleryUrls: string[];
  uploadingImage?: boolean;
  publishing?: boolean;
  voiceActive?: boolean;
  paid?: boolean;
}

export default function PublishStudioComposer({
  value,
  onChange,
  onSubmit,
  onPublish,
  onUploadFiles,
  onVoice,
  galleryUrls,
  uploadingImage,
  publishing,
  voiceActive,
  paid = true,
}: PublishStudioComposerProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const hasText = value.trim().length > 0;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <form
        className="px-2 pt-1"
        onSubmit={(event) => {
          event.preventDefault();
          if (hasText) onSubmit();
          else onPublish();
        }}
      >
        <p className="m-0 mb-1.5 px-2 text-center text-[10px] leading-snug text-[var(--text-tertiary)]">
          {paid
            ? 'Escribe o dicta aquí. La IA solo si tocas «Rellenar con ADIS».'
            : 'Escribe el aviso y publícalo gratis.'}
        </p>
        <div className="flex min-w-0 flex-1 items-center rounded-full bg-[var(--bg-secondary)] pl-4 pr-1">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Escribe un mensaje"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            aria-label="Mensaje"
          />
          {paid && (
            <>
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                disabled={uploadingImage}
                className="flex h-10 w-10 items-center justify-center text-[var(--text-secondary)] disabled:opacity-40"
                aria-label="Fotos"
                title="Fotos"
              >
                <IconCamera size={20} />
              </button>
              <button
                type="button"
                onClick={onVoice}
                disabled={publishing}
                className={`flex h-10 w-10 items-center justify-center ${
                  voiceActive ? 'animate-pulse text-red-500' : 'text-[var(--text-secondary)]'
                }`}
                aria-label={voiceActive ? 'Detener dictado' : 'Dictar'}
                title={voiceActive ? 'Detener' : 'Dictar'}
              >
                <IconMicrophone size={18} />
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={publishing || Boolean(paid && uploadingImage)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--brand-blue)] disabled:opacity-40"
            aria-label={hasText ? 'Añadir texto al aviso' : 'Publicar'}
            title={hasText ? 'Añadir al aviso' : 'Publicar'}
          >
            <IconMegaphone size={18} color="var(--brand-blue)" />
          </button>
        </div>
      </form>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) onUploadFiles(files);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) onUploadFiles(files);
          e.target.value = '';
        }}
      />

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
