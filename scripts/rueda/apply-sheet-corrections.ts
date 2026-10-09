/**
 * Aplica correcciones exportadas desde Google Sheets (CSV) a avisos.json locales.
 *
 *   npx tsx scripts/rueda/apply-sheet-corrections.ts --csv=output/rueda/leads/empleos-CORREGIDO.csv
 */
import * as fs from 'fs';
import * as path from 'path';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import type { RuedaExtractedAd } from '../../lib/rueda/types';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
    const row: Record<string, string> = {};
    header.forEach((h, j) => {
      row[h] = cols[j] || '';
    });
    rows.push(row);
  }
  return rows;
}

function main() {
  const csvPath = arg('csv');
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Requiere --csv=ruta.csv');
    process.exit(1);
  }
  const corrections = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const byKey = new Map(corrections.map((r) => [r.import_key, r]));

  const root = getRuedaOutputDir();
  let updated = 0;
  for (const dir of fs.readdirSync(root).filter((d) => /^R\d+$/i.test(d))) {
    const jsonPath = path.join(root, dir, 'avisos.json');
    if (!fs.existsSync(jsonPath)) continue;
    const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { avisos: RuedaExtractedAd[] };
    let changed = false;
    for (const a of doc.avisos) {
      const c = byKey.get(a.import_key);
      if (!c || c.estado_revision === 'NO_CONTACTAR') continue;
      if (c.estado_revision === 'OK' || c.titulo_corregido || c.descripcion_corregida) {
        if (c.titulo_corregido) a.titulo = c.titulo_corregido.slice(0, 120);
        if (c.descripcion_corregida) a.descripcion = c.descripcion_corregida.slice(0, 2000);
        if (c.estado_revision === 'OK') a.requiere_revision = false;
        updated++;
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(jsonPath, JSON.stringify(doc, null, 2) + '\n');
  }
  console.log(JSON.stringify({ filas_corregidas_aplicadas: updated }, null, 2));
}

main();
