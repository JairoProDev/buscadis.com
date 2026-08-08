import type { StyleSkinTokens } from '../types/style';

export const STYLE_SKINS: StyleSkinTokens[] = [
  {
    id: 'buscadis_default',
    label: 'Buscadis',
    color: '#53acc5',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'solid',
  },
  {
    id: 'executive',
    label: 'Ejecutivo',
    color: '#1e3a5f',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'solid',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    color: '#171717',
    mode: 'light',
    fontFamily: 'serif',
    radius: 'sharp',
    density: 'compact',
    accentStyle: 'outline',
  },
  {
    id: 'organic',
    label: 'Orgánico',
    color: '#2d6a4f',
    mode: 'light',
    fontFamily: 'sans',
    radius: 'pill',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
  {
    id: 'nocturno',
    label: 'Nocturno',
    color: '#7C3AED',
    mode: 'dark',
    fontFamily: 'display',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
  /** @deprecated alias for nocturno — keep id for existing engine docs */
  {
    id: 'cyberpunk',
    label: 'Nocturno',
    color: '#7C3AED',
    mode: 'dark',
    fontFamily: 'display',
    radius: 'rounded',
    density: 'comfortable',
    accentStyle: 'gradient',
  },
];

export function getStyleSkin(id: string): StyleSkinTokens {
  if (id === 'cyberpunk') {
    return STYLE_SKINS.find((s) => s.id === 'nocturno') ?? STYLE_SKINS[0];
  }
  return STYLE_SKINS.find((s) => s.id === id) ?? STYLE_SKINS[0];
}
