'use client';

import { useMemo } from 'react';
import FlyerCanvas from './FlyerCanvas';
import TemplateThumb from './TemplateThumb';
import { FLYER_TEMPLATES, resolveFlyerConfig } from '@/lib/flyer/templates';
import { getPaletteOverrides } from '@/lib/flyer/color-palettes';
import PublishPalettePicker from '@/components/publish/PublishPalettePicker';
import type { FlyerConfig, FlyerContent, FlyerTemplateId } from '@/lib/flyer/types';

export interface FlyerTemplatePickerProps {
  content: FlyerContent;
  templateId: FlyerTemplateId;
  config: FlyerConfig;
  onChange: (next: { templateId: FlyerTemplateId; config: FlyerConfig }) => void;
  exportRef?: React.Ref<HTMLDivElement>;
  compact?: boolean;
  /** El preview grande ya vive fuera (p. ej. el hero de publicar). */
  hidePreview?: boolean;
  /** Si la paleta ya se muestra arriba (p. ej. en PublishStudio). */
  hidePalette?: boolean;
}

export default function FlyerTemplatePicker({
  content,
  templateId,
  config,
  onChange,
  exportRef,
  compact = false,
  hidePreview = false,
  hidePalette = false,
}: FlyerTemplatePickerProps) {
  const paletteOverrides = useMemo(() => getPaletteOverrides(config), [config]);

  const resolved = useMemo(
    () =>
      resolveFlyerConfig(
        content.categoria,
        templateId,
        paletteOverrides ? { ...config, ...paletteOverrides } : config,
      ),
    [content.categoria, templateId, config, paletteOverrides],
  );

  const patch = (partial: Partial<FlyerConfig>) => {
    onChange({ templateId, config: { ...resolved, ...partial } });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="m-0 mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">
          Portada automática
        </p>
        <p className="m-0 mb-2 text-[11px] text-[var(--text-tertiary)]">
          Sin foto? Elige un flyer. Se guarda como imagen al publicar.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FLYER_TEMPLATES.map((t) => {
            const selected = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ templateId: t.id, config })}
                className="shrink-0"
              >
                <TemplateThumb selected={selected}>
                  <FlyerCanvas
                    templateId={t.id}
                    config={resolveFlyerConfig(
                      content.categoria,
                      t.id,
                      paletteOverrides ? { ...config, ...paletteOverrides } : undefined,
                    )}
                    content={content}
                    className="pointer-events-none h-full w-full"
                  />
                </TemplateThumb>
                <span className="block truncate bg-[var(--bg-secondary)] px-1 py-0.5 text-center text-[9px] font-semibold text-[var(--text-secondary)]">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!hidePreview && (
        <div className={`overflow-hidden rounded-2xl ring-1 ring-[var(--border-color)] ${compact ? 'max-w-[220px]' : 'max-w-sm'}`}>
          <FlyerCanvas
            templateId={templateId}
            config={resolved}
            content={content}
            exportRef={exportRef}
          />
        </div>
      )}

      {!hidePalette && (
        <PublishPalettePicker config={resolved} onChange={(next) => onChange({ templateId, config: next })} />
      )}

      <label className="flex flex-col gap-1 text-[10px] font-semibold text-[var(--text-tertiary)]">
        Etiqueta en la portada
        <input
          type="text"
          value={resolved.badge || ''}
          maxLength={24}
          placeholder="Ej. ¡Nuevo!"
          onChange={(e) => patch({ badge: e.target.value })}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <div className="flex overflow-hidden rounded-lg ring-1 ring-[var(--border-color)]">
          {(['left', 'center'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => patch({ align: a })}
              className={`px-2.5 py-1 text-[10px] font-semibold ${
                resolved.align === a
                  ? 'bg-[var(--brand-blue)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {a === 'left' ? 'Izq.' : 'Centro'}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-lg ring-1 ring-[var(--border-color)]">
          {(['s', 'm', 'l'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patch({ titleScale: s })}
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase ${
                resolved.titleScale === s
                  ? 'bg-[var(--brand-blue)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-secondary)]">
        {(
          [
            ['showPrice', 'Precio'],
            ['showLocation', 'Ubicación'],
            ['showCategory', 'Categoría'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={Boolean(resolved[key])}
              onChange={(e) => patch({ [key]: e.target.checked })}
              className="accent-[var(--brand-blue)]"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
