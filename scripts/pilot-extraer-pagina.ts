/**
 * Piloto una página — usa lib/extraer-anuncios-rueda.ts (dry-run, no DB).
 *
 *   npx tsx scripts/pilot-extraer-pagina.ts --pdf=... --edicion=R2747 --fecha=2026-07-27 --pagina=5
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import { estructurarAnuncios } from '../lib/extraer-anuncios-rueda';
import { esWhatsApp } from '../lib/limpiar-contactos';

function generateShortId(size = 10) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let id = '';
  const bytes = crypto.randomBytes(size);
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const pdfPath =
    arg('pdf') ||
    '/home/jairoprodev/proyectos/ads/archive/pages/R2747-Jul27-Ago2/pagina-05.pdf';
  const edicion = arg('edicion') || 'R2747';
  const fecha = arg('fecha') || '2026-07-27';
  const pagina = Number(arg('pagina') || '5');

  const parsed = await pdfParse(fs.readFileSync(pdfPath));
  const anuncios = estructurarAnuncios(parsed.text);

  const objetos = anuncios.map((a) => {
    const contactos = a.telefonos.map((n, idx) => ({
      tipo: esWhatsApp(a.textoRaw, n) ? 'whatsapp' : 'telefono',
      valor: n,
      principal: idx === 0,
    }));
    return {
      id: generateShortId(10),
      categoria: a.categoria,
      titulo: a.titulo,
      descripcion: a.descripcion,
      contacto: contactos[0]?.valor || '',
      ubicacion: { pais: 'Perú', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Cusco' },
      fechaPublicacion: fecha,
      horaPublicacion: '09:00',
      tamaño: 'pequeño',
      esHistorico: true,
      estaActivo: true,
      fuenteOriginal: 'rueda_negocios',
      edicionNumero: edicion,
      fechaPublicacionOriginal: fecha,
      contactosMultiples: contactos,
      fechaExpiracion: new Date(new Date(fecha).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      _qa: { score: a.score, issues: a.issues },
    };
  });

  const outDir = path.join(process.cwd(), 'output', 'pilot-rueda');
  fs.mkdirSync(outDir, { recursive: true });
  const stem = `${edicion}-p${String(pagina).padStart(2, '0')}`;
  fs.writeFileSync(path.join(outDir, `${stem}.raw.txt`), parsed.text);
  fs.writeFileSync(
    path.join(outDir, `${stem}.separados.txt`),
    anuncios
      .map(
        (a, i) =>
          `${i + 1}. [${a.score}] [${a.categoria}] ${a.titulo}\n${a.descripcion}\nphones: ${a.telefonos.join(', ')} | ${a.issues.join(',') || 'ok'}`
      )
      .join('\n\n')
  );
  fs.writeFileSync(
    path.join(outDir, `${stem}.upload-dryrun.json`),
    JSON.stringify(
      {
        pilot: true,
        uploaded: false,
        source: pdfPath,
        edicion,
        fecha,
        pagina,
        total: objetos.length,
        avgScore: Math.round(anuncios.reduce((s, a) => s + a.score, 0) / Math.max(1, anuncios.length)),
        anuncios: objetos,
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify(
      {
        total: objetos.length,
        avgScore: Math.round(anuncios.reduce((s, a) => s + a.score, 0) / Math.max(1, anuncios.length)),
        issues: anuncios.flatMap((a) => a.issues).reduce<Record<string, number>>((acc, i) => {
          acc[i] = (acc[i] || 0) + 1;
          return acc;
        }, {}),
        sample: objetos.slice(0, 4).map((o) => ({
          categoria: o.categoria,
          titulo: o.titulo,
          score: o._qa.score,
          issues: o._qa.issues,
        })),
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
