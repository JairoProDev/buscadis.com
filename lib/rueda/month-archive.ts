import * as fs from 'fs';
import * as path from 'path';
import { getEditionByCode, type RuedaEditionRecord } from './editions';
import { getRuedaPagesDir } from './paths';

export function getRuedaMonthlyArchiveDir(): string {
  return (
    process.env.RUEDA_MONTHLY_ARCHIVE_DIR ||
    path.resolve(process.cwd(), '../ads/archive/by-month')
  );
}

/** `2025-08` desde `fecha_inicio` ISO; fallback carpeta `sin-fecha`. */
export function monthKeyFromEdition(record: Pick<RuedaEditionRecord, 'fecha_inicio' | 'edicion'>): string {
  if (record.fecha_inicio?.length >= 7) return record.fecha_inicio.slice(0, 7);
  return 'sin-fecha';
}

export function editionFolderName(record: Pick<RuedaEditionRecord, 'edicion' | 'archivo'>): string {
  if (record.archivo?.endsWith('.pdf')) return record.archivo.replace(/\.pdf$/i, '');
  return record.edicion;
}

export function monthlyEditionPagesDir(record: RuedaEditionRecord): string {
  const month = monthKeyFromEdition(record);
  const folder = editionFolderName(record);
  return path.join(getRuedaMonthlyArchiveDir(), month, folder);
}

export function listPagePdfPaths(editionPagesDir: string): string[] {
  if (!fs.existsSync(editionPagesDir)) return [];
  return fs
    .readdirSync(editionPagesDir)
    .filter((f) => /^pagina-\d+\.pdf$/i.test(f))
    .sort()
    .map((f) => path.join(editionPagesDir, f));
}

export function pageNumberFromPdfFilename(name: string): number {
  const m = name.match(/pagina-(\d+)\.pdf/i);
  return m ? parseInt(m[1], 10) : 0;
}

/** Busca carpeta de páginas: by-month → legacy pages/. */
export function resolveEditionPagesDir(edicion: string): string | null {
  const code = edicion.toUpperCase();
  const man = getEditionByCode(code);
  if (man?.archivo) {
    const monthly = monthlyEditionPagesDir(man);
    if (fs.existsSync(monthly) && listPagePdfPaths(monthly).length) return monthly;
  }

  const root = getRuedaPagesDir();
  if (!fs.existsSync(root)) return null;
  const dirs = fs.readdirSync(root).filter((d) => {
    const full = path.join(root, d);
    return fs.statSync(full).isDirectory() && (d === code || d.startsWith(`${code}-`));
  });
  if (!dirs.length) return null;
  dirs.sort((a, b) => b.length - a.length);
  return path.join(root, dirs[0]);
}
