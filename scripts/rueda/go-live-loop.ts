/**
 * Loop local: activa 1 aviso por minuto hasta vaciar la cola.
 *
 *   npx tsx scripts/rueda/go-live-loop.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { activateScheduledRuedaAds } from '../../lib/rueda/go-live';
import { resolveEditionRunContext } from '../../lib/rueda/batch';
import { RUEDA_R2764_BATCH_ID } from '../../lib/rueda/batch-constants';
import { supabaseAdmin } from '../../lib/supabase-admin';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function resolveBatchId(): string {
  const fromEnv = process.env.RUEDA_ACTIVE_BATCH_ID;
  const edArg = process.argv.find((a) => a.startsWith('--edicion='))?.split('=')[1];
  const batchArg = process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1];
  if (batchArg) return batchArg;
  if (edArg) return resolveEditionRunContext({ edicion: edArg }).batchId;
  return fromEnv || RUEDA_R2764_BATCH_ID;
}

async function pendingCount(batchId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .eq('esta_activo', false)
    .contains('private_data', { batch_id: batchId });
  return count ?? 0;
}

async function main() {
  const batchId = resolveBatchId();
  console.log('[go-live-loop] started', { batchId, at: new Date().toISOString() });
  for (;;) {
    const pending = await pendingCount(batchId);
    if (pending === 0) {
      console.log('[go-live-loop] cola vacía — fin');
      break;
    }
    const result = await activateScheduledRuedaAds(1, batchId);
    console.log(new Date().toISOString(), { pending, ...result });
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
