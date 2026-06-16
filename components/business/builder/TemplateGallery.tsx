'use client';

import { useMemo, useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import { listTemplates, type PageParadigm } from '@/lib/business/templates/registry';
import { applyTemplate, type ApplyTemplatePolicy } from '@/lib/business/templates/apply-template';
import TemplatePreviewCard from './TemplatePreviewCard';
import { trackTemplateApplied } from '@/lib/business/profile-analytics';
import { cn } from '@/lib/utils';

interface TemplateGalleryProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
  recommendedTemplateId?: string;
  onUndo?: () => void;
  canUndo?: boolean;
}

export default function TemplateGallery({
  profile,
  onUpdate,
  recommendedTemplateId,
  onUndo,
  canUndo,
}: TemplateGalleryProps) {
  const [paradigmFilter, setParadigmFilter] = useState<PageParadigm | 'all'>('all');
  const [industryFilter, setIndustryFilter] = useState<string | 'all'>('all');
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [policy, setPolicy] = useState<ApplyTemplatePolicy>('merge');

  const templates = useMemo(
    () =>
      listTemplates({
        paradigm: paradigmFilter === 'all' ? undefined : paradigmFilter,
        industry: industryFilter === 'all' ? undefined : industryFilter,
      }),
    [paradigmFilter, industryFilter]
  );

  const apply = (templateId: string, applyPolicy: ApplyTemplatePolicy) => {
    const patch = applyTemplate(profile, { templateId, policy: applyPolicy });
    onUpdate(patch);
    trackTemplateApplied(templateId, applyPolicy, profile.id);
    setPendingTemplate(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'tabs', 'scroll'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setParadigmFilter(p)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold',
              paradigmFilter === p ? 'bg-[var(--brand-color)] text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {p === 'all' ? 'Todos' : p === 'tabs' ? 'Pestañas' : 'Scroll'}
          </button>
        ))}
        {(['all', 'ferreteria', 'restaurante', 'belleza', 'servicios'] as const).map((ind) => (
          <button
            key={ind}
            type="button"
            onClick={() => setIndustryFilter(ind)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold capitalize',
              industryFilter === ind ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {ind === 'all' ? 'Industria' : ind}
          </button>
        ))}
        {canUndo && onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"
          >
            Deshacer
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {templates.map((t) => (
          <TemplatePreviewCard
            key={t.id}
            template={t}
            selected={profile.template_id === t.id}
            recommended={recommendedTemplateId === t.id}
            onSelect={() => setPendingTemplate(t.id)}
          />
        ))}
      </div>

      {pendingTemplate && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Aplicar plantilla</h3>
            <p className="text-sm text-slate-500 mb-4">
              ¿Reemplazar el layout completo o solo combinar bloques nuevos?
            </p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={policy === 'merge'}
                  onChange={() => setPolicy('merge')}
                />
                Combinar (conservar datos)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={policy === 'replace'}
                  onChange={() => setPolicy('replace')}
                />
                Reemplazar layout
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingTemplate(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => apply(pendingTemplate, policy)}
                className="flex-1 py-2 rounded-xl bg-[var(--brand-color)] text-white text-sm font-bold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
