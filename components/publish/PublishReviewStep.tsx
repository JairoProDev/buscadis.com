'use client';

import { PublishDraft } from '@/lib/publish/publish-draft-types';
import PublishPreviewCard from './PublishPreviewCard';
import PublishReachLines from './PublishReachLines';
import { publishCard } from './publish-ui';

interface PublishReviewStepProps {
  draft: PublishDraft;
}

export default function PublishReviewStep({ draft }: PublishReviewStepProps) {
  return (
    <div className="space-y-4">
      <div className={`${publishCard} p-4`}>
        <p className="text-sm font-bold text-[var(--text-primary)] m-0 mb-3">
          Así se verá tu aviso
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="shrink-0 mx-auto sm:mx-0">
            <PublishPreviewCard draft={draft} variant="live" />
          </div>
          <div className="flex-1 min-w-0 w-full sm:pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] m-0 mb-2">
              Alcance estimado
            </p>
            <PublishReachLines draft={draft} variant="stack" />
          </div>
        </div>
      </div>

      <div className={`${publishCard} p-4 space-y-2`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] m-0">
          Resumen
        </p>
        {draft.titulo && (
          <p className="text-sm font-semibold text-[var(--text-primary)] m-0">{draft.titulo}</p>
        )}
        {draft.descripcion && (
          <p className="text-xs text-[var(--text-secondary)] m-0 line-clamp-3 leading-relaxed">
            {draft.descripcion}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {draft.contacto && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)] font-medium">
              {draft.contacto}
            </span>
          )}
          {draft.imagenes.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              {draft.imagenes.length} foto{draft.imagenes.length > 1 ? 's' : ''}
            </span>
          )}
          {draft.categoria && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize">
              {draft.categoria}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
