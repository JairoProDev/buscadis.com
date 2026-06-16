import type { BusinessProfile, BusinessReviewAggregate } from '@/types/business';
import type { Adiso } from '@/types';

export type BusinessViewMode = 'storefront' | 'editor' | 'preview';

export interface BusinessProfileShellProps {
  profile: Partial<BusinessProfile> | null;
  adisos?: Adiso[];
  catalogProducts?: { id: string; updated_at?: string; images?: unknown }[];
  reviewAggregate?: BusinessReviewAggregate | null;
  viewMode?: BusinessViewMode;
  /** @deprecated use viewMode === 'preview' */
  isPreview?: boolean;
  onEditPart?: (part: string) => void;
  editMode?: boolean;
  onUpdate?: (field: keyof BusinessProfile, value: unknown) => void;
  onEditProduct?: (product: Adiso) => void;
  chatbotMinimized?: boolean;
  onToggleChatbot?: () => void;
  onTrackEvent?: (event: string) => void;
}
