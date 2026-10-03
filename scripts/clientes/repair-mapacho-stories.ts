/**
 * @deprecated Usa sync-mapacho-stories.ts
 *   npx tsx scripts/clientes/sync-mapacho-stories.ts --apply
 */
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

const script = path.join(__dirname, 'sync-mapacho-stories.ts');
const apply = process.argv.includes('--apply');
spawnSync('npx', ['tsx', script, ...(apply ? ['--apply'] : [])], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '../..'),
});
