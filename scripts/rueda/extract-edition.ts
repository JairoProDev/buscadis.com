/**
 * Extrae todos los avisos de una edición Rueda (página por página).
 *
 *   npx tsx scripts/rueda/extract-edition.ts
 *   npx tsx scripts/rueda/extract-edition.ts --pdf=/path/to.pdf --edicion=R2764
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { estructurarAnunciosMaximo } from '../../lib/extraer-anuncios-rueda';
import { polishRuedaListing } from '../../lib/rueda/listing-quality';
import { esWhatsApp } from '../../lib/limpiar-contactos';
import {
  RUEDA_R2764_BATCH_ID,
  RUEDA_R2764_EDICION,
  RUEDA_R2764_FECHA_ORIGINAL,
  RUEDA_R2764_PDF,
} from '../../lib/rueda/batch-constants';

export interface RuedaExtractedAd {
  batch_id: string;
  edicion: string;
  pagina: number;
  import_key: string;
  titulo: string;
  categoria: string;
  subcategoria?: string;
  ubicacion: string;
  vacantes: string[];
  descripcion: string;
  telefonos: string[];
  whatsapp: string | null;
  email: string | null;
  es_empresa: boolean;
  confianza: number;
  requiere_revision: boolean;
  recurrente: boolean;
  score: number;
  issues: string[];
  texto_raw: string;
  flyer_template: string;
  hide_generic_location: boolean;
}

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

function main() {
  const pdf = arg('pdf') || RUEDA_R2764_PDF;
  const edicion = arg('edicion') || RUEDA_R2764_EDICION;
  const batchId = arg('batch') || RUEDA_R2764_BATCH_ID;
  const fechaOriginal = arg('fecha') || RUEDA_R2764_FECHA_ORIGINAL;

  if (!fs.existsSync(pdf)) {
    console.error('PDF no encontrado:', pdf);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'output', 'rueda', edicion);
  fs.mkdirSync(outDir, { recursive: true });

  const rawJson = execFileSync('python3', ['scripts/rueda/pdf-pages-text.py', pdf], {
    encoding: 'utf8',
    maxBuffer: 80 * 1024 * 1024,
  });
  const { pages } = JSON.parse(rawJson) as { pages: { pagina: number; texto: string }[] };

  const byPage: { pagina: number; count: number }[] = [];
  const byImportKey = new Map<string, RuedaExtractedAd>();
  const phonePages = new Map<string, Set<number>>();

  for (const p of pages) {
    const anuncios = estructurarAnunciosMaximo(p.texto);
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
    edicion,
    batch_id: batchId,
    fecha_publicacion_original: fechaOriginal,
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

main();
