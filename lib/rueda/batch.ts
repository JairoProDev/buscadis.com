import { getEditionByCode } from './editions';

/** ID estable de import/publicación: `rueda-R2766-claimable-2026-10-05`. */
export function suggestBatchId(edicion: string, fechaInicio: string): string {
  const fe = fechaInicio.trim();
  return `rueda-${edicion.toUpperCase()}-claimable-${fe}`;
}

export interface EditionRunContext {
  edicion: string;
  batchId: string;
  fechaPublicacionOriginal: string;
  fechaFin?: string;
}

export function resolveEditionRunContext(params: {
  edicion: string;
  batch?: string;
  fecha?: string;
}): EditionRunContext {
  const edicion = params.edicion.toUpperCase();
  const record = getEditionByCode(edicion);
  const fechaPublicacionOriginal =
    params.fecha || record?.fecha_inicio || new Date().toISOString().slice(0, 10);
  const batchId =
    params.batch || record?.batch_id || suggestBatchId(edicion, fechaPublicacionOriginal);

  return {
    edicion,
    batchId,
    fechaPublicacionOriginal,
    fechaFin: record?.fecha_fin,
  };
}
