export type TipoOrdenamiento =
  | 'recientes'
  | 'precio-asc'
  | 'precio-desc'
  | 'cercanos'
  | 'vistos'
  | 'con-fotos';

export interface SortOptionDef {
  value: TipoOrdenamiento;
  /** Clave i18n (Ordenamiento toolbar) */
  labelKey: string;
  /** Etiqueta fija en español (panel lateral) */
  label: string;
  /** Orden de prioridad en panel compacto (menor = más arriba) */
  panelOrder: number;
}

/** Fuente única de verdad para ordenamiento en toolbar y panel de filtros */
export const BROWSE_SORT_OPTIONS: SortOptionDef[] = [
  { value: 'recientes', labelKey: 'sort.recent', label: 'Más recientes', panelOrder: 0 },
  { value: 'precio-asc', labelKey: 'sort.priceAsc', label: 'Menor precio', panelOrder: 1 },
  { value: 'precio-desc', labelKey: 'sort.priceDesc', label: 'Mayor precio', panelOrder: 2 },
  { value: 'cercanos', labelKey: 'sort.nearest', label: 'Más cercanos', panelOrder: 3 },
  { value: 'vistos', labelKey: 'sort.viewed', label: 'Lo más visto', panelOrder: 4 },
  { value: 'con-fotos', labelKey: 'sort.withPhotos', label: 'Con fotos', panelOrder: 5 },
];

export const PANEL_SORT_OPTIONS = [...BROWSE_SORT_OPTIONS].sort(
  (a, b) => a.panelOrder - b.panelOrder,
);

export function getSortOption(value: TipoOrdenamiento): SortOptionDef {
  return BROWSE_SORT_OPTIONS.find((o) => o.value === value) ?? BROWSE_SORT_OPTIONS[0];
}
