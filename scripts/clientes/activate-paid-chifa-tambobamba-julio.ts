/**
 * Tras Yape S/50: verificar pago, historia Buscadis, quitar hold de redes.
 *
 *   npx tsx scripts/clientes/activate-paid-chifa-tambobamba-julio.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-chifa-tambobamba-julio-2026-10';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');
const EXPIRES = '2026-11-05T23:59:59-05:00';

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { dbToAdiso } = await import('../../lib/supabase');
  const { getAdisoUrl } = await import('../../lib/url');
  const { runInstantMatchCampaign } = await import('../../lib/activation/instant-match');

  const { data: row } = await supabaseAdmin
    .from('adisos')
    .select('*')
    .contains('private_data', { batch_id: BATCH_ID })
    .maybeSingle();
  if (!row) throw new Error('Aviso no encontrado');

  const priv = { ...(row.private_data as object), social_diffusion_hold: false, paid_at: new Date().toISOString() };

  const { error } = await supabaseAdmin
    .from('adisos')
    .update({
      payment_status: 'verified',
      private_data: priv,
    })
    .eq('id', row.id);
  if (error) throw new Error(error.message);

  const adiso = dbToAdiso(row);
  const imageUrl = adiso.imagenUrl || adiso.imagenesUrls?.[0];
  const userId = row.user_id as string;

  if (imageUrl) {
    const publicPath = getAdisoUrl(adiso);
    const { data: existing } = await supabaseAdmin.from('stories').select('id').eq('adiso_id', row.id).limit(1);
    if (!existing?.length) {
      await supabaseAdmin.from('stories').insert({
        user_id: userId,
        media_url: imageUrl,
        media_type: 'image',
        caption: adiso.titulo,
        categoria: adiso.categoria,
        adiso_id: row.id,
        promotion_tier: 'destacada',
        objective: 'contactos',
        source: 'adiso_auto',
        cta_url: `${SITE}${publicPath}`,
        status: 'active',
        visible_until: EXPIRES,
        expires_at: EXPIRES,
        sort_order: 0,
      });
    }
  }

  try {
    const { prewarmStoryCoverForAdiso } = await import('../../lib/stories/prewarm-cover');
    await prewarmStoryCoverForAdiso(row.id, userId);
  } catch {
    /* optional */
  }

  try {
    await runInstantMatchCampaign({
      adisoId: row.id,
      advertiserUserId: userId,
      titulo: adiso.titulo,
      descripcion: adiso.descripcion,
      categoria: adiso.categoria,
      ubicacion: adiso.ubicacion as unknown as Record<string, unknown>,
    });
  } catch (e) {
    console.warn('[instant-match]', e);
  }

  console.log(
    JSON.stringify(
      { activated: true, adisoId: row.id, social_hold: false, note: 'Publicar FB/IG/TK/grupos (Shantall)' },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
