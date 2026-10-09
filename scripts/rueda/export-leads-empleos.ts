/**
 * Tabla CRM empleos Cusco — pensada para Google Sheets (importar CSV).
 *
 *   npx tsx scripts/rueda/export-leads-empleos.ts --from=2747
 */
import * as fs from 'fs';
import * as path from 'path';
import { getEditionByCode } from '../../lib/rueda/editions';
import {
  extractHorarioTexto,
  extractSueldoTexto,
  mensajeWaEmpleoCusco,
} from '../../lib/rueda/lead-fields';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import type { RuedaExtractedAd } from '../../lib/rueda/types';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function editionNum(code: string): number {
  return parseInt(code.replace(/^R/i, ''), 10);
}

function csvCell(s: string): string {
  return `"${String(s).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

function isEmpleo(a: RuedaExtractedAd): boolean {
  const t = `${a.titulo} ${a.descripcion} ${a.texto_raw}`;
  return (
    a.categoria === 'empleos' ||
    /\b(?:SE SOLICITA|SE REQUIERE|SE NECESITA|vacante|personal|sueldo|planilla|CV)\b/i.test(t)
  );
}

function main() {
  const from = parseInt(arg('from') || '2747', 10);
  const root = getRuedaOutputDir();
  const editions = fs
    .readdirSync(root)
    .filter((d) => /^R\d+$/i.test(d) && editionNum(d) >= from)
    .sort();

  const header = [
    'import_key',
    'mes_edicion',
    'edicion',
    'fecha_sesion_inicio',
    'pagina',
    'titulo',
    'descripcion',
    'telefono_principal',
    'telefonos_todos',
    'whatsapp',
    'email',
    'es_empresa',
    'sueldo_texto',
    'horario_texto',
    'ubicacion',
    'score',
    'requiere_revision',
    'issues',
    'estado_revision',
    'titulo_corregido',
    'descripcion_corregida',
    'notas_equipo',
    'mensaje_wa_sugerido',
    'wa_url',
    'prioridad',
  ].join(',');

  const rows: string[] = [header];
  let count = 0;

  for (const ed of editions) {
    const jsonPath = path.join(root, ed, 'avisos.json');
    if (!fs.existsSync(jsonPath)) continue;
    const man = getEditionByCode(ed);
    const mes = man?.fecha_inicio?.slice(0, 7) || '';
    const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { avisos: RuedaExtractedAd[] };
    for (const a of payload.avisos) {
      if (!isEmpleo(a)) continue;
      const phone = a.telefonos[0] || '';
      if (!/^9\d{8}$/.test(phone)) continue;
      const full = `${a.titulo}\n${a.descripcion}`;
      const sueldoTexto = extractSueldoTexto(full);
      const mensaje = mensajeWaEmpleoCusco({
        titulo: a.titulo,
        descripcion: a.descripcion,
        edicion: ed,
        pagina: a.pagina,
        sueldoTexto,
        importKey: a.import_key,
        telefono: phone,
      });
      const waUrl = `https://wa.me/51${phone}?text=${encodeURIComponent(mensaje)}`;
      const prioridad = a.requiere_revision ? 'baja' : a.score >= 85 ? 'alta' : 'media';
      rows.push(
        [
          a.import_key,
          mes,
          ed,
          man?.fecha_inicio || '',
          a.pagina,
          a.titulo,
          a.descripcion,
          phone,
          a.telefonos.join('|'),
          a.whatsapp || phone,
          a.email || '',
          a.es_empresa ? 'si' : 'no',
          sueldoTexto,
          extractHorarioTexto(full),
          a.ubicacion || '',
          a.score,
          a.requiere_revision,
          (a.issues || []).join('|'),
          'pendiente',
          '',
          '',
          '',
          mensaje,
          waUrl,
          prioridad,
        ]
          .map((c) => csvCell(String(c)))
          .join(','),
      );
      count++;
    }
  }

  const outDir = path.join(root, 'leads');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `empleos-cusco-desde-R${from}.csv`);
  fs.writeFileSync(out, rows.join('\n') + '\n', 'utf8');
  console.log(JSON.stringify({ out, filas: count, ediciones: editions.length }, null, 2));
}

main();
