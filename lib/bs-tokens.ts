/**
 * App-facing helpers for @buscadis/tokens — use in inline styles & JS, prefer var(--bs-*) in CSS.
 */
import { brand, categories, tokens } from '@buscadis/tokens';
import type { Categoria } from '@/types';

export { brand, categories, tokens };

export type BsTokenName = keyof typeof tokens;

/** CSS `var(--bs-…)` reference for style objects / SVG. */
export function bsVar(name: BsTokenName): string {
  return `var(${name})`;
}

/** `color-mix` helper for translucent surfaces from a token. */
export function bsMix(name: BsTokenName, percent: number, base = 'transparent'): string {
  return `color-mix(in srgb, var(${name}) ${percent}%, ${base})`;
}

const CATEGORIA_FG: Record<Categoria, BsTokenName> = {
  empleos: '--bs-cat-empleos-fg',
  inmuebles: '--bs-cat-inmuebles-fg',
  vehiculos: '--bs-cat-vehiculos-fg',
  servicios: '--bs-cat-servicios-fg',
  productos: '--bs-cat-productos-fg',
  eventos: '--bs-cat-eventos-fg',
  negocios: '--bs-cat-negocios-fg',
  comunidad: '--bs-cat-comunidad-fg',
};

export function categoriaFg(categoria: string): string {
  const key = categoria as Categoria;
  const tokenName = CATEGORIA_FG[key];
  return tokenName ? tokens[tokenName] : tokens['--bs-color-neutral-600'];
}

export const semantic = {
  successFg: tokens['--bs-success-fg'],
  successBg: tokens['--bs-success-bg'],
  warningFg: tokens['--bs-warning-fg'],
  warningBg: tokens['--bs-warning-bg'],
  dangerFg: tokens['--bs-danger-fg'],
  dangerBg: tokens['--bs-danger-bg'],
  infoFg: tokens['--bs-info-fg'],
  infoBg: tokens['--bs-info-bg'],
  action: tokens['--bs-action'],
  identity: tokens['--bs-identity'],
  muted: tokens['--bs-color-neutral-500'],
  surface: tokens['--bs-color-neutral-0'],
  ink: tokens['--bs-color-neutral-900'],
  whatsapp: tokens['--bs-color-social-whatsapp'],
  whatsappDark: tokens['--bs-color-social-whatsappDark'],
  chatStart: tokens['--bs-color-accent-chatStart'],
  chatEnd: tokens['--bs-color-accent-chatEnd'],
} as const;

export const confidenceFg = {
  alta: semantic.successFg,
  media: semantic.warningFg,
  baja: semantic.dangerFg,
  default: semantic.muted,
} as const;

export function confidenceColor(level?: string): string {
  if (level === 'alta' || level === 'media' || level === 'baja') {
    return confidenceFg[level];
  }
  return confidenceFg.default;
}

export const chatGradient = `linear-gradient(135deg, ${semantic.chatStart} 0%, ${semantic.chatEnd} 100%)`;

export const trustBadge = {
  verified: {
    color: semantic.infoFg,
    bg: bsMix('--bs-info-fg', 15),
    border: bsMix('--bs-info-fg', 30),
  },
  business: {
    color: tokens['--bs-cat-eventos-fg'],
    bg: bsMix('--bs-cat-eventos-fg', 15),
    border: bsMix('--bs-cat-eventos-fg', 30),
  },
  identity: {
    color: semantic.successFg,
    bg: bsMix('--bs-success-fg', 15),
    border: bsMix('--bs-success-fg', 30),
  },
} as const;
