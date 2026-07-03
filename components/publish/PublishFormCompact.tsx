'use client';

import { Categoria } from '@/types';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { PUBLISH_CATEGORIAS, getSubcategories, getSubsubcategories } from '@/lib/publish/category-tree';
import { IconChevronDown, IconStar } from '@/components/Icons';
import PublishFormAdvanced from './PublishFormAdvanced';

interface PublishFormCompactProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | string[] | boolean | number) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onEnhanceField: (field: 'titulo' | 'descripcion') => void;
  enhancingField?: 'titulo' | 'descripcion' | null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">{children}</label>
  );
}

function inputClass(extra = '') {
  return `w-full mt-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-[var(--brand-blue)] ${extra}`;
}

export default function PublishFormCompact({
  draft,
  onChange,
  onSetAtributo,
  showAdvanced,
  onToggleAdvanced,
  onEnhanceField,
  enhancingField,
}: PublishFormCompactProps) {
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const subsubs = draft.categoria && draft.subcategoria
    ? getSubsubcategories(draft.categoria, draft.subcategoria)
    : [];

  return (
    <div className="space-y-2.5">
      {/* Title — full width */}
      <div>
        <FieldLabel>Título</FieldLabel>
        <div className="relative mt-1">
          <input
            type="text"
            value={draft.titulo || ''}
            onChange={(e) => onChange({ titulo: e.target.value })}
            placeholder="Ej: Mozo para restaurante"
            maxLength={120}
            className={inputClass('pr-10')}
          />
          <button
            type="button"
            onClick={() => onEnhanceField('titulo')}
            disabled={!draft.titulo?.trim() || enhancingField === 'titulo'}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--brand-blue)] disabled:opacity-30"
            aria-label="Mejorar título con IA"
            title="Mejorar título"
          >
            <IconStar size={14} />
          </button>
        </div>
      </div>

      {/* Description — full width */}
      <div>
        <FieldLabel>Descripción</FieldLabel>
        <div className="relative mt-1">
          <textarea
            value={draft.descripcion || ''}
            onChange={(e) => onChange({ descripcion: e.target.value })}
            placeholder="Detalles, condiciones, horarios…"
            rows={2}
            maxLength={2000}
            className={inputClass('pr-10 resize-none min-h-[56px]')}
          />
          <button
            type="button"
            onClick={() => onEnhanceField('descripcion')}
            disabled={!draft.descripcion?.trim() || enhancingField === 'descripcion'}
            className="absolute right-2 top-2 p-1.5 rounded-lg text-[var(--brand-blue)] disabled:opacity-30"
            aria-label="Mejorar descripción con IA"
            title="Mejorar descripción"
          >
            <IconStar size={14} />
          </button>
        </div>
      </div>

      {/* Contact — half width on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel>Contacto</FieldLabel>
          <input
            type="tel"
            value={draft.contacto || ''}
            onChange={(e) => onChange({ contacto: e.target.value })}
            placeholder="WhatsApp"
            className={inputClass()}
          />
        </div>
      </div>

      {/* Advanced fields toggle */}
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-blue)] transition-colors"
      >
        Campos
        {showAdvanced ? <IconChevronDown size={14} className="rotate-180" /> : <IconChevronDown size={14} />}
      </button>

      {showAdvanced && (
        <div className="space-y-2.5 pt-0.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <FieldLabel>Categoría</FieldLabel>
              <select
                value={draft.categoria || ''}
                onChange={(e) => onChange({
                  categoria: (e.target.value || undefined) as Categoria | undefined,
                  subcategoria: undefined,
                  subsubcategoria: undefined,
                })}
                className={inputClass()}
              >
                <option value="">Opcional…</option>
                {PUBLISH_CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {subs.length > 0 && (
              <div>
                <FieldLabel>Subcategoría</FieldLabel>
                <select
                  value={draft.subcategoria || ''}
                  onChange={(e) => onChange({ subcategoria: e.target.value || undefined, subsubcategoria: undefined })}
                  className={inputClass()}
                >
                  <option value="">Opcional…</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
            {subsubs.length > 0 && (
              <div className="sm:col-span-2">
                <FieldLabel>Tipo específico</FieldLabel>
                <select
                  value={draft.subsubcategoria || ''}
                  onChange={(e) => onChange({ subsubcategoria: e.target.value || undefined })}
                  className={inputClass()}
                >
                  <option value="">Opcional…</option>
                  {subsubs.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <FieldLabel>Precio (S/)</FieldLabel>
              <input
                type="number"
                value={draft.precio ?? ''}
                onChange={(e) => onChange({ precio: e.target.value ? Number(e.target.value) : undefined, tipoPrecio: 'fijo' })}
                placeholder="Opcional"
                className={inputClass()}
              />
            </div>
            <div>
              <FieldLabel>Ubicación</FieldLabel>
              <input
                type="text"
                value={typeof draft.ubicacion === 'string' ? draft.ubicacion : ''}
                onChange={(e) => onChange({ ubicacion: e.target.value })}
                placeholder="Distrito, zona…"
                className={inputClass()}
              />
            </div>
          </div>
          <PublishFormAdvanced draft={draft} onSetAtributo={onSetAtributo} />
        </div>
      )}
    </div>
  );
}
