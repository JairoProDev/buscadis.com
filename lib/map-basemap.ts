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
    // Leaflet lee subdomains.length al armar cada tesela. Si llega undefined, el mapa queda gris.
    subdomains: 'abc',
  };
}

type LeafletModule = typeof import('leaflet');

/** OSM tiles with referrerPolicy on images (typed-safe; no protected createTile override). */
export function createMapTileLayer(L: LeafletModule) {
  const tile = getMapTileLayerOptions();
  const layer = L.tileLayer(tile.url, {
    attribution: tile.attribution,
    maxZoom: tile.maxZoom,
    subdomains: tile.subdomains,
  });
  layer.on('tileload', (e) => {
    const el = e.tile;
    if (el instanceof HTMLImageElement) {
      el.referrerPolicy = 'origin';
    }
  });
  return layer;
}
