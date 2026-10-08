import * as fs from 'fs';
import * as path from 'path';
import type { RuedaExtractedAd } from '@/lib/rueda/types';

export const AVISOS_CSV_COLUMNS = [
  'numero_en_edicion',
  'fecha_sesion_inicio',
  'fecha_sesion_fin',
  'edicion',
  'pagina',
  'import_key',
  'titulo',
  'descripcion',
  'categoria',
  'subcategoria',
  'ubicacion',
  'telefono_principal',
  'telefonos_todos',
  'whatsapp',
  'email',
  'es_empresa',
  'recurrente',
  'requiere_revision',
  'confianza',
  'score',
  'issues',
  'flyer_template',
  'hide_generic_location',
  'texto_raw',
  'batch_id',
] as const;

/** Evita LS/PS del PDF que disparan el aviso de VS Code/Cursor en CSV. */
export function sanitizeCsvFieldText(s: string): string {
  return s
    .replace(/\u2028/g, ' ')
    .replace(/\u2029/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .trim();
}

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = sanitizeCsvFieldText(String(v));
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function avisoToCsvRow(
  ad: RuedaExtractedAd,
  numeroEnEdicion: number,
  fechas?: { inicio: string; fin: string },
): string {
  const row: Record<string, string | number | boolean> = {
    numero_en_edicion: numeroEnEdicion,
    fecha_sesion_inicio: fechas?.inicio || '',
    fecha_sesion_fin: fechas?.fin || '',
    edicion: ad.edicion,
    pagina: ad.pagina,
    import_key: ad.import_key,
    titulo: ad.titulo,
    descripcion: ad.descripcion,
    categoria: ad.categoria,
    subcategoria: ad.subcategoria || '',
    ubicacion: ad.ubicacion,
    telefono_principal: ad.telefonos[0] || '',
    telefonos_todos: ad.telefonos.join('; '),
    whatsapp: ad.whatsapp || '',
    email: ad.email || '',
    es_empresa: ad.es_empresa,
    recurrente: ad.recurrente,
    requiere_revision: ad.requiere_revision,
    confianza: ad.confianza,
    score: ad.score,
    issues: ad.issues.join('|'),
    flyer_template: ad.flyer_template,
    hide_generic_location: ad.hide_generic_location,
    texto_raw: ad.texto_raw,
    batch_id: ad.batch_id,
  };
  return AVISOS_CSV_COLUMNS.map((k) => csvCell(row[k])).join(',');
}

export function writeEditionAvisosCsv(
  outDir: string,
  avisos: RuedaExtractedAd[],
  fechas?: { inicio: string; fin: string },
): string {
  const sorted = [...avisos].sort((a, b) => a.pagina - b.pagina || a.titulo.localeCompare(b.titulo));
  const lines = [
    AVISOS_CSV_COLUMNS.join(','),
    ...sorted.map((a, i) => avisoToCsvRow(a, i + 1, fechas)),
  ];
  const csvPath = path.join(outDir, 'avisos.csv');
  fs.writeFileSync(csvPath, lines.join('\n') + '\n', 'utf8');
  return csvPath;
}

export function writeEditionAvisosTxt(outDir: string, avisos: RuedaExtractedAd[]): string {
  const sorted = [...avisos].sort((a, b) => a.pagina - b.pagina || a.titulo.localeCompare(b.titulo));
  const blocks = sorted.map((a, i) => {
    const n = i + 1;
    return [
      `========== AVISO ${n} (${a.edicion} p.${a.pagina}) ==========`,
      `Título: ${a.titulo}`,
      `Categoría: ${a.categoria}`,
      `Ubicación: ${a.ubicacion}`,
      `Teléfonos: ${a.telefonos.join(', ')}`,
      a.email ? `Email: ${a.email}` : '',
      `Empresa: ${a.es_empresa ? 'sí' : 'no'} | Revisión manual: ${a.requiere_revision ? 'SÍ' : 'no'} | Score: ${a.score}`,
      a.issues.length ? `Alertas: ${a.issues.join(', ')}` : '',
      '',
      a.descripcion,
      '',
      '--- Texto original revista ---',
      a.texto_raw,
      '',
    ]
      .filter(Boolean)
      .join('\n');
  });
  const txtPath = path.join(outDir, 'avisos-enumerados.txt');
  fs.writeFileSync(txtPath, blocks.join('\n'), 'utf8');
  return txtPath;
}
