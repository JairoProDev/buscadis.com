/**
 * Valida todas las ediciones con avisos.json y escribe output/rueda/VALIDATION-summary.json
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

function main() {
  const root = getRuedaOutputDir();
  const editions = fs
    .readdirSync(root)
    .filter((d) => /^R\d+$/i.test(d) && fs.existsSync(path.join(root, d, 'avisos.json')))
    .sort();

  const results: { edicion: string; pass: boolean; total: number; with_phone_pct?: number }[] = [];

  for (const ed of editions) {
    const r = spawnSync('npx', ['tsx', 'scripts/rueda/validate-avisos.ts', `--edicion=${ed}`], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    let pass = r.status === 0;
    let metrics: { qg?: { with_phone_pct?: number; total?: number } } = {};
    try {
      const mPath = path.join(root, ed, 'metrics.json');
      if (fs.existsSync(mPath)) metrics = JSON.parse(fs.readFileSync(mPath, 'utf8'));
    } catch {
      /* ignore */
    }
    results.push({
      edicion: ed,
      pass,
      total: metrics.qg?.total ?? 0,
      with_phone_pct: metrics.qg?.with_phone_pct,
    });
  }

  const summary = {
    generated_at: new Date().toISOString(),
    ediciones: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).map((r) => r.edicion),
    results,
  };
  fs.writeFileSync(path.join(root, 'VALIDATION-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed.length) process.exit(2);
}

main();
