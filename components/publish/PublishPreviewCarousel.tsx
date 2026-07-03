'use client';

import { useState } from 'react';
import { PublishDraft, draftToAdisoPreview } from '@/lib/publish/publish-draft-types';
import { Adiso, Categoria } from '@/types';
import AdisoCard from '@/components/AdisoCard';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';

const PREVIEW_VIEWS = [
  { id: 'buscadis', label: 'Buscadis' },
  { id: 'story', label: 'Historia' },
  { id: 'panel', label: 'Panel' },
  { id: 'page', label: 'Página' },
  { id: 'chat', label: 'ADIS AI' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'web', label: 'Webs/Apps' },
] as const;

type PreviewId = (typeof PREVIEW_VIEWS)[number]['id'];

function buildMockAdiso(draft: PublishDraft): Adiso {
  const preview = draftToAdisoPreview(draft);
  const now = new Date();
  return {
    id: 'preview',
    categoria: preview.categoria,
    titulo: preview.titulo,
    descripcion: preview.descripcion,
    contacto: preview.contacto || '999999999',
    ubicacion: preview.ubicacion || 'Cusco',
    fechaPublicacion: now.toISOString().split('T')[0],
    horaPublicacion: now.toTimeString().slice(0, 5),
    imagenesUrls: preview.imagenesUrls,
    imagenUrl: preview.imagenUrl,
    precio: preview.precio,
    moneda: preview.moneda,
    tipoPrecio: preview.tipoPrecio,
    tamaño: 'mediano',
    estaActivo: true,
  };
}

function StoryFrame({ draft }: { draft: PublishDraft }) {
  const theme = getCategoriaThemeTokens((draft.categoria || 'productos') as Categoria);
  return (
    <div className="w-full aspect-[9/16] max-h-64 rounded-2xl overflow-hidden relative" style={{ background: theme.accent }}>
      {draft.imagenes[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.imagenes[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
      )}
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white font-bold text-sm m-0">{draft.titulo || 'Tu aviso'}</p>
        <p className="text-white/80 text-xs m-0 mt-1 line-clamp-2">{draft.descripcion}</p>
      </div>
    </div>
  );
}

function SocialFrame({ draft, network }: { draft: PublishDraft; network: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--brand-blue)]" />
        <div>
          <p className="text-xs font-bold m-0">Buscadis</p>
          <p className="text-[10px] text-gray-500 m-0">{network}</p>
        </div>
      </div>
      {draft.imagenes[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.imagenes[0]} alt="" className="w-full aspect-video object-cover" />
      )}
      <div className="p-3">
        <p className="font-bold text-sm m-0">{draft.titulo || 'Tu aviso'}</p>
        <p className="text-xs text-gray-600 m-0 mt-1 line-clamp-2">{draft.descripcion}</p>
      </div>
    </div>
  );
}

interface PublishPreviewCarouselProps {
  draft: PublishDraft;
}

export default function PublishPreviewCarousel({ draft }: PublishPreviewCarouselProps) {
  const [active, setActive] = useState<PreviewId>('buscadis');
  const mockAdiso = buildMockAdiso(draft);
  const idx = PREVIEW_VIEWS.findIndex((v) => v.id === active);

  const prev = () => setActive(PREVIEW_VIEWS[(idx - 1 + PREVIEW_VIEWS.length) % PREVIEW_VIEWS.length].id);
  const next = () => setActive(PREVIEW_VIEWS[(idx + 1) % PREVIEW_VIEWS.length].id);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
          Vista previa
        </label>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prev} className="w-7 h-7 rounded-lg border border-[var(--border-color)] text-sm">‹</button>
          <span className="text-xs font-medium px-2">{PREVIEW_VIEWS[idx]?.label}</span>
          <button type="button" onClick={next} className="w-7 h-7 rounded-lg border border-[var(--border-color)] text-sm">›</button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-[var(--bg-secondary)] min-h-[200px] overflow-hidden">
        {active === 'buscadis' && (
          <div className="max-w-[280px] mx-auto pointer-events-none">
            <AdisoCard adiso={mockAdiso} onClick={() => {}} vista="feed" />
          </div>
        )}
        {active === 'story' && <StoryFrame draft={draft} />}
        {active === 'panel' && (
          <div className="space-y-2 p-2">
            <p className="font-bold text-sm m-0">{draft.titulo || 'Tu aviso'}</p>
            <p className="text-xs text-[var(--text-secondary)] m-0 line-clamp-4">{draft.descripcion || 'Sin descripción'}</p>
            {draft.precio && <p className="text-sm font-bold text-[var(--brand-blue)] m-0">S/ {draft.precio}</p>}
          </div>
        )}
        {active === 'page' && (
          <div className="space-y-2">
            {draft.imagenes[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.imagenes[0]} alt="" className="w-full h-32 object-cover rounded-xl" />
            )}
            <h3 className="font-bold m-0">{draft.titulo || 'Tu aviso'}</h3>
            <p className="text-sm text-[var(--text-secondary)] m-0">{draft.descripcion}</p>
          </div>
        )}
        {active === 'chat' && (
          <div className="rounded-xl bg-[var(--bg-primary)] p-3 border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-tertiary)] m-0 mb-2">Encontré esto para ti:</p>
            <p className="font-bold text-sm m-0">{draft.titulo || 'Aviso'}</p>
            <p className="text-xs m-0 mt-1">{draft.descripcion?.slice(0, 80)}…</p>
          </div>
        )}
        {(active === 'facebook' || active === 'instagram') && (
          <SocialFrame draft={draft} network={active === 'facebook' ? 'Facebook' : 'Instagram'} />
        )}
        {active === 'web' && (
          <div className="rounded-lg border border-gray-200 p-2 bg-gray-50">
            <p className="text-[10px] text-green-700 m-0">buscadis.com › aviso</p>
            <p className="text-sm font-medium text-blue-700 m-0 mt-1">{draft.titulo || 'Tu aviso'}</p>
            <p className="text-xs text-gray-600 m-0">{draft.descripcion?.slice(0, 100)}</p>
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {PREVIEW_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v.id)}
            className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium ${
              active === v.id ? 'bg-[var(--brand-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
