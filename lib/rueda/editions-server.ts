import * as fs from 'fs';
import * as path from 'path';
import {
  getEditionByCode,
  getRuedaEditionsDir,
  ruedaEditionPdfPath,
} from './editions';

/** Solo servidor/scripts — resuelve ruta al PDF de una edición. */
export function resolveEditionPdfPath(edicion: string): string {
  const record = getEditionByCode(edicion);
  const candidate = record
    ? ruedaEditionPdfPath(record)
    : path.join(getRuedaEditionsDir(), `${edicion}.pdf`);
  if (fs.existsSync(candidate)) return candidate;
  return path.join(getRuedaEditionsDir(), 'R2764-Sep28-30.pdf');
}

/** R2764 — scripts que importaban RUEDA_R2764_PDF desde batch-constants */
export const RUEDA_R2764_PDF = resolveEditionPdfPath('R2764');
