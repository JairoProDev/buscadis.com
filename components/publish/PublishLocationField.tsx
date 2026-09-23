'use client';

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import LocationPicker from '@/components/location/LocationPicker';
import { formatUbicacionCorta } from '@/lib/adiso-display';
import type { BrowseLocationFilter } from '@/lib/geo/types';
import type { Ubicacion, UbicacionDetallada } from '@/types';
import { IconChevronDown, IconLocation } from '@/components/Icons';
import { publishInput } from './publish-ui';

const HISTORY_KEY = 'buscadis-publish-locations';

function toFilter(ubicacion?: Ubicacion): BrowseLocationFilter {
  if (!ubicacion) return {};
  if (typeof ubicacion === 'string') {
    return { distrito: ubicacion };
  }
  return {
    country: ubicacion.pais,
    departamento: ubicacion.departamento,
    provincia: ubicacion.provincia,
    distrito: ubicacion.distrito,
    latitud: ubicacion.latitud,
    longitud: ubicacion.longitud,
  };
}

function toUbicacion(filter: BrowseLocationFilter, direccion?: string): UbicacionDetallada {
  return {
    pais: filter.country || 'Perú',
    departamento: filter.departamento || '',
    provincia: filter.provincia || '',
    distrito: filter.distrito || '',
    direccion,
    latitud: filter.latitud,
    longitud: filter.longitud,
  };
}

function labelOf(ubicacion?: Ubicacion) {
  if (!ubicacion) return '';
  if (typeof ubicacion === 'string') return formatUbicacionCorta(ubicacion);
  return formatUbicacionCorta(ubicacion) || ubicacion.direccion || '';
}

function readHistory(): UbicacionDetallada[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as UbicacionDetallada[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(next: UbicacionDetallada[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

function remember(ubicacion: UbicacionDetallada) {
  const key = [ubicacion.pais, ubicacion.departamento, ubicacion.provincia, ubicacion.distrito, ubicacion.direccion]
    .filter(Boolean)
    .join('|');
  if (!key) return;
  const current = readHistory().filter((item) =>
    [item.pais, item.departamento, item.provincia, item.distrito, item.direccion].filter(Boolean).join('|') !== key,
  );
  writeHistory([ubicacion, ...current]);
}

export default function PublishLocationField({
  value,
  onChange,
}: {
  value?: Ubicacion;
  onChange: (ubicacion: UbicacionDetallada) => void;
}) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<UbicacionDetallada[]>([]);
  const [direccion, setDireccion] = useState(typeof value === 'object' ? value.direccion || '' : '');
  const filter = useMemo(() => toFilter(value), [value]);
  const lat = filter.latitud ?? -13.5319;
  const lng = filter.longitud ?? -71.9675;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012}%2C${lat - 0.008}%2C${lng + 0.012}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`;

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const commit = (next: BrowseLocationFilter, street = direccion) => {
    const ubicacion = toUbicacion(next, street);
    onChange(ubicacion);
    remember(ubicacion);
    setHistory(readHistory());
  };

  const movePin = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const spanLng = 0.024;
    const spanLat = 0.016;
    commit({
      ...filter,
      longitud: lng - spanLng / 2 + x * spanLng,
      latitud: lat + spanLat / 2 - y * spanLat,
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${publishInput} mt-0 flex h-[52px] items-center justify-between gap-2 text-left`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconLocation size={16} color="var(--brand-blue)" />
          <span className={labelOf(value) ? 'truncate text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}>
            {labelOf(value) || 'Elige una ubicación'}
          </span>
        </span>
        <IconChevronDown size={14} className={`shrink-0 text-[var(--text-tertiary)] ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-xl bg-[var(--bg-secondary)] p-3 ring-1 ring-[var(--border-color)]">
          {history.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {history.map((item, index) => (
                <button
                  key={`${labelOf(item)}-${index}`}
                  type="button"
                  onClick={() => {
                    setDireccion(item.direccion || '');
                    onChange(item);
                  }}
                  className="rounded-full bg-[var(--bg-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]"
                >
                  {labelOf(item)}
                </button>
              ))}
            </div>
          )}
          <LocationPicker
            value={filter}
            onChange={(next) => commit(next)}
            autoDetectOnMount={false}
          />
          <input
            value={direccion}
            onChange={(event) => {
              setDireccion(event.target.value);
              commit(filter, event.target.value);
            }}
            placeholder="Calle, avenida o referencia"
            className={`${publishInput} mt-0`}
          />
          <div>
            <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Mapa
            </p>
            <div className="relative overflow-hidden rounded-xl" onClick={movePin}>
              <iframe
                title="Mapa de ubicación"
                src={mapSrc}
                className="pointer-events-none h-44 w-full border-0"
              />
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-2xl">
                📍
              </span>
            </div>
            <p className="m-0 mt-1 text-[11px] text-[var(--text-tertiary)]">
              Toca el mapa para mover el pin y guardar las coordenadas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
