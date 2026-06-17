export type TipoOrdenamiento =
  | 'recientes'
  | 'antiguos'
  | 'titulo-asc'
  | 'titulo-desc'
  | 'precio-asc'
  | 'precio-desc';

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
  { value: 'antiguos', labelKey: 'sort.oldest', label: 'Más antiguos', panelOrder: 3 },
  { value: 'titulo-asc', labelKey: 'sort.titleAsc', label: 'Título A-Z', panelOrder: 4 },
  { value: 'titulo-desc', labelKey: 'sort.titleDesc', label: 'Título Z-A', panelOrder: 5 },
  { value: 'precio-asc', labelKey: 'sort.priceAsc', label: 'Menor precio', panelOrder: 1 },
  { value: 'precio-desc', labelKey: 'sort.priceDesc', label: 'Mayor precio', panelOrder: 2 },
];

export const PANEL_SORT_OPTIONS = [...BROWSE_SORT_OPTIONS].sort(
  (a, b) => a.panelOrder - b.panelOrder,
);

export function getSortOption(value: TipoOrdenamiento): SortOptionDef {
  return BROWSE_SORT_OPTIONS.find((o) => o.value === value) ?? BROWSE_SORT_OPTIONS[0];
}
