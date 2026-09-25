import type { MapCluster, MapListing } from '@/lib/map/types';

/** Grados de celda según zoom. 0 = un pin por anuncio. */
export function cellDegrees(zoom: number): number {
  if (zoom >= 16) return 0;
  if (zoom >= 15) return 0.0022;
  if (zoom >= 14) return 0.0045;
  if (zoom >= 13) return 0.009;
  if (zoom >= 12) return 0.018;
  return 0.04;
}

export function clusterListings(listings: MapListing[], zoom: number): MapCluster[] {
  const size = cellDegrees(zoom);
  if (size === 0) {
    return listings.map((listing) => ({
      id: listing.id,
      lat: listing.lat,
      lng: listing.lng,
      count: 1,
      listings: [listing],
    }));
  }

  const groups = new Map<string, MapListing[]>();
  for (const listing of listings) {
    const gx = Math.floor(listing.lng / size);
    const gy = Math.floor(listing.lat / size);
    const key = `${gx}:${gy}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(listing);
    else groups.set(key, [listing]);
  }

  const clusters: MapCluster[] = [];
  for (const [key, items] of groups) {
    const lat = items.reduce((s, i) => s + i.lat, 0) / items.length;
    const lng = items.reduce((s, i) => s + i.lng, 0) / items.length;
    clusters.push({
      id: items.length === 1 ? items[0].id : `c-${key}`,
      lat,
      lng,
      count: items.length,
      listings: items,
    });
  }
  return clusters;
}
