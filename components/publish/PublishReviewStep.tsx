'use client';

import { PublishDraft } from '@/lib/publish/publish-draft-types';
import PublishPreviewCard, { type PublisherPreview } from './PublishPreviewCard';
import PublishReachLines from './PublishReachLines';
import { publishCard } from './publish-ui';

interface PublishReviewStepProps {
  draft: PublishDraft;
  publisher?: PublisherPreview | null;
}

const FIELD_LABELS: Record<string, string> = {
  titulo: 'Título',
  descripcion: 'Descripción',
  contacto: 'Contacto',
  categoria: 'Categoría',
};

export default function PublishReviewStep({ draft, publisher }: PublishReviewStepProps) {
  const missing = draft.missingFields || [];
  const hasContent = Boolean(draft.titulo?.trim() || draft.descripcion?.trim() || draft.imagenes.length);

  return (
    <div className="space-y-4">
      <div className={`${publishCard} p-4`}>
        <p className="text-sm font-bold text-[var(--text-primary)] m-0 mb-1">
          Así se verá tu aviso
        </p>
        <p className="text-xs text-[var(--text-secondary)] m-0 mb-3 leading-snug">
          Compara gratis vs promocionado. El plan pago destaca de verdad en el feed.
        </p>
        <div className="grid grid-cols-2 gap-3 items-start">
          <PublishPreviewCard
            draft={draft}
            variant="free"
            label="Gratis"
            compact
            publisher={publisher}
          />
          <PublishPreviewCard
            draft={draft}
            variant="paid"
            label="Promocionado"
            compact
            publisher={publisher}
          />
        </div>
      </div>

      <div className={`${publishCard} p-4 space-y-3`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] m-0">
          Resumen del aviso
        </p>
        {!hasContent && (
          <p className="text-sm text-[var(--text-secondary)] m-0">
            Aún no hay datos. Vuelve a editar o usa ADIS para completar el aviso.
          </p>
        )}
        {draft.titulo && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] m-0 mb-0.5">
              Título
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] m-0">{draft.titulo}</p>
          </div>
        )}
        {draft.descripcion && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] m-0 mb-0.5">
              Descripción
            </p>
            <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed whitespace-pre-wrap">
              {draft.descripcion}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {publisher?.name && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)] font-medium">
              {publisher.name}
            </span>
          )}
          {draft.contacto && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)] font-medium">
              {draft.contacto}
            </span>
          )}
          {draft.imagenes.length > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              {draft.imagenes.length} foto{draft.imagenes.length > 1 ? 's' : ''}
            </span>
          )}
          {draft.categoria && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize">
              {draft.categoria}
            </span>
          )}
          {draft.precio != null && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              S/ {draft.precio}
            </span>
          )}
        </div>

        {missing.length > 0 && (
          <div className="rounded-xl bg-[rgba(234,179,8,0.1)] ring-1 ring-[rgba(234,179,8,0.25)] px-3 py-2.5">
            <p className="text-[11px] font-semibold text-[#a16207] m-0 mb-1">
              Falta para un aviso más completo
            </p>
            <p className="text-[11px] text-[#a16207]/90 m-0">
              {missing.map((f) => FIELD_LABELS[f] || f).join(' · ')}
            </p>
          </div>
        )}
      </div>

      <div className={`${publishCard} p-4`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] m-0 mb-2">
          Alcance estimado (promocionado)
        </p>
        <PublishReachLines draft={draft} variant="stack" />
      </div>
    </div>
  );
}
