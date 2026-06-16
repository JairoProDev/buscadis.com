#!/usr/bin/env node
/**
 * Sync adiso titles from Supabase to Typesense.
 * Usage: node scripts/sync-typesense.mjs
 * Requires: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, TYPESENSE_* env vars
 */
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TS_HOST = process.env.TYPESENSE_HOST;
const TS_KEY = process.env.TYPESENSE_API_KEY;
const TS_PORT = process.env.TYPESENSE_PORT ?? '443';
const TS_PROTOCOL = process.env.TYPESENSE_PROTOCOL ?? 'https';

if (!SUPABASE_URL || !SERVICE_KEY || !TS_HOST || !TS_KEY) {
  console.error('Missing env: SUPABASE_URL, SERVICE_ROLE_KEY, TYPESENSE_HOST, TYPESENSE_API_KEY');
  process.exit(1);
}

const tsBase = `${TS_PROTOCOL}://${TS_HOST}:${TS_PORT}`;

async function ensureCollection() {
  const schema = {
    name: 'adiso_titles',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'titulo', type: 'string' },
      { name: 'categoria', type: 'string', facet: true },
      { name: 'popularity_score', type: 'float', optional: true },
    ],
  };
  const res = await fetch(`${tsBase}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-TYPESENSE-API-KEY': TS_KEY },
    body: JSON.stringify(schema),
  });
  if (!res.ok && res.status !== 409) {
    console.warn('Collection create:', await res.text());
  }
}

async function fetchAdisos(offset = 0, limit = 500) {
  const url = `${SUPABASE_URL}/rest/v1/adisos?select=id,titulo,categoria&order=fecha_publicacion.desc&offset=${offset}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function importBatch(docs) {
  const res = await fetch(`${tsBase}/collections/adiso_titles/documents/import?action=upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', 'X-TYPESENSE-API-KEY': TS_KEY },
    body: docs.map((d) => JSON.stringify(d)).join('\n'),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function main() {
  await ensureCollection();
  let offset = 0;
  let total = 0;
  while (true) {
    const rows = await fetchAdisos(offset);
    if (!rows.length) break;
    const docs = rows
      .filter((r) => r.titulo?.trim())
      .map((r) => ({
        id: r.id,
        titulo: r.titulo,
        categoria: r.categoria,
        popularity_score: 0,
      }));
    if (docs.length) {
      await importBatch(docs);
      total += docs.length;
      console.log(`Synced ${total} titles...`);
    }
    offset += rows.length;
    if (rows.length < 500) break;
  }
  console.log(`Done. ${total} adiso titles in Typesense.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
