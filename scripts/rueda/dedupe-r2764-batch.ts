/**
 * Elimina duplicados del batch R2764 (mismo teléfono + página).
 * Conserva el anuncio más antiguo o el ya activado.
 *
 *   npx tsx scripts/rueda/dedupe-r2764-batch.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { RUEDA_R2764_BATCH_ID } from '../../lib/rueda/batch-constants';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apply = process.argv.includes('--apply');

function normPhone(c: string | null | undefined): string {
  return (c || '').replace(/\D/g, '').slice(-9);
}

async function main() {
  const { data: rows, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, contacto, esta_activo, created_at, private_data')
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID });

  if (error) throw error;

  type Row = (typeof rows)[number];
  const groups = new Map<string, Row[]>();

  for (const row of rows || []) {
    const priv = (row.private_data || {}) as Record<string, unknown>;
    const pagina = String(priv.pagina_revista ?? '0');
    const phone = normPhone(row.contacto as string);
    if (!phone) continue;
    const key = `${pagina}:${phone}`;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  const toDelete: string[] = [];
  for (const [, list] of groups) {
    if (list.length <= 1) continue;
    const sorted = [...list].sort((a, b) => {
      const aLive = a.esta_activo ? 1 : 0;
      const bLive = b.esta_activo ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      const privA = (a.private_data || {}) as Record<string, unknown>;
      const privB = (b.private_data || {}) as Record<string, unknown>;
      const doneA = privA.go_live_completed_at ? 1 : 0;
      const doneB = privB.go_live_completed_at ? 1 : 0;
      if (doneA !== doneB) return doneB - doneA;
      return String(a.created_at).localeCompare(String(b.created_at));
    });
    for (const dup of sorted.slice(1)) {
      toDelete.push(dup.id as string);
    }
  }

  console.log(JSON.stringify({ total: rows?.length, duplicates: toDelete.length }, null, 2));

  if (!apply || !toDelete.length) return;

  for (let i = 0; i < toDelete.length; i += 50) {
    const chunk = toDelete.slice(i, i + 50);
    const { error: delErr } = await supabaseAdmin.from('adisos').delete().in('id', chunk);
    if (delErr) console.error(delErr.message);
    else process.stdout.write(`\rdeleted ${Math.min(i + 50, toDelete.length)}/${toDelete.length}`);
  }
  console.log('\ndone');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
