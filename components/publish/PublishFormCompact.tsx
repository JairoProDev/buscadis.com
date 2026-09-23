'use client';

import { useState, type ReactNode } from 'react';
import { Categoria, UbicacionDetallada } from '@/types';
import { formatUbicacionCorta } from '@/lib/adiso-display';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { PUBLISH_CATEGORIAS, getSubcategories, getSubsubcategories } from '@/lib/publish/category-tree';
import { getCategoriaIcon } from '@/lib/categoria-icons';
import { IconChevronDown, IconImage, IconStar } from '@/components/Icons';
import PublishFormAdvanced from './PublishFormAdvanced';
import { publishInput, publishInputAiFilled, publishLabel } from './publish-ui';

interface PublishFormCompactProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | string[] | boolean | number) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  autoDownload?: boolean;
  onAutoDownloadChange?: (value: boolean) => void;
  onEnhanceField: (field: 'titulo' | 'descripcion') => void;
  enhancingField?: 'titulo' | 'descripcion' | null;
  analyzing?: boolean;
  photoUrl?: string;
  onAddPhoto?: () => void;
}

function locationText(ubicacion: PublishDraft['ubicacion']) {
  if (!ubicacion) return '';
  if (typeof ubicacion === 'string') return ubicacion;
  return formatUbicacionCorta(ubicacion) || ubicacion.direccion || '';
}

async function detectLocation(onChange: (patch: Partial<PublishDraft>) => void) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const next: UbicacionDetallada = {
      pais: 'Perú',
      departamento: '',
      provincia: '',
      distrito: '',
      latitud: pos.coords.latitude,
      longitud: pos.coords.longitude,
    };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${next.latitud}&lon=${next.longitud}&accept-language=es`,
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

function FloatingHint({ text, up, active }: { text: string; up: boolean; active: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute left-3 z-10 px-1 transition-all ${
        up ? 'bg-[var(--bg-secondary)]' : 'bg-transparent'
      } ${
        up
          ? '-top-2 text-[10px] font-bold uppercase tracking-wider'
          : 'top-3.5 text-sm font-medium'
      } ${active || up ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'}`}
    >
      {text}
    </span>
  );
}

function PrettyField({
  label,
  hint,
  value,
  onChange,
  multiline,
  rows = 3,
  maxLength,
  inputMode,
  ai,
  trailing,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  inputMode?: 'text' | 'decimal' | 'tel';
  ai?: string;
  trailing?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const up = focused || value.trim().length > 0;
  const className = `${publishInput} mt-0 ${multiline ? 'min-h-[88px] resize-none pt-4' : 'h-[52px]'} ${trailing ? 'pr-12' : ''} ${ai || ''}`;
  return (
    <div className="relative">
      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          maxLength={maxLength}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={className}
        />
      ) : (
        <input
          value={value}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={className}
        />
      )}
      <FloatingHint text={up ? label : hint} up={up} active={focused} />
      {trailing}
    </div>
  );
}

export default function PublishFormCompact({
  draft,
  onChange,
  onSetAtributo,
  showAdvanced,
  onToggleAdvanced,
  autoDownload = true,
  onAutoDownloadChange,
  onEnhanceField,
  enhancingField,
  analyzing = false,
  photoUrl,
  onAddPhoto,
}: PublishFormCompactProps) {
  const [picking, setPicking] = useState<'categoria' | 'subcategoria' | null>(null);
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const subsubs = draft.categoria && draft.subcategoria
    ? getSubsubcategories(draft.categoria, draft.subcategoria)
    : [];
  const category = PUBLISH_CATEGORIAS.find((item) => item.value === draft.categoria);
  const CategoryIcon = draft.categoria ? getCategoriaIcon(draft.categoria) : null;
  const subLabel = subs.find((item) => item.id === draft.subcategoria)?.label;

  const aiClass = (field: string) =>
    draft.aiConfidence[field] ? publishInputAiFilled : analyzing ? 'animate-pulse' : '';

  return (
    <div className="space-y-4 px-1">
      {analyzing && (
        <div className="rounded-xl px-3 py-2.5 text-xs text-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)] animate-pulse">
          ADIS está extrayendo título, descripción y datos de tu foto…
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPicking(picking === 'categoria' ? null : 'categoria')}
          className={`${publishInput} mt-0 flex h-[52px] items-center gap-2 text-left`}
        >
          {CategoryIcon ? <CategoryIcon size={16} color="var(--brand-blue)" /> : null}
          <span className="text-[var(--text-primary)]">{category ? category.label : ''}</span>
        </button>
        <FloatingHint
          text={category || picking === 'categoria' ? 'Categoría' : 'Elige una categoría'}
          up={Boolean(category) || picking === 'categoria'}
          active={picking === 'categoria'}
        />
      </div>
      {picking === 'categoria' && (
        <div className="flex flex-wrap gap-2">
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
                  setPicking(nextSubs.length > 0 ? 'subcategoria' : null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                }`}
              >
                <Icon size={15} color={active ? 'var(--brand-blue)' : 'var(--text-secondary)'} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {draft.categoria && subs.length > 0 && (
        <>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPicking(picking === 'subcategoria' ? null : 'subcategoria')}
              className={`${publishInput} mt-0 flex h-[52px] items-center text-left`}
            >
              <span className="text-[var(--text-primary)]">{subLabel || ''}</span>
            </button>
            <FloatingHint
              text={subLabel || picking === 'subcategoria' ? 'Subcategoría' : 'Elige una subcategoría'}
              up={Boolean(subLabel) || picking === 'subcategoria'}
              active={picking === 'subcategoria'}
            />
          </div>
          {picking === 'subcategoria' && (
            <div className="flex flex-wrap gap-2">
              {subs.map((item) => {
                const active = draft.subcategoria === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange({ subcategoria: item.id, subsubcategoria: undefined });
                      setPicking(null);
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <PrettyField
        label="Título"
        hint="Ej: Mozo para restaurante"
        value={draft.titulo || ''}
        maxLength={120}
        ai={aiClass('titulo')}
        onChange={(titulo) => onChange({ titulo })}
        trailing={
          <button
            type="button"
            onClick={() => onEnhanceField('titulo')}
            disabled={!draft.titulo?.trim() || enhancingField === 'titulo'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--brand-blue)] transition-colors hover:bg-[rgba(var(--brand-primary-rgb),0.1)] disabled:opacity-30"
            aria-label="Mejorar título"
          >
            <IconStar size={15} />
          </button>
        }
      />

      <PrettyField
        label="Descripción"
        hint="Detalles, condiciones, horarios…"
        value={draft.descripcion || ''}
        maxLength={2000}
        multiline
        rows={3}
        ai={aiClass('descripcion')}
        onChange={(descripcion) => onChange({ descripcion })}
        trailing={
          <button
            type="button"
            onClick={() => onEnhanceField('descripcion')}
            disabled={!draft.descripcion?.trim() || enhancingField === 'descripcion'}
            className="absolute right-2.5 top-3 rounded-lg p-1.5 text-[var(--brand-blue)] transition-colors hover:bg-[rgba(var(--brand-primary-rgb),0.1)] disabled:opacity-30"
            aria-label="Mejorar descripción"
          >
            <IconStar size={15} />
          </button>
        }
      />

      <PrettyField
        label="Contacto"
        hint="WhatsApp"
        value={draft.contacto || ''}
        inputMode="tel"
        ai={aiClass('contacto')}
        onChange={(contacto) => onChange({ contacto })}
      />

      <PrettyField
        label="Ubicación"
        hint="Distrito, zona…"
        value={locationText(draft.ubicacion)}
        ai={aiClass('ubicacion')}
        onChange={(ubicacion) => onChange({ ubicacion })}
        trailing={
          <button
            type="button"
            onClick={() => void detectLocation(onChange)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--brand-blue)]"
          >
            Detectar
          </button>
        }
      />

      <div className="relative">
        <button
          type="button"
          onClick={onAddPhoto}
          className={`${publishInput} mt-0 flex h-[52px] items-center gap-3 text-left`}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <IconImage size={16} color="var(--brand-blue)" />
          )}
          <span className="text-sm text-[var(--text-primary)]">{photoUrl ? 'Foto lista' : ''}</span>
        </button>
        <FloatingHint text={photoUrl ? 'Foto' : 'Agrega una foto'} up={Boolean(photoUrl)} active={false} />
      </div>

      <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-blue)]"
      >
        Ajustes avanzados
        <IconChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-3 border-t border-[var(--border-color)] pt-1">
          {onAutoDownloadChange && (
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={autoDownload}
                onChange={(event) => onAutoDownloadChange(event.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              Descargar el aviso al publicar
            </label>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subsubs.length > 0 && (
              <div className="sm:col-span-2">
                <label className={publishLabel}>Tipo específico</label>
                <select
                  value={draft.subsubcategoria || ''}
                  onChange={(event) => onChange({ subsubcategoria: event.target.value || undefined })}
                  className={publishInput}
                >
                  <option value="">Opcional…</option>
                  {subsubs.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className={publishLabel}>Precio</label>
              <div className="mt-1.5 flex gap-2">
                {(['PEN', 'USD'] as const).map((code) => {
                  const active = (draft.moneda || 'PEN') === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onChange({ moneda: code, tipoPrecio: 'fijo' })}
                      className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                        active
                          ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                          : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {code === 'USD' ? '$' : 'S/'}
                    </button>
                  );
                })}
                <input
                  type="number"
                  value={draft.precio ?? ''}
                  onChange={(event) => onChange({
                    precio: event.target.value ? Number(event.target.value) : undefined,
                    tipoPrecio: 'fijo',
                    moneda: draft.moneda || 'PEN',
                  })}
                  placeholder="Opcional"
                  className={`${publishInput} mt-0`}
                />
              </div>
            </div>
          </div>
          <PublishFormAdvanced draft={draft} onSetAtributo={onSetAtributo} />
        </div>
      )}
    </div>
  );
}
