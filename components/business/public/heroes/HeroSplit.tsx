'use client';

import { useEffect, useState } from 'react';
import { IconEdit, IconMapMarkerAlt, IconVerified } from '@/components/Icons';
import HeroQrButton from '@/components/business/qr/HeroQrButton';
import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import { cn } from '@/lib/utils';
import { isBusinessOpenNow } from '@/lib/business/hours';

interface HeroSplitProps {
  profile: Partial<BusinessProfile>;
  showEditControls?: boolean;
  onEditPart?: (part: string) => void;
  reviewAggregate?: BusinessReviewAggregate | null;
  embedded?: boolean;
  onOpenQr?: () => void;
}

export default function HeroSplit({
  profile,
  showEditControls,
  onEditPart,
  reviewAggregate,
  embedded = false,
  onOpenQr,
}: HeroSplitProps) {
  const [mounted, setMounted] = useState(false);
  const [openStatus, setOpenStatus] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    setOpenStatus(isBusinessOpenNow(profile.business_hours));
  }, [profile.business_hours]);

  return (
    <div className={cn('bg-[var(--bg-primary)] shadow-sm relative z-10', embedded ? 'pt-0 py-4' : 'pt-16')}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative group rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
            {profile.banner_url ? (
              <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--brand-color)] to-slate-900" />
            )}
            {showEditControls && (
              <button
                type="button"
                onClick={() => onEditPart?.('visual')}
                className="absolute top-4 right-16 bg-black/40 text-white p-2 rounded-full z-20"
              >
                <IconEdit size={18} />
              </button>
            )}
            {onOpenQr && (
              <div className="absolute top-4 right-4 z-30">
                <HeroQrButton onClick={onOpenQr} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                    {profile.name?.[0] || 'N'}
                  </div>
                )}
              </div>
              {profile.is_verified !== false && (
                <span className="bg-blue-500 text-white p-1 rounded-full">
                  <IconVerified size={14} />
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">{profile.name}</h1>
            {profile.tagline && (
              <p className="text-[var(--text-secondary)] mt-2">{profile.tagline}</p>
            )}
            {reviewAggregate && reviewAggregate.review_count > 0 && (
              <p className="text-amber-500 font-bold mt-2">
                ★ {reviewAggregate.avg_rating.toFixed(1)} ({reviewAggregate.review_count})
              </p>
            )}
            <div className="text-[var(--text-secondary)] mt-4 text-sm leading-relaxed">
              {profile.description || 'Bienvenido a nuestra tienda.'}
            </div>
            {mounted && openStatus !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 mt-4 px-3 py-1 rounded-full text-sm font-bold',
                  openStatus ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                )}
              >
                {openStatus ? 'Abierto ahora' : 'Cerrado'}
              </span>
            )}
            {profile.contact_address && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2 flex items-center gap-1">
                <IconMapMarkerAlt size={12} /> {profile.contact_address}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
