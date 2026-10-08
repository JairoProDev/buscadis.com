/**
 * Extrae todos los avisos de una edición Rueda (página por página).
 *
 *   npx tsx scripts/rueda/extract-edition.ts
 *   npx tsx scripts/rueda/extract-edition.ts --pdf=/path/to.pdf --edicion=R2764
 *   npx tsx scripts/rueda/extract-edition.ts --vision   # GPT-4o en portada/páginas imagen
 *   npx tsx scripts/rueda/extract-edition.ts --ocr      # requiere tesseract-ocr-spa en el sistema
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';
import { estructurarAnunciosMaximo, type AnuncioExtraido } from '../../lib/extraer-anuncios-rueda';
import { extractRuedaAdsFromPagePng } from '../../lib/rueda/pdf-page-vision';
import { classifyRuedaListing } from '../../lib/rueda/classify-from-text';
import { polishRuedaListing } from '../../lib/rueda/listing-quality';
import { esWhatsApp } from '../../lib/limpiar-contactos';
import { resolveEditionRunContext } from '../../lib/rueda/batch';
import { getEditionByCode } from '../../lib/rueda/editions';
import { parseEditionDatesFromArchivo } from '../../lib/rueda/parse-filename-dates';
import { resolveEditionPdfPath } from '../../lib/rueda/editions-server';
import { RUEDA_AVISO_SCHEMA_VERSION } from '../../lib/rueda/schema';
import type { RuedaExtractedAd } from '../../lib/rueda/types';
import { getRuedaDataDir, getRuedaOutputDir } from '../../lib/rueda/paths';
import { writeEditionAvisosCsv, writeEditionAvisosTxt } from '../../lib/rueda/export-catalog';
import { ruedaExtractionMode } from '../../lib/rueda/extraction-policy';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

export type { RuedaExtractedAd } from '../../lib/rueda/types';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function detectEmpresa(text: string): boolean {
  return /\b(s\.?a\.?c\.?|s\.?a\.?|e\.?i\.?r\.?l\.?|empresa|hotel|hostal|restaurante|inmobiliaria|distribuidora|cl[ií]nica|instituci[oó]n|agencia|importarte\s+empresa|corporaci[oó]n|grupo)\b/i.test(
    text
  );
}

function extractEmail(text: string): string | null {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

function visionCandidate(page: { pagina: number; texto: string; images?: number; chars?: number }): boolean {
  if (page.pagina === 1) return true;
  if ((page.images ?? 0) >= 4 && (page.chars ?? 0) < 4000) return true;
  if ((page.chars ?? page.texto.length) < 2100) return true;
  return false;
}

function visionToAnuncio(v: {
  titulo: string;
  descripcion: string;
  telefonos: string[];
  categoria?: string;
}): AnuncioExtraido {
  const telefonos = v.telefonos
    .map((t) => t.replace(/\D/g, '').slice(-9))
    .filter((t) => /^9\d{8}$/.test(t));
  const textoRaw = `${v.titulo}. ${v.descripcion} ${telefonos.join(' ')}`.trim();
  const categoria = v.categoria || classifyRuedaListing(v.titulo, v.descripcion);
  return {
    textoRaw,
    titulo: v.titulo.slice(0, 100),
    descripcion: v.descripcion.slice(0, 2000),
    categoria,
    telefonos,
    issues: telefonos.length ? [] : ['sin_telefono'],
    score: telefonos.length ? 72 : 40,
  };
}

async function visionForPage(pdf: string, pagina: number): Promise<AnuncioExtraido[]> {
  const tmp = path.join(os.tmpdir(), `rueda-p${pagina}-${Date.now()}.png`);
  execFileSync('python3', ['scripts/rueda/render-pdf-page.py', pdf, String(pagina), tmp, '150'], {
    stdio: 'pipe',
  });
  const png = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  const ads = await extractRuedaAdsFromPagePng(png.toString('base64'), pagina);
  return ads.map(visionToAnuncio).filter((a) => a.telefonos.length > 0);
}

async function main() {
  const edicionArg = arg('edicion') || 'R2764';
  const man = getEditionByCode(edicionArg);
  const fromFile = man?.archivo ? parseEditionDatesFromArchivo(man.archivo, edicionArg) : null;
  const ctx = resolveEditionRunContext({
    edicion: edicionArg,
    batch: arg('batch') || man?.batch_id,
    fecha: arg('fecha') || man?.fecha_inicio || fromFile?.fecha_inicio,
  });
  const pdf = arg('pdf') || resolveEditionPdfPath(ctx.edicion);
  const { edicion, batchId, fechaPublicacionOriginal: fechaOriginal } = ctx;
  const useOcr = process.argv.includes('--ocr');
  const useVisionPortada = process.argv.includes('--vision-portada');
  const useVisionFull = process.argv.includes('--vision');
  const useVision =
    (useVisionFull || useVisionPortada) && ruedaExtractionMode() === 'openai';
  if ((useVisionFull || useVisionPortada) && !useVision) {
    console.warn(
      '[rueda] Visión OpenAI desactivada (política local). Usa --ocr o RUEDA_USE_OPENAI=1 si lo necesitas.',
    );
  }

  const shouldVisionPage = (page: { pagina: number; texto: string; images?: number; chars?: number }) => {
    if (useVisionPortada && !useVisionFull) return page.pagina === 1;
    return visionCandidate(page);
  };

  if (!fs.existsSync(pdf)) {
    console.error('PDF no encontrado:', pdf);
    process.exit(1);
  }

  const outDir = getRuedaOutputDir(edicion);
  fs.mkdirSync(outDir, { recursive: true });

  const pyArgs = ['scripts/rueda/pdf-pages-text.py', pdf];
  if (useOcr) pyArgs.push('--ocr');

  const rawJson = execFileSync('python3', pyArgs, {
    encoding: 'utf8',
    maxBuffer: 80 * 1024 * 1024,
  });
  const { pages } = JSON.parse(rawJson) as {
    pages: { pagina: number; texto: string; images?: number; chars?: number }[];
  };

  const byPage: { pagina: number; count: number }[] = [];
  const byImportKey = new Map<string, RuedaExtractedAd>();
  const phonePages = new Map<string, Set<number>>();

  for (const p of pages) {
    let anuncios = estructurarAnunciosMaximo(p.texto);
    if (useVision && shouldVisionPage(p)) {
      try {
        const fromVision = await visionForPage(pdf, p.pagina);
        const seen = new Set(anuncios.map((a) => `${a.telefonos[0]}:${a.titulo.slice(0, 40)}`));
        for (const v of fromVision) {
          const k = `${v.telefonos[0]}:${v.titulo.slice(0, 40)}`;
          if (!seen.has(k)) {
            anuncios.push(v);
            seen.add(k);
          }
        }
      } catch (e) {
        console.warn(`[vision] página ${p.pagina}:`, e);
      }
    }
    byPage.push({ pagina: p.pagina, count: anuncios.length });

    for (let idx = 0; idx < anuncios.length; idx++) {
      const a = anuncios[idx];
      const primary = a.telefonos[0];
      if (!primary) continue;

      const titleNorm = normalizeTitle(a.titulo).slice(0, 40);
      const importKey = `${edicion}-p${String(p.pagina).padStart(2, '0')}-${primary}-${titleNorm.slice(0, 24)}-${idx}`;
      if (byImportKey.has(importKey)) continue;

      const confianza = Math.min(1, a.score / 100);
      const requiere_revision = a.score < 70 || a.issues.includes('multi_inicio') || a.issues.includes('muy_largo');

      const pagesForPhone = phonePages.get(primary) || new Set<number>();
      const recurrente = pagesForPhone.size > 0 && !pagesForPhone.has(p.pagina);
      pagesForPhone.add(p.pagina);
      phonePages.set(primary, pagesForPhone);

      const polished = polishRuedaListing({
        id: importKey,
        titulo: a.titulo,
        descripcion: a.descripcion,
        textoRaw: a.textoRaw,
        categoria: a.categoria,
      });

      const item: RuedaExtractedAd = {
        batch_id: batchId,
        edicion,
        pagina: p.pagina,
        import_key: importKey,
        titulo: polished.titulo.slice(0, 120),
        categoria: a.categoria,
        ubicacion: polished.ubicacion.distrito
          ? `${polished.ubicacion.distrito}, ${polished.ubicacion.provincia}, ${polished.ubicacion.departamento}`
          : polished.ubicacion.departamento,
        vacantes: a.categoria === 'empleos' ? [polished.titulo.slice(0, 80)] : [],
        descripcion: polished.descripcion.slice(0, 2000),
        telefonos: a.telefonos,
        whatsapp: esWhatsApp(a.textoRaw, primary) ? primary : a.telefonos.find((t) => esWhatsApp(a.textoRaw, t)) || null,
        email: extractEmail(a.textoRaw),
        es_empresa: detectEmpresa(a.textoRaw),
        confianza,
        requiere_revision,
        recurrente,
        score: a.score,
        issues: a.issues,
        texto_raw: a.textoRaw,
        flyer_template: polished.flyerTemplateId,
        hide_generic_location: polished.hideGenericLocation,
      };

      byImportKey.set(importKey, item);
    }
  }

  const deduped = [...byImportKey.values()];
  const payload = {
    schema_version: RUEDA_AVISO_SCHEMA_VERSION,
    edicion,
    batch_id: batchId,
    fecha_publicacion_original: fechaOriginal,
    fecha_sesion_fin: man?.fecha_fin || fromFile?.fecha_fin || fechaOriginal,
    pdf,
    extracted_at: new Date().toISOString(),
    total_paginas: pages.length,
    total_avisos: deduped.length,
    por_pagina: byPage,
    avisos: deduped,
  };

  const outPath = path.join(outDir, 'avisos.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

  const reviewCsv = [
    'titulo,telefono,es_empresa,confianza,pagina,requiere_revision',
    ...deduped.map(
      (a) =>
        `"${a.titulo.replace(/"/g, '""')}",${a.telefonos[0]},${a.es_empresa},${a.confianza.toFixed(2)},${a.pagina},${a.requiere_revision}`
    ),
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'revision.csv'), reviewCsv);
  const fechasCsv = {
    inicio: fechaOriginal,
    fin: man?.fecha_fin || fromFile?.fecha_fin || fechaOriginal,
  };
  writeEditionAvisosCsv(outDir, deduped, fechasCsv);
  writeEditionAvisosTxt(outDir, deduped);

  fs.writeFileSync(
    path.join(getRuedaDataDir(), 'active.json'),
    JSON.stringify(
      {
        edicion,
        batch_id: batchId,
        fecha_publicacion_original: fechaOriginal,
        updated_at: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );

  console.log(
    JSON.stringify(
      {
        outPath,
        total: deduped.length,
        por_pagina: byPage,
        requiere_revision: deduped.filter((a) => a.requiere_revision).length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
