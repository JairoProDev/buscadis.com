'use client';

import { useMemo, useState, useEffect } from 'react';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import { getVisibleBlocks, getDefaultTabId } from '@/lib/business/blocks/normalize';
import { renderProfileBlock } from '@/lib/business/blocks/registry';
import { getTemplateById } from '@/lib/business/templates/registry';
import type { CtaPlacement } from '@/lib/business/templates/registry';
import BusinessTabShell from '@/components/business/public/shells/BusinessTabShell';
import BusinessScrollShell from '@/components/business/public/shells/BusinessScrollShell';

interface BlockRendererEngineProps {
  ctx: BlockRenderContext;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOwner?: boolean;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  ctaPlacement?: CtaPlacement;
}

export default function BlockRendererEngine({
  ctx,
  activeTab: controlledTab,
  onTabChange,
  isOwner,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
  ctaPlacement = 'sticky_bar',
}: BlockRendererEngineProps) {
  const template = getTemplateById(ctx.profile.template_id || 'modern_tabs');
  const visibleBlocks = useMemo(() => getVisibleBlocks(ctx.blocks), [ctx.blocks]);
  const defaultTab = useMemo(() => getDefaultTabId(ctx.blocks), [ctx.blocks]);

  const [internalTab, setInternalTab] = useState(defaultTab);
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;

  useEffect(() => {
    if (!controlledTab) {
      setInternalTab((prev) => {
        const tabs = visibleBlocks
          .filter((b) => !['hero', 'highlights', 'cta'].includes(b.type))
          .map((b) => getDefaultTabId([b]))
          .filter(Boolean);
        if (tabs.includes(prev)) return prev;
        return defaultTab;
      });
    }
  }, [defaultTab, controlledTab, visibleBlocks]);

  const heroVariant = template.heroVariant;
  const hideStickyCta = ctaPlacement === 'floating' || ctx.hideMobileActionBar;

  if (template.paradigm === 'scroll') {
    return (
      <BusinessScrollShell
        blocks={visibleBlocks}
        ctx={ctx}
        heroVariant={heroVariant}
        renderBlock={(block) => renderProfileBlock(block, ctx, heroVariant, { hideStickyCta })}
        isOwner={isOwner}
        cartCount={cartCount}
        onShare={onShare}
        onOpenCart={onOpenCart}
        onEditPart={onEditPart}
      />
    );
  }

  return (
    <BusinessTabShell
      blocks={visibleBlocks}
      ctx={ctx}
      heroVariant={heroVariant}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      adisosCount={ctx.adisos.length}
      renderBlock={(block) => renderProfileBlock(block, ctx, heroVariant, { hideStickyCta })}
      isOwner={isOwner}
      cartCount={cartCount}
      onShare={onShare}
      onOpenCart={onOpenCart}
      onEditPart={onEditPart}
    />
  );
}
