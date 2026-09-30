#!/usr/bin/env node
/**
 * Aplica migraciones pendientes al proyecto Supabase enlazado.
 * Usado en predev / db:migrate para mantener el schema remoto al día.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const linkedRef = join(root, 'supabase', '.temp', 'linked-project.json');

if (process.env.SKIP_DB_MIGRATE === '1' || process.env.SKIP_DB_MIGRATE === 'true') {
  console.warn('[db:migrate] SKIP_DB_MIGRATE activo; omitiendo migraciones.');
  process.exit(0);
}

if (!existsSync(linkedRef)) {
  console.warn('[db:migrate] Proyecto Supabase no enlazado; omitiendo migraciones.');
  process.exit(0);
}

/** Evita `npx supabase` en cada dev (descarga npm si no está instalado). */
function supabaseBin() {
  const local = join(root, 'node_modules', '.bin', 'supabase');
  if (existsSync(local)) return local;
  return null;
}

function runSupabase(args) {
  const bin = supabaseBin();
  const cmd = bin ? `"${bin}" ${args}` : `npx supabase ${args}`;
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

try {
  if (!supabaseBin()) {
    console.warn(
      '[db:migrate] CLI supabase no instalado localmente. Ejecuta `npm i -D supabase` (con red) o `SKIP_DB_MIGRATE=1 npm run dev`.',
    );
    process.exit(1);
  }

  const list = runSupabase('migration list --linked');
  const pending = [];

  // CLI reciente puede devolver JSON; el formato tabular usa | entre local/remote.
  try {
    const json = JSON.parse(list);
    const rows = Array.isArray(json) ? json : json.migrations;
    if (Array.isArray(rows)) {
      for (const row of rows) {
        const local = String(row.local ?? row.version ?? '').replace(/\D/g, '').slice(0, 3);
        const remote = String(row.remote ?? '');
        if (local && !remote) pending.push(local.padStart(3, '0'));
      }
    }
  } catch {
    for (const line of list.split('\n')) {
      // local present, remote empty: "033 |     | 033" or "033 |  | 033"
      const match = line.match(/^\s*(\d{3})\s*\|\s*\|\s*/);
      if (match) pending.push(match[1]);
    }
  }

  if (pending.length === 0) {
    console.log('[db:migrate] Schema remoto al día.');
    process.exit(0);
  }

  console.log(`[db:migrate] Aplicando ${pending.length} migración(es): ${pending.join(', ')}`);
  const bin = supabaseBin();
  execSync(`${bin ? `"${bin}"` : 'npx supabase'} db push --linked --yes`, {
    cwd: root,
    stdio: 'inherit',
  });
  console.log('[db:migrate] Migraciones aplicadas.');
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[db:migrate] Error:', msg);
  process.exit(1);
}
