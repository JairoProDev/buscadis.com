/**
 * Sincroniza oportunidades CRM para avisos de clientes con plan pagado.
 *
 *   npx tsx scripts/comercial/backfill-paid-clients.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const owner = process.env.RUEDA_OPS_USER_ID;
  const { backfillPaidClientBatches } = await import('../../lib/comercial/paid-client-sync');
  const result = await backfillPaidClientBatches(owner);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
