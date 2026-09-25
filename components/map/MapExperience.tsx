'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { PUBLISH_CATEGORIAS, getCategoriaIcon, getCategoriaLabel } from '@/lib/categoria-icons';
import { IconMapPin, IconMinus, IconPlus } from '@/components/Icons';
import MapCanvas from '@/components/map/MapCanvas';
import { clusterListings } from '@/lib/map/cluster';
import { boundsKey, formatMapPrice } from '@/lib/map/format';
import type { MapBounds, MapCluster, MapListing } from '@/lib/map/types';
import type { Categoria } from '@/types';
import { tokens } from '@/lib/bs-tokens';

type FilterId = Categoria | 'todos';

interface MapExperienceProps {
  variant?: 'page' | 'panel';
  onOpen?: (listing: MapListing) => void;
}

export default function MapExperience({ variant = 'panel', onOpen }: MapExperienceProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [listings, setListings] = useState<MapListing[]>([]);
  const [zoom, setZoom] = useState(13);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [fetchedKey, setFetchedKey] = useState('');
  const [filter, setFilter] = useState<FilterId>('todos');
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [photoOnly, setPhotoOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<MapListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [wide, setWide] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const boundsRef = useRef<MapBounds | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setWide(mq.matches && variant === 'page');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [variant]);

  const load = useCallback(
    async (next: MapBounds) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        south: String(next.south),
        west: String(next.west),
        north: String(next.north),
        east: String(next.east),
      });
      if (filter !== 'todos') params.set('categoria', filter);
      if (query.trim()) params.set('q', query.trim());
      if (minPrice) params.set('min', minPrice);
      if (maxPrice) params.set('max', maxPrice);
      if (photoOnly) params.set('foto', '1');
      try {
        const res = await fetch(`/api/map/listings?${params}`, { signal: controller.signal });
        const data = (await res.json()) as { listings?: MapListing[]; error?: string };
        if (!res.ok) throw new Error(data.error || 'Error al cargar el mapa');
        setListings(data.listings || []);
        setFetchedKey(boundsKey(next));
        setStale(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [filter, query, minPrice, maxPrice, photoOnly],
  );

  const onReady = useCallback(
    (next: MapBounds, nextZoom: number) => {
      boundsRef.current = next;
      setBounds(next);
      setZoom(nextZoom);
      void load(next);
    },
    [load],
  );

  const onViewChange = useCallback(
    (next: MapBounds, nextZoom: number) => {
      boundsRef.current = next;
      setBounds(next);
      setZoom(nextZoom);
      if (fetchedKey && boundsKey(next) !== fetchedKey) setStale(true);
    },
    [fetchedKey],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!boundsRef.current) return;
    void loadRef.current(boundsRef.current);
  }, [filter, photoOnly]);

  const clusters = useMemo(() => clusterListings(listings, zoom), [listings, zoom]);

  const expandCluster = (cluster: MapCluster) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 17), { duration: 0.4 });
  };

  const dock = !wide && selected ? '12.25rem' : '0px';

  return (
    <div
      className={`map-shell relative flex h-full min-h-[320px] w-full ${wide ? 'flex-row' : 'flex-col'} ${variant === 'page' ? 'map-shell--page' : ''}`}
      style={{ ['--map-dock' as string]: dock }}
    >
      <div className="relative min-h-0 min-w-0 flex-1">
        <MapCanvas
          clusters={clusters}
          selectedId={selected?.id ?? null}
          onMap={(map) => {
            mapRef.current = map;
          }}
          onReady={onReady}
          onViewChange={onViewChange}
          onSelectListing={setSelected}
          onExpandCluster={expandCluster}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3">
          <div className="pointer-events-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/95 p-2 shadow-md backdrop-blur-md">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (bounds) void load(bounds);
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zona, barrio o palabra"
                aria-label="Buscar en el mapa"
                className="h-10 min-w-0 flex-1 rounded-full bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-[var(--brand-blue)] px-4 text-xs font-bold text-white"
              >
                Buscar
              </button>
            </form>
            <div className="mt-2 flex items-center gap-2">
              <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                <FilterChip active={filter === 'todos'} label="Todos" onClick={() => setFilter('todos')} icon={<IconMapPin size={12} color={filter === 'todos' ? tokens['--bs-color-neutral-0'] : 'var(--brand-blue)'} />} />
                {PUBLISH_CATEGORIAS.map((c) => {
                  const Icon = getCategoriaIcon(c.value);
                  const active = filter === c.value;
                  return (
                    <FilterChip
                      key={c.value}
                      active={active}
                      label={c.label}
                      onClick={() => setFilter(c.value)}
                      icon={<Icon size={12} color={active ? tokens['--bs-color-neutral-0'] : 'currentColor'} />}
                    />
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className={`h-8 shrink-0 rounded-full border px-3 text-[11px] font-semibold ${filtersOpen || minPrice || maxPrice || photoOnly ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
              >
                Precio
              </button>
            </div>
            {filtersOpen && (
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  inputMode="numeric"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Mín"
                  aria-label="Precio mínimo"
                  className="h-9 w-full min-w-0 rounded-full bg-[var(--bg-secondary)] px-3 text-xs text-[var(--text-primary)] outline-none"
                />
                <input
                  inputMode="numeric"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Máx"
                  aria-label="Precio máximo"
                  className="h-9 w-full min-w-0 rounded-full bg-[var(--bg-secondary)] px-3 text-xs text-[var(--text-primary)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPhotoOnly((v) => !v)}
                  className={`h-9 shrink-0 rounded-full px-3 text-[11px] font-semibold ${photoOnly ? 'bg-[var(--brand-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                >
                  Con foto
                </button>
                <button
                  type="button"
                  onClick={() => bounds && void load(bounds)}
                  className="h-9 shrink-0 rounded-full bg-[var(--brand-blue)] px-3 text-[11px] font-bold text-white"
                >
                  Aplicar
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <p className="m-0 truncate text-[11px] font-semibold text-[var(--text-secondary)]">
                {loading ? 'Buscando…' : `${listings.length} en esta zona`}
              </p>
              {stale && (
                <button
                  type="button"
                  onClick={() => bounds && void load(bounds)}
                  className="h-8 shrink-0 rounded-full bg-[var(--brand-blue)] px-3 text-[11px] font-bold text-white"
                >
                  Buscar aquí
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="map-zoom absolute right-3 z-[500] flex flex-col gap-1.5">
          <RoundBtn label="Acercar" onClick={() => mapRef.current?.zoomIn()}>
            <IconPlus size={14} />
          </RoundBtn>
          <RoundBtn label="Alejar" onClick={() => mapRef.current?.zoomOut()}>
            <IconMinus size={14} />
          </RoundBtn>
          <RoundBtn
            label="Mi ubicación"
            accent
            onClick={() => {
              if (!navigator.geolocation || !mapRef.current) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15);
              });
            }}
          >
            <span className="block h-3 w-3 rounded-full border-2 border-current" />
          </RoundBtn>
        </div>

        {error && (
          <p className="map-dock absolute left-3 right-3 z-[500] rounded-xl bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--bs-danger-fg,var(--text-primary))] shadow">
            {error}
          </p>
        )}

        {!wide && selected && (
          <div className="map-dock absolute left-3 right-3 z-[500]">
            <ListingCard listing={selected} onClose={() => setSelected(null)} onOpen={onOpen} />
          </div>
        )}
      </div>

      {wide && (
        <aside className="flex w-[min(380px,38vw)] shrink-0 flex-col border-l border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="border-b border-[var(--border-color)] px-4 py-3">
            <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">
              {loading ? 'Actualizando…' : `${listings.length} en el mapa`}
            </p>
            <p className="m-0 text-[11px] text-[var(--text-tertiary)]">
              Precio en el pin. Negocios en su local; el resto, zona aproximada.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                onClick={() => {
                  setSelected(listing);
                  mapRef.current?.panTo([listing.lat, listing.lng]);
                }}
                onDoubleClick={() => onOpen?.(listing)}
                className={`flex w-full gap-3 border-b border-[var(--border-color)] px-3 py-3 text-left ${selected?.id === listing.id ? 'bg-[var(--bg-secondary)]' : ''}`}
              >
                <Thumb listing={listing} />
                <ListingCopy listing={listing} />
              </button>
            ))}
            {!loading && listings.length === 0 && (
              <p className="px-4 py-8 text-sm text-[var(--text-tertiary)]">
                Nada en esta zona. Mueve el mapa o publica con distrito o punto en el mapa.
              </p>
            )}
          </div>
          {selected && (
            <div className="border-t border-[var(--border-color)] p-3">
              <ListingActions listing={selected} onOpen={onOpen} />
            </div>
          )}
        </aside>
      )}

      <style jsx global>{`
        .bs-map-marker { background: transparent !important; border: none !important; }
        .bs-map-pin {
          width: 18px; height: 18px; border: 2.5px solid white; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg); box-shadow: 0 2px 8px rgba(0,0,0,.28); margin: 6px auto 0;
        }
        .bs-map-pin.is-selected { outline: 3px solid var(--brand-blue); outline-offset: 2px; }
        .bs-map-pin--price {
          width: auto; height: auto; transform: none; border-radius: 999px; background: white;
          color: var(--text-primary); font: 700 12px/1 system-ui, sans-serif; padding: 6px 8px;
          border: 1px solid rgba(0,0,0,.08); box-shadow: 0 4px 14px rgba(0,0,0,.16); white-space: nowrap;
        }
        .bs-map-pin--price.is-selected { background: var(--brand-blue); color: white; }
        .bs-map-pin.is-promoted, .bs-map-pin--price.is-promoted { box-shadow: 0 0 0 2px var(--bs-warning-fg), 0 4px 14px rgba(0,0,0,.16); }
        .bs-map-cluster {
          width: 40px; height: 40px; border-radius: 999px; background: var(--brand-blue); color: white;
          display: flex; align-items: center; justify-content: center; font: 700 13px/1 system-ui, sans-serif;
          border: 3px solid white; box-shadow: 0 4px 16px rgba(0,0,0,.25);
        }
        .leaflet-control-attribution { font-size: 9px !important; opacity: .7; }
        .map-zoom { top: 46%; }
        .map-dock { bottom: 12px; }
        @media (max-width: 767px) {
          .map-shell--page .map-dock {
            bottom: calc(var(--bs-nav-visible-offset, 72px) + 10px);
          }
          .map-shell--page .map-zoom {
            top: auto;
            bottom: calc(var(--bs-nav-visible-offset, 72px) + var(--map-dock, 0px) + 12px);
          }
          .map-shell--page .leaflet-bottom {
            bottom: calc(var(--bs-nav-visible-offset, 72px) + var(--map-dock, 0px) + 2px) !important;
          }
        }
      `}</style>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${
        active
          ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white'
          : 'border-[var(--border-color)] bg-[var(--bg-primary)]/95 text-[var(--text-secondary)] backdrop-blur-md'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RoundBtn({
  children,
  label,
  onClick,
  accent,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)]/95 shadow-md ${accent ? 'text-[var(--brand-blue)]' : 'text-[var(--text-secondary)]'}`}
    >
      {children}
    </button>
  );
}

function Thumb({ listing }: { listing: MapListing }) {
  if (!listing.imageUrl) {
    return <div className="h-14 w-14 shrink-0 rounded-lg bg-[var(--bg-secondary)]" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={listing.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
  );
}

function ListingCopy({ listing }: { listing: MapListing }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
        {getCategoriaLabel(listing.categoria)}
        {listing.distrito ? ` · ${listing.distrito}` : ''}
      </span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">{listing.titulo}</span>
      <span className="block text-xs font-bold text-[var(--brand-blue)]">{formatMapPrice(listing)}</span>
      <span className="block text-[10px] text-[var(--text-tertiary)]">
        {listing.precision === 'exact' ? 'Ubicación del local' : 'Zona aproximada'}
      </span>
    </span>
  );
}

function ListingActions({ listing, onOpen }: { listing: MapListing; onOpen?: (listing: MapListing) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onOpen?.(listing)}
        className="h-11 flex-1 rounded-xl bg-[var(--brand-blue)] px-3 text-sm font-bold text-white"
      >
        Ver anuncio
      </button>
      {listing.whatsappUrl && (
        <a
          href={listing.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center rounded-xl border border-[var(--border-color)] px-3 text-xs font-bold text-[var(--text-primary)]"
        >
          WhatsApp
        </a>
      )}
      {listing.directionsUrl && (
        <a
          href={listing.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center rounded-xl border border-[var(--border-color)] px-3 text-xs font-bold text-[var(--text-primary)]"
        >
          Cómo llegar
        </a>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  onClose,
  onOpen,
}: {
  listing: MapListing;
  onClose: () => void;
  onOpen?: (listing: MapListing) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 shadow-lg">
      <div className="mb-2 flex gap-3">
        <Thumb listing={listing} />
        <ListingCopy listing={listing} />
        <button type="button" onClick={onClose} aria-label="Cerrar" className="h-7 w-7 text-[var(--text-tertiary)]">
          ×
        </button>
      </div>
      <ListingActions listing={listing} onOpen={onOpen} />
    </div>
  );
}
