'use client';

import { useMemo, useState } from 'react';
import {
  FLYER_ACCENT_SWATCHES,
  FLYER_BACKGROUND_SWATCHES,
  FLYER_PALETTES,
  applyPaletteToConfig,
  isPaletteActive,
  setCustomPaletteColors,
} from '@/lib/flyer/color-palettes';
import { softWashFromAccent } from '@/lib/flyer/templates';
import type { FlyerConfig } from '@/lib/flyer/types';

interface PublishPalettePickerProps {
  config: FlyerConfig;
  onChange: (next: FlyerConfig) => void;
  compact?: boolean;
}

function Swatch({
  color,
  selected,
  label,
  onClick,
  size = 'md',
}: {
  color: string;
  selected?: boolean;
  label: string;
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${dim} shrink-0 rounded-full ring-2 transition-transform active:scale-95 ${
        selected ? 'ring-[var(--brand-blue)] ring-offset-2' : 'ring-transparent'
      }`}
      style={{ background: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
    />
  );
}

export default function PublishPalettePicker({ config, onChange, compact }: PublishPalettePickerProps) {
  const [customOpen, setCustomOpen] = useState(config.paletteId === 'custom');

  const primary = config.primary || '#53acc5';
  const secondary = config.secondary || softWashFromAccent(primary);

  const customActive = config.paletteId === 'custom';

  const summary = useMemo(() => {
    if (customActive) return 'Personalizada';
    const preset = FLYER_PALETTES.find((p) => p.id === config.paletteId);
    return preset?.label || 'Elige una paleta';
  }, [config.paletteId, customActive]);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="m-0 text-xs font-bold text-[var(--text-primary)]">Paleta de colores</p>
          {!compact && (
            <p className="m-0 mt-0.5 text-[11px] leading-snug text-[var(--text-tertiary)]">
              Se aplica a todas las plantillas. Luego elige el diseño que más te guste.
            </p>
          )}
        </div>
        <div
          className="flex h-8 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--border-color)]"
          aria-hidden
        >
          <span className="h-full w-1/2" style={{ background: primary }} />
          <span className="h-full w-1/2" style={{ background: secondary }} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FLYER_PALETTES.map((palette) => {
          const active = isPaletteActive(config, palette.id);
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onChange(applyPaletteToConfig(config, palette))}
              className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 transition-colors ${
                active ? 'bg-[rgba(var(--brand-primary-rgb),0.12)] ring-2 ring-[var(--brand-blue)]' : 'ring-1 ring-[var(--border-color)]'
              }`}
            >
              <span
                className="h-10 w-10 rounded-full ring-1 ring-black/10"
                style={{
                  background: `conic-gradient(from 135deg, ${palette.primary}, ${palette.secondary}, ${palette.primary})`,
                }}
              />
              <span className="w-full truncate text-center text-[10px] font-semibold text-[var(--text-secondary)]">
                {palette.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setCustomOpen(true);
            if (!config.paletteId) {
              onChange(setCustomPaletteColors(config, primary, secondary));
            }
          }}
          className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 transition-colors ${
            customActive ? 'bg-[rgba(var(--brand-primary-rgb),0.12)] ring-2 ring-[var(--brand-blue)]' : 'ring-1 ring-[var(--border-color)]'
          }`}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-lg font-light text-[var(--text-tertiary)] ring-1 ring-[var(--border-color)]"
          >
            +
          </span>
          <span className="w-full truncate text-center text-[10px] font-semibold text-[var(--text-secondary)]">
            Ajustar
          </span>
        </button>
      </div>

      {(customOpen || customActive) && (
        <div className="rounded-xl bg-[var(--bg-secondary)] p-3 ring-1 ring-[var(--border-color)]">
          <p className="m-0 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            {summary}
          </p>
          <p className="m-0 mb-1.5 text-[11px] font-semibold text-[var(--text-secondary)]">Color principal</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FLYER_ACCENT_SWATCHES.map((color) => (
              <Swatch
                key={color}
                color={color}
                label={`Principal ${color}`}
                selected={primary.toLowerCase() === color.toLowerCase()}
                size="sm"
                onClick={() => onChange(setCustomPaletteColors(config, color))}
              />
            ))}
          </div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="m-0 text-[11px] font-semibold text-[var(--text-secondary)]">Fondo</p>
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--brand-blue)] ring-1 ring-[var(--border-color)]"
              onClick={() => onChange(setCustomPaletteColors(config, primary, softWashFromAccent(primary)))}
            >
              Automático
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FLYER_BACKGROUND_SWATCHES.map((color) => (
              <Swatch
                key={color}
                color={color}
                label={`Fondo ${color}`}
                selected={secondary.toLowerCase() === color.toLowerCase()}
                size="sm"
                onClick={() => onChange(setCustomPaletteColors(config, primary, color))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
