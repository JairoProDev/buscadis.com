/**
 * Backfill Typesense adiso_marketplace from active adisos.
 * Usage: npx tsx scripts/sync-typesense-marketplace.ts
 */
import { getAdisosPageFromSupabase } from '../lib/supabase';
import { upsertAdisoMarketplace, ensureMarketplaceCollection } from '../lib/search/typesense-marketplace';

const PAGE = 100;

async function main() {
  await ensureMarketplaceCollection();
  let offset = 0;
  let total = 0;
  let synced = 0;

  for (;;) {
    const { items, total: count } = await getAdisosPageFromSupabase({
      limit: PAGE,
      offset,
      soloActivos: true,
    });
    total = count;
    if (!items.length) break;
    for (const adiso of items) {
      await upsertAdisoMarketplace(adiso);
      synced += 1;
    }
    offset += items.length;
    process.stdout.write(`\rSynced ${synced}/${total}`);
    if (offset >= total) break;
  }
  console.log(`\nDone. ${synced} documents.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
