'use client';

import { useState } from 'react';
import { IconSparkles } from '@/components/Icons';
import { PublishDraft } from '@/lib/publish/publish-draft-types';

interface PublishMagicEditorPanelProps {
  draft: PublishDraft;
  onFillAll: (data: Partial<PublishDraft>) => void;
  onEnhanceField: (field: 'titulo' | 'descripcion', value: string) => void;
}

export default function PublishMagicEditorPanel({
  draft,
  onFillAll,
  onEnhanceField,
}: PublishMagicEditorPanelProps) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingField, setLoadingField] = useState<'titulo' | 'descripcion' | null>(null);

  const analyzeMainImage = async () => {
    if (!draft.imagenes[0]) return;
    setLoading(true);
    try {
      const res = await fetch('/api/publish/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: [draft.imagenes[0]], text: draft.descripcion }),
      });
      const data = await res.json();
      if (data.draft) onFillAll(data.draft);
    } finally {
      setLoading(false);
    }
  };

  const enhanceField = async (field: 'titulo' | 'descripcion') => {
    const value = field === 'titulo' ? draft.titulo : draft.descripcion;
    if (!value?.trim()) return;
    setLoadingField(field);
    try {
      const res = await fetch('/api/catalog/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', field, text: value, title: draft.titulo, description: draft.descripcion }),
      });
      const json = await res.json();
      const enhanced = json.enhanced || json[field] || json.title || json.description;
      if (enhanced) onEnhanceField(field, enhanced);
    } finally {
      setLoadingField(null);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-white"
      >
        <span className="flex items-center gap-2 font-bold text-sm">
          <IconSparkles size={16} /> Editor Mágico
        </span>
        <span className="text-white/80">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase text-white/80 m-0 mb-2">Rellenar automáticamente</p>
            <button
              type="button"
              onClick={analyzeMainImage}
              disabled={loading || !draft.imagenes[0]}
              className="w-full py-2 rounded-lg bg-white/20 text-white text-xs font-bold disabled:opacity-50"
            >
              {loading ? 'Analizando…' : 'Analizar imagen principal'}
            </button>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase text-white/80 m-0 mb-2">Mejorar campos</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => enhanceField('titulo')}
                disabled={loadingField === 'titulo' || !draft.titulo}
                className="flex-1 py-2 rounded-lg bg-white/20 text-white text-[11px] font-bold disabled:opacity-50"
              >
                {loadingField === 'titulo' ? '…' : '✨ Mejorar título'}
              </button>
              <button
                type="button"
                onClick={() => enhanceField('descripcion')}
                disabled={loadingField === 'descripcion' || !draft.descripcion}
                className="flex-1 py-2 rounded-lg bg-white/20 text-white text-[11px] font-bold disabled:opacity-50"
              >
                {loadingField === 'descripcion' ? '…' : '✨ Mejorar descripción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
