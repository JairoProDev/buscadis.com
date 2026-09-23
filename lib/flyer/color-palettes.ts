import type { FlyerConfig } from './types';
import { softWashFromAccent } from './templates';

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
  { id: 'buscadis', label: 'Buscadis', primary: '#53acc5', secondary: '#e8f6fa' },
  { id: 'oceano', label: 'Océano', primary: '#0e7490', secondary: '#ecfeff' },
  { id: 'bosque', label: 'Bosque', primary: '#0f766e', secondary: '#ccfbf1' },
  { id: 'atardecer', label: 'Atardecer', primary: '#c2410c', secondary: '#ffedd5' },
  { id: 'coral', label: 'Coral', primary: '#e11d48', secondary: '#fff1f2' },
  { id: 'uva', label: 'Uva', primary: '#6d28d9', secondary: '#ede9fe' },
  { id: 'noche', label: 'Noche', primary: '#1e3a8a', secondary: '#dbeafe' },
  { id: 'caramelo', label: 'Caramelo', primary: '#92400e', secondary: '#fef3c7' },
  { id: 'rosa', label: 'Rosa', primary: '#be123c', secondary: '#ffe4e6' },
];

/** Tonos para personalizar sin el selector nativo del sistema. */
export const FLYER_ACCENT_SWATCHES = [
  '#0f172a',
  '#334155',
  '#0369a1',
  '#0e7490',
  '#0f766e',
  '#15803d',
  '#a16207',
  '#c2410c',
  '#ea580c',
  '#dc2626',
  '#be123c',
  '#db2777',
  '#7c3aed',
  '#6d28d9',
  '#4f46e5',
  '#1d4ed8',
  '#53acc5',
];

export const FLYER_BACKGROUND_SWATCHES = [
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#fff7ed',
  '#ffedd5',
  '#fef3c7',
  '#fef9c3',
  '#ecfccb',
  '#d1fae5',
  '#ccfbf1',
  '#e0f2fe',
  '#dbeafe',
  '#ede9fe',
  '#fae8ff',
  '#ffe4e6',
  '#fff1f2',
  '#ecfeff',
];

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

export function setCustomPaletteColors(
  config: FlyerConfig | undefined,
  primary: string,
  secondary?: string,
): FlyerConfig {
  return {
    ...config,
    paletteId: 'custom',
    primary,
    secondary: secondary || softWashFromAccent(primary),
  };
}

export function isPaletteActive(config?: FlyerConfig | null, paletteId?: string): boolean {
  if (!config?.paletteId || !paletteId) return false;
  return config.paletteId === paletteId;
}
