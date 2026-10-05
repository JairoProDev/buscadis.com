/**
 * Elimina oportunidades CRM creadas por error en avisos secundarios de Mapacho
 * (solo debe quedar la de `principal-8-vacantes`).
 *
 *   npx tsx scripts/comercial/cleanup-mapacho-crm-duplicates.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH = 'cliente-restaurante-mapacho-2026-10';
const PRIMARY_SLUG = 'principal-8-vacantes';

async function main() {
  const apply = process.argv.includes('--apply');
  const { supabaseAdmin } = await import('../../lib/supabase-admin');

  const { data: adisos, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, private_data')
    .filter('private_data->>batch_id', 'eq', BATCH);
  if (error) throw error;

  const toRemove = (adisos || []).filter((a) => {
    const priv = a.private_data as Record<string, unknown> | null;
    return priv?.job_slug !== PRIMARY_SLUG;
  });

  const ids = toRemove.map((a) => a.id);
  console.log(
    JSON.stringify(
      { batch: BATCH, secondaryAdisos: ids.length, titles: toRemove.map((a) => a.titulo) },
      null,
      2,
    ),
  );

  if (!apply || ids.length === 0) {
    console.log(apply ? 'Nada que borrar.' : 'Dry-run. Pasa --apply para eliminar oportunidades ligadas.');
    return;
  }

  const { data: opps } = await supabaseAdmin
    .from('sales_opportunities')
    .select('id, adiso_id')
    .in('adiso_id', ids);

  const oppIds = (opps || []).map((o) => o.id);
  if (oppIds.length === 0) {
    console.log('Sin oportunidades en avisos secundarios.');
    return;
  }

  const { error: delErr } = await supabaseAdmin
    .from('sales_opportunities')
    .delete()
    .in('id', oppIds);
  if (delErr) throw delErr;
  console.log(`Eliminadas ${oppIds.length} oportunidades duplicadas.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
