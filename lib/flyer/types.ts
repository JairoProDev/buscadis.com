import type { Categoria } from '@/types';

export type FlyerTemplateId =
  | 'bold-type'
  | 'diagonal-band'
  | 'minimal-cream'
  | 'marketplace-tag'
  | 'gradient-dusk'
  | 'split'
  | 'urgent'
  | 'negocio';

export type FlyerConfig = {
  primary?: string;
  secondary?: string;
  align?: 'left' | 'center';
  badge?: string;
  showPrice?: boolean;
  showLocation?: boolean;
  showCategory?: boolean;
  titleScale?: 's' | 'm' | 'l';
};

export type FlyerContent = {
  title: string;
  priceLabel?: string | null;
  locationLabel?: string | null;
  categoryLabel?: string | null;
  categoria?: Categoria | string;
};

export type FlyerTemplateMeta = {
  id: FlyerTemplateId;
  label: string;
  defaultConfig?: Partial<FlyerConfig>;
};

export const DEFAULT_FLYER_TEMPLATE: FlyerTemplateId = 'bold-type';
