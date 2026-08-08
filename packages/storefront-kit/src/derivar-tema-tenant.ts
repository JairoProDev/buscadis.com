import { parse, formatHex, converter } from 'culori';
import { hex as contrastHex } from 'wcag-contrast';
import type { DerivedTenantTheme, TenantMode } from './types';

const toOklch = converter('oklch');

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toHexColor(color: { mode?: string; l?: number; c?: number; h?: number }): string {
  const hex = formatHex(color as Parameters<typeof formatHex>[0]);
  return (hex || '#53ACC5').toUpperCase();
}

/**
 * Derive action tokens from a tenant seed (doc 04 §5).
 * Clamps chroma and lightness so extreme seeds (neon / near-black) stay AA.
 */
export function derivarTemaTenant(seed: string, mode: TenantMode): DerivedTenantTheme {
  const parsed = parse(seed);
  const oklch = parsed ? toOklch(parsed) : null;
  const h = oklch?.h ?? 200;
  let c = clamp(oklch?.c ?? 0.08, 0, 0.19);
  const lSeed = oklch?.l ?? 0.55;

  const lAccion =
    mode === 'light' ? clamp(lSeed, 0.42, 0.6) : clamp(lSeed, 0.62, 0.8);

  const accion = toHexColor({ mode: 'oklch', l: lAccion, c, h });
  const accionHover = toHexColor({
    mode: 'oklch',
    l: clamp(lAccion - 0.06, 0.2, 0.9),
    c,
    h,
  });
  const subtle = toHexColor({
    mode: 'oklch',
    l: mode === 'light' ? 0.96 : 0.2,
    c: Math.min(c, 0.05),
    h,
  });

  const white = '#FFFFFF';
  const ink = '#0B1418';
  const onAction = contrastHex(white, accion) >= 4.5 ? white : ink;

  return {
    '--bs-tenant-seed': seed,
    '--bs-tenant-mode': mode,
    '--bs-tenant-radius': 'rounded',
    '--bs-tenant-density': 'comfortable',
    '--bs-tenant-accent': 'solid',
    '--bs-action': accion,
    '--bs-action-hover': accionHover,
    '--bs-fg-on-action': onAction,
    '--bs-action-subtle': subtle,
    '--bs-identity': seed,
  };
}

export function contrastRatio(fg: string, bg: string): number {
  return contrastHex(fg, bg);
}
