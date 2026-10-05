import * as fs from 'fs';
import * as path from 'path';

export interface RuedaEditionRecord {
  edicion: string;
  fecha_inicio: string;
  fecha_fin: string;
  archivo: string;
  batch_id?: string;
  source_url?: string;
  sha256?: string;
  downloaded_at?: string;
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
