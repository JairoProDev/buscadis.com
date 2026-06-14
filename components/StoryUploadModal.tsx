'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Categoria, StoryPromotionTier, STORY_TIERS } from '@/types';
import { getCategoriaLabel } from '@/lib/adiso-display';
import { IconClose, IconImage, IconVideo } from '@/components/Icons';

interface StoryUploadModalProps {
  onClose: () => void;
  onPublished: () => void;
}

const CATEGORIAS: Categoria[] = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad',
];

export default function StoryUploadModal({ onClose, onPublished }: StoryUploadModalProps) {
  const { user, session } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [categoria, setCategoria] = useState<Categoria | ''>('');
  const [tier, setTier] = useState<StoryPromotionTier>('gratis');
  const [publishing, setPublishing] = useState(false);

  const handleFileSelected = (selected: File | null | undefined) => {
    if (!selected) return;

    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      toastError('Selecciona una imagen o un video.');
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      toastError('El archivo es muy grande. Usa uno menor a 25 MB.');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handlePublish = async () => {
    if (!user?.id || !file) return;

    const token = session?.access_token;
    if (!token) {
      toastError('Inicia sesión para publicar tu historia.');
      return;
    }

    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption.trim());
      if (categoria) formData.append('categoria', categoria);
      formData.append('tier', tier);

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        toastError(data.error || 'No se pudo publicar la historia.');
        return;
      }

      success('¡Historia publicada!');
      onPublished();
    } catch {
      toastError('Error al publicar la historia.');
    } finally {
      setPublishing(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10002] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nueva historia</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--text-secondary)]">
            <IconClose size={18} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="relative w-full aspect-[9/16] max-h-[320px] mx-auto rounded-xl overflow-hidden bg-black mb-4">
            {file?.type.startsWith('video/') ? (
              <video src={previewUrl} className="w-full h-full object-contain" controls />
            ) : (
              <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 text-xs font-medium px-3 py-1.5 rounded-full bg-black/60 text-white"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[9/16] max-h-[320px] mx-auto rounded-xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] mb-4"
          >
            <div className="flex gap-3">
              <IconImage size={28} />
              <IconVideo size={28} />
            </div>
            <span className="text-sm">Toca para elegir foto o video</span>
          </button>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escribe un texto (opcional)…"
          maxLength={150}
          rows={2}
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 text-sm mb-3 resize-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]"
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria | '')}
          className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 text-sm mb-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]"
        >
          <option value="">Sin categoría</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>{getCategoriaLabel(cat)}</option>
          ))}
        </select>

        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Visibilidad</p>
        <div className="grid grid-cols-1 gap-2 mb-5">
          {(Object.keys(STORY_TIERS) as StoryPromotionTier[]).map((tierId) => {
            const info = STORY_TIERS[tierId];
            const selected = tier === tierId;
            return (
              <button
                key={tierId}
                type="button"
                onClick={() => setTier(tierId)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)]'
                    : 'border-[var(--border-color)]'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{info.nombre}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{info.descripcion}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--brand-blue)] flex-shrink-0">
                  {info.precio === 0 ? 'Gratis' : `S/ ${info.precio}`}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={!file || publishing}
          className="w-full py-3 rounded-full bg-[var(--brand-blue)] text-white font-semibold disabled:opacity-50 disabled:pointer-events-none transition-opacity"
        >
          {publishing ? 'Publicando…' : 'Publicar historia'}
        </button>
      </div>
    </div>,
    document.body
  );
}
