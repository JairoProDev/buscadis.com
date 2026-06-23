'use client';

import type { ReactNode } from 'react';
import type { ProfileBlock } from '@/types/business';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import type { HeroVariant } from '@/lib/business/templates/registry';
import { blockTypeToTabId } from '@/lib/business/blocks/normalize';
import { cn } from '@/lib/utils';
import {
  IconStore,
  IconMapMarkerAlt,
  IconHeart,
  IconStar,
} from '@/components/Icons';
import HeroRenderer from '@/components/business/public/heroes/HeroRenderer';
import BusinessActionBar from '@/components/business/public/BusinessActionBar';

const TAB_META: Record<string, { label: string; icon: ReactNode }> = {
  catalogo: { label: 'Catálogo', icon: <IconStore size={18} /> },
  inicio: { label: 'Información', icon: <IconMapMarkerAlt size={18} /> },
  feed: { label: 'Ofertas', icon: <IconHeart size={18} /> },
  resenas: { label: 'Reseñas', icon: <IconStar size={18} /> },
};

interface BusinessTabShellProps {
  blocks: ProfileBlock[];
  ctx: BlockRenderContext;
  heroVariant: HeroVariant;
  activeTab: string;
  onTabChange: (tab: string) => void;
  adisosCount: number;
  renderBlock: (block: ProfileBlock) => ReactNode;
  isOwner?: boolean;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  onOpenQr?: () => void;
}

export default function BusinessTabShell({
  blocks,
  ctx,
  heroVariant,
  activeTab,
  onTabChange,
  adisosCount,
  renderBlock,
  isOwner,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
  onOpenQr,
}: BusinessTabShellProps) {
  const heroBlock = blocks.find((b) => b.type === 'hero');
  const highlightsBlock = blocks.find((b) => b.type === 'highlights');
  const contentBlocks = blocks.filter((b) => !['hero', 'highlights', 'cta'].includes(b.type));

  const tabs = Array.from(
    new Set(
      contentBlocks
        .map((b) => blockTypeToTabId(b.type))
        .filter((t): t is string => Boolean(t))
    )
  );

  const blocksByTab = tabs.reduce<Record<string, ProfileBlock[]>>((acc, tabId) => {
    acc[tabId] = contentBlocks.filter((b) => blockTypeToTabId(b.type) === tabId);
    return acc;
  }, {});

  return (
    <>
      {heroBlock?.visible && (
        <HeroRenderer
          variant={heroVariant}
          profile={ctx.profile}
          showEditControls={ctx.showEditControls}
          onEditPart={ctx.onEditPart}
          reviewAggregate={ctx.reviewAggregate}
          embedded={ctx.isPreview}
          onOpenQr={onOpenQr || ctx.onOpenQr}
        />
      )}
      {highlightsBlock?.visible && renderBlock(highlightsBlock)}
      <BusinessActionBar
        profile={ctx.profile}
        isOwner={isOwner}
        cartCount={cartCount}
        onShare={onShare || (() => {})}
        onOpenCart={onOpenCart}
        onEditPart={onEditPart || ctx.onEditPart}
        onOpenQr={onOpenQr || ctx.onOpenQr}
        hideMobile={ctx.hideMobileActionBar}
      />
      <div className="bg-[var(--bg-primary)] pb-2 shadow-sm relative z-10">
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
                    onClick={() => onTabChange(tabId)}
                    className={cn(
                      'flex items-center gap-2 py-3.5 px-1 font-bold text-sm whitespace-nowrap border-b-2 transition-all active:scale-[0.98]',
                      activeTab === tabId
                        ? 'text-[var(--brand-color)] border-[var(--brand-color)]'
                        : 'text-[var(--text-tertiary)] border-transparent'
                    )}
                  >
                    {meta.icon}
                    {meta.label}
                    {tabId === 'catalogo' && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[var(--bg-secondary)]">
                        {adisosCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 min-h-[40vh]">
        {tabs.map((tabId) => (
          <div key={tabId} className={cn(activeTab !== tabId && 'hidden')} aria-hidden={activeTab !== tabId}>
            {blocksByTab[tabId]?.map((b) => renderBlock(b))}
          </div>
        ))}
      </div>
      {blocks
        .filter((b) => b.type === 'cta')
        .map((b) => renderBlock(b))}
    </>
  );
}
