import type { Adiso, Categoria } from '@/types';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
  DEFAULT_FLYER_TEMPLATE,
  type FlyerConfig,
  type FlyerTemplateId,
  type FlyerTemplateMeta,
} from './types';

/** Soft wash of accent — never flat gray rails */
export function softWashFromAccent(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '#f8fafc';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * 0.18 + 255 * 0.82);
  return `#${[mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export const FLYER_TEMPLATES: FlyerTemplateMeta[] = [
  { id: 'bold-type', label: 'Bold', defaultConfig: { align: 'left', titleScale: 'l', primary: '#0f172a', secondary: '#0f172a' } },
  { id: 'diagonal-band', label: 'Diagonal', defaultConfig: { align: 'left', titleScale: 'l', primary: '#0e7490', secondary: '#ecfeff' } },
  { id: 'minimal-cream', label: 'Minimal', defaultConfig: { align: 'left', titleScale: 'm', primary: '#9a3412', secondary: '#fff7ed' } },
  { id: 'marketplace-tag', label: 'Tag', defaultConfig: { align: 'center', titleScale: 'm', primary: '#c2410c', secondary: '#ffedd5' } },
  { id: 'gradient-dusk', label: 'Dusk', defaultConfig: { align: 'left', titleScale: 'l', primary: '#38bdf8', secondary: '#1e3a5f' } },
  { id: 'split', label: 'Franja', defaultConfig: { align: 'left', titleScale: 'm', primary: '#1d4ed8', secondary: '#f8fafc' } },
  { id: 'urgent', label: 'Oferta', defaultConfig: { align: 'center', titleScale: 'l', primary: '#b91c1c', secondary: '#fff1f2', badge: 'OFERTA' } },
  { id: 'negocio', label: 'Negocio', defaultConfig: { align: 'left', titleScale: 'm', primary: '#0f766e', secondary: '#f0fdfa' } },
  { id: 'poster-serif', label: 'Póster', defaultConfig: { align: 'center', titleScale: 'l', primary: '#312e81', secondary: '#312e81' } },
  { id: 'ribbon', label: 'Cinta', defaultConfig: { align: 'left', titleScale: 'm', primary: '#6d28d9', secondary: '#f5f3ff' } },
  { id: 'duo-tone', label: 'Dúo', defaultConfig: { align: 'left', titleScale: 'l', primary: '#0f172a', secondary: '#fde68a' } },
  { id: 'editorial', label: 'Editorial', defaultConfig: { align: 'left', titleScale: 'm', primary: '#92400e', secondary: '#fef3c7' } },
  { id: 'stamp', label: 'Sello', defaultConfig: { align: 'center', titleScale: 'm', primary: '#b45309', secondary: '#fffbeb' } },
  { id: 'soft-wash', label: 'Suave', defaultConfig: { align: 'left', titleScale: 'm', primary: '#0369a1', secondary: '#f0f9ff' } },
  { id: 'ticket', label: 'Ticket', defaultConfig: { align: 'center', titleScale: 'm', primary: '#be123c', secondary: '#fff1f2', badge: 'ENTRADA' } },
  { id: 'corner-mark', label: 'Esquina', defaultConfig: { align: 'left', titleScale: 'l', primary: '#ea580c', secondary: '#fff7ed' } },
];

export function isFlyerTemplateId(value: unknown): value is FlyerTemplateId {
  return typeof value === 'string' && FLYER_TEMPLATES.some((t) => t.id === value);
}

export function getFlyerTemplateMeta(id: FlyerTemplateId): FlyerTemplateMeta {
  return FLYER_TEMPLATES.find((t) => t.id === id) || FLYER_TEMPLATES[0];
}

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
  const wash = softWashFromAccent(theme.accent);
  const base: FlyerConfig = {
    primary: theme.accent,
    secondary: wash,
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
    secondary: base.secondary || wash,
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
  const templateId: FlyerTemplateId =
    categoria === 'empleos'
      ? 'editorial'
      : categoria === 'servicios' || categoria === 'negocios'
        ? 'negocio'
        : categoria === 'productos' || categoria === 'vehiculos'
          ? 'urgent'
          : categoria === 'eventos'
            ? 'ticket'
            : categoria === 'inmuebles'
              ? 'soft-wash'
              : DEFAULT_FLYER_TEMPLATE;
  return {
    templateId,
    config: resolveFlyerConfig(categoria, templateId),
  };
}

/** True when the card visual is a generated flyer (live or exported), not a user photo. */
export function adisoUsesGeneratedCover(adiso: Pick<Adiso, 'imagenUrl' | 'imagenesUrls' | 'privateData'>): boolean {
  const priv =
    adiso.privateData && typeof adiso.privateData === 'object'
      ? (adiso.privateData as Record<string, unknown>)
      : {};
  if (priv.coverSource === 'template') return true;
  if (priv.coverSource === 'user') return false;
  // Published with flyer metadata → treat as generated even if JPEG export exists
  if (isFlyerTemplateId(priv.flyerTemplateId)) return true;
  const hasPhoto = Boolean(
    adiso.imagenUrl?.trim() || adiso.imagenesUrls?.some((u) => u?.trim())
  );
  return !hasPhoto;
}
