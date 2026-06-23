'use client';

import HeroCoverCenter from './HeroCoverCenter';
import HeroSplit from './HeroSplit';
import HeroMinimal from './HeroMinimal';
import HeroBento from './HeroBento';
import type { HeroVariant } from '@/lib/business/templates/registry';
import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';

export interface HeroRendererProps {
  variant: HeroVariant;
  profile: Partial<BusinessProfile>;
  showEditControls?: boolean;
  onEditPart?: (part: string) => void;
  reviewAggregate?: BusinessReviewAggregate | null;
  embedded?: boolean;
  onOpenQr?: () => void;
}

export default function HeroRenderer({
  variant,
  profile,
  showEditControls,
  onEditPart,
  reviewAggregate,
  embedded = false,
  onOpenQr,
}: HeroRendererProps) {
  const common = { profile, showEditControls, onEditPart, reviewAggregate, embedded, onOpenQr };
  switch (variant) {
    case 'split':
      return <HeroSplit {...common} />;
    case 'minimal_logo':
      return <HeroMinimal {...common} />;
    case 'bento_header':
      return <HeroBento {...common} />;
    case 'cover_center':
    default:
      return <HeroCoverCenter {...common} />;
  }
}
