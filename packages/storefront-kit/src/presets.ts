import type { TenantPreset, TenantPresetId, TenantPresetInput } from './types';

export const TENANT_PRESETS: Record<TenantPresetId, TenantPreset> = {
  buscadis: {
    id: 'buscadis',
    label: 'Buscadis',
    seed: '#53ACC5',
    mode: 'light',
    radius: 'rounded',
    density: 'comfortable',
    accent: 'solid',
    fontFamily: 'sans',
  },
  executive: {
    id: 'executive',
    label: 'Ejecutivo',
    seed: '#1E3A5F',
    mode: 'light',
    radius: 'rounded',
    density: 'comfortable',
    accent: 'solid',
    fontFamily: 'sans',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    seed: '#171717',
    mode: 'light',
    radius: 'sharp',
    density: 'compact',
    accent: 'outline',
    fontFamily: 'serif',
  },
  organic: {
    id: 'organic',
    label: 'Orgánico',
    seed: '#2D6A4F',
    mode: 'light',
    radius: 'pill',
    density: 'comfortable',
    accent: 'gradient',
    fontFamily: 'sans',
  },
  nocturno: {
    id: 'nocturno',
    label: 'Nocturno',
    seed: '#7C3AED',
    mode: 'dark',
    radius: 'rounded',
    density: 'comfortable',
    accent: 'gradient',
    fontFamily: 'display',
  },
};

/** Map legacy / alternate ids → canonical preset. */
export function normalizeTenantPresetId(id?: string | null): TenantPresetId {
  if (!id) return 'executive';
  if (id === 'cyberpunk') return 'nocturno';
  if (id in TENANT_PRESETS) return id as TenantPresetId;
  return 'executive';
}

export function getTenantPreset(id?: TenantPresetInput | null): TenantPreset {
  return TENANT_PRESETS[normalizeTenantPresetId(id)];
}
