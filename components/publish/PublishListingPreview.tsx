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

const CARD_COLORS = ['#53acc5', '#111827', '#b91c1c', '#166534', '#1d4ed8', '#c2410c', '#7c3aed'];

type Piece = 'categoria' | 'subcategoria' | 'titulo' | 'precio' | 'ubicacion' | 'descripcion' | `attr:${string}`;

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
  const [selected, setSelected] = useState<Piece | null>(null);
  const [scales, setScales] = useState<Partial<Record<Piece, number>>>({});
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const extraFields = getPublishFieldsForCategory(draft.categoria, draft.subcategoria);
  const showLocation = categoryAsksLocation(
    draft.categoria,
    draft.subcategoria,
    Boolean(draft.atributos.productos_entrega),
  );
  const price = priceLabel(draft.precio);
  const location = locationLabel(draft.ubicacion);
  const subLabel = subs.find((item) => item.id === draft.subcategoria)?.label;
  const categoryLabel = PUBLISH_CATEGORIAS.find((item) => item.value === draft.categoria)?.label;
  const CategoryIcon = draft.categoria ? getCategoriaIcon(draft.categoria) : null;

  const scaleOf = (piece: Piece) => scales[piece] ?? 1;
  const resize = (piece: Piece, delta: number) => {
    setScales((current) => {
      const next = Math.min(1.8, Math.max(0.75, (current[piece] ?? 1) + delta));
      return { ...current, [piece]: next };
    });
    if (piece === 'titulo') {
      const next = (scales.titulo ?? 1) + delta;
      onFlyer?.({ titleScale: next > 1.2 ? 'l' : next < 0.9 ? 's' : 'm' });
    }
  };

  const frame = (piece: Piece) =>
    selected === piece ? 'relative rounded-xl ring-2 ring-[var(--brand-blue)] ring-offset-2' : 'relative rounded-xl';

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSelected('categoria')} className={`${frame('categoria')} inline-flex items-center gap-1.5 px-2 py-1`}>
          {CategoryIcon ? <CategoryIcon size={16} /> : null}
          <span className="text-sm font-bold text-[var(--text-primary)]">{categoryLabel || 'Categoría'}</span>
          {selected === 'categoria' && <ResizeHandle onResize={(delta) => resize('categoria', delta)} />}
        </button>
        {draft.categoria && (
          <button type="button" onClick={() => setSelected('subcategoria')} className={`${frame('subcategoria')} px-2 py-1 text-sm font-semibold text-[var(--text-secondary)]`}>
            {subLabel || 'Subcategoría'}
            {selected === 'subcategoria' && <ResizeHandle onResize={(delta) => resize('subcategoria', delta)} />}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSelected('titulo')}
        className={`${frame('titulo')} mt-2 block w-full px-1 text-left font-extrabold leading-tight tracking-tight ${
          draft.titulo?.trim() ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
        }`}
        style={{ fontSize: `${1.5 * scaleOf('titulo')}rem`, color: flyerConfig?.primary }}
      >
        {draft.titulo?.trim() || 'Título'}
        {selected === 'titulo' && <ResizeHandle onResize={(delta) => resize('titulo', delta)} />}
      </button>

      <button
        type="button"
        onClick={() => setSelected('precio')}
        className={`${frame('precio')} mt-2 block px-1 text-left font-black ${
          price ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'
        }`}
        style={{ fontSize: `${1.85 * scaleOf('precio')}rem`, color: price ? flyerConfig?.primary || 'var(--brand-blue)' : undefined }}
      >
        {price || 'Precio'}
        {selected === 'precio' && <ResizeHandle onResize={(delta) => resize('precio', delta)} />}
      </button>

      {showLocation && (
        <button
          type="button"
          onClick={() => setSelected('ubicacion')}
          className={`${frame('ubicacion')} mt-3 flex w-full items-center gap-1.5 px-1 text-left text-sm text-[var(--text-secondary)]`}
          style={{ fontSize: `${0.9 * scaleOf('ubicacion')}rem` }}
        >
          <IconLocation size={16} color="var(--brand-blue)" />
          <span>{location || 'Ubicación'}</span>
          {selected === 'ubicacion' && <ResizeHandle onResize={(delta) => resize('ubicacion', delta)} />}
        </button>
      )}

      {extraFields.map((item) => {
        const raw = draft.atributos[item.id];
        const shown = item.type === 'toggle'
          ? (raw ? item.label : '')
          : item.options?.find((option) => option.value === raw)?.label || (raw ? String(raw) : '');
        const piece = `attr:${item.id}` as Piece;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(piece)}
            className={`${frame(piece)} mt-2 block w-full px-1 text-left text-sm ${shown ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            {shown || item.label}
            {selected === piece && <ResizeHandle onResize={(delta) => resize(piece, delta)} />}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => setSelected('descripcion')}
        className={`${frame('descripcion')} mt-4 block w-full whitespace-pre-wrap px-1 text-left leading-relaxed ${
          draft.descripcion?.trim() ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
        }`}
        style={{ fontSize: `${1 * scaleOf('descripcion')}rem` }}
      >
        {draft.descripcion?.trim() || 'Descripción'}
        {selected === 'descripcion' && <ResizeHandle onResize={(delta) => resize('descripcion', delta)} />}
      </button>

      {selected && (
        <aside className="fixed bottom-24 right-3 top-24 z-[80] flex w-44 flex-col gap-2 overflow-y-auto rounded-2xl bg-[var(--bg-primary)] p-3 shadow-xl ring-1 ring-[var(--border-color)]">
          <SideOptions
            selected={selected}
            draft={draft}
            subs={subs}
            extraFields={extraFields}
            flyerConfig={flyerConfig}
            onChange={onChange}
            onSetAtributo={onSetAtributo}
            onFlyer={onFlyer}
            onDetect={() => void detectLocation(onChange)}
          />
        </aside>
      )}
    </div>
  );
}

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  return (
    <span
      role="slider"
      aria-label="Redimensionar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
      className="absolute -bottom-1.5 -right-1.5 z-10 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-[var(--brand-blue)] bg-white"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.preventDefault();
        const start = event.clientY;
        let last = start;
        const move = (next: PointerEvent) => {
          onResize((last - next.clientY) / 80);
          last = next.clientY;
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
    />
  );
}

function SideOptions({
  selected,
  draft,
  subs,
  extraFields,
  flyerConfig,
  onChange,
  onSetAtributo,
  onFlyer,
  onDetect,
}: {
  selected: Piece;
  draft: PublishDraft;
  subs: ReturnType<typeof getSubcategories>;
  extraFields: PublishFieldDefinition[];
  flyerConfig?: FlyerConfig;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | boolean | number) => void;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
  onDetect: () => void;
}) {
  if (selected === 'categoria') {
    return (
      <div className="flex flex-col gap-1">
        {PUBLISH_CATEGORIAS.map((item) => {
          const Icon = getCategoriaIcon(item.value);
          const active = draft.categoria === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange({ categoria: item.value as Categoria, subcategoria: undefined, subsubcategoria: undefined })}
              className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold ${
                active ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-primary)]'
              }`}
            >
              <Icon size={16} color={active ? 'var(--bg-primary)' : 'var(--text-primary)'} />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (selected === 'subcategoria') {
    return (
      <div className="flex flex-col gap-1">
        {subs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange({ subcategoria: item.id, subsubcategoria: undefined })}
            className={`rounded-xl px-2 py-2 text-left text-sm font-semibold ${
              draft.subcategoria === item.id ? 'bg-[var(--brand-blue)] text-white' : 'text-[var(--text-primary)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }
  if (selected === 'titulo' || selected === 'descripcion' || selected === 'ubicacion' || selected === 'precio') {
    return (
      <div className="flex flex-col gap-2">
        {selected === 'titulo' && (
          <textarea
            value={draft.titulo || ''}
            onChange={(event) => onChange({ titulo: event.target.value })}
            placeholder="Título"
            rows={3}
            className="w-full resize-none rounded-xl bg-[var(--bg-secondary)] px-2 py-2 text-sm outline-none"
          />
        )}
        {selected === 'descripcion' && (
          <textarea
            value={draft.descripcion || ''}
            onChange={(event) => onChange({ descripcion: event.target.value })}
            placeholder="Descripción"
            rows={5}
            className="w-full resize-none rounded-xl bg-[var(--bg-secondary)] px-2 py-2 text-sm outline-none"
          />
        )}
        {selected === 'precio' && (
          <input
            inputMode="decimal"
            value={draft.precio ?? ''}
            onChange={(event) => onChange({ precio: event.target.value ? Number(event.target.value) : undefined, tipoPrecio: 'fijo' })}
            placeholder="Precio"
            className="w-full rounded-xl bg-[var(--bg-secondary)] px-2 py-2 text-sm outline-none"
          />
        )}
        {selected === 'ubicacion' && (
          <>
            <input
              value={typeof draft.ubicacion === 'string' ? draft.ubicacion : locationLabel(draft.ubicacion)}
              onChange={(event) => onChange({ ubicacion: event.target.value })}
              placeholder="Ubicación"
              className="w-full rounded-xl bg-[var(--bg-secondary)] px-2 py-2 text-sm outline-none"
            />
            <button type="button" onClick={onDetect} className="rounded-xl bg-[var(--brand-blue)] py-2 text-xs font-bold text-white">
              Detectar en el mapa
            </button>
          </>
        )}
        {(selected === 'titulo' || selected === 'precio') && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {CARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => onFlyer?.({ primary: color })}
                  className="h-6 w-6 rounded-full ring-1 ring-black/10"
                  style={{ background: color, outline: flyerConfig?.primary === color ? '2px solid var(--brand-blue)' : undefined }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onFlyer?.({ align: flyerConfig?.align === 'center' ? 'left' : 'center' })}
              className="rounded-lg py-1 text-left text-xs font-bold text-[var(--text-secondary)]"
            >
              {flyerConfig?.align === 'center' ? 'Centrado' : 'A la izquierda'}
            </button>
          </div>
        )}
      </div>
    );
  }
  const field = extraFields.find((item) => selected === `attr:${item.id}`);
  if (!field) return null;
  return (
    <AttributeField
      field={field}
      value={draft.atributos[field.id] as string | boolean | number | undefined}
      onChange={(value) => onSetAtributo(field.id, value)}
    />
  );
}
