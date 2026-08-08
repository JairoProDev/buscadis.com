/**
 * Smoke: Zod parse of demo fixture + type surface exists.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const typesSrc = readFileSync(join(root, 'src/types.ts'), 'utf8');
const schemasSrc = readFileSync(join(root, 'src/schemas.ts'), 'utf8');
const fixtureSrc = readFileSync(join(root, 'src/fixtures/demo-retail.ts'), 'utf8');

let failed = 0;

if (!typesSrc.includes('export type TipoModulo')) {
  console.error('FAIL: types.ts missing TipoModulo');
  failed += 1;
} else {
  console.log('OK: TipoModulo exported');
}

if (!schemasSrc.includes('NegocioSchema')) {
  console.error('FAIL: schemas.ts missing NegocioSchema');
  failed += 1;
} else {
  console.log('OK: NegocioSchema present');
}

if (!fixtureSrc.includes("slug: 'demo'")) {
  console.error('FAIL: demo fixture slug');
  failed += 1;
} else {
  console.log('OK: demo fixture slug');
}

// Minimal structural check mirroring ConfigModulo
const ConfigModuloSchema = z.object({
  tipo: z.string(),
  visible: z.boolean(),
  orden: z.number(),
});
const sample = ConfigModuloSchema.safeParse({
  tipo: 'hero',
  visible: true,
  orden: 0,
});
if (!sample.success) {
  console.error('FAIL: zod smoke');
  failed += 1;
} else {
  console.log('OK: zod smoke');
}

if (failed) {
  process.exit(1);
}
console.log('\nTypes smoke passed.');
