/**
 * Typesense client for autocomplete sidecar.
 * Falls back gracefully when env vars are not configured.
 */

export interface TypesenseAdisoHit {
  id: string;
  titulo: string;
  categoria: string;
  popularity_score?: number;
}

export interface TypesenseQueryHit {
  query: string;
  count?: number;
}

export interface SuggestHit {
  type: 'adiso' | 'query';
  id?: string;
  titulo?: string;
  categoria?: string;
  query?: string;
  completionSuffix?: string;
}

function getTypesenseConfig() {
  const host = process.env.TYPESENSE_HOST;
  const apiKey = process.env.TYPESENSE_API_KEY;
  const port = process.env.TYPESENSE_PORT ?? '443';
  const protocol = process.env.TYPESENSE_PROTOCOL ?? 'https';
  if (!host || !apiKey) return null;
  return { host, apiKey, port, protocol, baseUrl: `${protocol}://${host}:${port}` };
}

export function isTypesenseConfigured(): boolean {
  return Boolean(process.env.TYPESENSE_HOST && process.env.TYPESENSE_API_KEY);
}

export async function typesenseSuggest(prefix: string, limit = 8): Promise<SuggestHit[]> {
  const cfg = getTypesenseConfig();
  if (!cfg || prefix.trim().length < 2) return [];

  const q = prefix.trim();
  const body = {
    searches: [
      {
        collection: 'adiso_titles',
        q,
        query_by: 'titulo',
        prefix: true,
        num_typos: 2,
        per_page: limit,
      },
      {
        collection: 'search_queries',
        q,
        query_by: 'query',
        prefix: true,
        num_typos: 1,
        per_page: 3,
      },
    ],
  };

  try {
    const res = await fetch(`${cfg.baseUrl}/multi_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TYPESENSE-API-KEY': cfg.apiKey,
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<{ hits?: Array<{ document: Record<string, unknown> }> }>;
    };

    const hits: SuggestHit[] = [];
    const adisoResults = data.results?.[0]?.hits ?? [];
    const queryResults = data.results?.[1]?.hits ?? [];

    for (const hit of adisoResults) {
      const doc = hit.document;
      hits.push({
        type: 'adiso',
        id: String(doc.id),
        titulo: String(doc.titulo ?? ''),
        categoria: String(doc.categoria ?? ''),
      });
    }

    for (const hit of queryResults) {
      const doc = hit.document;
      hits.push({
        type: 'query',
        query: String(doc.query ?? ''),
      });
    }

    return hits.slice(0, limit);
  } catch (err) {
    console.warn('[typesense] suggest failed:', err);
    return [];
  }
}

export async function upsertAdisoTitle(doc: TypesenseAdisoHit): Promise<void> {
  const cfg = getTypesenseConfig();
  if (!cfg) return;

  await fetch(`${cfg.baseUrl}/collections/adiso_titles/documents?action=upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TYPESENSE-API-KEY': cfg.apiKey,
    },
    body: JSON.stringify(doc),
  }).catch((err) => console.warn('[typesense] upsert adiso:', err));
}

export async function ensureTypesenseCollections(): Promise<void> {
  const cfg = getTypesenseConfig();
  if (!cfg) return;

  const collections = [
    {
      name: 'adiso_titles',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'titulo', type: 'string' },
        { name: 'categoria', type: 'string', facet: true },
        { name: 'popularity_score', type: 'float', optional: true },
      ],
    },
    {
      name: 'search_queries',
      fields: [
        { name: 'query', type: 'string' },
        { name: 'count', type: 'int32', optional: true },
      ],
    },
  ];

  for (const schema of collections) {
    await fetch(`${cfg.baseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TYPESENSE-API-KEY': cfg.apiKey,
      },
      body: JSON.stringify(schema),
    }).catch(() => undefined);
  }
}
