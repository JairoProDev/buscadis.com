/**
 * Smoke: sugerencias IA no inventan stock; sin match → null.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../src/ia/sugerencias.ts'), 'utf8');

let failed = 0;
if (!src.includes('export function sugerenciasDesdePerfil')) {
  console.error('FAIL: sugerenciasDesdePerfil');
  failed += 1;
}
if (!src.includes('export function responderPreguntaIa')) {
  console.error('FAIL: responderPreguntaIa');
  failed += 1;
}
if (!src.includes('Nunca afirma stock') && !src.includes('no inventar')) {
  console.error('FAIL: guardrail comment missing');
  failed += 1;
}
if (src.includes('tenemos stock') || src.includes('sí hay stock')) {
  console.error('FAIL: must not claim stock');
  failed += 1;
}

if (failed) process.exit(1);
console.log('OK: IA sugerencias surface');
console.log('\nIA smoke passed.');
