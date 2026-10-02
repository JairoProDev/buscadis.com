/**
 * Deja una sola historia activa en el carril (aviso principal) para Restaurante Mapacho.
 *   npx tsx scripts/clientes/repair-mapacho-stories.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const BATCH_ID = 'cliente-restaurante-mapacho-2026-10';
const KEEP_ADISO_ID = 'Wf75ziYwCp';

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { data: adisos } = await supabaseAdmin
    .from('adisos')
    .select('id,user_id')
    .contains('private_data', { batch_id: BATCH_ID });

  const userId = adisos?.[0]?.user_id;
  if (!userId) {
    console.log('No batch Mapacho found');
    return;
  }

  const { data: stories } = await supabaseAdmin
    .from('stories')
    .select('id,adiso_id,status')
    .eq('user_id', userId)
    .eq('status', 'active');

  const toArchive = (stories || []).filter((s) => s.adiso_id !== KEEP_ADISO_ID);
  for (const story of toArchive) {
    await supabaseAdmin
      .from('stories')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', story.id);
  }

  console.log(
    JSON.stringify(
      {
        userId,
        keptAdiso: KEEP_ADISO_ID,
        archivedStories: toArchive.map((s) => s.id),
        remaining: 1,
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
