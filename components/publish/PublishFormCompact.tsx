'use client';

import { Categoria } from '@/types';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { PUBLISH_CATEGORIAS, getSubcategories, getSubsubcategories } from '@/lib/publish/category-tree';
import { IconChevronDown, IconStar } from '@/components/Icons';
import PublishFormAdvanced from './PublishFormAdvanced';
import { publishInput, publishInputAiFilled, publishLabel } from './publish-ui';

interface PublishFormCompactProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
  onSetAtributo: (fieldId: string, value: string | string[] | boolean | number) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onEnhanceField: (field: 'titulo' | 'descripcion') => void;
  enhancingField?: 'titulo' | 'descripcion' | null;
  analyzing?: boolean;
}

export default function PublishFormCompact({
  draft,
  onChange,
  onSetAtributo,
  showAdvanced,
  onToggleAdvanced,
  onEnhanceField,
  enhancingField,
  analyzing = false,
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
      <div>
        <label className={publishLabel}>Título</label>
        <div className="relative">
          <input
            type="text"
            value={draft.titulo || ''}
            onChange={(e) => onChange({ titulo: e.target.value })}
            placeholder="Ej: Mozo para restaurante"
            maxLength={120}
            className={`${publishInput} pr-11 ${aiClass('titulo')}`}
          />
          <button
            type="button"
            onClick={() => onEnhanceField('titulo')}
            disabled={!draft.titulo?.trim() || enhancingField === 'titulo'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.1)] disabled:opacity-30 transition-colors"
            aria-label="Mejorar título"
          >
            <IconStar size={15} />
          </button>
        </div>
      </div>

      <div>
        <label className={publishLabel}>Descripción</label>
        <div className="relative">
          <textarea
            value={draft.descripcion || ''}
            onChange={(e) => onChange({ descripcion: e.target.value })}
            placeholder="Detalles, condiciones, horarios…"
            rows={3}
            maxLength={2000}
            className={`${publishInput} pr-11 resize-none min-h-[72px] ${aiClass('descripcion')}`}
          />
          <button
            type="button"
            onClick={() => onEnhanceField('descripcion')}
            disabled={!draft.descripcion?.trim() || enhancingField === 'descripcion'}
            className="absolute right-2.5 top-3 p-1.5 rounded-lg text-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.1)] disabled:opacity-30 transition-colors"
            aria-label="Mejorar descripción"
          >
            <IconStar size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={publishLabel}>Contacto</label>
          <input
            type="tel"
            value={draft.contacto || ''}
            onChange={(e) => onChange({ contacto: e.target.value })}
            placeholder="WhatsApp"
            className={`${publishInput} ${aiClass('contacto')}`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleAdvanced}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-blue)] transition-colors"
      >
        Campos
        <IconChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={publishLabel}>Categoría</label>
              <select
                value={draft.categoria || ''}
                onChange={(e) => onChange({
                  categoria: (e.target.value || undefined) as Categoria | undefined,
                  subcategoria: undefined,
                  subsubcategoria: undefined,
                })}
                className={publishInput}
              >
                <option value="">Opcional…</option>
                {PUBLISH_CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {subs.length > 0 && (
              <div>
                <label className={publishLabel}>Subcategoría</label>
                <select
                  value={draft.subcategoria || ''}
                  onChange={(e) => onChange({ subcategoria: e.target.value || undefined, subsubcategoria: undefined })}
                  className={publishInput}
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
                <label className={publishLabel}>Tipo específico</label>
                <select
                  value={draft.subsubcategoria || ''}
                  onChange={(e) => onChange({ subsubcategoria: e.target.value || undefined })}
                  className={publishInput}
                >
                  <option value="">Opcional…</option>
                  {subsubs.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={publishLabel}>Precio (S/)</label>
              <input
                type="number"
                value={draft.precio ?? ''}
                onChange={(e) => onChange({ precio: e.target.value ? Number(e.target.value) : undefined, tipoPrecio: 'fijo' })}
                placeholder="Opcional"
                className={publishInput}
              />
            </div>
            <div>
              <label className={publishLabel}>Ubicación</label>
              <input
                type="text"
                value={typeof draft.ubicacion === 'string' ? draft.ubicacion : ''}
                onChange={(e) => onChange({ ubicacion: e.target.value })}
                placeholder="Distrito, zona…"
                className={publishInput}
              />
            </div>
          </div>
          <PublishFormAdvanced draft={draft} onSetAtributo={onSetAtributo} />
        </div>
      )}
    </div>
  );
}
