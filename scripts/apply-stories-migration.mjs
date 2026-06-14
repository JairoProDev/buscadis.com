#!/usr/bin/env node
/**
 * Aplica la migración 013 (tabla stories) si DATABASE_URL está configurada.
 * Sin DATABASE_URL, imprime instrucciones para el SQL Editor de Supabase.
 *
 * DATABASE_URL=postgresql://postgres.[ref]:[password]@... node scripts/apply-stories-migration.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '../supabase/migrations/013_stories_schema_fix.sql');
const sql = readFileSync(sqlPath, 'utf8');
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.log(`
⚠️  La tabla public.stories no existe en tu proyecto Supabase.

Opción A — SQL Editor (recomendado):
  1. Abre https://supabase.com/dashboard → tu proyecto → SQL Editor
  2. Pega y ejecuta el contenido de:
     supabase/migrations/013_stories_schema_fix.sql

Opción B — CLI con connection string:
  DATABASE_URL="postgresql://..." node scripts/apply-stories-migration.mjs
`);
  process.exit(1);
}

const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log('✅ Migración 013 aplicada: tabla stories lista.');
} catch (e) {
  console.error('❌ Error aplicando migración:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
