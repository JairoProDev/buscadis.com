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

interface ProfileHeroOverlapProps {
  entity: ProfileEntity;
  banner: BannerConfig;
  onBannerCtaClick?: () => void;
  className?: string;
}

export default function ProfileHeroOverlap({
  entity,
  banner,
  onBannerCtaClick,
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
      <div className="relative w-full h-[200px] sm:h-[240px] md:h-[280px] overflow-hidden bg-gradient-to-br from-[var(--brand-color)] to-slate-800 border-b border-[var(--border-subtle)]">
        {hasImage && imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
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
          <div className="absolute bottom-4 right-4 z-20">
            {ctaHref ? (
              <a
                href={ctaHref}
                target={cta.action === 'whatsapp' ? '_blank' : undefined}
                rel={cta.action === 'whatsapp' ? 'noreferrer' : undefined}
                onClick={onBannerCtaClick}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-sm font-bold shadow-lg hover:bg-white transition-colors"
              >
                {cta.label || 'Contactar'}
              </a>
            ) : (
              <button
                type="button"
                onClick={onBannerCtaClick}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-sm font-bold shadow-lg"
              >
                {cta.label || 'Ver más'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="-mt-[4.25rem] sm:-mt-[4.75rem] flex items-end gap-4">
          <div className="shrink-0 w-[104px] h-[104px] sm:w-[120px] sm:h-[120px] rounded-2xl border-4 border-[var(--bg-secondary)] bg-[var(--bg-primary)] shadow-lg overflow-hidden">
            {entity.avatarUrl ? (
              <img
                src={entity.avatarUrl}
                alt={entity.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--brand-color)]/15 text-2xl font-black text-[var(--brand-color)]">
                {entity.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
