'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { IconCamera, IconStar, IconX } from '@/components/Icons';
import { publishLabel } from './publish-ui';

const ENHANCE_OPTIONS = [
  { id: 'remove_bg', label: 'Quitar fondo' },
  { id: 'upscale', label: 'Mejorar calidad' },
  { id: 'white_bg', label: 'Fondo blanco' },
] as const;

interface PublishPhotoZoneProps {
  images: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  onEnhance?: (url: string, action: string) => void;
  uploading?: boolean;
  maxImages?: number;
  allowEnhance?: boolean;
}

export default function PublishPhotoZone({
  images,
  onAdd,
  onRemove,
  onUpload,
  onEnhance,
  uploading = false,
  maxImages = 10,
  allowEnhance = true,
}: PublishPhotoZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [menuUrl, setMenuUrl] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (images.length >= maxImages) break;
      const url = await onUpload(file);
      if (url) onAdd(url);
    }
  };

  const runEnhance = async (url: string, action: string) => {
    if (!onEnhance) return;
    setEnhancing(true);
    setMenuUrl(null);
    const apiAction = action === 'white_bg' ? 'remove_bg' : action;
    try {
      await onEnhance(url, apiAction);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div>
      <label className={publishLabel}>Foto</label>
      <div
        className={`flex gap-2 mt-1.5 overflow-x-auto pb-1 ${dragOver ? 'ring-2 ring-[rgba(var(--brand-primary-rgb),0.4)] rounded-xl' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {images.map((url) => (
          <div
            key={url}
            className="relative shrink-0 w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-xl overflow-hidden ring-1 ring-[var(--border-color)] shadow-sm"
          >
            <Image src={url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center"
              aria-label="Quitar"
            >
              <IconX size={10} />
            </button>
            {allowEnhance && onEnhance && (
              <button
                type="button"
                onClick={() => setMenuUrl(menuUrl === url ? null : url)}
                disabled={enhancing}
                className="absolute bottom-1 left-1 right-1 py-0.5 rounded-md bg-[var(--brand-blue)]/90 text-white text-[9px] font-semibold flex items-center justify-center gap-0.5"
              >
                <IconStar size={8} /> Mejorar
              </button>
            )}
            {menuUrl === url && (
              <div className="absolute inset-0 z-10 bg-black/80 flex flex-col justify-center gap-1 p-1.5">
                {ENHANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => runEnhance(url, opt.id)}
                    className="text-[10px] text-white py-1 rounded-md bg-[var(--brand-blue)] font-medium"
                  >
                    {opt.label}
                  </button>
                ))}
                <button type="button" onClick={() => setMenuUrl(null)} className="text-[9px] text-white/70">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        ))}
        {uploading && (
          <div
            className="shrink-0 w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-xl bg-[var(--bg-secondary)] animate-pulse ring-1 ring-[var(--border-color)]"
            aria-label="Subiendo foto"
          />
        )}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-[rgba(var(--brand-primary-rgb),0.35)] bg-[rgba(var(--brand-primary-rgb),0.04)] flex flex-col items-center justify-center gap-0.5 text-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.08)] transition-colors disabled:opacity-50"
          >
            <IconCamera size={20} />
            <span className="text-[10px] font-semibold">{uploading ? 'Subiendo…' : 'Agregar'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxImages > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
