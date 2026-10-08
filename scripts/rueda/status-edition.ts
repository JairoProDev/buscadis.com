/**
 *   npx tsx scripts/rueda/status-edition.ts --batch=rueda-R2764-claimable-2026-09-28
 *   npx tsx scripts/rueda/status-edition.ts --edicion=R2766
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { resolveEditionRunContext } from '../../lib/rueda/batch';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const edicion = arg('edicion');
  const batchId =
    arg('batch') ||
    (edicion ? resolveEditionRunContext({ edicion }).batchId : process.env.RUEDA_ACTIVE_BATCH_ID);

  if (!batchId) {
    console.error('Requiere --batch= o --edicion=');
    process.exit(1);
  }

  const { count: active } = await supabaseAdmin
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .contains('private_data', { batch_id: batchId })
    .eq('esta_activo', true);

  const { count: pending } = await supabaseAdmin
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .contains('private_data', { batch_id: batchId })
    .eq('esta_activo', false);

  const { data: last } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, fecha_publicacion, hora_publicacion')
    .contains('private_data', { batch_id: batchId })
    .eq('esta_activo', true)
    .order('fecha_publicacion', { ascending: false })
    .order('hora_publicacion', { ascending: false })
    .limit(3);

  console.log(
    JSON.stringify(
      {
        batch: batchId,
        active: active ?? 0,
        pending: pending ?? 0,
        last_published: last,
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
