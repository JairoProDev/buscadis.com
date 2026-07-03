'use client';

import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { getPublishFieldsForCategory, PublishFieldDefinition } from '@/lib/publish/category-tree';

interface PublishFormAdvancedProps {
  draft: PublishDraft;
  onSetAtributo: (fieldId: string, value: string | string[] | boolean | number) => void;
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
      <div className="flex flex-wrap gap-1 mt-1">
        {field.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${
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
        className={`mt-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
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

export default function PublishFormAdvanced({ draft, onSetAtributo }: PublishFormAdvancedProps) {
  const fields = getPublishFieldsForCategory(draft.categoria, draft.subcategoria);
  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
      {fields.map((field) => (
        <div
          key={field.id}
          className={field.type === 'chips' && (field.options?.length ?? 0) > 3 ? 'sm:col-span-2' : ''}
        >
          <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)]">{field.label}</label>
          <FieldInput
            field={field}
            value={draft.atributos[field.id]}
            onChange={(v) => onSetAtributo(field.id, v)}
          />
        </div>
      ))}
    </div>
  );
}
