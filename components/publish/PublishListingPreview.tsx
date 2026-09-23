'use client';

import { useState } from 'react';
import { Categoria, UbicacionDetallada } from '@/types';
import { formatUbicacionCorta } from '@/lib/adiso-display';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { FlyerConfig } from '@/lib/flyer/types';
import {
  PUBLISH_CATEGORIAS,
  categoryAsksLocation,
  getPublishFieldsForCategory,
  getSubcategories,
  type PublishFieldDefinition,
} from '@/lib/publish/category-tree';
import { IconLocation } from '@/components/Icons';

type EditableField = 'titulo' | 'precio' | 'ubicacion' | 'descripcion';

interface PublishListingPreviewProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | boolean | number) => void;
  flyerConfig?: FlyerConfig;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
}

const CARD_COLORS = ['#53acc5', '#111827', '#b91c1c', '#166534', '#1d4ed8', '#c2410c', '#7c3aed'];

function priceLabel(precio?: number) {
  if (!precio || precio <= 0) return '';
  return `S/ ${precio.toLocaleString('es-PE')}`;
}

function locationLabel(ubicacion: PublishDraft['ubicacion']) {
  if (!ubicacion) return '';
  if (typeof ubicacion === 'string') return formatUbicacionCorta(ubicacion);
  const place = formatUbicacionCorta(ubicacion);
  if (place) return place;
  if (ubicacion.latitud != null && ubicacion.longitud != null) return 'Punto en el mapa';
  return ubicacion.direccion || '';
}

async function detectLocation(onChange: (patch: Partial<PublishDraft>) => void) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const latitud = pos.coords.latitude;
    const longitud = pos.coords.longitude;
    const next: UbicacionDetallada = {
      pais: 'Perú',
      departamento: '',
      provincia: '',
      distrito: '',
      latitud,
      longitud,
    };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitud}&lon=${longitud}&accept-language=es`,
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        next.distrito = address.suburb || address.city_district || address.town || address.city || '';
        next.departamento = address.state || '';
        next.provincia = address.county || address.state_district || '';
        next.direccion = data.display_name || '';
      }
    } catch {
      /* las coordenadas bastan para el mapa */
    }
    onChange({ ubicacion: next });
  });
}

function AttributeField({
  field,
  value,
  onChange,
}: {
  field: PublishFieldDefinition;
  value: string | boolean | number | undefined;
  onChange: (value: string | boolean | number) => void;
}) {
  if (field.type === 'chips' && field.options) {
    return (
      <div className="mt-3">
        <p className="m-0 mb-1 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{field.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selected
                    ? 'bg-[var(--brand-blue)] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (field.type === 'toggle') {
    return (
      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-primary)]">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{field.label}</span>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={field.placeholder || field.label}
        onChange={(event) =>
          onChange(field.type === 'number' ? Number(event.target.value) || 0 : event.target.value)
        }
        className="w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
      />
    </label>
  );
}

export default function PublishListingPreview({
  draft,
  onChange,
  onSetAtributo,
  flyerConfig,
  onFlyer,
}: PublishListingPreviewProps) {
  const [field, setField] = useState<EditableField | null>(null);
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const extraFields = getPublishFieldsForCategory(draft.categoria, draft.subcategoria);
  const showLocation = categoryAsksLocation(
    draft.categoria,
    draft.subcategoria,
    Boolean(draft.atributos.productos_entrega),
  );
  const price = priceLabel(draft.precio);
  const location = locationLabel(draft.ubicacion);
  const selectClass =
    'rounded-full bg-[var(--bg-primary)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]';

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Categoría"
          value={draft.categoria || ''}
          onChange={(event) =>
            onChange({
              categoria: (event.target.value || undefined) as Categoria | undefined,
              subcategoria: undefined,
              subsubcategoria: undefined,
            })
          }
          className={selectClass}
        >
          <option value="">Categoría</option>
          {PUBLISH_CATEGORIAS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        {subs.length > 0 && (
          <select
            aria-label="Subcategoría"
            value={draft.subcategoria || ''}
            onChange={(event) => onChange({ subcategoria: event.target.value || undefined, subsubcategoria: undefined })}
            className={selectClass}
          >
            <option value="">Subcategoría</option>
            {subs.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        )}
      </div>

      {field === 'titulo' ? (
        <input
          autoFocus
          value={draft.titulo || ''}
          onChange={(event) => onChange({ titulo: event.target.value })}
          onBlur={() => setField(null)}
          placeholder="Título"
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
          {draft.titulo?.trim() || 'Título'}
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
          {price || 'Precio'}
        </button>
      )}

      {showLocation && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <IconLocation size={16} color="var(--brand-blue)" />
          {field === 'ubicacion' ? (
            <input
              autoFocus
              value={typeof draft.ubicacion === 'string' ? draft.ubicacion : location}
              onChange={(event) => onChange({ ubicacion: event.target.value })}
              onBlur={() => setField(null)}
              placeholder="Ubicación"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-tertiary)]"
              aria-label="Ubicación"
            />
          ) : (
            <button type="button" onClick={() => setField('ubicacion')} className="min-w-0 flex-1 text-left">
              {location || 'Ubicación'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void detectLocation(onChange)}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-[var(--brand-blue)]"
          >
            Detectar
          </button>
        </div>
      )}

      {extraFields.map((item) => (
        <AttributeField
          key={item.id}
          field={item}
          value={draft.atributos[item.id] as string | boolean | number | undefined}
          onChange={(value) => onSetAtributo(item.id, value)}
        />
      ))}

      <div className="mt-4">
        {field === 'descripcion' ? (
          <textarea
            autoFocus
            value={draft.descripcion || ''}
            onChange={(event) => onChange({ descripcion: event.target.value })}
            onBlur={() => setField(null)}
            placeholder="Descripción"
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
            {draft.descripcion?.trim() || 'Descripción'}
          </button>
        )}
      </div>

      {onFlyer && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {CARD_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => onFlyer({ primary: color })}
              className="h-6 w-6 rounded-full ring-1 ring-black/10"
              style={{ background: color, outline: flyerConfig?.primary === color ? '2px solid var(--brand-blue)' : undefined }}
            />
          ))}
          {(['s', 'm', 'l'] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onFlyer({ titleScale: size })}
              className={`rounded-full px-2 py-1 text-xs font-bold ${
                flyerConfig?.titleScale === size ? 'bg-[var(--brand-blue)] text-white' : 'text-[var(--text-secondary)]'
              }`}
            >
              {size === 's' ? 'A−' : size === 'm' ? 'A' : 'A+'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFlyer({ align: flyerConfig?.align === 'center' ? 'left' : 'center' })}
            className="rounded-full px-2 py-1 text-xs font-bold text-[var(--text-secondary)]"
          >
            {flyerConfig?.align === 'center' ? 'Centro' : 'Izquierda'}
          </button>
        </div>
      )}
    </div>
  );
}
