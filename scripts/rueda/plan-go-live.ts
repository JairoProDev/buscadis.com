/**
 * Recomienda ancla de go-live (1 aviso/min) alineada a fechas de revista.
 *
 *   npx tsx scripts/rueda/plan-go-live.ts --edicion=R2766
 */
import { getEditionByCode } from '../../lib/rueda/editions';
import { loadAvisosPayload } from '../../lib/rueda/import-run';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function main() {
  const edicion = arg('edicion') || 'R2766';
  const man = getEditionByCode(edicion);
  const payload = loadAvisosPayload(edicion);
  const ready = payload.avisos.filter((a) => !a.requiere_revision);
  const intervalSec = 60;
  const editionDay = man?.fecha_inicio ? `${man.fecha_inicio}T07:00:00-05:00` : null;
  const now = Date.now();
  const anchorMs = editionDay ? Math.max(now, new Date(editionDay).getTime()) : now + 60 * 60 * 1000;
  const lastMs = anchorMs + (ready.length - 1) * intervalSec * 1000;

  console.log(
    JSON.stringify(
      {
        edicion,
        fecha_revista_inicio: man?.fecha_inicio,
        total_avisos: payload.avisos.length,
        listos_sin_revision: ready.length,
        requiere_revision: payload.avisos.length - ready.length,
        recomendacion: {
          intervalo_segundos: intervalSec,
          ancla_go_live_lima: new Date(anchorMs).toISOString(),
          fin_cola_aprox: new Date(lastMs).toISOString(),
          comando_import:
            `npx tsx scripts/rueda/import-edition.ts --edicion=${edicion} --apply --start-in-minutes=${Math.max(1, Math.round((anchorMs - now) / 60000))} --interval-seconds=60`,
          comando_loop: `RUEDA_ACTIVE_BATCH_ID=${man?.batch_id || `rueda-${edicion}-claimable-${man?.fecha_inicio}`} npx tsx scripts/rueda/go-live-loop.ts`,
        },
        nota:
          'fecha_publicacion del aviso usa fecha de la edición; scheduled_go_live_at escalona 1/min para simular actividad orgánica.',
      },
      null,
      2,
    ),
  );
}

main();
