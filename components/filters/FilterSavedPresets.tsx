'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import {
  deleteSavedFilterPreset,
  getSavedFilterPresets,
  saveFilterPreset,
  type SavedFilterPreset,
} from '@/lib/filters/saved-presets';
import { IconClose, IconCopy } from '@/components/Icons';

interface FilterSavedPresetsProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onApply: (filters: BrowseFilterState) => void;
}

export default function FilterSavedPresets({ categoria, filters, onApply }: FilterSavedPresetsProps) {
  const [saved, setSaved] = useState<SavedFilterPreset[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setSaved(getSavedFilterPresets(categoria));
  }, [categoria, filters]);

  const handleSave = () => {
    const preset = saveFilterPreset(name || 'Mi filtro', categoria, filters);
    setSaved(getSavedFilterPresets(categoria));
    setName('');
    setSaving(false);
  };

  if (saved.length === 0 && !saving) {
    return (
      <button
        type="button"
        onClick={() => setSaving(true)}
        className="w-full rounded-xl border border-dashed border-[var(--border-color)] py-2 text-[10px] font-semibold text-[var(--text-tertiary)] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
      >
        Guardar esta combinación
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Mis filtros guardados
        </p>
        <button
          type="button"
          onClick={() => setSaving((s) => !s)}
          className="text-[10px] font-semibold text-[var(--brand-blue)]"
        >
          {saving ? 'Cancelar' : '+ Guardar'}
        </button>
      </div>

      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-1.5 overflow-hidden"
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del filtro"
              className="min-w-0 flex-1 rounded-lg bg-[var(--bg-tertiary)] px-2 py-1.5 text-[11px] text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--brand-blue)]"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              type="button"
              onClick={handleSave}
              className="shrink-0 rounded-lg bg-[var(--brand-blue)] px-2.5 py-1.5 text-[10px] font-bold text-white"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1">
        {saved.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center gap-1 rounded-lg bg-[var(--bg-tertiary)] pr-1"
          >
            <button
              type="button"
              onClick={() => onApply({ ...preset.filters, facets: { ...preset.filters.facets } })}
              className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-[10px] font-semibold text-[var(--text-primary)] hover:text-[var(--brand-blue)]"
            >
              {preset.name}
            </button>
            <button
              type="button"
              onClick={() => {
                deleteSavedFilterPreset(preset.id);
                setSaved(getSavedFilterPresets(categoria));
              }}
              className="rounded p-1 text-[var(--text-tertiary)] hover:text-red-500"
              aria-label={`Eliminar ${preset.name}`}
            >
              <IconClose size={9} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FilterShareLinkProps {
  onCopy: () => void;
  copied: boolean;
}

export function FilterShareLink({ onCopy, copied }: FilterShareLinkProps) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-color)] py-2 text-[10px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
    >
      <IconCopy size={11} />
      {copied ? 'Enlace copiado' : 'Copiar enlace con filtros'}
    </button>
  );
}
