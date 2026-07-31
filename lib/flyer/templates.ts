import type { Categoria } from '@/types';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
  DEFAULT_FLYER_TEMPLATE,
  type FlyerConfig,
  type FlyerTemplateId,
  type FlyerTemplateMeta,
} from './types';

export const FLYER_TEMPLATES: FlyerTemplateMeta[] = [
  { id: 'bold-type', label: 'Bold', defaultConfig: { align: 'left', titleScale: 'l' } },
  { id: 'diagonal-band', label: 'Diagonal', defaultConfig: { align: 'left', titleScale: 'l' } },
  { id: 'minimal-cream', label: 'Minimal', defaultConfig: { align: 'left', titleScale: 'm', primary: '#1e293b', secondary: '#f1f5f9' } },
  { id: 'marketplace-tag', label: 'Tag', defaultConfig: { align: 'center', titleScale: 'm' } },
  { id: 'gradient-dusk', label: 'Dusk', defaultConfig: { align: 'left', titleScale: 'l', primary: '#0f172a', secondary: '#334155' } },
  { id: 'split', label: 'Split', defaultConfig: { align: 'left', titleScale: 'm' } },
  { id: 'urgent', label: 'Oferta', defaultConfig: { align: 'center', titleScale: 'l', badge: 'OFERTA' } },
  { id: 'negocio', label: 'Negocio', defaultConfig: { align: 'left', titleScale: 'm' } },
];

export function isFlyerTemplateId(value: unknown): value is FlyerTemplateId {
  return typeof value === 'string' && FLYER_TEMPLATES.some((t) => t.id === value);
}

export function getFlyerTemplateMeta(id: FlyerTemplateId): FlyerTemplateMeta {
  return FLYER_TEMPLATES.find((t) => t.id === id) || FLYER_TEMPLATES[0];
}

/** Merge category accents + template defaults + user overrides */
export function resolveFlyerConfig(
  categoria: Categoria | string | undefined,
  templateId: FlyerTemplateId = DEFAULT_FLYER_TEMPLATE,
  overrides?: FlyerConfig | null
): Required<
  Pick<
    FlyerConfig,
    'primary' | 'secondary' | 'align' | 'showPrice' | 'showLocation' | 'showCategory' | 'titleScale'
  >
> &
  FlyerConfig {
  const theme = getCategoriaThemeTokens((categoria as Categoria) || 'productos');
  const meta = getFlyerTemplateMeta(templateId);
  const base: FlyerConfig = {
    primary: theme.accent,
    secondary: theme.placeholderBg,
    align: 'left',
    showPrice: true,
    showLocation: true,
    showCategory: true,
    titleScale: 'm',
    badge: '',
    ...meta.defaultConfig,
    ...overrides,
  };

  return {
    primary: base.primary || theme.accent,
    secondary: base.secondary || theme.placeholderBg,
    align: base.align || 'left',
    showPrice: base.showPrice !== false,
    showLocation: base.showLocation !== false,
    showCategory: base.showCategory !== false,
    titleScale: base.titleScale || 'm',
    badge: base.badge || '',
  };
}

export function defaultFlyerForCategory(categoria?: Categoria | string): {
  templateId: FlyerTemplateId;
  config: FlyerConfig;
} {
  const templateId =
    categoria === 'empleos' || categoria === 'servicios' || categoria === 'negocios'
      ? 'negocio'
      : categoria === 'productos' || categoria === 'vehiculos'
        ? 'urgent'
        : DEFAULT_FLYER_TEMPLATE;
  return {
    templateId,
    config: resolveFlyerConfig(categoria, templateId),
  };
}
