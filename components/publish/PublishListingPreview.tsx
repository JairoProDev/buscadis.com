'use client';

import { useState } from 'react';
import { Categoria } from '@/types';
import { getCategoriaLabel, formatUbicacionCorta } from '@/lib/adiso-display';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { IconLocation } from '@/components/Icons';

type EditableField = 'titulo' | 'precio' | 'ubicacion' | 'descripcion';

interface PublishListingPreviewProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onOpenForm?: () => void;
}

function priceLabel(precio?: number) {
  if (!precio || precio <= 0) return '';
  return `S/ ${precio.toLocaleString('es-PE')}`;
}

function locationLabel(ubicacion: PublishDraft['ubicacion']) {
  if (!ubicacion) return '';
  if (typeof ubicacion === 'string') return formatUbicacionCorta(ubicacion);
  return formatUbicacionCorta(ubicacion);
}

export default function PublishListingPreview({ draft, onChange, onOpenForm }: PublishListingPreviewProps) {
  const [field, setField] = useState<EditableField | null>(null);
  const category = draft.categoria ? getCategoriaLabel(draft.categoria as Categoria) : 'Aviso';
  const price = priceLabel(draft.precio);
  const location = locationLabel(draft.ubicacion);

  return (
    <div className="px-4 pb-6 pt-3">
      <button
        type="button"
        onClick={onOpenForm}
        className="rounded-full bg-[var(--bg-primary)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]"
      >
        {category}
      </button>

      {field === 'titulo' ? (
        <input
          autoFocus
          value={draft.titulo || ''}
          onChange={(event) => onChange({ titulo: event.target.value })}
          onBlur={() => setField(null)}
          placeholder="Título del aviso"
          maxLength={120}
          className="mt-2 w-full bg-transparent text-2xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          aria-label="Título"
        />
      ) : (
        <button
          type="button"
          onClick={() => setField('titulo')}
          className={`mt-2 block w-full text-left text-2xl font-extrabold leading-tight tracking-tight ${
            draft.titulo?.trim() ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
          }`}
        >
          {draft.titulo?.trim() || 'Toca para escribir el título'}
        </button>
      )}

      {field === 'precio' ? (
        <input
          autoFocus
          inputMode="decimal"
          value={draft.precio ?? ''}
          onChange={(event) =>
            onChange({
              precio: event.target.value ? Number(event.target.value) : undefined,
              tipoPrecio: 'fijo',
            })
          }
          onBlur={() => setField(null)}
          placeholder="Precio"
          className="mt-2 w-full bg-transparent text-3xl font-black text-[var(--brand-blue)] outline-none placeholder:text-[var(--text-tertiary)]"
          aria-label="Precio"
        />
      ) : (
        <button
          type="button"
          onClick={() => setField('precio')}
          className={`mt-2 block text-left text-3xl font-black ${
            price ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'
          }`}
        >
          {price || 'Toca para poner el precio'}
        </button>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
        <IconLocation size={16} color="var(--brand-blue)" />
        {field === 'ubicacion' ? (
          <input
            autoFocus
            value={typeof draft.ubicacion === 'string' ? draft.ubicacion : location}
            onChange={(event) => onChange({ ubicacion: event.target.value })}
            onBlur={() => setField(null)}
            placeholder="Distrito, ciudad"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]"
            aria-label="Ubicación"
          />
        ) : (
          <button type="button" onClick={() => setField('ubicacion')} className="text-left">
            {location || 'Toca para poner la zona'}
          </button>
        )}
      </div>

      <section className="mt-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
        <h2 className="m-0 mb-2 text-lg font-bold text-[var(--text-primary)]">Descripción</h2>
        {field === 'descripcion' ? (
          <textarea
            autoFocus
            value={draft.descripcion || ''}
            onChange={(event) => onChange({ descripcion: event.target.value })}
            onBlur={() => setField(null)}
            placeholder="Detalles, condiciones, horarios…"
            rows={4}
            maxLength={2000}
            className="w-full resize-none bg-transparent text-base leading-relaxed text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]"
            aria-label="Descripción"
          />
        ) : (
          <button
            type="button"
            onClick={() => setField('descripcion')}
            className={`block w-full whitespace-pre-wrap text-left text-base leading-relaxed ${
              draft.descripcion?.trim() ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            {draft.descripcion?.trim() || 'Toca para escribir la descripción'}
          </button>
        )}
      </section>
    </div>
  );
}
