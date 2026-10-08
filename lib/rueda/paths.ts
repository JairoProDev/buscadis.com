import * as fs from 'fs';
import * as path from 'path';
import { getRuedaEditionsDir } from './editions';

/** Repo buscadis.com root (cwd en scripts). */
export function getBuscadisRoot(): string {
  return process.cwd();
}

export function getRuedaDataDir(): string {
  return path.join(getBuscadisRoot(), 'data', 'rueda');
}

export function getManifestPath(): string {
  return path.join(getRuedaDataDir(), 'manifest.json');
}

export function getInventoryPath(): string {
  return path.join(getRuedaDataDir(), 'inventory.json');
}

export function getEditionGapsPath(): string {
  return path.join(getRuedaDataDir(), 'edition-gaps.json');
}

export function getRuedaPagesDir(): string {
  return (
    process.env.RUEDA_PAGES_DIR ||
    path.resolve(getBuscadisRoot(), '../ads/archive/pages')
  );
}

export function getRuedaOutputDir(edicion?: string): string {
  const base = path.join(getBuscadisRoot(), 'output', 'rueda');
  return edicion ? path.join(base, edicion) : base;
}

export function getRuedaAvisosJsonPath(edicion: string): string {
  return path.join(getRuedaOutputDir(edicion), 'avisos.json');
}

export function getRuedaReportsDir(): string {
  return (
    process.env.RUEDA_REPORTS_DIR ||
    path.resolve(getBuscadisRoot(), '../ads/reports')
  );
}

/** Carpeta de páginas partidas: `R2764-Sep28-30` o fallback `R2764`. */
export function findEditionPagesDir(edicion: string): string | null {
  const root = getRuedaPagesDir();
  if (!fs.existsSync(root)) return null;
  const code = edicion.toUpperCase();
  const dirs = fs.readdirSync(root).filter((d) => {
    const full = path.join(root, d);
    return fs.statSync(full).isDirectory() && (d === code || d.startsWith(`${code}-`));
  });
  if (!dirs.length) return null;
  dirs.sort((a, b) => b.length - a.length);
  return path.join(root, dirs[0]);
}

export function defaultWindowsDownloadsDir(): string | null {
  const candidates = [
    process.env.RUEDA_WINDOWS_DOWNLOADS,
    '/mnt/c/Users/jairo/Downloads',
    `/mnt/c/Users/${process.env.USER || process.env.USERNAME || 'jairo'}/Downloads`,
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}
