'use client';

import { DealPromotionTier, DEAL_TIERS } from '@/types';

interface DealBoostSelectorProps {
  value: DealPromotionTier;
  onChange: (tier: DealPromotionTier) => void;
}

export default function DealBoostSelector({ value, onChange }: DealBoostSelectorProps) {
  const tiers: DealPromotionTier[] = ['gratis', 'destacada', 'premium'];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Impulsa tu Deal en el feed</p>
      {tiers.map((t) => {
        const info = DEAL_TIERS[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              active
                ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/10'
                : 'border-[var(--border-color)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">{info.nombre}</span>
              <span className="text-sm font-semibold">
                {info.precio === 0 ? 'Gratis' : `S/ ${info.precio}`}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{info.descripcion}</p>
          </button>
        );
      })}
    </div>
  );
}
