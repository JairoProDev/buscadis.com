import { derivarTemaTenant } from './derivar-tema-tenant';
import { getTenantPreset, normalizeTenantPresetId } from './presets';
import type {
  DerivedTenantTheme,
  StorefrontSurfaceVars,
  TenantAccent,
  TenantContract,
  TenantDensity,
  TenantMode,
  TenantPresetInput,
  TenantRadius,
} from './types';

export interface BuildStorefrontThemeInput {
  preset?: TenantPresetInput | null;
  seed?: string | null;
  mode?: TenantMode | 'auto' | null;
  accentColor?: string | null;
  radius?: TenantRadius | null;
  density?: TenantDensity | null;
  accent?: TenantAccent | null;
}

export interface StorefrontThemeResult {
  contract: TenantContract;
  derived: DerivedTenantTheme;
  surfaces: StorefrontSurfaceVars;
  /** Inline style for the storefront root (no marketplace --bg-* invention). */
  style: Record<string, string>;
  dataAttrs: {
    'data-tenant': string;
    'data-theme-radius': TenantRadius;
    'data-theme-density': TenantDensity;
    'data-theme-mode': TenantMode;
  };
}

function radiusCss(radius: TenantRadius): string {
  if (radius === 'sharp') return '0px';
  if (radius === 'pill') return '1.5rem';
  return '0.75rem';
}

function surfacesForMode(mode: TenantMode): Omit<
  StorefrontSurfaceVars,
  | '--bp-radius'
  | '--bp-density-gap'
  | '--theme-radius'
  | '--brand-color'
  | '--brand-accent'
> {
  if (mode === 'dark') {
    return {
      '--bp-canvas': '#13171d',
      '--bp-surface': '#1c2229',
      '--bp-surface-elevated': '#283038',
      '--bp-text': '#edf1f5',
      '--bp-text-muted': '#9dabb8',
      '--bp-border': 'rgba(255,255,255,0.10)',
    };
  }
  return {
    '--bp-canvas': '#f8fafc',
    '--bp-surface': '#ffffff',
    '--bp-surface-elevated': '#ffffff',
    '--bp-text': '#0f172a',
    '--bp-text-muted': '#64748b',
    '--bp-border': '#e2e8f0',
  };
}

/**
 * Build scoped storefront theme from preset + overrides.
 * Sets tenant contract + derived action + --bp-* surfaces only.
 */
export function buildStorefrontTheme(input: BuildStorefrontThemeInput = {}): StorefrontThemeResult {
  const preset = getTenantPreset(input.preset);
  const mode: TenantMode =
    input.mode === 'dark' || input.mode === 'light' ? input.mode : preset.mode;
  const seed = (input.seed || preset.seed).trim() || preset.seed;
  const radius = input.radius || preset.radius;
  const density = input.density || preset.density;
  const accent = input.accent || preset.accent;

  const contract: TenantContract = { seed, mode, radius, density, accent };
  const derivedBase = derivarTemaTenant(seed, mode);
  const derived: DerivedTenantTheme = {
    ...derivedBase,
    '--bs-tenant-seed': seed,
    '--bs-tenant-mode': mode,
    '--bs-tenant-radius': radius,
    '--bs-tenant-density': density,
    '--bs-tenant-accent': accent,
  };

  const r = radiusCss(radius);
  const gap = density === 'compact' ? '0.5rem' : '1rem';
  const brandAccent = input.accentColor || '#FFC24A';

  const surfaces: StorefrontSurfaceVars = {
    ...surfacesForMode(mode),
    '--bp-radius': r,
    '--bp-density-gap': gap,
    '--theme-radius': r,
    '--brand-color': derived['--bs-action'],
    '--brand-accent': brandAccent,
  };

  const style: Record<string, string> = {
    ...derived,
    ...surfaces,
  };

  return {
    contract,
    derived,
    surfaces,
    style,
    dataAttrs: {
      'data-tenant': normalizeTenantPresetId(input.preset),
      'data-theme-radius': radius,
      'data-theme-density': density,
      'data-theme-mode': mode,
    },
  };
}
