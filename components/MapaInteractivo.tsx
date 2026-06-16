'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { Adiso, UbicacionDetallada, Categoria } from '@/types';
import { getCategoriaIcon, PUBLISH_CATEGORIAS } from '@/lib/categoria-icons';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import { IconMapPin, IconMinus, IconPlus } from '@/components/Icons';

const MAP_FILTERS: { id: Categoria | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  ...PUBLISH_CATEGORIAS.map((c) => ({ id: c.value, label: c.label })),
];

const DEFAULT_CENTER: [number, number] = [-13.5319, -71.9675];
const DEFAULT_ZOOM = 13;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface MapaInteractivoProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
}

function getCoordenadas(adiso: Adiso): { lat: number; lng: number } | null {
  if (typeof adiso.ubicacion === 'object' && adiso.ubicacion !== null && 'latitud' in adiso.ubicacion) {
    const ubi = adiso.ubicacion as UbicacionDetallada;
    if (ubi.latitud != null && ubi.longitud != null) {
      return { lat: ubi.latitud, lng: ubi.longitud };
    }
  }
  return null;
}

function pinHtml(categoria: Categoria, selected = false): string {
  const accent = getCategoriaThemeTokens(categoria).accent;
  const scale = selected ? 1.1 : 1;
  return `
    <div class="map-pin" style="
      transform: scale(${scale});
      width: 28px; height: 28px;
      background: ${accent};
      border: 2.5px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg) scale(${scale});
      box-shadow: 0 2px 8px rgba(0,0,0,0.28);
    "></div>
  `;
}

export default function MapaInteractivo({ adisos, onAbrirAdiso }: MapaInteractivoProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const [filter, setFilter] = useState<Categoria | 'todos'>('todos');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const adisosConCoords = useMemo(
    () => adisos.filter((a) => getCoordenadas(a) !== null),
    [adisos],
  );

  const adisosFiltrados = useMemo(
    () =>
      adisosConCoords.filter((a) => filter === 'todos' || a.categoria === filter),
    [adisosConCoords, filter],
  );

  const invalidateMapSize = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.invalidateSize({ animate: false });
  }, []);

  // Init Leaflet
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapContainerRef.current || mapInstance.current) return;

      try {
        const L = await import('leaflet');
        if (cancelled) return;

        leafletRef.current = L;

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

        L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: 19,
        }).addTo(map);

        mapInstance.current = map;
        setMapReady(true);

        requestAnimationFrame(() => {
          invalidateMapSize();
          setTimeout(invalidateMapSize, 200);
          setTimeout(invalidateMapSize, 600);
        });
      } catch (e) {
        console.error('[MapaInteractivo] init error', e);
        setMapError(true);
      }
    }

    void init();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapReady(false);
    };
  }, [invalidateMapSize]);

  // Resize when sidebar panel changes size
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => invalidateMapSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [invalidateMapSize, mapReady]);

  // Markers
  useEffect(() => {
    const L = leafletRef.current;
    if (!mapInstance.current || !L || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds: [number, number][] = [];

    adisosFiltrados.forEach((adiso) => {
      const coords = getCoordenadas(adiso);
      if (!coords) return;

      let lat = coords.lat;
      let lng = coords.lng;

      if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) {
        lat = DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.04;
        lng = DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.04;
      } else {
        lat += (Math.random() - 0.5) * 0.0004;
        lng += (Math.random() - 0.5) * 0.0004;
      }

      bounds.push([lat, lng]);

      const isSelected = selectedId === adiso.id;

      const markerIcon = L.divIcon({
        className: 'map-marker-icon',
        html: pinHtml(adiso.categoria, isSelected),
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const priceLabel =
        adiso.precio != null
          ? `S/ ${Number(adiso.precio).toLocaleString('es-PE')}`
          : 'Consultar';

      const marker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(
        `
        <div class="map-popup">
          <p class="map-popup__cat">${adiso.categoria}</p>
          <h3 class="map-popup__title">${escapeHtml(adiso.titulo)}</h3>
          <p class="map-popup__price">${escapeHtml(priceLabel)}</p>
          <button type="button" class="map-popup__btn" id="map-btn-${adiso.id}">Ver aviso</button>
        </div>
      `,
        { className: 'map-popup-wrapper', maxWidth: 240 },
      );

      marker.on('click', () => setSelectedId(adiso.id));

      marker.on('popupopen', () => {
        setSelectedId(adiso.id);
        const btn = document.getElementById(`map-btn-${adiso.id}`);
        if (btn) btn.onclick = () => onAbrirAdiso(adiso);
      });

      marker.addTo(mapInstance.current!);
      markersRef.current.push(marker);
    });

    if (bounds.length > 1) {
      mapInstance.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    } else if (bounds.length === 1) {
      mapInstance.current.setView(bounds[0], 14);
    }
  }, [adisosFiltrados, onAbrirAdiso, mapReady, selectedId]);

  const handleLocateMe = () => {
    const L = leafletRef.current;
    if (!mapInstance.current || !L) return;

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapInstance.current!.setView([latitude, longitude], 15);

        userMarkerRef.current?.remove();
        userMarkerRef.current = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'user-loc-marker',
            html: `<div style="width:14px;height:14px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.35);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        })
          .addTo(mapInstance.current!)
          .bindPopup('Tu ubicación')
          .openPopup();
      },
      () => {
        /* silent — no alert in sidebar */
      },
    );
  };

  const handleZoom = (delta: number) => {
    mapInstance.current?.setZoom(mapInstance.current.getZoom() + delta);
  };

  return (
    <div className="map-shell relative h-full w-full min-h-[320px]">
      <div ref={mapContainerRef} className="map-canvas absolute inset-0 z-0" />

      {/* Loading */}
      {!mapReady && !mapError && (
        <div className="map-loading absolute inset-0 z-[400] flex flex-col items-center justify-center gap-3 bg-[var(--bg-secondary)]">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--brand-blue)]" />
          <p className="text-xs font-medium text-[var(--text-tertiary)]">Cargando mapa…</p>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-[var(--bg-secondary)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No se pudo cargar el mapa.</p>
        </div>
      )}

      {/* Category chips — scroll sin barra visible */}
      <div className="map-filters absolute left-0 right-12 top-0 z-[500] pt-3 pl-3">
        <div className="no-scrollbar mask-fade-right flex gap-1.5 overflow-x-auto pb-1 pr-6">
          {MAP_FILTERS.map((f) => {
            const active = filter === f.id;
            const Icon = f.id === 'todos' ? IconMapPin : getCategoriaIcon(f.id);
            const accent =
              f.id === 'todos' ? 'var(--brand-blue)' : getCategoriaThemeTokens(f.id).accent;

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`map-filter-chip flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                  active
                    ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)]/95 text-[var(--text-secondary)] backdrop-blur-md hover:border-[rgba(var(--brand-primary-rgb),0.35)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={12} color={active ? '#fff' : accent} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1.5">
        <MapControlBtn label="Acercar" onClick={() => handleZoom(1)}>
          <IconPlus size={14} />
        </MapControlBtn>
        <MapControlBtn label="Alejar" onClick={() => handleZoom(-1)}>
          <IconMinus size={14} />
        </MapControlBtn>
        <MapControlBtn label="Mi ubicación" onClick={handleLocateMe} accent>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </MapControlBtn>
      </div>

      {/* Bottom status */}
      <div className="absolute bottom-3 left-3 right-3 z-[500]">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/95 px-3.5 py-2.5 shadow-sm backdrop-blur-md">
          <div className="min-w-0">
            <p className="m-0 text-xs font-semibold text-[var(--text-primary)]">
              {adisosFiltrados.length}{' '}
              {adisosFiltrados.length === 1 ? 'aviso en el mapa' : 'avisos en el mapa'}
            </p>
            <p className="m-0 truncate text-[10px] text-[var(--text-tertiary)]">
              {adisosConCoords.length < adisos.length
                ? `${adisos.length - adisosConCoords.length} sin ubicación exacta`
                : filter === 'todos'
                  ? 'Toca un pin para ver detalle'
                  : `Filtro: ${MAP_FILTERS.find((x) => x.id === filter)?.label}`}
            </p>
          </div>
          {adisosFiltrados.length === 0 && (
            <span className="shrink-0 rounded-lg bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-tertiary)]">
              Sin resultados
            </span>
          )}
        </div>
      </div>

      <style jsx global>{`
        .map-marker-icon,
        .user-loc-marker {
          background: transparent !important;
          border: none !important;
        }

        .map-popup-wrapper .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .map-popup-wrapper .leaflet-popup-content {
          margin: 0;
          min-width: 180px;
        }

        .map-popup {
          padding: 12px 14px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .map-popup__cat {
          margin: 0 0 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-tertiary, #6b7280);
        }

        .map-popup__title {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.3;
          color: var(--text-primary, #111);
        }

        .map-popup__price {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--brand-blue, #53acc5);
        }

        .map-popup__btn {
          width: 100%;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          background: var(--brand-blue, #53acc5);
          cursor: pointer;
        }

        .map-popup__btn:hover {
          filter: brightness(1.05);
        }

        .leaflet-control-attribution {
          font-size: 9px !important;
          opacity: 0.65;
          background: rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>
    </div>
  );
}

function MapControlBtn({
  children,
  label,
  onClick,
  accent,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/95 shadow-sm backdrop-blur-md transition-all hover:bg-[var(--bg-primary)] active:scale-95 ${
        accent ? 'text-[var(--brand-blue)]' : 'text-[var(--text-secondary)]'
      }`}
    >
      {children}
    </button>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
