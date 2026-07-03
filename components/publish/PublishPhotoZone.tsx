'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { IconCamera, IconSparkles, IconX } from '@/components/Icons';

interface PublishPhotoZoneProps {
  images: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  onEnhance?: (url: string, action: string) => void;
  uploading?: boolean;
}

export default function PublishPhotoZone({
  images,
  onAdd,
  onRemove,
  onUpload,
  onEnhance,
  uploading = false,
}: PublishPhotoZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await onUpload(file);
      if (url) onAdd(url);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
        Fotos del aviso
      </label>
      <div
        className={`flex gap-2 overflow-x-auto pb-1 ${dragOver ? 'ring-2 ring-[var(--brand-blue)] rounded-xl' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {images.map((url) => (
          <div key={url} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden group border border-[var(--border-color)]">
            <Image src={url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              aria-label="Quitar"
            >
              <IconX size={12} />
            </button>
            {onEnhance && (
              <div className="absolute bottom-0 inset-x-0 flex gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition bg-black/50">
                <button
                  type="button"
                  onClick={() => onEnhance(url, 'remove_bg')}
                  className="flex-1 text-[9px] text-white py-0.5 rounded bg-purple-600/90 flex items-center justify-center gap-0.5"
                >
                  <IconSparkles size={8} /> Fondo
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition"
        >
          <IconCamera size={22} />
          <span className="text-[10px] font-medium">{uploading ? 'Subiendo…' : 'Agregar'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
