'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@/components/Icons';
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
import { publishUi } from '@/lib/bs-tokens';

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
}: {
  color: string;
  selected?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`h-8 w-8 shrink-0 rounded-full ring-2 transition-transform active:scale-95 ${
        selected ? 'ring-[var(--brand-blue)] ring-offset-2' : 'ring-transparent'
      }`}
      style={{ background: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
    />
  );
}

function CustomPaletteSheet({
  open,
  onClose,
  summary,
  primary,
  secondary,
  config,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  summary: string;
  primary: string;
  secondary: string;
  config: FlyerConfig;
  onChange: (next: FlyerConfig) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-black/45"
        aria-label="Cerrar personalización"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-sheet-title"
        className="fixed inset-x-0 bottom-0 z-[81] flex max-h-[min(72vh,520px)] flex-col rounded-t-2xl bg-[var(--bg-primary)] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3">
          <div className="min-w-0">
            <p id="palette-sheet-title" className="m-0 text-sm font-bold text-[var(--text-primary)]">
              Personalizar colores
            </p>
            <p className="m-0 truncate text-[11px] text-[var(--text-tertiary)]">{summary}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div
              className="mr-1 flex h-7 w-12 overflow-hidden rounded-full ring-1 ring-[var(--border-color)]"
              aria-hidden
            >
              <span className="h-full w-1/2" style={{ background: primary }} />
              <span className="h-full w-1/2" style={{ background: secondary }} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]"
              aria-label="Cerrar"
            >
              <IconX size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[var(--brand-blue)] px-3.5 py-2 text-xs font-bold text-white"
            >
              Listo
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="m-0 mb-2 text-[11px] font-semibold text-[var(--text-secondary)]">Color principal</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {FLYER_ACCENT_SWATCHES.map((color) => (
              <Swatch
                key={color}
                color={color}
                label={`Principal ${color}`}
                selected={primary.toLowerCase() === color.toLowerCase()}
                onClick={() => onChange(setCustomPaletteColors(config, color))}
              />
            ))}
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="m-0 text-[11px] font-semibold text-[var(--text-secondary)]">Fondo</p>
            <button
              type="button"
              className="rounded-full px-2.5 py-1 text-[10px] font-bold text-[var(--brand-blue)] ring-1 ring-[var(--border-color)]"
              onClick={() => onChange(setCustomPaletteColors(config, primary, softWashFromAccent(primary)))}
            >
              Automático
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pb-2">
            {FLYER_BACKGROUND_SWATCHES.map((color) => (
              <Swatch
                key={color}
                color={color}
                label={`Fondo ${color}`}
                selected={secondary.toLowerCase() === color.toLowerCase()}
                onClick={() => onChange(setCustomPaletteColors(config, primary, color))}
              />
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default function PublishPalettePicker({ config, onChange, compact }: PublishPalettePickerProps) {
  const [customOpen, setCustomOpen] = useState(false);

  const primary = config.primary || publishUi.defaultPrimary;
  const secondary = config.secondary || softWashFromAccent(primary);
  const customActive = config.paletteId === 'custom';

  const summary = useMemo(() => {
    if (customActive) return 'Paleta personalizada';
    const preset = FLYER_PALETTES.find((p) => p.id === config.paletteId);
    return preset?.label || 'Sin paleta fija';
  }, [config.paletteId, customActive]);

  const pickPreset = (palette: (typeof FLYER_PALETTES)[number]) => {
    onChange(applyPaletteToConfig(config, palette));
    setCustomOpen(false);
  };

  return (
    <>
      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-xs font-bold text-[var(--text-primary)]">Paleta</p>
          <div
            className="flex h-6 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--border-color)]"
            aria-hidden
          >
            <span className="h-full w-1/2" style={{ background: primary }} />
            <span className="h-full w-1/2" style={{ background: secondary }} />
          </div>
        </div>

        {!compact && (
          <p className="m-0 text-[10px] leading-snug text-[var(--text-tertiary)]">
            Elige colores; las plantillas de abajo los usan todas.
          </p>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FLYER_PALETTES.map((palette) => {
            const active = isPaletteActive(config, palette.id);
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => pickPreset(palette)}
                className={`flex w-[3.75rem] shrink-0 flex-col items-center gap-0.5 rounded-lg p-1 transition-colors ${
                  active ? 'bg-[rgba(var(--brand-primary-rgb),0.12)] ring-2 ring-[var(--brand-blue)]' : 'ring-1 ring-[var(--border-color)]'
                }`}
              >
                <span
                  className="h-8 w-8 rounded-full ring-1 ring-black/10"
                  style={{
                    background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`,
                  }}
                />
                <span className="w-full truncate text-center text-[9px] font-semibold text-[var(--text-secondary)]">
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
            className={`flex w-[3.75rem] shrink-0 flex-col items-center gap-0.5 rounded-lg p-1 transition-colors ${
              customActive || customOpen
                ? 'bg-[rgba(var(--brand-primary-rgb),0.12)] ring-2 ring-[var(--brand-blue)]'
                : 'ring-1 ring-[var(--border-color)]'
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-base text-[var(--text-tertiary)] ring-1 ring-[var(--border-color)]">
              +
            </span>
            <span className="w-full truncate text-center text-[9px] font-semibold text-[var(--text-secondary)]">
              Ajustar
            </span>
          </button>
        </div>
      </div>

      <CustomPaletteSheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        summary={summary}
        primary={primary}
        secondary={secondary}
        config={config}
        onChange={onChange}
      />
    </>
  );
}
