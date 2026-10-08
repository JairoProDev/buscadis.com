/**
 * @deprecated Usa `import-edition.ts --edicion=R2764`
 */
import { spawnSync } from 'node:child_process';

const extra = process.argv.slice(2);
if (!extra.some((a) => a.startsWith('--edicion='))) {
  extra.unshift('--edicion=R2764');
}

const r = spawnSync('npx', ['tsx', 'scripts/rueda/import-edition.ts', ...extra], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
process.exit(r.status ?? 1);
