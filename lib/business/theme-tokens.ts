import type { ProfileThemePreset } from '@/types/business';
import {
  getTenantPreset,
  normalizeTenantPresetId,
  type TenantPreset,
} from '@buscadis/storefront-kit';

export interface ThemeTokens {
  color: string;
  mode: 'light' | 'dark';
  fontFamily: 'sans' | 'serif' | 'display';
  radius: 'sharp' | 'rounded' | 'pill';
  density: 'compact' | 'comfortable';
  accentStyle: 'solid' | 'gradient' | 'outline';
}

function presetToTokens(p: TenantPreset): ThemeTokens {
  return {
    color: p.seed,
    mode: p.mode,
    fontFamily: p.fontFamily,
    radius: p.radius,
    density: p.density,
    accentStyle: p.accent,
  };
}

/** @deprecated Prefer TENANT_PRESETS from @buscadis/storefront-kit — kept for app call sites. */
export const THEME_TOKEN_PRESETS: Record<ProfileThemePreset, ThemeTokens> = {
  executive: presetToTokens(getTenantPreset('executive')),
  minimal: presetToTokens(getTenantPreset('minimal')),
  organic: presetToTokens(getTenantPreset('organic')),
  nocturno: presetToTokens(getTenantPreset('nocturno')),
  cyberpunk: presetToTokens(getTenantPreset('nocturno')),
};

export function resolveThemeTokens(
  preset?: ProfileThemePreset | null,
  overrides?: Partial<ThemeTokens>
): ThemeTokens {
  const id = normalizeTenantPresetId(preset);
  const base = presetToTokens(getTenantPreset(id));
  return { ...base, ...overrides };
}

export function themeRadiusClass(radius: ThemeTokens['radius']): string {
  switch (radius) {
    case 'sharp':
      return 'rounded-none';
    case 'pill':
      return 'rounded-3xl';
    default:
      return 'rounded-xl';
  }
}

export function themeFontClass(font: ThemeTokens['fontFamily']): string {
  switch (font) {
    case 'serif':
      return 'font-serif';
    case 'display':
      return 'font-sans tracking-tight';
    default:
      return 'font-sans';
  }
}
