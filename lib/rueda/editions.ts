import * as fs from 'fs';
import * as path from 'path';

export type RuedaEditionSource = 'wordpress' | 'downloads' | 'wayback' | 'manual' | 'unknown';

export interface RuedaEditionRecord {
  edicion: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  batch_id?: string;
  source_url?: string;
  sha256?: string;
  downloaded_at?: string;
  page_count?: number;
  source?: RuedaEditionSource;
  status?: 'active' | 'missing' | 'conflict';
  notes?: string;
}

const DEFAULT_EDITIONS_DIR =
  process.env.RUEDA_EDITIONS_DIR ||
  path.resolve(process.cwd(), '../ads/archive/editions');

export function getRuedaEditionsDir(): string {
  return DEFAULT_EDITIONS_DIR;
}

export function ruedaEditionPdfPath(record: Pick<RuedaEditionRecord, 'edicion' | 'archivo'>): string {
  return path.join(getRuedaEditionsDir(), record.archivo);
}

export function loadRuedaManifest(): RuedaEditionRecord[] {
  const manifestPath = path.join(process.cwd(), 'data', 'rueda', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return [];
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { editions?: RuedaEditionRecord[] };
  return raw.editions || [];
}

export function getEditionByCode(edicion: string): RuedaEditionRecord | undefined {
  return loadRuedaManifest().find((e) => e.edicion === edicion);
}

export function suggestEditionFilename(edicion: string, rangoLabel: string): string {
  return `${edicion}-${rangoLabel}.pdf`;
}

export function parseEditionCodeFromFilename(name: string): string | null {
  const m = name.match(/\b(R\d{3,4})\b/i);
  return m ? m[1].toUpperCase() : null;
}

export function loadManifestDocument(): {
  editions_dir_env: string;
  editions_dir_default: string;
  wordpress_revista_url?: string;
  note?: string;
  editions: RuedaEditionRecord[];
} {
  const manifestPath = path.join(process.cwd(), 'data', 'rueda', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return {
      editions_dir_env: 'RUEDA_EDITIONS_DIR',
      editions_dir_default: '../ads/archive/editions',
      editions: [],
    };
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    editions_dir_env: string;
    editions_dir_default: string;
    wordpress_revista_url?: string;
    note?: string;
    editions: RuedaEditionRecord[];
  };
}

export function saveManifestEditions(editions: RuedaEditionRecord[]): void {
  const manifestPath = path.join(process.cwd(), 'data', 'rueda', 'manifest.json');
  const doc = loadManifestDocument();
  doc.editions = [...editions].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  fs.writeFileSync(manifestPath, JSON.stringify(doc, null, 2) + '\n');
}

export function upsertManifestEdition(record: RuedaEditionRecord): void {
  const doc = loadManifestDocument();
  const idx = doc.editions.findIndex((e) => e.edicion === record.edicion);
  if (idx >= 0) doc.editions[idx] = { ...doc.editions[idx], ...record };
  else doc.editions.push(record);
  saveManifestEditions(doc.editions);
}

/** Lista PDFs en disco que siguen convención R####-*.pdf */
export function listEditionPdfFilesOnDisk(): { edicion: string; archivo: string; path: string }[] {
  const dir = getRuedaEditionsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^R\d{3,4}(-.+)?\.pdf$/i.test(f))
    .map((archivo) => {
      const edicion = parseEditionCodeFromFilename(archivo) || archivo;
      return { edicion, archivo, path: path.join(dir, archivo) };
    })
    .sort((a, b) => a.edicion.localeCompare(b.edicion));
}
