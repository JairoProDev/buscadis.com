'use client';

import React from 'react';
import { IconClose } from '@/components/Icons';
import { FilterChip } from '@/lib/filters/types';

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '999px',
  border: '1px solid rgba(var(--brand-yellow-rgb), 0.45)',
  backgroundColor: 'rgba(var(--brand-yellow-rgb), 0.12)',
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: '32px',
};

interface FilterChipRowProps {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
}

export default function FilterChipRow({ chips, onRemove, onClearAll, showClearAll }: FilterChipRowProps) {
  if (chips.length === 0 && !showClearAll) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onRemove(chip)}
          style={chipStyle}
          aria-label={`Quitar filtro ${chip.label}`}
        >
          {chip.label}
          <IconClose size={12} />
        </button>
      ))}
      {showClearAll && chips.length > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            ...chipStyle,
            backgroundColor: 'transparent',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
