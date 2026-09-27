'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { getMapTileLayerOptions } from '@/lib/map-basemap';
import type { MapBounds, MapCluster, MapListing } from '@/lib/map/types';
import { formatMapPrice } from '@/lib/map/format';

interface MapCanvasProps {
  clusters: MapCluster[];
  selectedId: string | null;
  onMap: (map: LeafletMap) => void;
  onReady: (bounds: MapBounds, zoom: number) => void;
  onViewChange: (bounds: MapBounds, zoom: number) => void;
  onSelectListing: (listing: MapListing) => void;
  onExpandCluster: (cluster: MapCluster) => void;
  onGestureStart?: () => void;
}

export function readBounds(map: LeafletMap): MapBounds {
  const b = map.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

const PIN_GLYPH: Record<string, string> = {
  empleos: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  inmuebles: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
  vehiculos: '<path d="M3 16h18"/><path d="M5 16l2-6h10l2 6"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  servicios: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L4 17l3 3 5.1-5.1a4 4 0 0 0 5.6-5.6l-2.2 2.2-1.6-1.6z"/>',
  productos: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  eventos: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  negocios: '<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M3 10l2-5h14l2 5"/><path d="M9 20v-5h6v5"/>',
  comunidad: '<circle cx="9" cy="8" r="2.2"/><circle cx="16" cy="9" r="1.8"/><path d="M4.5 18a4.5 4.5 0 0 1 9 0"/><path d="M14 18a3.5 3.5 0 0 1 6 0"/>',
};

function pinHtml(listing: MapListing, selected: boolean): string {
  const price = formatMapPrice(listing);
  const state = `${selected ? ' is-selected' : ''}${listing.promoted ? ' is-promoted' : ''}`;
  if (showsPricePin(listing)) {
    return `<div class="bs-map-pin bs-map-pin--price${state}">${escapeHtml(price)}</div>`;
  }
  const glyph = PIN_GLYPH[listing.categoria] || PIN_GLYPH.productos;
  return `<div class="bs-map-pin${state}"><span class="bs-map-pin__glyph"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg></span></div>`;
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
  onGestureStart,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const callbacks = useRef({ onMap, onReady, onViewChange, onSelectListing, onExpandCluster, onGestureStart });
  callbacks.current = { onMap, onReady, onViewChange, onSelectListing, onExpandCluster, onGestureStart };

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
      const layer = L.tileLayer(tile.url, {
        attribution: tile.attribution,
        maxZoom: tile.maxZoom,
        subdomains: tile.subdomains,
      });
      const createTile = layer.createTile.bind(layer);
      layer.createTile = (coords, done) => {
        const img = createTile(coords, done);
        if (img instanceof HTMLImageElement) img.referrerPolicy = 'origin';
        return img;
      };
      layer.addTo(map);
      mapRef.current = map;
      callbacks.current.onMap(map);
      const emit = () => callbacks.current.onViewChange(readBounds(map), map.getZoom());
      map.on('movestart', () => callbacks.current.onGestureStart?.());
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
        iconSize: cluster.count > 1 ? [36, 36] : single && showsPricePin(single) ? [88, 32] : [30, 36],
        iconAnchor: cluster.count > 1 ? [18, 18] : single && showsPricePin(single) ? [44, 32] : [15, 34],
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

function showsPricePin(listing: MapListing): boolean {
  const priced = listing.categoria === 'inmuebles' || listing.categoria === 'vehiculos' || listing.categoria === 'productos';
  if (!priced) return false;
  if (listing.tipoPrecio === 'gratis') return true;
  return listing.tipoPrecio !== 'a_convenir' && listing.precio != null;
}
