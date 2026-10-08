/**
 *   npx tsx scripts/rueda/preflight-edition.ts --edicion=R2766
 */
import { preflightEdition } from '../../lib/rueda/preflight';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function main() {
  const edicion = arg('edicion');
  if (!edicion) {
    console.error('Requiere --edicion=R2766');
    process.exit(1);
  }
  const r = preflightEdition(edicion);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 2);
}

main();
