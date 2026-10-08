/**
 * Tras import --apply: CRM backfill + CSV contacto con URLs y reclamar reales.
 *
 *   npx tsx scripts/rueda/post-import-edition.ts --edicion=R2766
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { resolveEditionRunContext } from '../../lib/rueda/batch';
import { OPS_USER_ID } from '../../lib/rueda/import-run';
import { outreachToCsv } from '../../lib/rueda/outreach';
import { getRuedaOutputDir } from '../../lib/rueda/paths';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const edicion = arg('edicion');
  if (!edicion) {
    console.error('Requiere --edicion=');
    process.exit(1);
  }
  const ctx = resolveEditionRunContext({ edicion });
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { backfillOpportunitiesFromBatch } = await import('../../lib/comercial/rueda-sync');

  const { data: rows, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, contacto, private_data')
    .contains('private_data', { batch_id: ctx.batchId });
  if (error) throw new Error(error.message);

  const crm = await backfillOpportunitiesFromBatch(ctx.batchId, OPS_USER_ID);

  const csvRows = (rows || []).map((row) => {
    const priv = (row.private_data || {}) as Record<string, unknown>;
    const token = String(priv.claim_token || '');
    const phone = String(row.contacto || '').replace(/\D/g, '').slice(-9);
    const urlAviso = `https://buscadis.com/a/${row.id}`;
    const urlReclamar = token ? `https://buscadis.com/reclamar/${token}` : '';
    const msg = encodeURIComponent(
      `Hola, publicamos gratis su aviso en Buscadis: ${urlAviso}. Reclámelo aquí: ${urlReclamar}`,
    );
    return {
      edicion,
      pagina: Number(priv.pagina_revista || 0),
      titulo: String(row.titulo || ''),
      telefono: phone,
      url_aviso: urlAviso,
      url_reclamar: urlReclamar,
      wa_url: phone ? `https://wa.me/51${phone}?text=${msg}` : '',
      estado: 'importado_pendiente_contacto',
      requiere_revision: Boolean(priv.requiere_revision),
      import_key: String(priv.import_key || ''),
    };
  });

  const out = path.join(
    getRuedaOutputDir(edicion),
    `contacto-anunciantes-${edicion}-LISTO.csv`,
  );
  fs.writeFileSync(out, outreachToCsv(csvRows), 'utf8');

  console.log(JSON.stringify({ out, adisos: csvRows.length, crm }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
