'use client';

import { FaTimes } from 'react-icons/fa';
import { IconMegaphone, IconAdis } from '@/components/Icons';
import { FREE_TIER_LIMITS } from '@/lib/publish/tiers';

interface PublishTierModalProps {
  open: boolean;
  onClose: () => void;
  onChooseFree: () => void;
  onChoosePro: () => void;
  loading?: boolean;
  loadingTier?: 'free' | 'pro' | null;
}

export default function PublishTierModal({
  open,
  onClose,
  onChooseFree,
  onChoosePro,
  loading = false,
  loadingTier = null,
}: PublishTierModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-tier-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg bg-[var(--bg-primary)] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Cerrar"
        >
          <FaTimes size={18} />
        </button>

        <h2
          id="publish-tier-title"
          className="text-lg font-extrabold text-[var(--text-primary)] m-0 mb-1 pr-8"
        >
          ¿Cómo quieres publicar?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] m-0 mb-5">
          Elige el plan que mejor se adapte a lo que necesitas.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Gratis */}
          <div className="rounded-2xl border border-[var(--border-color)] p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-9 h-9 rounded-xl bg-[rgba(var(--brand-primary-rgb),0.12)] flex items-center justify-center">
                <IconMegaphone size={18} color="var(--brand-blue)" />
              </span>
              <div>
                <p className="m-0 font-bold text-[var(--text-primary)]">Gratis</p>
                <p className="m-0 text-xs text-[var(--text-tertiary)]">S/ 0 · {FREE_TIER_LIMITS.durationHours}h en línea</p>
              </div>
            </div>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 mb-4 flex-1 m-0 pl-4 list-disc">
              <li>1 foto · texto corto ({FREE_TIER_LIMITS.maxDescChars + FREE_TIER_LIMITS.maxTitleChars} caracteres)</li>
              <li>Sin redacción con IA</li>
              <li>Sin respuestas automáticas ni campaña de interesados</li>
              <li>Historia visible solo {FREE_TIER_LIMITS.storyDurationHours}h</li>
              <li>Se archiva después de 24 horas</li>
            </ul>
            <button
              type="button"
              disabled={loading}
              onClick={onChooseFree}
              className="w-full py-2.5 rounded-xl border-2 border-[var(--brand-blue)] text-[var(--brand-blue)] font-bold text-sm hover:bg-[rgba(var(--brand-primary-rgb),0.08)] disabled:opacity-50"
            >
              {loadingTier === 'free' ? 'Publicando…' : 'Publicar gratis'}
            </button>
          </div>

          {/* Con IA */}
          <div className="rounded-2xl border-2 border-[rgba(var(--brand-yellow-rgb),0.5)] bg-[rgba(var(--brand-yellow-rgb),0.06)] p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-9 h-9 rounded-xl bg-[rgba(var(--brand-yellow-rgb),0.2)] flex items-center justify-center">
                <IconAdis size={18} color="var(--brand-yellow)" />
              </span>
              <div>
                <p className="m-0 font-bold text-[var(--text-primary)]">Con IA</p>
                <p className="m-0 text-xs text-[var(--brand-yellow)]">Recomendado · más alcance</p>
              </div>
            </div>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 mb-4 flex-1 m-0 pl-4 list-disc">
              <li>Redacción profesional con IA</li>
              <li>Varias fotos y descripción larga</li>
              <li>Respuestas automáticas a interesados</li>
              <li>Flyer y campaña de difusión</li>
              <li>Prioridad en historias · más tiempo visible</li>
            </ul>
            <button
              type="button"
              disabled={loading}
              onClick={onChoosePro}
              className="w-full py-2.5 rounded-xl bg-[var(--brand-yellow)] text-[#1c1608] font-bold text-sm shadow-[0_2px_10px_rgba(var(--brand-yellow-rgb),0.4)] hover:brightness-105 disabled:opacity-50"
            >
              {loadingTier === 'pro' ? 'Preparando…' : 'Publicar con IA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
