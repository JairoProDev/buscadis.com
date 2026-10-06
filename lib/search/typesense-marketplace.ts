import type { Adiso } from '@/types';
import { getTypesenseConfig, isTypesenseConfigured } from './typesense-client';

export const MARKETPLACE_COLLECTION = 'adiso_marketplace';

export interface TypesenseMarketplaceDoc {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  categoria: string;
  fecha_publicacion: number;
}

function ubicacionToText(ubicacion: Adiso['ubicacion']): string {
  if (typeof ubicacion === 'string') return ubicacion;
  if (ubicacion && typeof ubicacion === 'object') {
    return [ubicacion.departamento, ubicacion.provincia, ubicacion.distrito, ubicacion.direccion]
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

function fechaToEpoch(adiso: Adiso): number {
  const date = adiso.fechaPublicacion
    ? new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion || '00:00'}:00`)
    : new Date();
  const ms = date.getTime();
  return Number.isNaN(ms) ? Date.now() : ms;
}

export function adisoToMarketplaceDoc(adiso: Adiso): TypesenseMarketplaceDoc {
  return {
    id: adiso.id,
    titulo: adiso.titulo || '',
    descripcion: (adiso.descripcion || '').slice(0, 4000),
    ubicacion: ubicacionToText(adiso.ubicacion),
    categoria: adiso.categoria,
    fecha_publicacion: fechaToEpoch(adiso),
  };
}

export async function ensureMarketplaceCollection(): Promise<void> {
  const cfg = getTypesenseConfig();
  if (!cfg) return;

  const schema = {
    name: MARKETPLACE_COLLECTION,
    fields: [
      { name: 'id', type: 'string' },
      { name: 'titulo', type: 'string' },
      { name: 'descripcion', type: 'string', optional: true },
      { name: 'ubicacion', type: 'string', optional: true },
      { name: 'categoria', type: 'string', facet: true },
      { name: 'fecha_publicacion', type: 'int64', optional: true },
    ],
    default_sorting_field: 'fecha_publicacion',
  };

  await fetch(`${cfg.baseUrl}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TYPESENSE-API-KEY': cfg.apiKey,
    },
    body: JSON.stringify(schema),
  }).catch(() => undefined);
}

export async function upsertAdisoMarketplace(adiso: Adiso): Promise<void> {
  const cfg = getTypesenseConfig();
  if (!cfg || !adiso.titulo?.trim()) return;

  await ensureMarketplaceCollection();

  const doc = adisoToMarketplaceDoc(adiso);
  await fetch(`${cfg.baseUrl}/collections/${MARKETPLACE_COLLECTION}/documents?action=upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TYPESENSE-API-KEY': cfg.apiKey,
    },
    body: JSON.stringify(doc),
  }).catch((err) => console.warn('[typesense] marketplace upsert:', err));
}

export async function searchMarketplaceIds(
  query: string,
  limit = 40,
  categoria?: string
): Promise<string[]> {
  const cfg = getTypesenseConfig();
  const q = query.trim();
  if (!cfg || q.length < 2) return [];

  const typos = q.length <= 5 ? 0 : 1;
  const params = new URLSearchParams({
    q,
    query_by: 'titulo,descripcion,ubicacion',
    prefix: 'true',
    num_typos: String(typos),
    per_page: String(Math.min(limit, 60)),
  });
  if (categoria) {
    params.set('filter_by', `categoria:=${categoria}`);
  }

  try {
    const res = await fetch(
      `${cfg.baseUrl}/collections/${MARKETPLACE_COLLECTION}/documents/search?${params}`,
      {
        headers: { 'X-TYPESENSE-API-KEY': cfg.apiKey },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      hits?: Array<{ document: { id?: string } }>;
    };
    return (data.hits ?? [])
      .map((h) => h.document?.id)
      .filter((id): id is string => Boolean(id));
  } catch (err) {
    console.warn('[typesense] marketplace search failed:', err);
    return [];
  }
}

export { isTypesenseConfigured };
