/**
 * Teselas del mapa.
 * Carto responde HTTP 200 con una imagen que dice "API KEY REQUIRED".
 * No usamos ese servicio: en el celular se ve como mapa roto.
 * OpenStreetMap no pide clave. El referrer lo fija el canvas del mapa.
 */
export type LeafletTileLayerOptions = {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string | string[];
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function getMapTileLayerOptions(): LeafletTileLayerOptions {
  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
  };
}
