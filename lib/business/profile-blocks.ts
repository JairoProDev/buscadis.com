import type { ProfileBlock, ProfileThemePreset } from '@/types/business';
import { tokens } from '@buscadis/tokens';

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
  executive: { label: 'Ejecutivo', color: tokens['--bs-color-adis-900'], mode: 'light' },
  minimal: { label: 'Minimal', color: tokens['--bs-color-neutral-950'], mode: 'light' },
  organic: { label: 'Orgánico', color: tokens['--bs-cat-inmuebles-fg'], mode: 'light' },
  nocturno: { label: 'Nocturno', color: tokens['--bs-cat-eventos-fg'], mode: 'dark' },
  /** @deprecated alias → nocturno */
  cyberpunk: { label: 'Nocturno', color: tokens['--bs-cat-eventos-fg'], mode: 'dark' },
};

// normalizeProfileBlocks lives in lib/business/blocks/normalize.ts
