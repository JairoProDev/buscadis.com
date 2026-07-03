'use client';

import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { getPublishFieldsForCategory, PublishFieldDefinition } from '@/lib/publish/category-tree';

interface PublishFormAdvancedProps {
  draft: PublishDraft;
  onSetAtributo: (fieldId: string, value: string | string[] | boolean | number) => void;
  onChange: (patch: Partial<PublishDraft>) => void;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PublishFieldDefinition;
  value: string | string[] | boolean | number | undefined;
  onChange: (v: string | string[] | boolean | number) => void;
}) {
  if (field.type === 'chips' && field.options) {
    const selected = typeof value === 'string' ? value : '';
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {field.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
              selected === opt.value
                ? 'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]'
                : 'border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (field.type === 'toggle') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`mt-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${
          value ? 'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]' : 'border-[var(--border-color)]'
        }`}
      >
        {value ? 'Sí' : 'No'}
      </button>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
      >
        <option value="">Seleccionar…</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type === 'number' || field.type === 'price' ? 'number' : 'text'}
      value={value !== undefined && value !== null ? String(value) : ''}
      onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={field.placeholder}
      className="w-full mt-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
    />
  );
}

export default function PublishFormAdvanced({ draft, onSetAtributo, onChange }: PublishFormAdvancedProps) {
  const fields = getPublishFieldsForCategory(draft.categoria, draft.subcategoria);
  const groups = [...new Set(fields.map((f) => f.group || 'General'))];

  if (fields.length === 0) {
    return (
      <div className="space-y-3 pt-2">
        <div>
          <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Ubicación</label>
          <input
            type="text"
            value={typeof draft.ubicacion === 'string' ? draft.ubicacion : ''}
            onChange={(e) => onChange({ ubicacion: e.target.value })}
            placeholder="Distrito, provincia…"
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {groups.map((group) => (
        <div key={group}>
          <p className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] mb-2">{group}</p>
          <div className="space-y-3">
            {fields.filter((f) => (f.group || 'General') === group).map((field) => (
              <div key={field.id}>
                <label className="text-xs text-[var(--text-secondary)]">{field.label}</label>
                <FieldInput
                  field={field}
                  value={draft.atributos[field.id]}
                  onChange={(v) => onSetAtributo(field.id, v)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">Ubicación</label>
        <input
          type="text"
          value={typeof draft.ubicacion === 'string' ? draft.ubicacion : ''}
          onChange={(e) => onChange({ ubicacion: e.target.value })}
          placeholder="Distrito, provincia…"
          className="w-full mt-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm"
        />
      </div>
    </div>
  );
}
