/**
 * Extrae los path de react-icons a un módulo estático para el PDF (jsPDF no
 * puede renderizar componentes React). Ejecutar solo si hay que añadir iconos.
 */
import fs from 'node:fs';

const PACKS = {
  si: 'node_modules/react-icons/si/index.mjs',
  fa6: 'node_modules/react-icons/fa6/index.mjs',
};

const WANTED = [
  ['whatsapp', 'si', 'SiWhatsapp'],
  ['instagram', 'si', 'SiInstagram'],
  ['facebook', 'si', 'SiFacebook'],
  ['tiktok', 'si', 'SiTiktok'],
  ['linkedin', 'si', 'SiLinkedin'],
  ['youtube', 'si', 'SiYoutube'],
  ['telegram', 'si', 'SiTelegram'],
  ['messenger', 'si', 'SiMessenger'],
  ['twitter', 'si', 'SiX'],
  ['pinterest', 'si', 'SiPinterest'],
  ['threads', 'si', 'SiThreads'],
  ['spotify', 'si', 'SiSpotify'],
  ['website', 'fa6', 'FaGlobe'],
  ['phone', 'fa6', 'FaPhone'],
  ['mail', 'fa6', 'FaEnvelope'],
  ['pin', 'fa6', 'FaLocationDot'],
  ['clock', 'fa6', 'FaRegClock'],
  ['check', 'fa6', 'FaCheck'],
  ['qr', 'fa6', 'FaQrcode'],
  ['tag', 'fa6', 'FaTag'],
  ['star', 'fa6', 'FaStar'],
  ['link', 'fa6', 'FaLink'],
];

const sources = Object.fromEntries(
  Object.entries(PACKS).map(([k, p]) => [k, fs.readFileSync(p, 'utf8')])
);

function extract(pack, name) {
  const src = sources[pack];
  const marker = `export function ${name} (props)`;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`${name} no encontrado en ${pack}`);
  const end = src.indexOf('\nexport function ', start + marker.length);
  const body = src.slice(start, end < 0 ? undefined : end);
  const viewBox = body.match(/"viewBox":"([^"]+)"/)?.[1];
  const paths = [...body.matchAll(/"d":"([^"]+)"/g)].map((m) => m[1]);
  if (!viewBox || paths.length === 0) throw new Error(`${name} sin viewBox/paths`);
  return { viewBox, paths };
}

const entries = WANTED.map(([key, pack, name]) => {
  const { viewBox, paths } = extract(pack, name);
  return { key, source: `${pack}/${name}`, viewBox, paths };
});

const out = `/**
 * Paths SVG para el PDF del catálogo. Generado desde react-icons por
 * scripts/tmp-extract-icon-paths.mjs — jsPDF no renderiza componentes React,
 * necesita el path plano para rasterizar el icono.
 */

export type PdfIconKey =
${entries.map((e) => `  | '${e.key}'`).join('\n')};

export type PdfIcon = { viewBox: string; paths: string[] };

export const PDF_ICONS: Record<PdfIconKey, PdfIcon> = {
${entries
  .map(
    (e) => `  // ${e.source}
  ${e.key}: {
    viewBox: '${e.viewBox}',
    paths: [
${e.paths.map((p) => `      '${p}',`).join('\n')}
    ],
  },`
  )
  .join('\n')}
};
`;

fs.writeFileSync('lib/pdf/icon-paths.ts', out);
console.log(
  `lib/pdf/icon-paths.ts escrito con ${entries.length} iconos (${out.length} bytes)`
);
