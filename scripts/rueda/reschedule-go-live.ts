/**
 * Reprograma go-live 1/min desde ahora (solo pendientes).
 *
 *   npx tsx scripts/rueda/reschedule-go-live.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { RUEDA_R2764_BATCH_ID } from '../../lib/rueda/batch-constants';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apply = process.argv.includes('--apply');
const startMinutes = Number(process.argv.find((a) => a.startsWith('--start='))?.split('=')[1] || '1');
const intervalSec = Number(process.argv.find((a) => a.startsWith('--interval='))?.split('=')[1] || '60');

async function main() {
  const { data: rows, error } = await supabaseAdmin
    .from('adisos')
    .select('id, private_data')
    .eq('esta_activo', false)
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID });

  if (error) throw error;
  const pending = (rows || []).filter((r) => !(r.private_data as Record<string, unknown>)?.go_live_completed_at);
  pending.sort((a, b) => {
    const ka = String((a.private_data as Record<string, unknown>)?.import_key || a.id);
    const kb = String((b.private_data as Record<string, unknown>)?.import_key || b.id);
    return ka.localeCompare(kb);
  });

  const base = Date.now() + startMinutes * 60_000;
  console.log({ pending: pending.length, apply, first: new Date(base).toISOString() });

  if (!apply) return;

  for (let i = 0; i < pending.length; i++) {
    const at = new Date(base + i * intervalSec * 1000).toISOString();
    const priv = { ...(pending[i].private_data as Record<string, unknown>), scheduled_go_live_at: at };
    await supabaseAdmin.from('adisos').update({ private_data: priv }).eq('id', pending[i].id);
  }
  console.log('Reprogramados', pending.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
