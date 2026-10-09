/**
 * Importa avisos extraídos (inactivos + go-live programado).
 *
 *   npx tsx scripts/rueda/import-edition.ts --edicion=R2766 --dry-run
 *   npx tsx scripts/rueda/import-edition.ts --edicion=R2766 --apply
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { resolveEditionRunContext } from '../../lib/rueda/batch';
import { loadAvisosPayload, toAdisoFromRuedaExtract, OPS_USER_ID } from '../../lib/rueda/import-run';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import { adisoToDb } from '../../lib/supabase';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function argNum(name: string, def: number): number {
  const v = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!v) return def;
  return Number(v.split('=')[1]) || def;
}

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  return supabaseAdmin;
}

async function batchExists(batchId: string): Promise<boolean> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from('adisos')
    .select('id')
    .contains('private_data', { batch_id: batchId })
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function main() {
  const edicion = arg('edicion');
  if (!edicion) {
    console.error('Requiere --edicion=R2766');
    process.exit(1);
  }

  const ctx = resolveEditionRunContext({
    edicion,
    batch: arg('batch'),
    fecha: arg('fecha'),
  });

  const supabaseAdmin = await getSupabaseAdmin();
  const dryRun = !hasFlag('--apply');
  const startInMinutes = argNum('start-in-minutes', 1);
  const intervalMs = argNum('interval-seconds', 60) * 1000;

  const payload = loadAvisosPayload(ctx.edicion);
  let avisos = payload.avisos.sort((a, b) => a.pagina - b.pagina || a.titulo.localeCompare(b.titulo));
  if (hasFlag('--only-ready')) {
    avisos = avisos.filter((a) => !a.requiere_revision);
  }
  let baseTime = Date.now() + startInMinutes * 60 * 1000;

  const missingOnly = hasFlag('--missing-only');
  if (!missingOnly && (await batchExists(ctx.batchId))) {
    console.log(JSON.stringify({ skipped: true, reason: 'batch_already_imported', batch: ctx.batchId }));
    if (!dryRun) process.exit(0);
  }

  let avisosToImport = avisos;
  if (missingOnly) {
    const { data: existing } = await supabaseAdmin
      .from('adisos')
      .select('contacto, private_data')
      .contains('private_data', { batch_id: ctx.batchId });
    const seen = new Set(
      (existing || []).map((r) => {
        const priv = (r.private_data || {}) as Record<string, unknown>;
        const pagina = String(priv.pagina_revista ?? '');
        const phone = String(r.contacto || '').replace(/\D/g, '').slice(-9);
        return `${pagina}:${phone}`;
      }),
    );
    avisosToImport = avisos.filter((a) => {
      const phone = (a.telefonos[0] || '').replace(/\D/g, '').slice(-9);
      return phone && !seen.has(`${String(a.pagina)}:${phone}`);
    });
    if (!avisosToImport.length) {
      console.log(JSON.stringify({ missing: 0 }));
      return;
    }
    const { data: lastScheduled } = await supabaseAdmin
      .from('adisos')
      .select('private_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .contains('private_data', { batch_id: ctx.batchId });
    const lastAt = (lastScheduled?.[0]?.private_data as Record<string, unknown>)?.scheduled_go_live_at;
    if (typeof lastAt === 'string') {
      const t = new Date(lastAt).getTime();
      if (t + intervalMs > baseTime) baseTime = t + intervalMs;
    }
  }

  const rows = avisosToImport.map((item, index) => {
    const scheduledGoLiveAt = new Date(baseTime + index * intervalMs).toISOString();
    const claimToken = nanoid(24);
    return toAdisoFromRuedaExtract(item, ctx, scheduledGoLiveAt, claimToken);
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        edicion: ctx.edicion,
        batch_id: ctx.batchId,
        total: rows.length,
        first_go_live: (rows[0]?.privateData as Record<string, unknown>)?.scheduled_go_live_at,
        last_go_live: (rows[rows.length - 1]?.privateData as Record<string, unknown>)?.scheduled_go_live_at,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log('\n(dry-run — usa --apply para insertar)');
    return;
  }

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25).map(adisoToDb);
    const { error } = await supabaseAdmin.from('adisos').insert(chunk);
    if (error) {
      fail += chunk.length;
      console.error('insert error', error.message);
    } else {
      ok += chunk.length;
      process.stdout.write(`\rinsertados ${ok}/${rows.length}`);
    }
  }
  console.log(`\n✅ Insertados ${ok}, fallidos ${fail}`);

  if (ok > 0) {
    const { backfillOpportunitiesFromBatch } = await import('../../lib/comercial/rueda-sync');
    const crm = await backfillOpportunitiesFromBatch(ctx.batchId, OPS_USER_ID);
    console.log('oportunidades CRM:', crm);
  }

  const contactsPath = path.join(getRuedaOutputDir(ctx.edicion), 'contactos-outreach.csv');
  const lines = [
    'negocio,telefono,url,wa_url,estado,recurrente,prioridad_hoy',
    ...rows.map((r, i) => {
      const url = `https://buscadis.com/a/${r.id}`;
      const msg = encodeURIComponent(
        `Buenas, ya publicamos gratis su aviso de ${r.titulo.slice(0, 60)} en Buscadis: ${url}. Si prefiere retirarlo, me avisa y lo quito al instante. ¿Siguen buscando personal?`,
      );
      const wa = `https://wa.me/51${r.contacto}?text=${msg}`;
      const rec = (r.privateData as Record<string, unknown>).recurrente ? '1' : '0';
      const today = i < 30 ? '1' : '0';
      return `"${r.titulo.replace(/"/g, '""')}",${r.contacto},${url},${wa},sin_contactar,${rec},${today}`;
    }),
  ];
  fs.writeFileSync(contactsPath, lines.join('\n'));
  console.log('contactos:', contactsPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
