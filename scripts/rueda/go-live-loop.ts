/**
 * Loop local: activa 1 aviso por minuto hasta vaciar la cola.
 *
 *   npx tsx scripts/rueda/go-live-loop.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { activateScheduledRuedaAds } from '../../lib/rueda/go-live';
import { RUEDA_R2764_BATCH_ID } from '../../lib/rueda/batch-constants';
import { supabaseAdmin } from '../../lib/supabase-admin';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function pendingCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .eq('esta_activo', false)
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID });
  return count ?? 0;
}

async function main() {
  console.log('[go-live-loop] started', new Date().toISOString());
  for (;;) {
    const pending = await pendingCount();
    if (pending === 0) {
      console.log('[go-live-loop] cola vacía — fin');
      break;
    }
    const result = await activateScheduledRuedaAds(1);
    console.log(new Date().toISOString(), { pending, ...result });
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
