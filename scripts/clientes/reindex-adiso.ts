/** npx tsx scripts/clientes/reindex-adiso.ts <adisoId> */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const id = process.argv[2];
if (!id) {
  console.error('Usage: npx tsx scripts/clientes/reindex-adiso.ts <adisoId>');
  process.exit(1);
}

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { onAdisoSearchIndexUpdate } = await import('../../lib/search/post-create');
  const { generateAndStoreEmbedding } = await import('../../lib/ai/embeddings');

  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, categoria')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message || 'not found');

  onAdisoSearchIndexUpdate(data);
  await generateAndStoreEmbedding(id);
  console.log('ok', data);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
