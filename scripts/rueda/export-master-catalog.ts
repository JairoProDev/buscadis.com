/**
 * Unifica todas las ediciones extraídas en MASTER-avisos.csv / .jsonl (sin publicar en web).
 *
 *   npx tsx scripts/rueda/export-master-catalog.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { AVISOS_CSV_COLUMNS, avisoToCsvRow } from '../../lib/rueda/export-catalog';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import type { RuedaExtractedAd } from '../../lib/rueda/types';

function editionNum(code: string): number {
  const m = code.match(/^R(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function main() {
  const recentFrom = parseInt(
    process.argv.find((a) => a.startsWith('--recent-from='))?.split('=')[1] || '2747',
    10,
  );
  const root = getRuedaOutputDir();
  if (!fs.existsSync(root)) {
    console.error('No hay output/rueda');
    process.exit(1);
  }

  const editions = fs
    .readdirSync(root)
    .filter((d) => /^R\d+$/i.test(d) && fs.existsSync(path.join(root, d, 'avisos.json')))
    .sort();

  const all: { ad: RuedaExtractedAd; edicion: string; fechas: { inicio: string; fin: string } }[] = [];
  const summary: { edicion: string; total: number; requiere_revision: number }[] = [];

  for (const ed of editions) {
    const payload = JSON.parse(fs.readFileSync(path.join(root, ed, 'avisos.json'), 'utf8')) as {
      avisos: RuedaExtractedAd[];
      fecha_publicacion_original?: string;
      fecha_sesion_fin?: string;
    };
    const fechas = {
      inicio: payload.fecha_publicacion_original || '',
      fin: payload.fecha_sesion_fin || payload.fecha_publicacion_original || '',
    };
    const avisos = payload.avisos || [];
    summary.push({
      edicion: ed,
      total: avisos.length,
      requiere_revision: avisos.filter((a) => a.requiere_revision).length,
    });
    for (const ad of avisos) all.push({ ad, edicion: ed, fechas });
  }

  all.sort(
    (a, b) =>
      a.edicion.localeCompare(b.edicion) ||
      a.ad.pagina - b.ad.pagina ||
      a.ad.titulo.localeCompare(b.ad.titulo),
  );

  const masterColumns = ['numero_global', ...AVISOS_CSV_COLUMNS];
  const perEditionCount = new Map<string, number>();
  const masterRows = all.map(({ ad, edicion, fechas }, i) => {
    const global = i + 1;
    const inEd = (perEditionCount.get(edicion) || 0) + 1;
    perEditionCount.set(edicion, inEd);
    return `${global},${avisoToCsvRow(ad, inEd, fechas)}`;
  });
  const masterCsv = [masterColumns.join(','), ...masterRows].join('\n') + '\n';

  const masterCsvPath = path.join(root, 'MASTER-avisos.csv');
  const catalogoHistorico = path.join(root, 'catalogo-avisos-historico-completo.csv');
  fs.writeFileSync(masterCsvPath, masterCsv, 'utf8');
  fs.writeFileSync(catalogoHistorico, masterCsv, 'utf8');

  const recent = all.filter(({ edicion }) => editionNum(edicion) >= recentFrom);
  const perEdRecent = new Map<string, number>();
  const recentCsvRows = recent.map(({ ad, edicion, fechas }, i) => {
    const global = i + 1;
    const inEd = (perEdRecent.get(edicion) || 0) + 1;
    perEdRecent.set(edicion, inEd);
    return `${global},${avisoToCsvRow(ad, inEd, fechas)}`;
  });
  const recentCsv =
    [masterColumns.join(','), ...recentCsvRows].join('\n') + '\n';
  const recentPath = path.join(root, 'MASTER-reciente.csv');
  const catalogoReciente = path.join(
    root,
    `catalogo-avisos-reciente-R${recentFrom}-en-adelante.csv`,
  );
  fs.writeFileSync(recentPath, recentCsv, 'utf8');
  fs.writeFileSync(catalogoReciente, recentCsv, 'utf8');
  fs.writeFileSync(
    path.join(root, 'MASTER-reciente-summary.json'),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        desde_edicion: `R${recentFrom}`,
        ediciones: [...new Set(recent.map((r) => r.edicion))].sort(),
        total_avisos: recent.length,
      },
      null,
      2,
    ) + '\n',
  );

  const jsonlPath = path.join(root, 'MASTER-avisos.jsonl');
  fs.writeFileSync(
    jsonlPath,
    all.map(({ ad }, i) => JSON.stringify({ numero_global: i + 1, ...ad })).join('\n') + '\n',
    'utf8',
  );

  const summaryPath = path.join(root, 'MASTER-summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        ediciones: editions.length,
        total_avisos: all.length,
        por_edicion: summary,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(
    JSON.stringify(
      {
        masterCsvPath,
        catalogoHistorico,
        recentPath,
        catalogoReciente,
        jsonlPath,
        summaryPath,
        total_avisos: all.length,
        total_reciente: recent.length,
        ediciones: summary,
      },
      null,
      2,
    ),
  );
}

main();
