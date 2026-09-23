'use client';

import { useState } from 'react';
import { Categoria, UbicacionDetallada } from '@/types';
import { formatUbicacionCorta } from '@/lib/adiso-display';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { FlyerConfig } from '@/lib/flyer/types';
import {
  categoryAsksLocation,
  getPublishFieldsForCategory,
  getSubcategories,
  type PublishFieldDefinition,
} from '@/lib/publish/category-tree';
import { getCategoriaIcon, PUBLISH_CATEGORIAS } from '@/lib/categoria-icons';
import { IconLocation } from '@/components/Icons';

interface PublishListingPreviewProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | boolean | number) => void;
  flyerConfig?: FlyerConfig;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
}

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
  const [open, setOpen] = useState(false);
  if (field.type === 'chips' && field.options) {
    const current = field.options.find((option) => option.value === value)?.label;
    return (
      <div className="mt-2">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`text-left text-sm ${current ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            {current || field.label}
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {field.options.map((option) => {
              const selected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                    selected
                      ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
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

const fieldClass =
  'w-full bg-transparent outline-none placeholder:text-[var(--text-tertiary)]';

export default function PublishListingPreview({
  draft,
  onChange,
  onSetAtributo,
}: PublishListingPreviewProps) {
  const [open, setOpen] = useState<'categoria' | 'subcategoria' | null>(null);
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const extraFields = getPublishFieldsForCategory(draft.categoria, draft.subcategoria);
  const showLocation = categoryAsksLocation(
    draft.categoria,
    draft.subcategoria,
    Boolean(draft.atributos.productos_entrega),
  );
  const category = PUBLISH_CATEGORIAS.find((item) => item.value === draft.categoria);
  const CategoryIcon = draft.categoria ? getCategoriaIcon(draft.categoria) : null;
  const subLabel = subs.find((item) => item.id === draft.subcategoria)?.label;

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (open === 'categoria') {
              setOpen(subs.length > 0 && !draft.subcategoria ? 'subcategoria' : null);
              return;
            }
            setOpen('categoria');
          }}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]"
        >
          {CategoryIcon ? <CategoryIcon size={16} /> : null}
          {category?.label || 'Categoría'}
        </button>
        {subLabel && (
          <button
            type="button"
            onClick={() => setOpen(open === 'subcategoria' ? null : 'subcategoria')}
            className="text-sm text-[var(--text-secondary)]"
          >
            {subLabel}
          </button>
        )}
      </div>

      {open === 'categoria' && (
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PUBLISH_CATEGORIAS.map((item) => {
            const Icon = getCategoriaIcon(item.value);
            const active = draft.categoria === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  const nextSubs = getSubcategories(item.value);
                  onChange({
                    categoria: item.value as Categoria,
                    subcategoria: undefined,
                    subsubcategoria: undefined,
                  });
                  setOpen(nextSubs.length > 0 ? 'subcategoria' : null);
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border-color)] px-3 py-1.5 text-sm ${
                  active
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                }`}
              >
                <Icon size={15} color={active ? 'var(--bg-primary)' : 'var(--text-primary)'} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {open === 'subcategoria' && subs.length > 0 && (
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {subs.map((item) => {
            const active = draft.subcategoria === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange({ subcategoria: item.id, subsubcategoria: undefined });
                  setOpen(null);
                }}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                  active
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <input
        value={draft.titulo || ''}
        onChange={(event) => onChange({ titulo: event.target.value })}
        placeholder="Título"
        maxLength={120}
        aria-label="Título"
        className={`${fieldClass} mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)]`}
      />

      <input
        inputMode="decimal"
        value={draft.precio ?? ''}
        onChange={(event) =>
          onChange({
            precio: event.target.value ? Number(event.target.value) : undefined,
            tipoPrecio: 'fijo',
          })
        }
        placeholder={priceLabel(draft.precio) || 'Precio'}
        aria-label="Precio"
        className={`${fieldClass} mt-1 text-3xl font-black text-[var(--brand-blue)]`}
      />

      {showLocation && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <IconLocation size={16} color="var(--brand-blue)" />
          <input
            value={typeof draft.ubicacion === 'string' ? draft.ubicacion : locationLabel(draft.ubicacion)}
            onChange={(event) => onChange({ ubicacion: event.target.value })}
            placeholder="Ubicación"
            aria-label="Ubicación"
            className={`${fieldClass} min-w-0 flex-1 text-sm text-[var(--text-secondary)]`}
          />
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

      <textarea
        value={draft.descripcion || ''}
        onChange={(event) => onChange({ descripcion: event.target.value })}
        placeholder="Descripción"
        rows={4}
        maxLength={2000}
        aria-label="Descripción"
        className={`${fieldClass} mt-4 resize-none text-base leading-relaxed text-[var(--text-secondary)]`}
      />
    </div>
  );
}
