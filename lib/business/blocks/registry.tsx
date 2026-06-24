'use client';

import type { ReactNode } from 'react';
import type { ProfileBlock } from '@/types/business';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import type { HeroVariant } from '@/lib/business/templates/registry';
import BusinessHighlights from '@/components/business/public/BusinessHighlights';
import BusinessCatalogTab from '@/components/business/public/BusinessCatalogTab';
import BusinessDealsTab from '@/components/business/public/BusinessDealsTab';
import BusinessReviewsTab from '@/components/business/public/BusinessReviewsTab';
import BusinessInfoTab from '@/components/business/public/BusinessInfoTab';
import BusinessCustomBlocks from '@/components/business/public/BusinessCustomBlocks';
import HeroRenderer from '@/components/business/public/heroes/HeroRenderer';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { getTemplateById } from '@/lib/business/templates/registry';
import { resolveLinktreeBlocks } from '@/lib/business/social-display';
import { IconWhatsapp } from '@/components/Icons';

export interface RenderBlockOptions {
  hideStickyCta?: boolean;
}

export function renderProfileBlock(
  block: ProfileBlock,
  ctx: BlockRenderContext,
  heroVariant: HeroVariant,
  options?: RenderBlockOptions
): ReactNode {
  if (!block.visible) return null;

  const { profile, adisos, catalogProducts, showEditControls, onEditPart, onEditProduct, addItem, reviewAggregate } =
    ctx;
  const catalogView =
    (block.config.viewMode as 'grid' | 'list' | 'feed' | undefined) ||
    ctx.defaultCatalogView ||
    'grid';

  switch (block.type) {
    case 'hero':
      return (
        <HeroRenderer
          key={block.id}
          variant={heroVariant}
          profile={profile}
          showEditControls={showEditControls}
          onEditPart={onEditPart}
          reviewAggregate={reviewAggregate}
          embedded={ctx.isPreview}
          onOpenQr={ctx.onOpenQr}
        />
      );
    case 'highlights':
      return (
        <BusinessHighlights
          key={block.id}
          announcementText={profile.announcement_text}
          announcementActive={profile.announcement_active}
        />
      );
    case 'catalog': {
      const template = getTemplateById(profile.template_id || 'modern_tabs');
      return (
        <BusinessCatalogTab
          key={block.id}
          profile={profile}
          adisos={adisos}
          catalogProducts={catalogProducts}
          showEditControls={showEditControls}
          onEditProduct={onEditProduct}
          onEditPart={onEditPart}
          addItem={addItem}
          defaultViewMode={catalogView}
          showPinnedCarousel={template.catalogPresentation === 'pinned_carousel'}
          visible
        />
      );
    }
    case 'deals':
      return profile.slug ? (
        <BusinessDealsTab
          key={block.id}
          slug={profile.slug}
          businessName={profile.name || 'Negocio'}
          adisos={adisos}
        />
      ) : null;
    case 'links': {
      const linkBlocks = resolveLinktreeBlocks(profile);
      if (!linkBlocks.length) return null;
      return (
        <div key={block.id} className="max-w-6xl mx-auto px-4 py-4">
          <BusinessCustomBlocks blocks={linkBlocks} />
        </div>
      );
    }
    case 'reviews':
      return profile.slug ? (
        <BusinessReviewsTab key={block.id} slug={profile.slug} />
      ) : null;
    case 'map':
      return (
        <div key={block.id} className="max-w-6xl mx-auto px-4 py-8">
          <BusinessInfoTab profile={profile} adisos={adisos} showCustomLinks={false} />
        </div>
      );
    case 'text':
    case 'timeline':
    case 'portfolio':
    case 'case_study':
    case 'faq':
    case 'team': {
      const title = (block.config.title as string) || '';
      const markdown =
        (block.config.markdown as string) ||
        (block.config.body as string) ||
        '';
      if (!markdown && !title) return null;
      return (
        <div key={block.id} className="max-w-2xl mx-auto px-4 py-6">
          {title ? (
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{title}</h3>
          ) : null}
          {markdown ? (
            <div className="bg-[var(--bp-surface)] rounded-[var(--bp-radius)] p-6 border border-[var(--bp-border)] text-[var(--bp-text-muted)] text-sm leading-relaxed whitespace-pre-wrap">
              {markdown}
            </div>
          ) : null}
        </div>
      );
    }
    case 'embed': {
      const url = (block.config.url as string) || '';
      if (!url) return null;
      const safe = url.startsWith('https://') ? url : null;
      if (!safe) return null;
      return (
        <div key={block.id} className="max-w-4xl mx-auto px-4 py-6">
          <iframe
            title="Embed"
            src={safe}
            className="w-full aspect-video rounded-[var(--bp-radius)] border border-[var(--bp-border)]"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    }
    case 'cta':
      if (options?.hideStickyCta) return null;
      return profile.contact_whatsapp ? (
        <div key={block.id} className="hidden md:block sticky bottom-0 z-40 bg-[var(--bp-surface)] border-t border-[var(--bp-border)] p-4 print:hidden">
          <a
            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            className="max-w-md mx-auto flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-[var(--bp-radius)] font-bold active:scale-[0.98] transition-transform"
          >
            <IconWhatsapp size={20} /> Contáctanos por WhatsApp
          </a>
        </div>
      ) : null;
    default:
      return null;
  }
}
