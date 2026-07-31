/**
 * Extrae anuncios desde PDFs de páginas en archive/pages y los sube a Supabase.
 *
 *   # Dry-run (no escribe DB)
 *   npx tsx scripts/cargar-edicion-desde-pdfs.ts --edicion=R2747 --fecha=2026-07-27 --dry-run
 *
 *   # Subir
 *   npx tsx scripts/cargar-edicion-desde-pdfs.ts --edicion=R2747 --fecha=2026-07-27
 *
 *   # Solo páginas clasificados típicas
 *   npx tsx scripts/cargar-edicion-desde-pdfs.ts --edicion=R2747 --fecha=2026-07-27 --paginas=4-16
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

import { estructurarAnuncios, esPublicable, type AnuncioExtraido } from '../lib/extraer-anuncios-rueda';
import { esWhatsApp } from '../lib/limpiar-contactos';
import { adisoToDb } from '../lib/supabase';
import type { Adiso, ContactoMultiple } from '../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const ARCHIVE = '/home/jairoprodev/proyectos/ads/archive/pages';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parsePaginas(spec: string | undefined, maxPage: number): number[] {
  if (!spec) return Array.from({ length: maxPage }, (_, i) => i + 1);
  if (spec.includes('-')) {
    const [a, b] = spec.split('-').map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return spec.split(',').map((s) => Number(s.trim())).filter(Boolean);
}

function generateShortId(size = 10) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let id = '';
  const bytes = crypto.randomBytes(size);
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

function findEditionDir(ed: string): string | null {
  if (!fs.existsSync(ARCHIVE)) return null;
  const dirs = fs.readdirSync(ARCHIVE).filter((d) => d.startsWith(ed + '-') || d === ed);
  return dirs.length ? path.join(ARCHIVE, dirs[0]) : null;
}

function toAdiso(a: AnuncioExtraido, edicion: string, fecha: string, hora: string): Adiso {
  const contactos: ContactoMultiple[] = a.telefonos.map((n, idx) => ({
    tipo: esWhatsApp(a.textoRaw, n) ? 'whatsapp' : 'telefono',
    valor: n,
    principal: idx === 0,
  }));
  return {
    id: generateShortId(10),
    categoria: a.categoria as Adiso['categoria'],
    titulo: a.titulo.substring(0, 100),
    descripcion: a.descripcion.substring(0, 2000),
    contacto: contactos[0]?.valor || '',
    ubicacion: { pais: 'Perú', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Cusco' },
    fechaPublicacion: fecha,
    horaPublicacion: hora,
    tamaño: 'pequeño',
    esHistorico: true,
    estaActivo: true,
    fuenteOriginal: 'rueda_negocios',
    edicionNumero: edicion,
    fechaPublicacionOriginal: fecha,
    contactosMultiples: contactos,
    fechaExpiracion: new Date(new Date(fecha).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

async function main() {
  const edicion = arg('edicion');
  const fecha = arg('fecha');
  const dryRun = hasFlag('dry-run');
  if (!edicion || !fecha) {
    console.error('Uso: --edicion=R2747 --fecha=2026-07-27 [--dry-run] [--paginas=4-16]');
    process.exit(1);
  }

  const dir = findEditionDir(edicion);
  if (!dir) {
    console.error(`No hay carpeta de páginas para ${edicion} en ${ARCHIVE}`);
    process.exit(1);
  }

  const pdfs = fs.readdirSync(dir).filter((f) => /^pagina-\d+\.pdf$/i.test(f));
  const maxPage = Math.max(...pdfs.map((f) => parseInt(f.replace(/\D/g, ''), 10)));
  const paginas = parsePaginas(arg('paginas'), maxPage);

  const hora = '09:00';
  const all: AnuncioExtraido[] = [];
  const byPage: { pagina: number; total: number; publicables: number }[] = [];

  for (const p of paginas) {
    const pdf = path.join(dir, `pagina-${String(p).padStart(2, '0')}.pdf`);
    if (!fs.existsSync(pdf)) continue;
    const text = (await pdfParse(fs.readFileSync(pdf))).text;
    const ads = estructurarAnuncios(text);
    all.push(...ads);
    byPage.push({
      pagina: p,
      total: ads.length,
      publicables: ads.filter(esPublicable).length,
    });
  }

  const publicables = all.filter(esPublicable);
  const revision = all.filter((a) => !esPublicable(a));

  const outDir = path.join(process.cwd(), 'output', 'carga', edicion);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'preview.json'),
    JSON.stringify(
      {
        edicion,
        fecha,
        dryRun,
        total: all.length,
        publicables: publicables.length,
        revision: revision.length,
        byPage,
        sample: publicables.slice(0, 5).map((a) => ({
          categoria: a.categoria,
          titulo: a.titulo,
          score: a.score,
          phones: a.telefonos,
        })),
        revisionSample: revision.map((a) => ({
          titulo: a.titulo,
          score: a.score,
          issues: a.issues,
          len: a.textoRaw.length,
        })),
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify(
      {
        edicion,
        fecha,
        dryRun,
        total: all.length,
        publicables: publicables.length,
        revision: revision.length,
        byPage,
      },
      null,
      2
    )
  );

  if (dryRun) {
    console.log(`\nDry-run OK → ${outDir}/preview.json`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Faltan credenciales Supabase en .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Evitar duplicar misma edición: borrar previos rueda de esta edición (opcional flag)
  if (hasFlag('replace')) {
    console.log(`🗑️  replace: borrando adisos existentes ${edicion}…`);
    const { error: delErr, count } = await supabase
      .from('adisos')
      .delete({ count: 'exact' })
      .eq('fuente_original', 'rueda_negocios')
      .eq('edicion_numero', edicion);
    if (delErr) console.error('delete error', delErr.message);
    else console.log(`borrados: ${count ?? '?'}`);
  }

  const adisos = publicables.map((a) => toAdiso(a, edicion, fecha, hora));
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < adisos.length; i += 40) {
    const lote = adisos.slice(i, i + 40).map(adisoToDb);
    const { error } = await supabase.from('adisos').upsert(lote);
    if (error) {
      fail += lote.length;
      console.error('lote error', error.message);
    } else {
      ok += lote.length;
      process.stdout.write(`\rsubidos ${ok}/${adisos.length}`);
    }
  }
  console.log(`\n✅ Subidos ${ok}, fallidos ${fail}`);

  // Contar en DB
  const { count } = await supabase
    .from('adisos')
    .select('id', { count: 'exact', head: true })
    .eq('edicion_numero', edicion)
    .eq('fuente_original', 'rueda_negocios');
  console.log(`DB ahora tiene ${count} avisos de ${edicion}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
