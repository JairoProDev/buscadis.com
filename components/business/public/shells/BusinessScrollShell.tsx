'use client';

import type { ReactNode } from 'react';
import type { ProfileBlock } from '@/types/business';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import type { HeroVariant } from '@/lib/business/templates/registry';
import BusinessActionBar from '@/components/business/public/BusinessActionBar';

interface BusinessScrollShellProps {
  blocks: ProfileBlock[];
  ctx: BlockRenderContext;
  heroVariant: HeroVariant;
  renderBlock: (block: ProfileBlock) => ReactNode;
  isOwner?: boolean;
  cartCount?: number;
  onShare?: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  onOpenQr?: () => void;
}

export default function BusinessScrollShell({
  blocks,
  ctx,
  renderBlock,
  isOwner,
  cartCount,
  onShare,
  onOpenCart,
  onEditPart,
  onOpenQr,
}: BusinessScrollShellProps) {
  const heroIdx = blocks.findIndex((b) => b.type === 'hero');
  const heroBlock = heroIdx >= 0 ? blocks[heroIdx] : null;
  const afterHero = blocks.filter((_, i) => i !== heroIdx);

  return (
    <>
      {heroBlock && renderBlock(heroBlock)}
      <BusinessActionBar
        profile={ctx.profile}
        isOwner={isOwner}
        cartCount={cartCount}
        onShare={onShare || (() => {})}
        onOpenCart={onOpenCart}
        onEditPart={onEditPart || ctx.onEditPart}
        onOpenQr={onOpenQr || ctx.onOpenQr}
      />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {afterHero.map((block) => (
          <section key={block.id} id={`block-${block.type}`}>
            {renderBlock(block)}
          </section>
        ))}
      </div>
    </>
  );
}
