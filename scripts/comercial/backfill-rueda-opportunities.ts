/**
 * Crea oportunidades comerciales para cada adiso de un batch (p. ej. Rueda).
 *
 *   npx tsx scripts/comercial/backfill-rueda-opportunities.ts
 *   npx tsx scripts/comercial/backfill-rueda-opportunities.ts --batch=rueda-R2764-claimable-2026-09-28
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { RUEDA_R2764_BATCH_ID } from '../../lib/rueda/batch-constants';

async function main() {
  const batchArg = process.argv.find((a) => a.startsWith('--batch='));
  const batchId = batchArg?.split('=')[1] || RUEDA_R2764_BATCH_ID;
  const owner = process.env.RUEDA_OPS_USER_ID;

  const { backfillOpportunitiesFromBatch } = await import('../../lib/comercial/rueda-sync');
  const result = await backfillOpportunitiesFromBatch(batchId, owner);
  console.log(JSON.stringify({ batchId, ...result }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
