/**
 * Importa muchos exports .txt de una carpeta (nombre: 984759634-cliente.txt).
 *
 *   npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=./exports-wa
 *   npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=./exports-wa --apply
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const dirArg = process.argv.find((a) => a.startsWith('--dir='));
  const dir = dirArg?.split('=')[1] || path.join(process.cwd(), 'exports-wa');
  const apply = process.argv.includes('--apply');

  if (!fs.existsSync(dir)) {
    console.error('Carpeta no existe:', dir);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt'));
  console.log(JSON.stringify({ dir, files: files.length, apply }, null, 2));

  if (!apply) {
    console.log('Dry-run. Usa --apply para importar.');
    return;
  }

  const owner = process.env.RUEDA_OPS_USER_ID;
  const { importWhatsAppExportFile } = await import('../../lib/comercial/whatsapp-batch-import');

  const results = [];
  for (const name of files) {
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    results.push(await importWhatsAppExportFile(name, text, owner));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
