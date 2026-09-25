import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createAdisoTitleSlug } from '@/lib/url';
import type { Categoria } from '@/types';
import { displayCoordinate, precisionFor } from '@/lib/map/precision';
import { coordenadasValidas, distritoMasEspecifico, resolveStoredPoint, textoUbicaEnZona } from '@/lib/map/resolve-point';
import type { MapBounds, MapListing, MapQuery } from '@/lib/map/types';
import { directionsUrl, whatsappUrlFromContact } from '@/lib/map/format';

const SELECT =
  'id,titulo,categoria,precio,moneda,tipo_precio,distrito,latitud,longitud,ubicacion,imagen_url,promotion_tier,contacto,esta_activo';

let mapDb: SupabaseClient | null = null;

/** Cliente sin sesión. El de la app refresca auth y, en el servidor, eso falla a ratos. */
function getMapDb(): SupabaseClient | null {
  if (mapDb) return mapDb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  mapDb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return mapDb;
}

const CATEGORIES = new Set<Categoria>([
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad',
]);

function inBounds(lat: number, lng: number, b: MapBounds): boolean {
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

function firstImage(row: { imagen_url?: string | null; imagenes_urls?: unknown }): string | null {
  if (typeof row.imagen_url === 'string' && row.imagen_url) return row.imagen_url;
  const raw = row.imagenes_urls;
  const list = typeof raw === 'string' ? safeJson(raw) : raw;
  if (Array.isArray(list) && typeof list[0] === 'string') return list[0];
  return null;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function rowToListing(row: Record<string, unknown>, bounds: MapBounds): MapListing | null {
  const categoria = row.categoria as Categoria;
  if (!CATEGORIES.has(categoria)) return null;

  const storedLat = typeof row.latitud === 'number' ? row.latitud : null;
  const storedLng = typeof row.longitud === 'number' ? row.longitud : null;
  const distrito = typeof row.distrito === 'string' ? row.distrito : null;
  const text = typeof row.ubicacion === 'string' ? row.ubicacion : null;
  const hasStoredPoint = coordenadasValidas(storedLat, storedLng);
  if (!hasStoredPoint && !distrito?.trim()) {
    const named = distritoMasEspecifico(text);
    if (!named || !textoUbicaEnZona(text, named)) return null;
  }

  const resolved = resolveStoredPoint({
    latitud: storedLat,
    longitud: storedLng,
    distrito,
    text,
  });
  if (!resolved || !inBounds(resolved.lat, resolved.lng, bounds)) return null;

  const precision = precisionFor(categoria, resolved.source);
  const display = displayCoordinate(String(row.id), resolved.lat, resolved.lng, precision);
  const id = String(row.id);
  const titulo = String(row.titulo || 'Anuncio');
  const exact = precision === 'exact';

  return {
    id,
    titulo,
    categoria,
    precio: typeof row.precio === 'number' ? row.precio : null,
    moneda: row.moneda === 'USD' || row.moneda === 'PEN' ? row.moneda : null,
    tipoPrecio:
      row.tipo_precio === 'fijo' || row.tipo_precio === 'a_convenir' || row.tipo_precio === 'gratis'
        ? row.tipo_precio
        : null,
    distrito: resolved.distrito,
    imageUrl: firstImage(row as { imagen_url?: string | null; imagenes_urls?: unknown }),
    lat: display.lat,
    lng: display.lng,
    precision,
    href: `/a/${id}/${createAdisoTitleSlug(titulo)}`,
    promoted: Boolean(row.promotion_tier && row.promotion_tier !== 'gratis'),
    whatsappUrl: whatsappUrlFromContact(typeof row.contacto === 'string' ? row.contacto : null),
    directionsUrl: exact ? directionsUrl(resolved.lat, resolved.lng) : null,
  };
}

function applyFilters(
  query: ReturnType<SupabaseClient['from']>,
  input: MapQuery,
) {
  let q = query.select(SELECT);
  if (input.categoria && input.categoria !== 'todos' && CATEGORIES.has(input.categoria)) {
    q = q.eq('categoria', input.categoria);
  }
  if (input.min != null && Number.isFinite(input.min)) {
    q = q.gte('precio', input.min);
  }
  if (input.max != null && Number.isFinite(input.max)) {
    q = q.lte('precio', input.max);
  }
  return q;
}

function matchesText(row: Record<string, unknown>, q: string): boolean {
  const needle = q.replace(/[%_,]/g, ' ').trim().toLowerCase();
  if (!needle) return true;
  const hay = [row.titulo, row.distrito, row.ubicacion].filter((v) => typeof v === 'string').join(' ').toLowerCase();
  return hay.includes(needle);
}

export function parseMapQuery(params: URLSearchParams): MapQuery | { error: string } {
  const south = Number(params.get('south'));
  const west = Number(params.get('west'));
  const north = Number(params.get('north'));
  const east = Number(params.get('east'));
  if (![south, west, north, east].every(Number.isFinite)) {
    return { error: 'Faltan los límites del mapa.' };
  }
  if (north <= south || east <= west) return { error: 'Límites del mapa inválidos.' };
  if (north - south > 8 || east - west > 8) return { error: 'Acerca el mapa para buscar en esta zona.' };

  const categoria = params.get('categoria') as Categoria | 'todos' | null;
  const minRaw = params.get('min');
  const maxRaw = params.get('max');
  return {
    bounds: { south, west, north, east },
    categoria: categoria && categoria !== 'todos' ? categoria : 'todos',
    q: params.get('q') || undefined,
    min: minRaw ? Number(minRaw) : undefined,
    max: maxRaw ? Number(maxRaw) : undefined,
    foto: params.get('foto') === '1',
  };
}

async function fetchGeo(db: SupabaseClient, input: MapQuery) {
  const { bounds } = input;
  return applyFilters(db.from('adisos'), input)
    .gte('latitud', bounds.south)
    .lte('latitud', bounds.north)
    .gte('longitud', bounds.west)
    .lte('longitud', bounds.east)
    .limit(400);
}

export async function queryMapListings(input: MapQuery): Promise<MapListing[]> {
  const db = getMapDb();
  if (!db) return [];
  const { bounds } = input;

  let withCoords = await fetchGeo(db, input);
  if (withCoords.error) {
    withCoords = await fetchGeo(db, input);
  }
  if (withCoords.error) throw withCoords.error;

  const missing = await applyFilters(db.from('adisos'), input)
    .is('latitud', null)
    .order('fecha_publicacion', { ascending: false })
    .limit(120);
  if (missing.error) {
    console.error('[map/listings] anuncios sin coordenada omitidos', missing.error.message);
  }

  const seen = new Set<string>();
  const listings: MapListing[] = [];

  for (const row of [...(withCoords.data || []), ...(missing.error ? [] : missing.data || [])]) {
    const record = row as Record<string, unknown>;
    if (record.esta_activo === false) continue;
    if (input.q && !matchesText(record, input.q)) continue;
    const listing = rowToListing(record, bounds);
    if (!listing || seen.has(listing.id)) continue;
    if (input.foto && !listing.imageUrl) continue;
    seen.add(listing.id);
    listings.push(listing);
  }

  listings.sort((a, b) => Number(b.promoted) - Number(a.promoted) || a.titulo.localeCompare(b.titulo, 'es'));
  return listings;
}
