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

if (!existsSync(linkedRef)) {
  console.warn('[db:migrate] Proyecto Supabase no enlazado; omitiendo migraciones.');
  process.exit(0);
}

function run(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

try {
  const list = run('npx supabase migration list --linked');
  const pending = [];

  for (const line of list.split('\n')) {
    const match = line.match(/^\s*(\d{3})\s*\|\s*\|\s*/);
    if (match) pending.push(match[1]);
  }

  if (pending.length === 0) {
    console.log('[db:migrate] Schema remoto al día.');
    process.exit(0);
  }

  console.log(`[db:migrate] Aplicando ${pending.length} migración(es): ${pending.join(', ')}`);
  execSync('npx supabase db push --linked --yes', { cwd: root, stdio: 'inherit' });
  console.log('[db:migrate] Migraciones aplicadas.');
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[db:migrate] Error:', msg);
  process.exit(1);
}
