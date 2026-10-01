/**
 *   npx tsx scripts/rueda/status-r2764.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { RUEDA_R2764_BATCH_ID } from '../../lib/rueda/batch-constants';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const { count: active } = await supabaseAdmin
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID })
    .eq('esta_activo', true);

  const { count: pending } = await supabaseAdmin
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID })
    .eq('esta_activo', false);

  const { data: last } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, fecha_publicacion, hora_publicacion')
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID })
    .eq('esta_activo', true)
    .order('fecha_publicacion', { ascending: false })
    .order('hora_publicacion', { ascending: false })
    .limit(3);

  console.log(
    JSON.stringify(
      {
        batch: RUEDA_R2764_BATCH_ID,
        active: active ?? 0,
        pending: pending ?? 0,
        last_published: last,
        at: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
