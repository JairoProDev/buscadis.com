import { tokens } from '@buscadis/tokens';
import type { FlyerConfig } from './types';
import { softWashFromAccent } from './templates';

const t = tokens;

export type FlyerPaletteId =
  | 'buscadis'
  | 'oceano'
  | 'bosque'
  | 'atardecer'
  | 'coral'
  | 'uva'
  | 'noche'
  | 'caramelo'
  | 'rosa'
  | 'custom';

export type FlyerPalette = {
  id: Exclude<FlyerPaletteId, 'custom'>;
  label: string;
  primary: string;
  secondary: string;
};

export const FLYER_PALETTES: FlyerPalette[] = [
  { id: 'buscadis', label: 'Buscadis', primary: t['--bs-identity'], secondary: t['--bs-color-adis-50'] },
  { id: 'oceano', label: 'Océano', primary: t['--bs-action'], secondary: t['--bs-info-bg'] },
  { id: 'bosque', label: 'Bosque', primary: t['--bs-cat-empleos-fg'], secondary: t['--bs-cat-empleos-bg'] },
  { id: 'atardecer', label: 'Atardecer', primary: t['--bs-cat-vehiculos-fg'], secondary: t['--bs-cat-vehiculos-bg'] },
  { id: 'coral', label: 'Coral', primary: t['--bs-cat-productos-fg'], secondary: t['--bs-cat-productos-bg'] },
  { id: 'uva', label: 'Uva', primary: t['--bs-cat-eventos-fg'], secondary: t['--bs-cat-eventos-bg'] },
  { id: 'noche', label: 'Noche', primary: t['--bs-color-adis-800'], secondary: t['--bs-cat-negocios-bg'] },
  { id: 'caramelo', label: 'Caramelo', primary: t['--bs-cat-servicios-fg'], secondary: t['--bs-warning-bg'] },
  { id: 'rosa', label: 'Rosa', primary: t['--bs-cat-productos-fg'], secondary: t['--bs-cat-productos-bg'] },
];

/** Tonos para personalizar sin el selector nativo del sistema. */
export const FLYER_ACCENT_SWATCHES = [
  t['--bs-color-neutral-900'],
  t['--bs-color-neutral-700'],
  t['--bs-action'],
  t['--bs-color-adis-700'],
  t['--bs-cat-empleos-fg'],
  t['--bs-cat-inmuebles-fg'],
  t['--bs-cat-servicios-fg'],
  t['--bs-cat-vehiculos-fg'],
  t['--bs-danger-fg'],
  t['--bs-cat-productos-fg'],
  t['--bs-cat-comunidad-fg'],
  t['--bs-cat-eventos-fg'],
  t['--bs-cat-negocios-fg'],
  t['--bs-identity'],
] as const;

export const FLYER_BACKGROUND_SWATCHES = [
  t['--bs-color-neutral-0'],
  t['--bs-color-neutral-50'],
  t['--bs-color-neutral-100'],
  t['--bs-cat-vehiculos-bg'],
  t['--bs-warning-bg'],
  t['--bs-color-sol-50'],
  t['--bs-cat-servicios-bg'],
  t['--bs-success-bg'],
  t['--bs-cat-empleos-bg'],
  t['--bs-info-bg'],
  t['--bs-cat-negocios-bg'],
  t['--bs-cat-eventos-bg'],
  t['--bs-cat-comunidad-bg'],
  t['--bs-cat-productos-bg'],
  t['--bs-color-adis-50'],
] as const;

export function getPaletteById(id: string | undefined): FlyerPalette | undefined {
  return FLYER_PALETTES.find((p) => p.id === id);
}

export function getPaletteOverrides(config?: FlyerConfig | null): Partial<FlyerConfig> | undefined {
  if (!config?.paletteId) return undefined;
  return {
    primary: config.primary,
    secondary: config.secondary,
  };
}

export function applyPaletteToConfig(
  config: FlyerConfig | undefined,
  palette: { id: FlyerPaletteId; primary: string; secondary: string },
): FlyerConfig {
  return {
    ...config,
    paletteId: palette.id,
    primary: palette.primary,
    secondary: palette.secondary,
  };
}

export function isPaletteActive(config: FlyerConfig | undefined, paletteId: FlyerPaletteId): boolean {
  if (paletteId === 'custom') return config?.paletteId === 'custom';
  const preset = getPaletteById(paletteId);
  if (!preset || !config) return false;
  return config.paletteId === paletteId || (config.primary === preset.primary && config.secondary === preset.secondary);
}

export function setCustomPaletteColors(
  config: FlyerConfig | undefined,
  primary: string,
  secondary?: string,
): FlyerConfig {
  const nextSecondary = secondary ?? softWashFromAccent(primary);
  return {
    ...config,
    paletteId: 'custom',
    primary,
    secondary: nextSecondary,
  };
}
