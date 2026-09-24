/**
 * Basemap tiles for Leaflet.
 *
 * CARTO Voyager used to work without a key; tiles now return a watermark image (HTTP 200).
 * Default: OpenStreetMap raster (no key). Optional: set NEXT_PUBLIC_CARTO_API_KEY (free at carto.com/basemaps).
 */
export type LeafletTileLayerOptions = {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string | string[];
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const CARTO_ATTRIBUTION =
  `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/">CARTO</a>`;

export function getMapTileLayerOptions(): LeafletTileLayerOptions {
  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();

  if (cartoKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${encodeURIComponent(cartoKey)}`,
      attribution: CARTO_ATTRIBUTION,
      maxZoom: 19,
      subdomains: 'abcd',
    };
  }

  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  };
}
