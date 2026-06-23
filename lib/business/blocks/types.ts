import type { BusinessProfile, ProfileBlock, BusinessReviewAggregate } from '@/types/business';
import type { Adiso } from '@/types';
import type { BusinessViewMode } from '@/components/business/public/BusinessProfileShell.types';

export interface CartAddItem {
  productId: string;
  title: string;
  price?: number;
  imageUrl?: string;
}

export interface BlockRenderContext {
  profile: Partial<BusinessProfile>;
  adisos: Adiso[];
  catalogProducts: { id: string; updated_at?: string; images?: unknown }[];
  blocks: ProfileBlock[];
  showEditControls: boolean;
  isPreview?: boolean;
  viewMode?: BusinessViewMode;
  reviewAggregate?: BusinessReviewAggregate | null;
  hideMobileActionBar?: boolean;
  onEditPart?: (part: string) => void;
  onEditProduct?: (product: Adiso) => void;
  addItem: (item: CartAddItem) => void;
  defaultCatalogView?: 'grid' | 'list' | 'feed';
  onOpenQr?: () => void;
}
