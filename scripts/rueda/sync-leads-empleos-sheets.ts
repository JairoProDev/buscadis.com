/**
 * Sube empleos-cusco CSV a Google Sheets (OAuth o service account).
 *
 *   npx tsx scripts/rueda/sync-leads-empleos-sheets.ts
 *   npx tsx scripts/rueda/sync-leads-empleos-sheets.ts --create --share=jairoprodev@gmail.com
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { ensureSpreadsheet, uploadCsvToSheet } from '../../lib/google/sheets-client';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const from = arg('from') || '2747';
  const csvPath = path.join(getRuedaOutputDir(), 'leads', `empleos-cusco-desde-R${from}.csv`);
  if (!fs.existsSync(csvPath)) {
    console.error('Genera primero: npm run rueda:leads-empleos');
    process.exit(1);
  }
  const csv = fs.readFileSync(csvPath, 'utf8');

  let spreadsheetId = process.env.RUEDA_LEADS_SPREADSHEET_ID || arg('spreadsheet');
  if (process.argv.includes('--create') || !spreadsheetId) {
    spreadsheetId = await ensureSpreadsheet(
      `Buscadis — Empleos Cusco R${from}+`,
      arg('share') || process.env.RUEDA_SHEETS_SHARE_EMAIL || 'jairoprodev@gmail.com',
    );
    console.log('\nGuarda en .env.local:\nRUEDA_LEADS_SPREADSHEET_ID=' + spreadsheetId + '\n');
  }

  const r = await uploadCsvToSheet({
    spreadsheetId,
    sheetName: 'Empleos',
    csvText: csv,
  });
  console.log(
    JSON.stringify(
      {
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        ...r,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
