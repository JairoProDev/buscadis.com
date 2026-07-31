'use client';

import { useMemo } from 'react';
import FlyerCanvas from './FlyerCanvas';
import { FLYER_TEMPLATES, resolveFlyerConfig } from '@/lib/flyer/templates';
import type { FlyerConfig, FlyerContent, FlyerTemplateId } from '@/lib/flyer/types';

export interface FlyerTemplatePickerProps {
  content: FlyerContent;
  templateId: FlyerTemplateId;
  config: FlyerConfig;
  onChange: (next: { templateId: FlyerTemplateId; config: FlyerConfig }) => void;
  exportRef?: React.Ref<HTMLDivElement>;
  compact?: boolean;
}

export default function FlyerTemplatePicker({
  content,
  templateId,
  config,
  onChange,
  exportRef,
  compact = false,
}: FlyerTemplatePickerProps) {
  const resolved = useMemo(
    () => resolveFlyerConfig(content.categoria, templateId, config),
    [content.categoria, templateId, config]
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
                onClick={() =>
                  onChange({
                    templateId: t.id,
                    config: resolveFlyerConfig(content.categoria, t.id, {
                      ...resolved,
                      ...t.defaultConfig,
                    }),
                  })
                }
                className={`w-[72px] shrink-0 overflow-hidden rounded-xl ring-2 transition-shadow ${
                  selected
                    ? 'ring-[var(--brand-blue)] shadow-md'
                    : 'ring-[var(--border-color)] opacity-90 hover:opacity-100'
                }`}
              >
                <FlyerCanvas
                  templateId={t.id}
                  config={resolveFlyerConfig(content.categoria, t.id, {
                    ...resolved,
                    ...t.defaultConfig,
                  })}
                  content={content}
                  className="pointer-events-none"
                />
                <span className="block truncate bg-[var(--bg-secondary)] px-1 py-0.5 text-center text-[9px] font-semibold text-[var(--text-secondary)]">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`overflow-hidden rounded-2xl ring-1 ring-[var(--border-color)] ${compact ? 'max-w-[220px]' : 'max-w-sm'}`}>
        <FlyerCanvas
          templateId={templateId}
          config={resolved}
          content={content}
          exportRef={exportRef}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[10px] font-semibold text-[var(--text-tertiary)]">
          Color 1
          <input
            type="color"
            value={resolved.primary}
            onChange={(e) => patch({ primary: e.target.value })}
            className="h-8 w-full cursor-pointer rounded-lg border border-[var(--border-color)] bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold text-[var(--text-tertiary)]">
          Color 2
          <input
            type="color"
            value={/^#/.test(resolved.secondary) ? resolved.secondary : '#f1f5f9'}
            onChange={(e) => patch({ secondary: e.target.value })}
            className="h-8 w-full cursor-pointer rounded-lg border border-[var(--border-color)] bg-transparent"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-[10px] font-semibold text-[var(--text-tertiary)] sm:col-span-1">
          Etiqueta
          <input
            type="text"
            value={resolved.badge || ''}
            maxLength={24}
            placeholder="Ej. ¡Nuevo!"
            onChange={(e) => patch({ badge: e.target.value })}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
          />
        </label>
      </div>

      <div>
        <p className="m-0 mb-1.5 text-[10px] font-semibold text-[var(--text-tertiary)]">Paletas rápidas</p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['#e11d48', '#fff1f2'],
              ['#0f766e', '#ccfbf1'],
              ['#1d4ed8', '#dbeafe'],
              ['#c2410c', '#ffedd5'],
              ['#7c3aed', '#ede9fe'],
              ['#0f172a', '#fef3c7'],
              ['#be123c', '#fff7ed'],
              ['#0369a1', '#e0f2fe'],
            ] as const
          ).map(([p, s]) => (
            <button
              key={`${p}-${s}`}
              type="button"
              title="Aplicar paleta"
              onClick={() => patch({ primary: p, secondary: s })}
              className="h-7 w-7 overflow-hidden rounded-full ring-1 ring-[var(--border-color)]"
              style={{
                background: `linear-gradient(135deg, ${p} 0 50%, ${s} 50% 100%)`,
              }}
            />
          ))}
        </div>
      </div>

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
