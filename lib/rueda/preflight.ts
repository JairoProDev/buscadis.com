import * as fs from 'fs';
import * as path from 'path';
import { ruedaAvisosPayloadSchema } from '@/lib/rueda/schema';
import { getEditionByCode, ruedaEditionPdfPath } from '@/lib/rueda/editions';
import { getRuedaOutputDir } from '@/lib/rueda/paths';
import { resolveEditionRunContext } from '@/lib/rueda/batch';

export interface PreflightResult {
  ok: boolean;
  edicion: string;
  batch_id: string;
  fecha_sesion: string;
  total_avisos: number;
  sin_telefono: number;
  requiere_revision: number;
  multi_inicio: number;
  pdf_existe: boolean;
  avisos_json: boolean;
  errores: string[];
  advertencias: string[];
}

export function preflightEdition(edicion: string): PreflightResult {
  const code = edicion.toUpperCase();
  const errores: string[] = [];
  const advertencias: string[] = [];
  const man = getEditionByCode(code);
  const ctx = resolveEditionRunContext({
    edicion: code,
    fecha: man?.fecha_inicio,
    batch: man?.batch_id,
  });

  const jsonPath = path.join(getRuedaOutputDir(code), 'avisos.json');
  const avisos_json = fs.existsSync(jsonPath);
  if (!avisos_json) errores.push(`Falta ${jsonPath}`);

  let total = 0;
  let sin_telefono = 0;
  let requiere_revision = 0;
  let multi_inicio = 0;

  if (avisos_json) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const parsed = ruedaAvisosPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      errores.push(`avisos.json no cumple schema: ${parsed.error.message.slice(0, 200)}`);
    } else {
      total = parsed.data.avisos.length;
      for (const a of parsed.data.avisos) {
        if (!a.telefonos.some((t) => /^9\d{8}$/.test(t))) sin_telefono++;
        if (a.requiere_revision) requiere_revision++;
        if (a.issues.includes('multi_inicio')) multi_inicio++;
      }
      const pctPhone = total ? ((total - sin_telefono) / total) * 100 : 0;
      if (pctPhone < 92) errores.push(`Solo ${pctPhone.toFixed(1)}% con teléfono (mín 92%)`);
      if (multi_inicio / Math.max(1, total) > 0.03) {
        advertencias.push(`${multi_inicio} avisos con posible fusión (multi_inicio)`);
      }
      if (requiere_revision > 0) {
        advertencias.push(`${requiere_revision} avisos marcados requiere_revision`);
      }
    }
  }

  let pdf_existe = false;
  if (man?.archivo) {
    const p = ruedaEditionPdfPath(man);
    pdf_existe = fs.existsSync(p);
  }
  if (!pdf_existe) advertencias.push('PDF no encontrado en manifest (catálogo JSON puede bastar)');

  if (!man?.fecha_inicio) advertencias.push('manifest sin fecha_inicio — revisa fix-manifest-fechas');

  const ok = errores.length === 0;

  return {
    ok,
    edicion: code,
    batch_id: ctx.batchId,
    fecha_sesion: ctx.fechaPublicacionOriginal,
    total_avisos: total,
    sin_telefono,
    requiere_revision,
    multi_inicio,
    pdf_existe,
    avisos_json,
    errores,
    advertencias,
  };
}
