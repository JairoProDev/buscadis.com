'use client';

import { motion } from 'framer-motion';
import { IconEdit, IconMapMarkerAlt, IconVerified } from '@/components/Icons';
import type { BusinessProfile } from '@/types/business';
import type { BusinessReviewAggregate } from '@/types/business';
import { cn } from '@/lib/utils';
import { isBusinessOpenNow } from '@/lib/business/hours';

interface BusinessHeroProps {
  profile: Partial<BusinessProfile>;
  showEditControls?: boolean;
  onEditPart?: (part: string) => void;
  reviewAggregate?: BusinessReviewAggregate | null;
}

export default function BusinessHero({
  profile,
  showEditControls,
  onEditPart,
  reviewAggregate,
}: BusinessHeroProps) {
  const openStatus = isBusinessOpenNow(profile.business_hours);

  return (
    <div className="bg-white pb-2 shadow-sm relative z-10 pt-16">
      <div className="w-full max-w-[1100px] mx-auto relative group h-[200px] md:h-[350px] overflow-hidden bg-slate-100 md:rounded-b-xl shadow-sm">
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
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <IconEdit size={18} />
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-row items-end md:items-start gap-4 -mt-12 md:-mt-24 relative z-20 mb-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="shrink-0 relative"
          >
            <div className="w-24 h-24 md:w-48 md:h-48 rounded-full border-4 md:border-[6px] border-white bg-white shadow-xl overflow-hidden relative group/logo">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl md:text-5xl font-bold text-slate-300">
                  {profile.name?.substring(0, 1) || 'N'}
                </div>
              )}
              {showEditControls && (
                <button
                  type="button"
                  onClick={() => onEditPart?.('logo')}
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <IconEdit size={24} />
                </button>
              )}
            </div>
            {profile.is_verified !== false && (
              <div
                className="absolute bottom-1 right-1 md:bottom-3 md:right-3 bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm"
                title="Verificado"
              >
                <IconVerified size={12} className="md:w-5 md:h-5" />
              </div>
            )}
          </motion.div>

          <div className="flex-1 pb-1 md:pt-28 md:pb-0 min-w-0">
            <motion.h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2 md:line-clamp-none">
              {profile.name || 'Mi Negocio'}
            </motion.h1>
            {profile.tagline && (
              <p className="text-sm md:text-base text-slate-500 font-medium mt-1">{profile.tagline}</p>
            )}
            <p className="text-xs md:text-base text-slate-400 font-medium truncate">@{profile.slug}</p>
            {reviewAggregate && reviewAggregate.review_count > 0 && (
              <p className="text-sm text-amber-600 font-bold mt-1">
                ★ {reviewAggregate.avg_rating.toFixed(1)} ({reviewAggregate.review_count} reseñas)
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:ml-[220px]">
          <div className="flex-1">
            <p className="text-slate-600 text-sm md:text-lg font-medium leading-relaxed mb-3">
              {profile.description || 'Bienvenido a nuestra tienda oficial.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {profile.contact_address && (
                <span className="flex items-center gap-1">
                  <IconMapMarkerAlt size={14} /> {profile.contact_address}
                </span>
              )}
              {openStatus !== null && (
                <span
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full',
                    openStatus ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
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
