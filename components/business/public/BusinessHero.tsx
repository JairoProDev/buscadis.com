'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IconEdit, IconMapMarkerAlt, IconVerified } from '@/components/Icons';
import HeroQrButton from '@/components/business/qr/HeroQrButton';
import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import { cn } from '@/lib/utils';
import { isBusinessOpenNow } from '@/lib/business/hours';

interface BusinessHeroProps {
  profile: Partial<BusinessProfile>;
  showEditControls?: boolean;
  onEditPart?: (part: string) => void;
  reviewAggregate?: BusinessReviewAggregate | null;
  embedded?: boolean;
  onOpenQr?: () => void;
}

export default function BusinessHero({
  profile,
  showEditControls,
  onEditPart,
  reviewAggregate,
  embedded = false,
  onOpenQr,
}: BusinessHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [openStatus, setOpenStatus] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    setOpenStatus(isBusinessOpenNow(profile.business_hours));
  }, [profile.business_hours]);

  return (
    <div className={cn('bg-[var(--bp-surface)] pb-2 shadow-sm relative z-10', embedded ? 'pt-0' : 'pt-2')}>
      <div
        className={cn(
          'w-full max-w-[1100px] mx-auto relative group overflow-hidden bg-[var(--bg-secondary)] shadow-sm',
          embedded ? 'h-[120px] rounded-t-xl' : 'h-[200px] md:h-[350px] md:rounded-b-xl'
        )}
      >
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="Portada"
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[var(--brand-color)] to-slate-800 opacity-90" />
        )}
        {showEditControls && (
          <button
            type="button"
            onClick={() => onEditPart?.('visual')}
            className="absolute top-4 right-16 md:right-16 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20"
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

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className={cn('flex flex-row items-end md:items-start gap-4 relative z-20 mb-4', embedded ? '-mt-8' : '-mt-12 md:-mt-24')}>
          <motion.div initial={false} className="shrink-0 relative">
            <div
              className={cn(
                'rounded-full border-[var(--bp-surface)] bg-[var(--bp-surface)] shadow-xl overflow-hidden relative group/logo',
                embedded
                  ? 'w-16 h-16 border-2'
                  : 'w-24 h-24 md:w-48 md:h-48 border-4 md:border-[6px]'
              )}
            >
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt="Logo"
                  className={cn(
                    'w-full h-full',
                    profile.logo_url.toLowerCase().includes('.svg')
                      ? 'object-contain p-2 bg-white'
                      : 'object-cover'
                  )}
                />
              ) : (
                <div className="w-full h-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl md:text-5xl font-bold text-[var(--bp-text-muted)]">
                  {profile.name?.substring(0, 1) || 'N'}
                </div>
              )}
              {showEditControls && (
                <button
                  type="button"
                  onClick={() => onEditPart?.('logo')}
                  className="absolute inset-0 bg-black/30 opacity-100 md:opacity-0 md:group-hover/logo:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <IconEdit size={24} />
                </button>
              )}
            </div>
            {profile.is_verified !== false && (
              <div
                className="absolute bottom-1 right-1 md:bottom-3 md:right-3 bg-blue-500 text-white p-1 rounded-full border-2 border-[var(--bp-surface)] shadow-sm"
                title="Verificado"
              >
                <IconVerified size={12} className="md:w-5 md:h-5" />
              </div>
            )}
          </motion.div>

          <div className="flex-1 pb-1 md:pt-28 md:pb-0 min-w-0">
            <h1 className="text-2xl md:text-5xl font-black text-[var(--bp-text)] tracking-tight leading-tight line-clamp-2 md:line-clamp-none">
              {profile.name || 'Mi Negocio'}
            </h1>
            {profile.tagline && (
              <p className="text-sm md:text-base text-[var(--bp-text-muted)] font-medium mt-1">{profile.tagline}</p>
            )}
            <p className="text-xs md:text-base text-[var(--text-tertiary)] font-medium truncate">@{profile.slug}</p>
            {reviewAggregate && reviewAggregate.review_count > 0 && (
              <p className="text-sm text-amber-500 font-bold mt-1">
                ★ {reviewAggregate.avg_rating.toFixed(1)} ({reviewAggregate.review_count} reseñas)
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:ml-[220px]">
          <div className="flex-1">
            <div className="text-[var(--bp-text-muted)] text-sm md:text-lg font-medium leading-relaxed mb-3">
              {profile.description || 'Bienvenido a nuestra tienda oficial.'}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--bp-text-muted)]">
              {profile.contact_address && (
                <span className="flex items-center gap-1">
                  <IconMapMarkerAlt size={14} /> {profile.contact_address}
                </span>
              )}
              {mounted && openStatus !== null && (
                <span
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full',
                    openStatus ? 'text-green-600 bg-green-500/10' : 'text-red-600 bg-red-500/10'
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      openStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    )}
                  />
                  {openStatus ? 'Abierto ahora' : 'Cerrado'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
