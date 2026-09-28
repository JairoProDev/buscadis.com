'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Map as LeafletMap } from 'leaflet';
import { PUBLISH_CATEGORIAS, getCategoriaIcon, getCategoriaLabel } from '@/lib/categoria-icons';
import { IconFilterFunnel, IconMinus, IconPlus } from '@/components/Icons';
import MarketplaceSearchComposer from '@/components/search/MarketplaceSearchComposer';
import MapCanvas from '@/components/map/MapCanvas';
import { clusterListings } from '@/lib/map/cluster';
import { boundsKey, formatMapPrice } from '@/lib/map/format';
import { getAdisoById } from '@/lib/storage';
import type { MapBounds, MapCluster, MapListing } from '@/lib/map/types';
import type { Adiso, Categoria } from '@/types';

const ModalAdiso = dynamic(() => import('@/components/ModalAdiso'), { ssr: false });

type FilterId = Categoria | 'todos';

interface MapExperienceProps {
  variant?: 'page' | 'panel';
  onOpen?: (listing: MapListing) => void;
}

export default function MapExperience({ variant = 'panel' }: MapExperienceProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
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
  const [moving, setMoving] = useState(false);
  const [detail, setDetail] = useState<Adiso | null>(null);
  const adisoCache = useRef(new Map<string, Adiso>());
  const [dockPx, setDockPx] = useState(0);
  const [wide, setWide] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const boundsRef = useRef<MapBounds | null>(null);
  const listingsRef = useRef<MapListing[]>([]);
  listingsRef.current = listings;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setWide(mq.matches && variant === 'page');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [variant]);

  const load = useCallback(
    async (next: MapBounds, q?: string) => {
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
      const text = (q ?? query).trim();
      if (text) params.set('q', text);
      if (minPrice) params.set('min', minPrice);
      if (maxPrice) params.set('max', maxPrice);
      if (photoOnly) params.set('foto', '1');
      try {
        let res = await fetch(`/api/map/listings?${params}`, { signal: controller.signal });
        if (res.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (controller.signal.aborted) return;
          res = await fetch(`/api/map/listings?${params}`, { signal: controller.signal });
        }
        const data = (await res.json()) as { listings?: MapListing[]; error?: string };
        if (!res.ok) {
          if (listingsRef.current.length > 0) return;
          throw new Error(data.error || 'Error al cargar el mapa');
        }
        setListings(data.listings || []);
        setFetchedKey(boundsKey(next));
        setStale(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (listingsRef.current.length > 0) return;
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
      setMoving(false);
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
    map.flyTo([cluster.lat, cluster.lng], Math.min(map.getZoom() + 2, 19), { duration: 0.4 });
  };

  const openDetail = useCallback((id: string) => {
    const cached = adisoCache.current.get(id);
    if (cached) {
      setDetail(cached);
      return;
    }
    const listing = listingsRef.current.find((item) => item.id === id);
    if (listing) setDetail(listingToAdiso(listing));
    void getAdisoById(id).then((adiso) => {
      if (!adiso) {
        if (!listing) setError('No se pudo abrir el anuncio');
        return;
      }
      adisoCache.current.set(id, adiso);
      setDetail((current) => (current?.id === id ? adiso : current));
    });
  }, []);

  useEffect(() => {
    if (!selected || adisoCache.current.has(selected.id)) return;
    let cancel = false;
    void getAdisoById(selected.id).then((adiso) => {
      if (!cancel && adiso) adisoCache.current.set(selected.id, adiso);
    });
    return () => {
      cancel = true;
    };
  }, [selected]);

  useEffect(() => {
    const el = cardRef.current;
    if (!selected || wide || !el) {
      setDockPx(0);
      return;
    }
    const update = () => setDockPx(el.offsetHeight + 8);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [selected, wide]);

  const detailIndex = detail ? listings.findIndex((item) => item.id === detail.id) : -1;
  const compactChrome = moving || (!wide && Boolean(selected));
  const dock = dockPx > 0 ? `${dockPx}px` : '0px';
  const activeFilterCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (photoOnly ? 1 : 0);

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
          onGestureStart={() => {
            setMoving(true);
            setFiltersOpen(false);
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-col gap-2 px-3 pt-3">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="map-search min-w-0 flex-1">
              <MarketplaceSearchComposer
                searchOnly
                flat
                compact
                placeholder="Buscar en el mapa"
                value={query}
                onChange={setQuery}
                searchLoading={loading}
                onSearchSubmit={(text) => {
                  setQuery(text);
                  if (bounds) void load(bounds, text);
                }}
                onCategoryDetected={(categoria) => setFilter(categoria)}
                onOpenAdiso={(id) => {
                  void openDetail(id);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className={`map-float relative flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${filtersOpen || activeFilterCount ? 'text-[var(--brand-blue)]' : 'text-[var(--text-primary)]'}`}
              aria-expanded={filtersOpen}
            >
              <IconFilterFunnel size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-blue)] px-1 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {!compactChrome && (
            <div className="no-scrollbar pointer-events-auto -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5">
              <CategoryChip active={filter === 'todos'} label="Todos" onClick={() => setFilter('todos')} />
              {PUBLISH_CATEGORIAS.map((c) => {
                const Icon = getCategoriaIcon(c.value);
                const active = filter === c.value;
                return (
                  <CategoryChip
                    key={c.value}
                    active={active}
                    label={c.label}
                    onClick={() => setFilter((current) => (current === c.value ? 'todos' : c.value))}
                    icon={<Icon size={14} />}
                  />
                );
              })}
            </div>
          )}

          {!compactChrome && filtersOpen && (
            <div className="map-float pointer-events-auto flex items-center gap-2 rounded-2xl p-2">
              <input
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Mín"
                aria-label="Precio mínimo"
                className="h-10 w-full min-w-0 rounded-full bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none"
              />
              <input
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Máx"
                aria-label="Precio máximo"
                className="h-10 w-full min-w-0 rounded-full bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none"
              />
              <button
                type="button"
                onClick={() => setPhotoOnly((v) => !v)}
                className={`h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${photoOnly ? 'bg-[var(--brand-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
              >
                Con foto
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  if (bounds) void load(bounds);
                }}
                className="h-10 shrink-0 rounded-full bg-[var(--text-primary)] px-4 text-sm font-semibold text-[var(--bg-primary)]"
              >
                Aplicar
              </button>
            </div>
          )}

          {stale && !moving && (
            <div className="pointer-events-none flex justify-center">
              <button
                type="button"
                onClick={() => bounds && void load(bounds)}
                className="pointer-events-auto h-10 rounded-full bg-[var(--text-primary)] px-4 text-sm font-semibold text-[var(--bg-primary)] shadow-lg"
              >
                Buscar en esta zona
              </button>
            </div>
          )}
        </div>

        <div className="map-controls absolute right-3 z-[500] flex flex-col items-center gap-2">
          <div className="map-zoom">
            <button type="button" aria-label="Acercar" onClick={() => mapRef.current?.zoomIn()} className="map-zoom__btn">
              <IconPlus size={16} />
            </button>
            <button type="button" aria-label="Alejar" onClick={() => mapRef.current?.zoomOut()} className="map-zoom__btn">
              <IconMinus size={16} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Mi ubicación"
            onClick={() => {
              if (!navigator.geolocation || !mapRef.current) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 16);
              });
            }}
            className="map-locate"
          >
            <TargetGlyph />
          </button>
        </div>

        {error && (
          <p className="map-dock absolute left-3 right-3 z-[500] rounded-xl bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--bs-danger-fg,var(--text-primary))] shadow">
            {error}
          </p>
        )}

        {!wide && selected && (
          <div ref={cardRef} className="map-dock absolute left-3 right-3 z-[500]">
            <ListingCard
              listing={selected}
              onOpen={() => openDetail(selected.id)}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {wide && (
        <aside className="flex w-[min(400px,36vw)] shrink-0 flex-col border-l border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="border-b border-[var(--border-color)] px-5 py-4">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              En esta zona
            </p>
            <p className="m-0 mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {loading ? 'Buscando anuncios' : `${listings.length} ${listings.length === 1 ? 'anuncio' : 'anuncios'}`}
            </p>
            <p className="m-0 mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
              El precio va en el pin. Los negocios marcan su local; el resto, una zona aproximada.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && listings.length === 0 &&
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 border-b border-[var(--border-color)] px-4 py-3">
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-[var(--bg-secondary)]" />
                  <div className="flex flex-1 flex-col justify-center gap-2">
                    <div className="h-2.5 w-24 animate-pulse rounded-full bg-[var(--bg-secondary)]" />
                    <div className="h-3.5 w-full animate-pulse rounded-full bg-[var(--bg-secondary)]" />
                    <div className="h-3 w-16 animate-pulse rounded-full bg-[var(--bg-secondary)]" />
                  </div>
                </div>
              ))}
            {listings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                onClick={() => {
                  setSelected(listing);
                  mapRef.current?.panTo([listing.lat, listing.lng]);
                }}
                onDoubleClick={() => void openDetail(listing.id)}
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
              <ListingActions listing={selected} onOpen={() => void openDetail(selected.id)} />
            </div>
          )}
        </aside>
      )}

      {detail && (
        <ModalAdiso
          adiso={detail}
          onCerrar={() => setDetail(null)}
          onAnterior={detailIndex > 0 ? () => void openDetail(listings[detailIndex - 1].id) : undefined}
          onSiguiente={
            detailIndex >= 0 && detailIndex < listings.length - 1
              ? () => void openDetail(listings[detailIndex + 1].id)
              : undefined
          }
          puedeAnterior={detailIndex > 0}
          puedeSiguiente={detailIndex >= 0 && detailIndex < listings.length - 1}
          preservarUrlQuery
        />
      )}

      <style jsx global>{`
        .bs-map-marker { background: transparent !important; border: none !important; }
        .bs-map-pin {
          width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
          background: var(--brand-blue); color: white; border: 2px solid white;
          border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,.28);
        }
        .bs-map-pin__glyph { display: flex; transform: rotate(45deg); }
        .bs-map-pin.is-selected { background: var(--text-primary); outline: 3px solid var(--brand-blue); outline-offset: 2px; }
        .bs-map-pin--price {
          width: auto; height: auto; transform: none; border-radius: 999px; background: white;
          color: var(--text-primary); font: 700 12px/1 system-ui, sans-serif; padding: 6px 8px;
          border: 1px solid rgba(0,0,0,.08); box-shadow: 0 4px 14px rgba(0,0,0,.16); white-space: nowrap;
        }
        .bs-map-pin--price.is-selected { background: var(--brand-blue); color: white; }
        .bs-map-pin.is-promoted, .bs-map-pin--price.is-promoted { box-shadow: 0 0 0 2px var(--bs-warning-fg), 0 4px 14px rgba(0,0,0,.16); }
        .bs-map-cluster {
          width: 36px; height: 36px; border-radius: 999px; background: var(--brand-blue); color: white;
          display: flex; align-items: center; justify-content: center; font: 700 13px/1 system-ui, sans-serif;
          border: 2px solid white; box-shadow: 0 4px 16px rgba(0,0,0,.25);
        }
        .leaflet-container { background: var(--bg-secondary); }
        .leaflet-control-attribution {
          font-size: 9px !important; opacity: .75; max-width: calc(100% - 72px);
          background: var(--bg-primary) !important; border-radius: 8px; margin: 0 0 2px 8px !important;
        }
        .map-float {
          background: var(--bg-primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .map-search .brand-search-shell {
          border-radius: 999px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .map-controls { top: auto; bottom: 28px; }
        .map-zoom {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 14px;
          background: var(--bg-primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .map-zoom__btn {
          display: flex;
          width: 40px;
          height: 36px;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          background: transparent;
        }
        .map-locate {
          display: flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: var(--text-primary);
          background: var(--bg-primary);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .map-zoom__btn + .map-zoom__btn {
          border-top: 1px solid var(--border-color);
        }
        .map-dock { bottom: 12px; }
        @media (max-width: 767px) {
          .map-shell--page .map-dock {
            bottom: calc(var(--bs-nav-visible-offset, 72px) + 10px);
          }
          .map-shell--page .map-controls {
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

function CategoryChip({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${
        active ? 'bg-[var(--brand-blue)] text-white' : 'map-float text-[var(--text-primary)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TargetGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 0 0 20.5 3.5zM12 20.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.8.6.6-3.7-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.5c0-.1-.5-1.2-.7-1.6s-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.5 2.5 0 0 0-.8 1.8 4.3 4.3 0 0 0 .9 2.3 9.8 9.8 0 0 0 3.8 3.3 4.3 4.3 0 0 0 2.6.7 2.2 2.2 0 0 0 1.5-.7 1.8 1.8 0 0 0 .4-1.3c0-.1 0-.3-.2-.4z" />
    </svg>
  );
}

function Thumb({ listing, size = 56 }: { listing: MapListing; size?: number }) {
  const Icon = getCategoriaIcon(listing.categoria);
  if (!listing.imageUrl) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--brand-blue)]"
        style={{ width: size, height: size }}
      >
        <Icon size={22} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={listing.imageUrl} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />
  );
}

function ListingCopy({ listing }: { listing: MapListing }) {
  const place = listing.distrito || 'Cusco';
  const precision = listing.precision === 'exact' ? 'Local' : 'Zona aproximada';
  return (
    <span className="min-w-0">
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">{listing.titulo}</span>
      <span className="mt-0.5 block text-sm font-bold text-[var(--brand-blue)]">{formatMapPrice(listing)}</span>
      <span className="mt-0.5 block truncate text-xs text-[var(--text-tertiary)]">
        {getCategoriaLabel(listing.categoria)} · {place} · {precision}
      </span>
    </span>
  );
}

function ListingActions({ listing, onOpen }: { listing: MapListing; onOpen: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onOpen}
        className="h-11 flex-1 rounded-full bg-[var(--text-primary)] px-4 text-sm font-semibold text-[var(--bg-primary)]"
      >
        Ver anuncio
      </button>
      {listing.whatsappUrl && (
        <a
          href={listing.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center gap-1.5 rounded-full bg-[var(--bs-color-social-whatsapp)] px-3.5 text-sm font-semibold text-white"
        >
          <WhatsAppGlyph />
          WhatsApp
        </a>
      )}
      {listing.directionsUrl && (
        <a
          href={listing.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="map-float flex h-11 items-center rounded-full px-3.5 text-sm font-semibold text-[var(--text-primary)]"
        >
          Cómo llegar
        </a>
      )}
    </div>
  );
}

function listingToAdiso(listing: MapListing): Adiso {
  return {
    id: listing.id,
    categoria: listing.categoria,
    titulo: listing.titulo,
    descripcion: '',
    contacto: '',
    ubicacion: listing.distrito || 'Cusco',
    fechaPublicacion: '',
    horaPublicacion: '',
    imagenUrl: listing.imageUrl || undefined,
    imagenesUrls: listing.imageUrl ? [listing.imageUrl] : undefined,
    precio: listing.precio ?? undefined,
    moneda: listing.moneda ?? undefined,
    tipoPrecio: listing.tipoPrecio ?? undefined,
    esDestacado: listing.promoted,
    promotionTier: listing.promoted ? 'destacada' : 'gratis',
  };
}

function ListingCard({
  listing,
  onOpen,
  onClose,
}: {
  listing: MapListing;
  onOpen: () => void;
  onClose: () => void;
}) {
  const place = listing.distrito || 'Cusco';
  const precision = listing.precision === 'exact' ? 'Local' : 'Zona aproximada';
  return (
    <div className="map-float rounded-[22px] p-3">
      <div className="flex items-start gap-2">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <Thumb listing={listing} size={64} />
          <span className="min-w-0">
            <span className="block whitespace-normal break-words text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
              {listing.titulo}
            </span>
            <span className="mt-1 block text-sm font-bold text-[var(--brand-blue)]">{formatMapPrice(listing)}</span>
            <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
              {getCategoriaLabel(listing.categoria)} · {place} · {precision}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-[var(--text-secondary)]"
        >
          ×
        </button>
      </div>
      <div className="mt-3">
        <ListingActions listing={listing} onOpen={onOpen} />
      </div>
    </div>
  );
}
