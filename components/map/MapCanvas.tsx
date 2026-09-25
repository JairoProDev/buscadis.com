'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { getMapTileLayerOptions } from '@/lib/map-basemap';
import type { MapBounds, MapCluster, MapListing } from '@/lib/map/types';
import { formatMapPrice } from '@/lib/map/format';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';

interface MapCanvasProps {
  clusters: MapCluster[];
  selectedId: string | null;
  onMap: (map: LeafletMap) => void;
  onReady: (bounds: MapBounds, zoom: number) => void;
  onViewChange: (bounds: MapBounds, zoom: number) => void;
  onSelectListing: (listing: MapListing) => void;
  onExpandCluster: (cluster: MapCluster) => void;
}

export function readBounds(map: LeafletMap): MapBounds {
  const b = map.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

function pinHtml(listing: MapListing, selected: boolean): string {
  const price = formatMapPrice(listing);
  const showPrice =
    listing.categoria === 'inmuebles' || listing.categoria === 'vehiculos' || listing.categoria === 'productos';
  const accent = getCategoriaThemeTokens(listing.categoria).accent;
  if (showPrice && price !== 'Consultar') {
    return `<div class="bs-map-pin bs-map-pin--price${selected ? ' is-selected' : ''}${listing.promoted ? ' is-promoted' : ''}">${escapeHtml(price)}</div>`;
  }
  return `<div class="bs-map-pin${selected ? ' is-selected' : ''}${listing.promoted ? ' is-promoted' : ''}" style="background:${accent}"></div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function MapCanvas({
  clusters,
  selectedId,
  onMap,
  onReady,
  onViewChange,
  onSelectListing,
  onExpandCluster,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const callbacks = useRef({ onMap, onReady, onViewChange, onSelectListing, onExpandCluster });
  callbacks.current = { onMap, onReady, onViewChange, onSelectListing, onExpandCluster };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([-13.5319, -71.9675], 13);
      const tile = getMapTileLayerOptions();
      L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: tile.maxZoom,
        subdomains: tile.subdomains,
      }).addTo(map);
      mapRef.current = map;
      callbacks.current.onMap(map);
      const emit = () => callbacks.current.onViewChange(readBounds(map), map.getZoom());
      map.on('moveend', emit);
      map.on('zoomend', emit);
      requestAnimationFrame(() => {
        map.invalidateSize();
        callbacks.current.onReady(readBounds(map), map.getZoom());
      });
    }
    void init();
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const cluster of clusters) {
      const single = cluster.count === 1 ? cluster.listings[0] : null;
      const selected = Boolean(single && single.id === selectedId);
      const icon = L.divIcon({
        className: 'bs-map-marker',
        html: cluster.count > 1 ? `<div class="bs-map-cluster">${cluster.count}</div>` : pinHtml(single!, selected),
        iconSize: cluster.count > 1 ? [44, 44] : single && pinIsPrice(single) ? [88, 32] : [28, 34],
        iconAnchor: cluster.count > 1 ? [22, 22] : single && pinIsPrice(single) ? [44, 32] : [14, 34],
      });
      const marker = L.marker([cluster.lat, cluster.lng], { icon, zIndexOffset: selected ? 800 : cluster.count });
      marker.on('click', () => {
        if (cluster.count > 1) callbacks.current.onExpandCluster(cluster);
        else callbacks.current.onSelectListing(cluster.listings[0]);
      });
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [clusters, selectedId]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}

function pinIsPrice(listing: MapListing): boolean {
  const price = formatMapPrice(listing);
  return (
    (listing.categoria === 'inmuebles' || listing.categoria === 'vehiculos' || listing.categoria === 'productos') &&
    price !== 'Consultar'
  );
}
