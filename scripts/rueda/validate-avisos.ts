/**
 * Valida output/rueda/R####/avisos.json contra schema Zod + reglas QG.
 *
 *   npx tsx scripts/rueda/validate-avisos.ts --edicion=R2766
 */
import * as fs from 'fs';
import * as path from 'path';
import { ruedaAvisosPayloadSchema } from '../../lib/rueda/schema';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

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

  const jsonPath = path.join(getRuedaOutputDir(edicion), 'avisos.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('No existe', jsonPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const parsed = ruedaAvisosPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema inválido:', parsed.error.flatten());
    process.exit(1);
  }

  const avisos = parsed.data.avisos;
  const sinTelefono = avisos.filter((a) => !a.telefonos.some((t) => /^9\d{8}$/.test(t)));
  const multiInicio = avisos.filter((a) => a.issues.includes('multi_inicio'));
  const revision = avisos.filter((a) => a.requiere_revision);
  const withPhonePct = ((avisos.length - sinTelefono.length) / avisos.length) * 100;

  const qg = {
    pass: withPhonePct >= 92 && multiInicio.length / avisos.length < 0.03,
    with_phone_pct: Math.round(withPhonePct * 10) / 10,
    sin_telefono: sinTelefono.length,
    multi_inicio: multiInicio.length,
    requiere_revision: revision.length,
    total: avisos.length,
  };

  const metricsPath = path.join(getRuedaOutputDir(edicion), 'metrics.json');
  fs.writeFileSync(
    metricsPath,
    JSON.stringify({ validated_at: new Date().toISOString(), qg, edicion }, null, 2) + '\n',
  );

  console.log(JSON.stringify({ jsonPath, qg }, null, 2));
  if (!qg.pass) process.exit(2);
}

main();
