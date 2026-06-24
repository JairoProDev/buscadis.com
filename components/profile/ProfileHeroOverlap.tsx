'use client';

import type { BannerConfig } from '@buscadis/profile-engine';
import type { ProfileEntity } from '@buscadis/profile-engine';
import { cn } from '@/lib/utils';
import { getWhatsappUrl } from '@/lib/business/public-utils';

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
  className,
}: ProfileHeroOverlapProps) {
  const hasImage = banner.mode === 'image' && Boolean(banner.imageUrl || entity.bannerImageUrl);
  const imageUrl = banner.imageUrl || entity.bannerImageUrl;
  const cta = banner.cta;

  const ctaHref =
    cta?.action === 'whatsapp' && entity.contactWhatsapp
      ? getWhatsappUrl(entity.contactWhatsapp, entity.displayName)
      : cta?.href;

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden bg-gradient-to-br from-[var(--brand-color)] to-slate-800 border-b border-[var(--border-subtle)]">
        {hasImage && imageUrl ? (
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
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

        {banner.fadeBottom === true && (
          <div
            className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent pointer-events-none"
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

      {!bannerOnly && (
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="-mt-14 sm:-mt-16">
            <ProfileAvatar entity={entity} />
          </div>
        </div>
      )}
    </div>
  );
}
