/**
 * Informe de calidad post-extracción (sin API).
 *
 *   npx tsx scripts/rueda/audit-extraction-quality.ts --from=2747
 */
import * as fs from 'fs';
import * as path from 'path';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function editionNum(code: string): number {
  return parseInt(code.replace(/^R/i, ''), 10);
}

function main() {
  const from = parseInt(arg('from') || '2747', 10);
  const root = getRuedaOutputDir();
  const editions = fs
    .readdirSync(root)
    .filter((d) => /^R\d+$/i.test(d) && editionNum(d) >= from)
    .sort();

  let total = 0;
  const flags = {
    fragmento: 0,
    multi_inicio: 0,
    muy_corto: 0,
    requiere_revision: 0,
    empleo_sin_monto: 0,
  };
  const samples: { edicion: string; pagina: number; titulo: string; flag: string }[] = [];

  for (const ed of editions) {
    const payload = JSON.parse(
      fs.readFileSync(path.join(root, ed, 'avisos.json'), 'utf8'),
    ) as { avisos: Array<Record<string, unknown>> };
    for (const a of payload.avisos) {
      total++;
      const issues = (a.issues as string[]) || [];
      const tit = String(a.titulo || '');
      const desc = String(a.descripcion || '');
      const cat = String(a.categoria || '');
      if (issues.includes('fragmento_cortado')) flags.fragmento++;
      if (issues.includes('multi_inicio')) flags.multi_inicio++;
      if (issues.includes('muy_corto')) flags.muy_corto++;
      if (a.requiere_revision) flags.requiere_revision++;
      const esEmpleo =
        cat === 'empleos' || /\b(?:SE SOLICITA|SE REQUIERE|SE NECESITA|sueldo|personal)\b/i.test(tit + desc);
      const tieneMonto = /S\/\.?\s*[\d,.]+|s\/\s*[\d,.]+|sueldo/i.test(tit + desc);
      if (esEmpleo && !tieneMonto && issues.length) flags.empleo_sin_monto++;

      for (const flag of ['fragmento_cortado', 'multi_inicio', 'muy_corto'] as const) {
        if (issues.includes(flag) && samples.length < 40) {
          samples.push({ edicion: ed, pagina: Number(a.pagina), titulo: tit.slice(0, 70), flag });
        }
      }
    }
  }

  const out = {
    from: `R${from}`,
    ediciones: editions.length,
    total_avisos: total,
    flags,
    pct_revision: Math.round((flags.requiere_revision / Math.max(1, total)) * 1000) / 10,
    samples,
  };
  const outPath = path.join(root, `informe-calidad-R${from}-en-adelante.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ outPath, ...out }, null, 2));
}

main();
