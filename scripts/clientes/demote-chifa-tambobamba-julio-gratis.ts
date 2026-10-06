/**
 * Si Julio no confirma/paga: bajar aviso a plan gratis (sin destacado).
 *
 *   npx tsx scripts/clientes/demote-chifa-tambobamba-julio-gratis.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-chifa-tambobamba-julio-2026-10';

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { data: rows } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, private_data')
    .contains('private_data', { batch_id: BATCH_ID });
  const row = rows?.[0];
  if (!row) throw new Error('No se encontró aviso del batch');

  const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const priv = { ...(row.private_data as object), demoted_to_gratis_at: new Date().toISOString() };

  const { error } = await supabaseAdmin
    .from('adisos')
    .update({
      promotion_tier: 'gratis',
      promotion_rank: 0,
      promotion_expires_at: null,
      promoted_at: null,
      publish_tier: 'free',
      payment_status: 'free',
      expires_at: exp,
      fecha_expiracion: exp,
      private_data: priv,
    })
    .eq('id', row.id);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from('stories').update({ status: 'expired' }).eq('adiso_id', row.id);

  console.log(JSON.stringify({ demoted: true, id: row.id, titulo: row.titulo }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
