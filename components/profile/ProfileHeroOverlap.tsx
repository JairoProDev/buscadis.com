'use client';

import type { BannerConfig } from '@buscadis/profile-engine';
import type { ProfileEntity } from '@buscadis/profile-engine';
import { cn } from '@/lib/utils';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { profilePageContainerClass } from '@/lib/business/profile-layout';
import type { ReactNode } from 'react';

const TEXT_SIZE: Record<string, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export const PROFILE_AVATAR_SIZE = {
  mobile: 112,
  desktop: 128,
} as const;

interface ProfileHeroOverlapProps {
  entity: ProfileEntity;
  banner: BannerConfig;
  onBannerCtaClick?: () => void;
  /** Si true, solo renderiza el banner (avatar va en el shell junto a métricas). */
  bannerOnly?: boolean;
  showEditControls?: boolean;
  onEditBanner?: () => void;
  /** Barra superior (editar, QR, compartir) dentro del banner. */
  headerSlot?: ReactNode;
  className?: string;
}

export function ProfileAvatar({
  entity,
  className,
  size = 'md',
}: {
  entity: ProfileEntity;
  className?: string;
  size?: 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-[128px] h-[128px]' : 'w-[112px] h-[112px] sm:w-[128px] sm:h-[128px]';
  return (
    <div
      className={cn(
        'shrink-0 rounded-2xl border-4 border-[var(--bg-secondary)] bg-[var(--bg-primary)] shadow-lg overflow-hidden',
        dim,
        className
      )}
    >
      {entity.avatarUrl ? (
        <img src={entity.avatarUrl} alt={entity.displayName} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[var(--brand-color)]/15 text-3xl font-black text-[var(--brand-color)]">
          {entity.displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function ProfileHeroOverlap({
  entity,
  banner,
  onBannerCtaClick,
  bannerOnly = false,
  showEditControls = false,
  onEditBanner,
  headerSlot,
  className,
}: ProfileHeroOverlapProps) {
  const hasImage = banner.mode === 'image' && Boolean(entity.bannerImageUrl || banner.imageUrl);
  const imageUrl = entity.bannerImageUrl || banner.imageUrl;
  const cta = banner.cta;

  const ctaHref =
    cta?.action === 'whatsapp' && entity.contactWhatsapp
      ? getWhatsappUrl(entity.contactWhatsapp, entity.displayName)
      : cta?.href;

  return (
    <div className={cn('relative w-full', className)}>
      <div className={profilePageContainerClass('pt-2 sm:pt-3')}>
        <div
          className={cn(
            'relative w-full overflow-hidden bg-gradient-to-br from-[var(--brand-color)] via-[var(--brand-color)] to-[var(--brand-accent)] shadow-sm',
            'h-[180px] sm:h-[200px] md:h-[220px] rounded-2xl md:rounded-3xl'
          )}
        >
          {headerSlot && (
            <div
              className="absolute top-0 inset-x-0 z-20"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.25rem)' }}
            >
              {headerSlot}
            </div>
          )}

          {hasImage && imageUrl ? (
            <>
              <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/25"
                aria-hidden
              />
            </>
          ) : banner.mode === 'text' && banner.text?.content ? (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center px-8',
                banner.text.align === 'left' && 'justify-start',
                banner.text.align === 'right' && 'justify-end'
              )}
            >
              <p
                className={cn(
                  'font-bold text-white drop-shadow-lg max-w-lg',
                  TEXT_SIZE[banner.text.size || 'lg']
                )}
                style={{ color: banner.text.color || undefined }}
              >
                {banner.text.content}
              </p>
            </div>
          ) : null}

          {showEditControls && onEditBanner && (
            <button
              type="button"
              onClick={onEditBanner}
              className="absolute top-12 right-3 z-30 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-bold backdrop-blur-sm hover:bg-black/65 transition-colors"
            >
              Cambiar banner
            </button>
          )}

          {banner.fadeBottom === true && (
            <div
              className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent pointer-events-none rounded-b-2xl md:rounded-b-3xl"
              aria-hidden
            />
          )}

          {cta && (ctaHref || cta.action === 'cart') && (
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
              {ctaHref ? (
                <a
                  href={ctaHref}
                  target={cta.action === 'whatsapp' ? '_blank' : undefined}
                  rel={cta.action === 'whatsapp' ? 'noreferrer' : undefined}
                  onClick={onBannerCtaClick}
                  className="inline-flex items-center px-3 py-2 sm:px-4 rounded-xl bg-white/95 text-slate-900 text-xs sm:text-sm font-bold shadow-lg hover:bg-white transition-colors"
                >
                  {cta.label || 'Contactar'}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onBannerCtaClick}
                  className="inline-flex items-center px-3 py-2 rounded-xl bg-white/95 text-slate-900 text-xs sm:text-sm font-bold shadow-lg"
                >
                  {cta.label || 'Ver más'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!bannerOnly && (
        <div className={cn(profilePageContainerClass(), 'relative z-10')}>
          <div className="-mt-14 sm:-mt-16">
            <ProfileAvatar entity={entity} />
          </div>
        </div>
      )}
    </div>
  );
}
