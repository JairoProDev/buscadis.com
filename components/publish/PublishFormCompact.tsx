'use client';

import { Categoria } from '@/types';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { PUBLISH_CATEGORIAS, getSubcategories, getSubsubcategories } from '@/lib/publish/category-tree';

interface PublishFormCompactProps {
  draft: PublishDraft;
  onChange: (patch: Partial<PublishDraft>) => void;
}

export default function PublishFormCompact({ draft, onChange }: PublishFormCompactProps) {
  const subs = draft.categoria ? getSubcategories(draft.categoria) : [];
  const subsubs = draft.categoria && draft.subcategoria
    ? getSubsubcategories(draft.categoria, draft.subcategoria)
    : [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Categoría</label>
          <select
            value={draft.categoria || ''}
            onChange={(e) => onChange({
              categoria: (e.target.value || undefined) as Categoria | undefined,
              subcategoria: undefined,
              subsubcategoria: undefined,
            })}
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
          >
            <option value="">Seleccionar…</option>
            {PUBLISH_CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        {subs.length > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Subcategoría</label>
            <select
              value={draft.subcategoria || ''}
              onChange={(e) => onChange({ subcategoria: e.target.value || undefined, subsubcategoria: undefined })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
            >
              <option value="">Opcional…</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
        {subsubs.length > 0 && (
          <div className="col-span-2">
            <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Tipo específico</label>
            <select
              value={draft.subsubcategoria || ''}
              onChange={(e) => onChange({ subsubcategoria: e.target.value || undefined })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
            >
              <option value="">Opcional…</option>
              {subsubs.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Título</label>
        <input
          type="text"
          value={draft.titulo || ''}
          onChange={(e) => onChange({ titulo: e.target.value })}
          placeholder="Ej: Cóctel de Cacao Artesanal"
          maxLength={120}
          className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Descripción</label>
        <textarea
          value={draft.descripcion || ''}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          placeholder="Detalles, condiciones, características…"
          rows={3}
          maxLength={2000}
          className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Contacto</label>
          <input
            type="tel"
            value={draft.contacto || ''}
            onChange={(e) => onChange({ contacto: e.target.value })}
            placeholder="WhatsApp"
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Precio (S/)</label>
          <input
            type="number"
            value={draft.precio ?? ''}
            onChange={(e) => onChange({ precio: e.target.value ? Number(e.target.value) : undefined, tipoPrecio: 'fijo' })}
            placeholder="Opcional"
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
          />
        </div>
      </div>
    </div>
  );
}
