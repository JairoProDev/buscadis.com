'use client';

import { IconEdit, IconVerified } from '@/components/Icons';
import HeroQrButton from '@/components/business/qr/HeroQrButton';
import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import { cn } from '@/lib/utils';

interface HeroMinimalProps {
  profile: Partial<BusinessProfile>;
  showEditControls?: boolean;
  onEditPart?: (part: string) => void;
  reviewAggregate?: BusinessReviewAggregate | null;
  embedded?: boolean;
  onOpenQr?: () => void;
}

export default function HeroMinimal({
  profile,
  showEditControls,
  onEditPart,
  reviewAggregate,
  embedded = false,
  onOpenQr,
}: HeroMinimalProps) {
  return (
    <div className={cn('bg-[var(--bg-primary)] pb-8 text-center relative z-10', embedded ? 'pt-4' : 'pt-20')}>
      {onOpenQr && (
        <div className="absolute top-4 right-4 z-30">
          <HeroQrButton onClick={onOpenQr} />
        </div>
      )}
      <div className="max-w-xl mx-auto px-4">
        <div className="relative inline-block group mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--border-subtle)] mx-auto bg-white shadow-md">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-300">
                {profile.name?.[0] || 'N'}
              </div>
            )}
          </div>
          {profile.is_verified !== false && (
            <span className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
              <IconVerified size={12} />
            </span>
          )}
          {showEditControls && (
            <button
              type="button"
              onClick={() => onEditPart?.('logo')}
              className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
            >
              <IconEdit size={20} />
            </button>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">{profile.name}</h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">@{profile.slug}</p>
        {profile.tagline && (
          <p className="text-[var(--text-secondary)] mt-3 font-medium">{profile.tagline}</p>
        )}
        {reviewAggregate && reviewAggregate.review_count > 0 && (
          <p className="text-amber-500 font-bold mt-2 text-sm">
            ★ {reviewAggregate.avg_rating.toFixed(1)} · {reviewAggregate.review_count} reseñas
          </p>
        )}
        <div className="text-[var(--text-secondary)] mt-4 text-sm leading-relaxed max-w-md mx-auto">
          {profile.description || 'Bienvenido.'}
        </div>
      </div>
    </div>
  );
}
