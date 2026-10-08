/**
 * Extrae avisos página a página desde PDFs ya partidos (by-month o legacy).
 * Escribe texto + avisos por hoja para QA y corrección.
 *
 *   npx tsx scripts/rueda/extract-from-page-pdfs.ts --edicion=R2766
 *   npx tsx scripts/rueda/extract-from-page-pdfs.ts --from=2747
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { estructurarAnunciosPaginaRueda } from '../../lib/extraer-anuncios-rueda';
import { resolveEditionRunContext } from '../../lib/rueda/batch';
import { getEditionByCode, loadRuedaManifest } from '../../lib/rueda/editions';
import {
  listPagePdfPaths,
  monthKeyFromEdition,
  pageNumberFromPdfFilename,
  resolveEditionPagesDir,
} from '../../lib/rueda/month-archive';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import { RUEDA_AVISO_SCHEMA_VERSION } from '../../lib/rueda/schema';
import type { RuedaExtractedAd } from '../../lib/rueda/types';
import { writeEditionAvisosCsv } from '../../lib/rueda/export-catalog';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function editionNum(code: string): number {
  return parseInt(code.replace(/^R/i, ''), 10);
}

function textFromPagePdf(pdfPath: string): string {
  const out = execFileSync(
    'python3',
    ['-c', `import pymupdf,sys; d=pymupdf.open(sys.argv[1]); print(d[0].get_text())`, pdfPath],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
  );
  return out;
}

function extractEdition(edicion: string) {
  const man = getEditionByCode(edicion);
  const pagesDir = resolveEditionPagesDir(edicion);
  if (!pagesDir) throw new Error(`Sin carpeta de páginas para ${edicion}`);
  const ctx = resolveEditionRunContext({
    edicion,
    fecha: man?.fecha_inicio,
    batch: man?.batch_id,
  });
  const month = man ? monthKeyFromEdition(man) : 'sin-fecha';
  const pagePdfs = listPagePdfPaths(pagesDir);
  const all: RuedaExtractedAd[] = [];
  const byPage: { pagina: number; count: number }[] = [];

  for (const pdfPath of pagePdfs) {
    const pagina = pageNumberFromPdfFilename(path.basename(pdfPath));
    const texto = textFromPagePdf(pdfPath);
    const pageOut = path.join(
      getRuedaOutputDir(),
      'by-month',
      month,
      path.basename(pagesDir),
      `pagina-${String(pagina).padStart(2, '0')}`,
    );
    fs.mkdirSync(pageOut, { recursive: true });
    fs.writeFileSync(path.join(pageOut, 'texto.txt'), texto, 'utf8');
    fs.copyFileSync(pdfPath, path.join(pageOut, 'pagina.pdf'));

    const anuncios = estructurarAnunciosPaginaRueda(texto);
    const items: RuedaExtractedAd[] = anuncios.map((a, idx) => ({
      batch_id: ctx.batchId,
      edicion,
      pagina,
      import_key: `${edicion}-p${String(pagina).padStart(2, '0')}-${a.telefonos[0] || 'x'}-${idx}`,
      titulo: a.titulo.slice(0, 120),
      categoria: a.categoria,
      ubicacion: '',
      vacantes: [],
      descripcion: a.descripcion.slice(0, 2000),
      telefonos: a.telefonos,
      whatsapp: a.telefonos[0] || null,
      email: null,
      es_empresa: /\b(empresa|hotel|restaurante|hostal|cl[ií]nica)\b/i.test(a.textoRaw),
      confianza: a.score / 100,
      requiere_revision:
        a.score < 70 ||
        a.issues.includes('fragmento_cortado') ||
        a.issues.includes('multi_inicio'),
      recurrente: false,
      score: a.score,
      issues: a.issues,
      texto_raw: a.textoRaw,
      flyer_template: null,
      hide_generic_location: false,
    }));
    fs.writeFileSync(
      path.join(pageOut, 'avisos.json'),
      JSON.stringify({ schema_version: RUEDA_AVISO_SCHEMA_VERSION, pagina, avisos: items }, null, 2) + '\n',
    );
    byPage.push({ pagina, count: items.length });
    all.push(...items);
  }

  const outDir = getRuedaOutputDir(edicion);
  fs.mkdirSync(outDir, { recursive: true });
  const payload = {
    schema_version: RUEDA_AVISO_SCHEMA_VERSION,
    edicion,
    batch_id: ctx.batchId,
    fecha_publicacion_original: ctx.fechaPublicacionOriginal,
    fecha_sesion_fin: man?.fecha_fin,
    total_avisos: all.length,
    por_pagina: byPage,
    avisos: all,
  };
  fs.writeFileSync(path.join(outDir, 'avisos.json'), JSON.stringify(payload, null, 2) + '\n');
  writeEditionAvisosCsv(outDir, all, {
    inicio: ctx.fechaPublicacionOriginal,
    fin: man?.fecha_fin || ctx.fechaPublicacionOriginal,
  });
  return { edicion, total: all.length, pagesDir, month };
}

function main() {
  const from = parseInt(arg('from') || '2747', 10);
  const only = arg('edicion');
  const list = only
    ? [only.toUpperCase()]
    : loadRuedaManifest()
        .map((e) => e.edicion)
        .filter((c) => editionNum(c) >= from)
        .sort();

  const results = [];
  for (const ed of list) {
    try {
      results.push(extractEdition(ed));
      console.log(JSON.stringify(results[results.length - 1]));
    } catch (e) {
      console.error(ed, e);
      results.push({ edicion: ed, error: String(e) });
    }
  }
  console.log(JSON.stringify({ done: results.length }, null, 2));
}

main();
