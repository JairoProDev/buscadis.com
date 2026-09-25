import type { Categoria } from '@/types';

export type MapPrecision = 'exact' | 'area';

export interface MapListing {
  id: string;
  titulo: string;
  categoria: Categoria;
  precio: number | null;
  moneda: 'PEN' | 'USD' | null;
  tipoPrecio: 'fijo' | 'a_convenir' | 'gratis' | null;
  distrito: string | null;
  imageUrl: string | null;
  /** Coordenadas ya ofuscadas para pintar. Nunca la puerta en inmuebles/empleos. */
  lat: number;
  lng: number;
  precision: MapPrecision;
  href: string;
  promoted: boolean;
  whatsappUrl: string | null;
  directionsUrl: string | null;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  listings: MapListing[];
}

export interface MapQuery {
  bounds: MapBounds;
  categoria?: Categoria | 'todos';
  q?: string;
  min?: number;
  max?: number;
  foto?: boolean;
}
