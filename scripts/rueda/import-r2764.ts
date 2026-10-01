/**
 * Importa avisos extraídos (inactivos + go-live programado, 1/min).
 *
 *   npx tsx scripts/rueda/extract-edition.ts
 *   npx tsx scripts/rueda/import-r2764.ts --dry-run
 *   npx tsx scripts/rueda/import-r2764.ts --apply
 *   npx tsx scripts/rueda/import-r2764.ts --apply --start-in-minutes=2
 *   npx tsx scripts/rueda/import-r2764.ts --apply --missing-only
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { adisoToDb } from '../../lib/supabase';
import { featuresForTier } from '../../lib/publish/tiers';
import type { Adiso, ContactoMultiple } from '../../types';
import {
  RUEDA_R2764_BATCH_ID,
  RUEDA_R2764_EDICION,
  RUEDA_R2764_FECHA_ORIGINAL,
} from '../../lib/rueda/batch-constants';
import type { RuedaExtractedAd } from './extract-edition';
import { parseUbicacionFromText } from '../../lib/rueda/parse-ubicacion';
import { flyerTemplateForRuedaImport } from '../../lib/rueda/listing-quality';
import type { FlyerTemplateId } from '../../lib/flyer/types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const OPS_USER_ID = process.env.RUEDA_OPS_USER_ID || 'ef81f31b-a11d-4417-9325-e737daaad32e';

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function argNum(name: string, def: number): number {
  const v = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!v) return def;
  return Number(v.split('=')[1]) || def;
}

async function batchExists(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('adisos')
    .select('id')
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID })
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export function toAdiso(
  item: RuedaExtractedAd,
  scheduledGoLiveAt: string,
  claimToken: string
): Adiso {
  const contactos: ContactoMultiple[] = item.telefonos.map((n, idx) => ({
    tipo: item.whatsapp === n || /^9\d{8}$/.test(n) ? 'whatsapp' : 'telefono',
    valor: n,
    principal: idx === 0,
  }));

  const features = featuresForTier('free');
  const id = nanoid(10);
  const ubicacion = parseUbicacionFromText(item.texto_raw || item.descripcion);
  const flyerTemplateId = (item.flyer_template as FlyerTemplateId) ||
    flyerTemplateForRuedaImport(id, item.categoria);

  return {
    id,
    categoria: item.categoria as Adiso['categoria'],
    titulo: item.titulo,
    descripcion: item.descripcion,
    contacto: item.telefonos[0] || '',
    contactosMultiples: contactos,
    ubicacion,
    fechaPublicacion: RUEDA_R2764_FECHA_ORIGINAL,
    horaPublicacion: '00:00',
    tamaño: 'miniatura',
    user_id: OPS_USER_ID,
    usuario_id: OPS_USER_ID,
    estaActivo: false,
    esHistorico: false,
    esGratuito: true,
    fuenteOriginal: 'rueda_negocios',
    edicionNumero: RUEDA_R2764_EDICION,
    fechaPublicacionOriginal: RUEDA_R2764_FECHA_ORIGINAL,
    publishTier: 'free',
    paymentStatus: 'free',
    promotionTier: 'gratis',
    promotionRank: 0,
    contactLocked: false,
    features: features as unknown as Record<string, unknown>,
    privateData: {
      batch_id: RUEDA_R2764_BATCH_ID,
      import_pipeline: 'rueda_claimable',
      import_key: item.import_key,
      pending_owner_transfer: true,
      claim_token: claimToken,
      claim_republish_available: true,
      scheduled_go_live_at: scheduledGoLiveAt,
      import_confidence: item.confianza,
      requiere_revision: item.requiere_revision,
      recurrente: item.recurrente,
      es_empresa: item.es_empresa,
      pagina_revista: item.pagina,
      source_label:
        'Publicado por Buscadis. ¿Eres el anunciante? Reclámalo o retíralo.',
      coverSource: 'template',
      flyerTemplateId,
      flyerConfig: {},
      hide_generic_location: item.hide_generic_location,
      noindex_until_claimed: true,
    },
  };
}

async function main() {
  const dryRun = !hasFlag('--apply');
  const startInMinutes = argNum('start-in-minutes', 1);
  const intervalMs = argNum('interval-seconds', 60) * 1000;

  const jsonPath = path.join(process.cwd(), 'output', 'rueda', RUEDA_R2764_EDICION, 'avisos.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Ejecuta primero: npx tsx scripts/rueda/extract-edition.ts');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
    avisos: RuedaExtractedAd[];
    total_avisos: number;
  };

  const avisos = payload.avisos.sort((a, b) => a.pagina - b.pagina || a.titulo.localeCompare(b.titulo));
  const baseTime = Date.now() + startInMinutes * 60 * 1000;

  const missingOnly = hasFlag('--missing-only');
  if (!missingOnly && (await batchExists())) {
    console.log(JSON.stringify({ skipped: true, reason: 'batch_already_imported', batch: RUEDA_R2764_BATCH_ID }));
    if (!dryRun) process.exit(0);
  }

  let avisosToImport = avisos;
  if (missingOnly) {
    const { data: existing } = await supabaseAdmin
      .from('adisos')
      .select('private_data')
      .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID });
    const keys = new Set(
      (existing || [])
        .map((r) => (r.private_data as Record<string, unknown>)?.import_key)
        .filter(Boolean) as string[],
    );
    avisosToImport = avisos.filter((a) => !keys.has(a.import_key));
    if (!avisosToImport.length) {
      console.log(JSON.stringify({ missing: 0 }));
      return;
    }
    const { data: lastScheduled } = await supabaseAdmin
      .from('adisos')
      .select('private_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID });
    const lastAt = (lastScheduled?.[0]?.private_data as Record<string, unknown>)?.scheduled_go_live_at;
    if (typeof lastAt === 'string') {
      const t = new Date(lastAt).getTime();
      if (t + intervalMs > baseTime) baseTime = t + intervalMs;
    }
  }

  const rows = avisosToImport.map((item, index) => {
    const scheduledGoLiveAt = new Date(baseTime + index * intervalMs).toISOString();
    const claimToken = nanoid(24);
    return toAdiso(item, scheduledGoLiveAt, claimToken);
  });

  const sample = rows
    .sort(() => Math.random() - 0.5)
    .slice(0, 20)
    .map((r) => ({
      titulo: r.titulo,
      telefono: r.contacto,
      pagina: (r.privateData as Record<string, unknown>).pagina_revista,
      go_live: (r.privateData as Record<string, unknown>).scheduled_go_live_at,
    }));

  console.log(
    JSON.stringify(
      {
        dryRun,
        total: rows.length,
        first_go_live: (rows[0]?.privateData as Record<string, unknown>)?.scheduled_go_live_at,
        last_go_live: (rows[rows.length - 1]?.privateData as Record<string, unknown>)?.scheduled_go_live_at,
        sample_qa: sample,
      },
      null,
      2
    )
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

  const contactsPath = path.join(process.cwd(), 'output', 'rueda', RUEDA_R2764_EDICION, 'contactos-outreach.csv');
  const lines = [
    'negocio,telefono,url,wa_url,estado,recurrente,prioridad_hoy',
    ...rows.map((r, i) => {
      const url = `https://buscadis.com/a/${r.id}`;
      const msg = encodeURIComponent(
        `Buenas, ya publicamos gratis su aviso de ${r.titulo.slice(0, 60)} en Buscadis: ${url}. Si prefiere retirarlo, me avisa y lo quito al instante. ¿Siguen buscando personal?`
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
