import { Categoria } from '@/types';
import { BrowseFilterState } from './types';

export interface SmartFilterPreset {
  id: string;
  label: string;
  description: string;
  /** Aplica sobre el estado actual (merge) */
  apply: (current: BrowseFilterState, categoria: Categoria | 'todos') => BrowseFilterState;
}

export const SMART_FILTER_PRESETS: SmartFilterPreset[] = [
  {
    id: 'mejores',
    label: 'Mejores opciones',
    description: 'Con foto, precio y destacados',
    apply: (current) => ({
      ...current,
      conFotos: true,
      soloConPrecio: true,
      destacado: true,
    }),
  },
  {
    id: 'recientes',
    label: 'Recién publicados',
    description: 'Última semana con fotos',
    apply: (current) => ({
      ...current,
      publicadoEn: '7d',
      conFotos: true,
    }),
  },
  {
    id: 'confiables',
    label: 'Más confiables',
    description: 'Verificados con fotos',
    apply: (current) => ({
      ...current,
      verificado: true,
      conFotos: true,
    }),
  },
  {
    id: 'economicos',
    label: 'Económicos',
    description: 'Hasta S/ 500 con precio',
    apply: (current) => ({
      ...current,
      precioMax: 500,
      precioMin: undefined,
      soloConPrecio: true,
    }),
  },
  {
    id: 'hoy',
    label: 'Publicados hoy',
    description: 'Últimas 24 horas',
    apply: (current) => ({
      ...current,
      publicadoEn: '24h',
    }),
  },
];

export function applySmartPreset(
  presetId: string,
  current: BrowseFilterState,
  categoria: Categoria | 'todos',
): BrowseFilterState | null {
  const preset = SMART_FILTER_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  return preset.apply({ ...current, facets: { ...current.facets } }, categoria);
}
