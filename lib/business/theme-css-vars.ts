import type { CSSProperties } from 'react';
import type { BusinessProfile } from '@/types/business';
import type { ProfileThemePreset } from '@/types/business';
import { resolveThemeTokens } from '@/lib/business/theme-tokens';

export function buildBusinessThemeVars(profile: Partial<BusinessProfile>): CSSProperties {
  const preset = (profile.theme_preset || 'executive') as ProfileThemePreset;
  const tokens = resolveThemeTokens(preset, {
    color: profile.theme_color || undefined,
    mode:
      profile.theme_mode === 'dark'
        ? 'dark'
        : profile.theme_mode === 'light'
          ? 'light'
          : undefined,
  });
  const isDark = tokens.mode === 'dark';

  const radius =
    tokens.radius === 'sharp' ? '0px' : tokens.radius === 'pill' ? '1.5rem' : '0.75rem';
  const densityGap = tokens.density === 'compact' ? '0.5rem' : '1rem';

  return {
    '--brand-color': tokens.color,
    '--bg-primary': isDark ? '#0f172a' : '#ffffff',
    '--bg-secondary': isDark ? '#020617' : '#f8fafc',
    '--bg-tertiary': isDark ? '#1e293b' : '#e2e8f0',
    '--text-primary': isDark ? '#f8fafc' : '#0f172a',
    '--text-secondary': isDark ? '#cbd5e1' : '#475569',
    '--text-tertiary': isDark ? '#64748b' : '#94a3b8',
    '--border-color': isDark ? '#334155' : '#e2e8f0',
    '--border-subtle': isDark ? '#1e293b' : '#f1f5f9',
    '--bp-surface': isDark ? '#0f172a' : '#ffffff',
    '--bp-surface-elevated': isDark ? '#1e293b' : '#ffffff',
    '--bp-text': isDark ? '#f8fafc' : '#0f172a',
    '--bp-text-muted': isDark ? '#94a3b8' : '#64748b',
    '--bp-border': isDark ? '#334155' : '#e2e8f0',
    '--bp-radius': radius,
    '--bp-density-gap': densityGap,
    '--theme-radius': radius,
  } as CSSProperties;
}
