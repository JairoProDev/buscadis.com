'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import type { ProfileBlock } from '@/types/business';
import type { SocialInsight } from '@buscadis/profile-engine';
import { resolveProfilePresentation, isSlotVisible } from '@buscadis/profile-engine';
import {
  businessProfileToEntity,
  resolveBusinessProfileLayout,
  resolveBusinessProfileStyle,
} from '@/lib/profile/adapters/business-adapter';
import { blockTypeToTabId, getDefaultTabId, getVisibleBlocks } from '@/lib/business/blocks/normalize';
import ProfileChrome from '@/components/profile/ProfileChrome';
import type { ProfileMenuItem } from '@/components/profile/ProfileChromeMenu';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';
import ProfileHeroOverlap from '@/components/profile/ProfileHeroOverlap';
import ProfileMetrics from '@/components/profile/ProfileMetrics';
import ProfileIdentityRow from '@/components/profile/ProfileIdentityRow';
import ProfileExpandableBio from '@/components/profile/ProfileExpandableBio';
import ProfileHashtags from '@/components/profile/ProfileHashtags';
import ProfileSocialProof from '@/components/profile/ProfileSocialProof';
import ProfileStoryHighlights from '@/components/profile/ProfileStoryHighlights';
import ProfileStickyCta from '@/components/profile/ProfileStickyCta';
import BusinessSocialStrip from '@/components/business/public/BusinessSocialStrip';
import BusinessOwnerBanner from '@/components/business/public/BusinessOwnerBanner';
import { profileIsOrphan } from '@/lib/business/social-display';
import {
  IconStore,
  IconMapMarkerAlt,
  IconHeart,
  IconStar,
} from '@/components/Icons';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const TAB_META: Record<string, { label: string; icon: ReactNode }> = {
  catalogo: { label: 'Catálogo', icon: <IconStore size={18} /> },
  contenido: { label: 'Contenido', icon: <IconStore size={18} /> },
  inicio: { label: 'Información', icon: <IconMapMarkerAlt size={18} /> },
  feed: { label: 'Deals', icon: <IconHeart size={18} /> },
  resenas: { label: 'Reseñas', icon: <IconStar size={18} /> },
};

interface ProfileWireframeShellProps {
  ctx: BlockRenderContext;
  renderBlock: (block: ProfileBlock) => ReactNode;
  isOwner?: boolean;
  canEdit?: boolean;
  isEditor?: boolean;
  isLoggedIn?: boolean;
  userEmail?: string | null;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  onOpenEditor?: () => void;
  onOpenQr?: () => void;
  onWhatsappClick?: () => void;
}

export default function ProfileWireframeShell({
  ctx,
  renderBlock,
  isOwner,
  canEdit,
  isEditor,
  isLoggedIn,
  userEmail,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
  onOpenEditor,
  onOpenQr,
  onWhatsappClick,
}: ProfileWireframeShellProps) {
  const profile = ctx.profile;
  const entity = useMemo(
    () =>
      businessProfileToEntity(profile, {
        reviewAggregate: ctx.reviewAggregate ?? undefined,
        productCount: ctx.adisos.length,
      }),
    [profile, ctx.reviewAggregate, ctx.adisos.length]
  );

  const layout = useMemo(() => resolveBusinessProfileLayout(profile), [profile]);
  const styleSchema = useMemo(() => resolveBusinessProfileStyle(profile), [profile]);
  const presentation = useMemo(
    () => resolveProfilePresentation(entity, layout, styleSchema, profile.banner_config || undefined),
    [entity, layout, styleSchema, profile.banner_config]
  );

  const visibleBlocks = getVisibleBlocks(ctx.blocks);
  const contentBlocks = visibleBlocks.filter((b) => !['hero', 'highlights', 'cta'].includes(b.type));
  const tabs = Array.from(
    new Set(
      contentBlocks
        .map((b) => blockTypeToTabId(b.type))
        .filter((t): t is string => Boolean(t))
    )
  );
  const defaultTab = getDefaultTabId(ctx.blocks);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [socialInsights, setSocialInsights] = useState<SocialInsight[]>([]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!profile.slug || !isSlotVisible(presentation.layout, 'profile_social_proof')) return;
    let cancelled = false;
    fetch(`/api/business/${encodeURIComponent(profile.slug)}/social-insights`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.insights)) {
          setSocialInsights(data.insights);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile.slug, presentation.layout]);

  const blocksByTab = tabs.reduce<Record<string, ProfileBlock[]>>((acc, tabId) => {
    acc[tabId] = contentBlocks.filter((b) => blockTypeToTabId(b.type) === tabId);
    return acc;
  }, {});

  const highlightsBlock = visibleBlocks.find((b) => b.type === 'highlights');
  const showSticky = isSlotVisible(presentation.layout, 'profile_sticky_cta') && !ctx.hideMobileActionBar;

  const chromeMenuItems = useMemo((): ProfileMenuItem[] => {
    const shareUrl =
      typeof window !== 'undefined'
        ? window.location.href
        : getBusinessCanonicalUrl(profile.slug || '');
    return [
      {
        id: 'copy',
        label: 'Copiar enlace',
        onClick: () => {
          void navigator.clipboard?.writeText(shareUrl);
        },
      },
      {
        id: 'share',
        label: 'Compartir',
        onClick: onShare,
        hidden: !onShare,
      },
      {
        id: 'explore',
        label: 'Explorar marketplace',
        href: '/?utm_source=profile_menu',
      },
      {
        id: 'create',
        label: 'Crea tu perfil gratis',
        href: '/publicar?utm_source=profile_menu',
      },
      {
        id: 'help',
        label: 'Centro de ayuda',
        href: '/ayuda',
      },
      {
        id: 'report',
        label: 'Reportar perfil',
        href: '/ayuda?topic=reportar-perfil',
      },
    ];
  }, [profile.slug, onShare]);

  const defaultBannerCta = profile.contact_whatsapp
    ? { label: 'Contactar', action: 'whatsapp' as const }
    : undefined;

  const bannerWithCta = {
    ...presentation.banner,
    cta: presentation.banner.cta || defaultBannerCta,
  };

  return (
    <div style={presentation.cssVars as React.CSSProperties}>
      <div className="relative">
        {isSlotVisible(presentation.layout, 'profile_chrome') && (
          <ProfileChrome
            handle={entity.handle}
            onShare={onShare}
            onOpenQr={onOpenQr || ctx.onOpenQr}
            canEdit={canEdit && !isEditor}
            onEdit={onOpenEditor}
            menuItems={chromeMenuItems}
          />
        )}

        {isSlotVisible(presentation.layout, 'profile_hero') && (
          <ProfileHeroOverlap
            entity={entity}
            banner={bannerWithCta}
            onBannerCtaClick={onWhatsappClick}
          />
        )}

        <div className="max-w-6xl mx-auto px-4 -mt-2 relative z-10">
          <div className="flex items-end gap-3 sm:gap-4 pl-[112px] sm:pl-[128px] min-h-[2rem]">
            {isSlotVisible(presentation.layout, 'profile_metrics') && entity.metrics && (
              <ProfileMetrics metrics={entity.metrics} className="pt-2" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2 pb-4">
        {isSlotVisible(presentation.layout, 'profile_identity') && (
          <ProfileIdentityRow entity={entity} />
        )}

        {isSlotVisible(presentation.layout, 'profile_social_strip') && (
          <BusinessSocialStrip
            profile={profile}
            variant="chips"
            className="max-w-6xl mx-auto px-4 md:flex-wrap max-md:flex-nowrap max-md:overflow-x-auto max-md:no-scrollbar max-md:snap-x max-md:gap-3 [&_a]:max-md:shrink-0 max-md:[&_span:last-child]:hidden"
          />
        )}

        {isSlotVisible(presentation.layout, 'profile_bio') && (
          <ProfileExpandableBio text={entity.description} />
        )}

        {isSlotVisible(presentation.layout, 'profile_hashtags') && (
          <ProfileHashtags tags={entity.hashtags} />
        )}

        {isSlotVisible(presentation.layout, 'profile_social_proof') && socialInsights.length > 0 && (
          <ProfileSocialProof insights={socialInsights} />
        )}

        {isSlotVisible(presentation.layout, 'profile_story_highlights') &&
          (entity.storyHighlights?.length ? (
            <ProfileStoryHighlights highlights={entity.storyHighlights} />
          ) : (
            highlightsBlock?.visible && renderBlock(highlightsBlock)
          ))}

        {profileIsOrphan(profile) && !canEdit && (
          <BusinessOwnerBanner
            profile={profile}
            canEdit={false}
            isEditor={isEditor}
            isLoggedIn={isLoggedIn}
            userEmail={userEmail}
            onOpenEditor={onOpenEditor}
            className="!px-4 !md:pl-4"
          />
        )}
      </div>

      {isSlotVisible(presentation.layout, 'profile_sections') && tabs.length > 0 && (
        <div
          className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 sticky z-40 shadow-sm backdrop-blur-md print:hidden"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 0px)' }}
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              {tabs.map((tabId) => {
                const meta = TAB_META[tabId] || { label: tabId, icon: null };
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setActiveTab(tabId)}
                    className={cn(
                      'flex items-center gap-2 py-3.5 px-1 font-bold text-sm whitespace-nowrap border-b-2 transition-all',
                      activeTab === tabId
                        ? 'text-[var(--brand-color)] border-[var(--brand-color)]'
                        : 'text-[var(--text-tertiary)] border-transparent'
                    )}
                  >
                    {meta.icon}
                    {meta.label}
                    {tabId === 'catalogo' && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[var(--bg-secondary)]">
                        {ctx.adisos.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 min-h-[40vh]">
        {tabs.map((tabId) => (
          <div key={tabId} className={cn(activeTab !== tabId && 'hidden')}>
            {blocksByTab[tabId]?.map((b) => renderBlock(b))}
          </div>
        ))}
      </div>

      {visibleBlocks
        .filter((b) => b.type === 'cta')
        .map((b) => renderBlock(b))}

      {showSticky && (
        <ProfileStickyCta
          profile={profile}
          cartCount={cartCount}
          onOpenCart={onOpenCart}
          onShare={onShare}
          onWhatsappClick={onWhatsappClick}
        />
      )}
    </div>
  );
}
