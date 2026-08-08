import type { ProfileBlock, ProfileThemePreset } from '@/types/business';

export { normalizeProfileBlocks, getVisibleBlocks, blockTypeToTabId } from '@/lib/business/blocks/normalize';

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
  executive: { label: 'Ejecutivo', color: '#1E3A5F', mode: 'light' },
  minimal: { label: 'Minimal', color: '#171717', mode: 'light' },
  organic: { label: 'Orgánico', color: '#2D6A4F', mode: 'light' },
  nocturno: { label: 'Nocturno', color: '#7C3AED', mode: 'dark' },
  /** @deprecated alias → nocturno */
  cyberpunk: { label: 'Nocturno', color: '#7C3AED', mode: 'dark' },
};

// normalizeProfileBlocks lives in lib/business/blocks/normalize.ts
