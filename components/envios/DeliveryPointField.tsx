'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { FaCrosshairs } from 'react-icons/fa';
import { detectZoneFromText } from '@/lib/envios/zones';
import { IconLocation, IconSearch } from '@/components/Icons';

const DEFAULT_CENTER: [number, number] = [-13.5319, -71.9675];
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export interface DeliveryMapPoint {
  lat: number;
  lng: number;
  text: string;
  zona?: string | null;
}

interface DeliveryPointFieldProps {
  label: string;
  value: DeliveryMapPoint | null;
  onChange: (point: DeliveryMapPoint) => void;
  autoLocate?: boolean;
  placeholder?: string;
}

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

async function reverseGeocode(lat: number, lng: number): Promise<{ text: string; zona: string | null }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'Buscadis-Delivery/1.0' } }
    );
    if (!res.ok) throw new Error('geocode');
    const data = await res.json();
    const text = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const addr = data.address || {};
    const suburb =
      addr.suburb || addr.neighbourhood || addr.city_district || addr.town || '';
    return { text, zona: detectZoneFromText(`${suburb} ${text}`) };
  } catch {
    return { text: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, zona: null };
  }
}

async function searchPlaces(query: string): Promise<NominatimHit[]> {
  const q = `${query.trim()}, Cusco, Peru`;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
    { headers: { 'User-Agent': 'Buscadis-Delivery/1.0' } }
  );
  if (!res.ok) return [];
  return (await res.json()) as NominatimHit[];
}

export default function DeliveryPointField({
  label,
  value,
  onChange,
  autoLocate = false,
  placeholder = 'Escribe o toca el mapa',
}: DeliveryPointFieldProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const autoLocateDone = useRef(false);

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState(value?.text || '');
  const [suggestions, setSuggestions] = useState<NominatimHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncMarker = useCallback((lat: number, lng: number) => {
    const L = leafletRef.current;
    if (!L || !mapInstance.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:var(--brand-blue,#53acc5);border:2px solid #fff;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      markerRef.current = L.marker([lat, lng], { draggable: true, icon }).addTo(
        mapInstance.current
      );
      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current!.getLatLng();
        const geo = await reverseGeocode(pos.lat, pos.lng);
        setQuery(geo.text);
        onChangeRef.current({
          lat: pos.lat,
          lng: pos.lng,
          text: geo.text,
          zona: geo.zona,
        });
      });
    }
    mapInstance.current.setView([lat, lng], Math.max(mapInstance.current.getZoom(), 15));
  }, []);

  const applyCoords = useCallback(
    async (lat: number, lng: number, keepText?: string) => {
      const geo = await reverseGeocode(lat, lng);
      const text = keepText?.trim() || geo.text;
      setQuery(text);
      setSuggestions([]);
      setShowSuggestions(false);
      onChangeRef.current({ lat, lng, text, zona: geo.zona });
      syncMarker(lat, lng);
    },
    [syncMarker]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || mapInstance.current) return;
      try {
        const L = await import('leaflet');
        // @ts-expect-error css
        await import('leaflet/dist/leaflet.css');
        if (cancelled || !mapRef.current) return;
        leafletRef.current = L;

        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(value ? [value.lat, value.lng] : DEFAULT_CENTER, value ? 15 : 13);

        L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          void applyCoords(e.latlng.lat, e.latlng.lng);
        });

        mapInstance.current = map;
        setReady(true);

        if (value) {
          syncMarker(value.lat, value.lng);
        } else if (autoLocate && !autoLocateDone.current && navigator.geolocation) {
          autoLocateDone.current = true;
          setLocating(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              void applyCoords(pos.coords.latitude, pos.coords.longitude).finally(() =>
                setLocating(false)
              );
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 12000 }
          );
        }

        requestAnimationFrame(() => map.invalidateSize());
      } catch {
        setReady(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void applyCoords(pos.coords.latitude, pos.coords.longitude).finally(() =>
          setLocating(false)
        );
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const hits = await searchPlaces(text);
        setSuggestions(hits);
        setShowSuggestions(true);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const pickSuggestion = async (hit: NominatimHit) => {
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    await applyCoords(lat, lng, hit.display_name);
  };

  const confirmTyped = async () => {
    if (query.trim().length < 3) return;
    setSearching(true);
    try {
      const hits = await searchPlaces(query);
      if (hits[0]) {
        await pickSuggestion(hits[0]);
      } else if (value) {
        onChangeRef.current({ ...value, text: query.trim() });
      }
    } finally {
      setSearching(false);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
          <IconLocation size={14} color="var(--brand-blue)" />
          {label}
        </label>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--brand-blue)] hover:bg-[rgba(var(--brand-primary-rgb),0.1)]"
        >
          <FaCrosshairs size={11} />
          {locating ? 'Detectando…' : 'Mi ubicación'}
        </button>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 focus-within:border-[var(--brand-blue)]">
          <IconSearch size={14} color="var(--text-secondary)" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => {
              // delay so click on suggestion works
              setTimeout(() => setShowSuggestions(false), 180);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void confirmTyped();
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
          />
          {searching && (
            <span className="text-[10px] text-[var(--text-secondary)]">…</span>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-lg">
            {suggestions.map((s) => (
              <li key={`${s.lat}-${s.lon}-${s.display_name}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pickSuggestion(s)}
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        ref={mapRef}
        className="h-40 w-full overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
      />
      <p className="text-[11px] text-[var(--text-secondary)]">
        {ready
          ? value?.zona
            ? `Zona: ${value.zona} · Escribe, elige sugerencia o toca/arrastra el pin`
            : 'Escribe una dirección, elige de la lista, o toca/arrastra el pin'
          : 'Cargando mapa…'}
      </p>
    </div>
  );
}
