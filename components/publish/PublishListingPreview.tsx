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
import {
  IconBath,
  IconBed,
  IconBuilding,
  IconCoins,
  IconBicycle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconCogs,
  IconCouch,
  IconDoor,
  IconExchange,
  IconGas,
  IconGauge,
  IconGrad,
  IconKey,
  IconLaptop,
  IconLocation,
  IconPaw,
  IconRuler,
  IconShield,
  IconShirt,
  IconStore,
  IconVehiculos,
  IconTicket,
  IconTree,
  IconTruck,
  IconUser,
  IconUsers,
  IconUtensils,
  IconWeight,
  IconWifi,
} from '@/components/Icons';
import type { ComponentType } from 'react';

interface PublishListingPreviewProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | boolean | number) => void;
  flyerConfig?: FlyerConfig;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
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

const FIELD_ICONS: Array<[RegExp, ComponentType<{ size?: number; color?: string }>]> = [
  [/operacion/, IconKey],
  [/condicion/, IconCheck],
  [/modalidad/, IconLaptop],
  [/jornada/, IconClock],
  [/sueldo|tarifa|pago/, IconCoins],
  [/dormitorio/, IconBed],
  [/bano/, IconBath],
  [/area|frente|altura/, IconRuler],
  [/ambiente/, IconDoor],
  [/piso|pisos|edificio|unidad/, IconBuilding],
  [/amobl|mueble/, IconCouch],
  [/estacionamiento/, IconVehiculos],
  [/patio|jardin/, IconTree],
  [/servicio/, IconWifi],
  [/anio|fecha/, IconCalendar],
  [/km|kilomet/, IconGauge],
  [/combustible/, IconGas],
  [/transmision|traccion|cilindrada|cc/, IconCogs],
  [/asiento|cupo/, IconUsers],
  [/carga|camion/, IconTruck],
  [/peso/, IconWeight],
  [/hora/, IconClock],
  [/aro|bici/, IconBicycle],
  [/talla|ropa/, IconShirt],
  [/especie|mascota/, IconPaw],
  [/trueque|ofrece/, IconExchange],
  [/entrada|evento_tipo/, IconTicket],
  [/edad/, IconUser],
  [/garantia/, IconShield],
  [/perecible|alimento|cocina/, IconUtensils],
  [/materia|clase/, IconGrad],
  [/rubro/, IconStore],
  [/uso|zona|trabajo|esp|area_prof|prof/, IconStore],
];

function fieldIcon(field: PublishFieldDefinition) {
  const id = field.id.toLowerCase();
  const match = FIELD_ICONS.find(([pattern]) => pattern.test(id));
  return match?.[1] ?? IconCheck;
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
  const Icon = fieldIcon(field);
  if (field.type === 'chips' && field.options) {
    const current = field.options.find((option) => option.value === value)?.label;
    return (
      <div className="mt-2">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`inline-flex items-center gap-1.5 text-left text-sm ${current ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            <Icon size={16} color="var(--brand-blue)" />
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
        <Icon size={16} color="var(--brand-blue)" />
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }
  return (
    <label className="mt-3 flex items-center gap-1.5">
      <Icon size={16} color="var(--brand-blue)" />
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={field.label}
        aria-label={field.label}
        onChange={(event) =>
          onChange(field.type === 'number' ? Number(event.target.value) || 0 : event.target.value)
        }
        className="min-w-0 flex-1 bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
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

      <textarea
        value={draft.titulo || ''}
        onChange={(event) => onChange({ titulo: event.target.value })}
        placeholder="Título"
        maxLength={120}
        rows={2}
        aria-label="Título"
        className={`${fieldClass} mt-3 resize-none text-2xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)]`}
      />

      <div className="mt-1 flex items-center gap-2">
        <div className="flex shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--border-color)]">
          {(['PEN', 'USD'] as const).map((code) => {
            const active = (draft.moneda || 'PEN') === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onChange({ moneda: code, tipoPrecio: 'fijo' })}
                className={`px-2.5 py-1 text-sm font-black ${
                  active ? 'bg-[var(--brand-blue)] text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                {code === 'USD' ? '$' : 'S/'}
              </button>
            );
          })}
        </div>
        <input
          inputMode="decimal"
          value={draft.precio ?? ''}
          onChange={(event) =>
            onChange({
              precio: event.target.value ? Number(event.target.value) : undefined,
              tipoPrecio: 'fijo',
              moneda: draft.moneda || 'PEN',
            })
          }
          placeholder="Precio"
          aria-label="Precio"
          className={`${fieldClass} text-3xl font-black text-[var(--brand-blue)]`}
        />
      </div>

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
