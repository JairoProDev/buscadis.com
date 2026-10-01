/**
 * Activa avisos Rueda programados (ejecutar cada minuto).
 *
 *   npx tsx scripts/rueda/go-live-tick.ts
 *   npx tsx scripts/rueda/go-live-loop.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { activateScheduledRuedaAds } from '../../lib/rueda/go-live';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '1');
  const result = await activateScheduledRuedaAds(limit);
  console.log(JSON.stringify({ at: new Date().toISOString(), ...result }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
