'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import { Categoria } from '@/types';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { PUBLISH_CATEGORIAS, getSubcategories, getSubsubcategories } from '@/lib/publish/category-tree';
import { IconChevronDown, IconImage, IconStar } from '@/components/Icons';
import { getCategoriaIcon } from '@/lib/categoria-icons';
import PublishFormAdvanced from './PublishFormAdvanced';
import PublishLocationField from './PublishLocationField';
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

function PrettySelect({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: ComponentType<{ size?: number; color?: string }> }>;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((item) => item.value === value);
  const Icon = current?.icon;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className={`${publishInput} mt-0 flex h-[52px] items-center justify-between gap-2 text-left`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon size={16} color="var(--brand-blue)" /> : null}
          <span className={current ? 'text-[var(--text-primary)]' : 'text-transparent'}>{current?.label || hint}</span>
        </span>
        <IconChevronDown size={14} className={`shrink-0 text-[var(--text-tertiary)] ${open ? 'rotate-180' : ''}`} />
      </button>
      <FloatingHint text={current ? label : hint} up={Boolean(current) || open} active={open} />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-[var(--bg-primary)] p-1 shadow-lg ring-1 ring-[var(--border-color)]">
          {options.map((item) => {
            const OptionIcon = item.icon;
            const active = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  active
                    ? 'bg-[rgba(var(--brand-primary-rgb),0.1)] font-semibold text-[var(--brand-blue)]'
                    : 'text-[var(--text-primary)]'
                }`}
              >
                {OptionIcon ? <OptionIcon size={15} color={active ? 'var(--brand-blue)' : 'var(--text-secondary)'} /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const subsubs = draft.categoria && draft.subcategoria
    ? getSubsubcategories(draft.categoria, draft.subcategoria)
    : [];

  const aiClass = (field: string) =>
    draft.aiConfidence[field] ? publishInputAiFilled : analyzing ? 'animate-pulse' : '';

  return (
    <div className="space-y-4 px-1">
      {analyzing && (
        <div className="rounded-xl px-3 py-2.5 text-xs text-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)] animate-pulse">
          ADIS está extrayendo título, descripción y datos de tu foto…
        </div>
      )}

      <PrettySelect
        label="Categoría"
        hint="Elige una categoría"
        value={draft.categoria || ''}
        options={PUBLISH_CATEGORIAS.map((item) => ({
          value: item.value,
          label: item.label,
          icon: getCategoriaIcon(item.value),
        }))}
        onChange={(categoria) =>
          onChange({
            categoria: (categoria || undefined) as Categoria | undefined,
            subcategoria: undefined,
            subsubcategoria: undefined,
          })
        }
      />
      {draft.categoria && subs.length > 0 && (
        <PrettySelect
          label="Subcategoría"
          hint="Elige una subcategoría"
          value={draft.subcategoria || ''}
          options={subs.map((item) => ({ value: item.id, label: item.label }))}
          onChange={(subcategoria) => onChange({ subcategoria: subcategoria || undefined, subsubcategoria: undefined })}
        />
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

      <PublishLocationField
        value={draft.ubicacion}
        onChange={(ubicacion) => onChange({ ubicacion })}
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
