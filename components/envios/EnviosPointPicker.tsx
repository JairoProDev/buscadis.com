'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { FaCrosshairs } from 'react-icons/fa';
import { detectZoneFromText } from '@/lib/envios/zones';

const DEFAULT_CENTER: [number, number] = [-13.5319, -71.9675];
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export interface EnviosMapPoint {
  lat: number;
  lng: number;
  text: string;
  zona?: string | null;
}

interface EnviosPointPickerProps {
  label: string;
  value: EnviosMapPoint | null;
  onChange: (point: EnviosMapPoint) => void;
  autoLocate?: boolean;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ text: string; zona: string | null }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'Buscadis-Envios/1.0' } }
    );
    if (!res.ok) throw new Error('geocode');
    const data = await res.json();
    const text = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const addr = data.address || {};
    const suburb =
      addr.suburb || addr.neighbourhood || addr.city_district || addr.town || '';
    const zona = detectZoneFromText(`${suburb} ${text}`);
    return { text, zona };
  } catch {
    return {
      text: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      zona: null,
    };
  }
}

export default function EnviosPointPicker({
  label,
  value,
  onChange,
  autoLocate = false,
}: EnviosPointPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [textDraft, setTextDraft] = useState(value?.text || '');

  const applyPoint = useCallback(async (lat: number, lng: number, keepText?: string) => {
    const geo = await reverseGeocode(lat, lng);
    const point: EnviosMapPoint = {
      lat,
      lng,
      text: keepText?.trim() || geo.text,
      zona: geo.zona,
    };
    setTextDraft(point.text);
    onChangeRef.current(point);

    const L = leafletRef.current;
    if (L && mapInstance.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstance.current);
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current!.getLatLng();
          await applyPoint(pos.lat, pos.lng);
        });
      }
      mapInstance.current.setView([lat, lng], 16);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapRef.current || mapInstance.current) return;
      try {
        const L = await import('leaflet');
        // @ts-expect-error leaflet css side-effect
        await import('leaflet/dist/leaflet.css');
        if (cancelled) return;
        leafletRef.current = L;

        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView(
          value ? [value.lat, value.lng] : DEFAULT_CENTER,
          value ? 16 : 13
        );

        L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);

        map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
          await applyPoint(e.latlng.lat, e.latlng.lng);
        });

        mapInstance.current = map;
        setReady(true);

        if (value) {
          await applyPoint(value.lat, value.lng, value.text);
        } else if (autoLocate && navigator.geolocation) {
          setLocating(true);
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await applyPoint(pos.coords.latitude, pos.coords.longitude);
              setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
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
      async (pos) => {
        await applyPoint(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[var(--text-primary)]">{label}</label>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
        >
          <FaCrosshairs size={12} />
          {locating ? 'Detectando…' : 'Mi ubicación'}
        </button>
      </div>

      <input
        type="text"
        value={textDraft}
        onChange={(e) => setTextDraft(e.target.value)}
        onBlur={() => {
          if (value) {
            onChange({ ...value, text: textDraft.trim() || value.text });
          }
        }}
        placeholder="Dirección o referencia"
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-blue)]"
      />

      <div
        ref={mapRef}
        className="h-52 w-full overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
      />
      {!ready && (
        <p className="text-xs text-[var(--text-secondary)]">Cargando mapa…</p>
      )}
      <p className="text-xs text-[var(--text-secondary)]">
        Toca el mapa o arrastra el pin. {value?.zona ? `Zona: ${value.zona}` : ''}
      </p>
    </div>
  );
}
