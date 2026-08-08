import type { CSSProperties } from 'react';
import type { BusinessProfile, ProfileThemePreset } from '@/types/business';
import { buildStorefrontTheme } from '@buscadis/storefront-kit';

/**
 * Scoped storefront CSS vars.
 * Does NOT invent marketplace --bg-* / --text-* values (Sprint 8).
 * Bridge aliases live in CSS: [data-tenant] { --bg-primary: var(--bp-surface); … }
 */
export function buildBusinessThemeVars(profile: Partial<BusinessProfile>): CSSProperties {
  const preset = (profile.theme_preset || 'executive') as ProfileThemePreset;
  const styleExtra = profile.profile_style as { accentColor?: string } | null | undefined;

  const theme = buildStorefrontTheme({
    preset,
    seed: profile.theme_color || undefined,
    mode:
      profile.theme_mode === 'dark'
        ? 'dark'
        : profile.theme_mode === 'light'
          ? 'light'
          : undefined,
    accentColor: profile.theme_accent_color || styleExtra?.accentColor || undefined,
  });

  return theme.style as CSSProperties;
}

export function buildBusinessThemeDataAttrs(profile: Partial<BusinessProfile>) {
  const preset = (profile.theme_preset || 'executive') as ProfileThemePreset;
  return buildStorefrontTheme({
    preset,
    seed: profile.theme_color || undefined,
    mode:
      profile.theme_mode === 'dark'
        ? 'dark'
        : profile.theme_mode === 'light'
          ? 'light'
          : undefined,
  }).dataAttrs;
}
