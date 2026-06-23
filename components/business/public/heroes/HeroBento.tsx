'use client';

import { IconEdit, IconVerified, IconWhatsapp } from '@/components/Icons';
import HeroQrButton from '@/components/business/qr/HeroQrButton';
import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { cn } from '@/lib/utils';

interface HeroBentoProps {
  profile: Partial<BusinessProfile>;
  showEditControls?: boolean;
  onEditPart?: (part: string) => void;
  reviewAggregate?: BusinessReviewAggregate | null;
  embedded?: boolean;
  onOpenQr?: () => void;
}

export default function HeroBento({
  profile,
  showEditControls,
  onEditPart,
  reviewAggregate,
  embedded = false,
  onOpenQr,
}: HeroBentoProps) {
  return (
    <div className={cn('bg-[var(--bg-secondary)] pb-6 relative z-10', embedded ? 'pt-2' : 'pt-16')}>
      {onOpenQr && (
        <div className="absolute top-4 right-4 z-30 max-w-6xl mx-auto w-full px-4 flex justify-end pointer-events-none">
          <div className="pointer-events-auto">
            <HeroQrButton onClick={onOpenQr} />
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[minmax(80px,auto)]">
          <div className="col-span-2 row-span-2 bg-[var(--bg-primary)] rounded-2xl p-6 shadow-sm border border-[var(--border-subtle)] flex flex-col justify-end relative group overflow-hidden">
            {profile.banner_url && (
              <img
                src={profile.banner_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="relative z-10 flex items-end gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow bg-white shrink-0">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                    {profile.name?.[0]}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-[var(--text-primary)]">{profile.name}</h1>
                {profile.tagline && (
                  <p className="text-sm text-[var(--text-secondary)]">{profile.tagline}</p>
                )}
              </div>
            </div>
            {showEditControls && (
              <button
                type="button"
                onClick={() => onEditPart?.('visual')}
                className="absolute top-3 right-3 bg-black/40 text-white p-2 rounded-full"
              >
                <IconEdit size={16} />
              </button>
            )}
          </div>
          <div className="bg-[var(--brand-color)] text-white rounded-2xl p-4 flex flex-col justify-center">
            {reviewAggregate && reviewAggregate.review_count > 0 ? (
              <>
                <p className="text-2xl font-black">{reviewAggregate.avg_rating.toFixed(1)}</p>
                <p className="text-xs opacity-80">{reviewAggregate.review_count} reseñas</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black">★</p>
                <p className="text-xs opacity-80">Sin reseñas aún</p>
              </>
            )}
          </div>
          <div className="bg-[var(--bg-primary)] rounded-2xl p-4 border border-[var(--border-subtle)] flex items-center justify-center">
            {profile.is_verified !== false && (
              <span className="flex items-center gap-1 text-blue-600 font-bold text-sm">
                <IconVerified size={16} /> Verificado
              </span>
            )}
          </div>
          {profile.contact_whatsapp && (
            <a
              href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold transition-colors"
            >
              <IconWhatsapp size={20} /> WhatsApp
            </a>
          )}
          <div className="col-span-2 bg-[var(--bg-primary)] rounded-2xl p-4 border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] line-clamp-3">
            {profile.description || 'Explora nuestro catálogo y deals.'}
          </div>
        </div>
      </div>
    </div>
  );
}
