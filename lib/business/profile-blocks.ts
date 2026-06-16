import type { ProfileBlock, ProfileThemePreset } from '@/types/business';

export const DEFAULT_PROFILE_BLOCKS: ProfileBlock[] = [
  { id: 'hero', type: 'hero', visible: true, config: {} },
  { id: 'highlights', type: 'highlights', visible: true, config: {} },
  { id: 'catalog', type: 'catalog', visible: true, config: {} },
  { id: 'deals', type: 'deals', visible: true, config: {} },
  { id: 'links', type: 'links', visible: true, config: {} },
  { id: 'reviews', type: 'reviews', visible: true, config: {} },
  { id: 'map', type: 'map', visible: true, config: {} },
];

export const PROFILE_THEME_PRESETS: Record<
  ProfileThemePreset,
  { label: string; color: string; mode: 'light' | 'dark' }
> = {
  executive: { label: 'Ejecutivo', color: '#1e3a5f', mode: 'light' },
  minimal: { label: 'Minimal', color: '#171717', mode: 'light' },
  organic: { label: 'Orgánico', color: '#2d6a4f', mode: 'light' },
  cyberpunk: { label: 'Cyberpunk', color: '#a855f7', mode: 'dark' },
};

export function normalizeProfileBlocks(blocks?: ProfileBlock[] | null): ProfileBlock[] {
  if (!blocks || blocks.length === 0) return DEFAULT_PROFILE_BLOCKS;
  return blocks;
}
