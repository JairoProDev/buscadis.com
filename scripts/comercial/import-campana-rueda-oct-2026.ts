/**
 * Importa prospectos de campaña WA (documento oct 2026) al CRM.
 *
 *   npx tsx scripts/comercial/import-campana-rueda-oct-2026.ts
 *   npx tsx scripts/comercial/import-campana-rueda-oct-2026.ts --apply
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import type { CampanaProspectInput } from '../../lib/comercial/campana-rueda-oct-2026';

async function main() {
  const apply = process.argv.includes('--apply');
  const jsonPath = path.join(process.cwd(), 'data/comercial/campana-rueda-oct-2026.json');
  const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
    prospects: CampanaProspectInput[];
  };

  console.log(
    JSON.stringify(
      {
        apply,
        count: doc.prospects.length,
        note: doc.prospects.length < 100
          ? 'Campaña manual; los ~340 source=rueda son leads PDF sin contacto masivo'
          : undefined,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log('Dry-run. Pasa --apply para escribir en Supabase.');
    return;
  }

  const owner = process.env.RUEDA_OPS_USER_ID;
  const { importCampanaProspects } = await import('../../lib/comercial/campana-import');
  const result = await importCampanaProspects(doc.prospects, owner);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
