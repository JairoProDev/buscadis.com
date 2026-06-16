/**
 * Publica avisos de empleo Eco Terra Lodge (6 vacantes + 1 captador).
 *
 * Uso:
 *   npx tsx scripts/seed-eco-terra-jobs.ts
 *   npx tsx scripts/seed-eco-terra-jobs.ts --dry-run
 *
 * Transferir al cliente real cuando tenga cuenta:
 *   npx tsx scripts/transfer-adisos-owner.ts --batch eco-terra-jobs-2026-06 --email cliente@ejemplo.com
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { generarIdUnico } from '../lib/utils';
import { applyPaidTierToAdiso } from '../lib/publish/paid-publish';
import { onAdisoSearchIndexUpdate } from '../lib/search/post-create';
import type { Adiso, TamañoPaquete } from '../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface JobData {
  clientName: string;
  clientSlug: string;
  batchId: string;
  ownerEmail: string;
  contactWhatsapp: string;
  contactDisplay: string;
  ubicacion: {
    pais: string;
    departamento: string;
    provincia: string;
    distrito: string;
    direccion?: string;
  };
  packageTier: TamañoPaquete;
  jobs: { slug: string; titulo: string; descripcion: string }[];
  aggregator: { slug: string; titulo: string; descripcion: string };
}

async function findUserIdByEmail(email: string): Promise<string> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  let page = 1;
  const perPage = 200;
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  throw new Error(`Usuario no encontrado: ${email}`);
}

async function batchExists(batchId: string): Promise<boolean> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('id')
    .contains('private_data', { batch_id: batchId })
    .limit(1);
  if (error) {
    console.warn('No se pudo verificar batch existente:', error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

function buildAdiso(
  input: { slug: string; titulo: string; descripcion: string },
  userId: string,
  data: JobData,
  extraPrivate: Record<string, unknown> = {}
): Adiso {
  const now = new Date();
  const fecha = now.toISOString().split('T')[0];
  const hora = now.toTimeString().slice(0, 5);
  const ubicacionString = `${data.ubicacion.distrito}, ${data.ubicacion.provincia}, ${data.ubicacion.departamento}`;

  const base: Adiso = {
    id: generarIdUnico(),
    categoria: 'empleos',
    titulo: input.titulo.slice(0, 120),
    descripcion: input.descripcion.slice(0, 2000),
    contacto: data.contactWhatsapp,
    contactosMultiples: [
      {
        tipo: 'whatsapp',
        valor: data.contactWhatsapp,
        principal: true,
        etiqueta: 'Postular',
      },
    ],
    ubicacion: {
      pais: data.ubicacion.pais,
      departamento: data.ubicacion.departamento,
      provincia: data.ubicacion.provincia,
      distrito: data.ubicacion.distrito,
      direccion: data.ubicacion.direccion,
    },
    fechaPublicacion: fecha,
    horaPublicacion: hora,
    tamaño: data.packageTier,
    usuario_id: userId,
    user_id: userId,
    estaActivo: true,
    esHistorico: false,
    esGratuito: false,
    precio: 1500,
    moneda: 'PEN',
    tipoPrecio: 'mensual',
    publishTier: 'paid',
  };

  return applyPaidTierToAdiso(base, data.packageTier, {
    batch_id: data.batchId,
    pending_owner_transfer: true,
    client_name: data.clientName,
    client_slug: data.clientSlug,
    job_slug: input.slug,
    contact_whatsapp: data.contactWhatsapp,
    contact_display: data.contactDisplay,
    seeded_by: 'scripts/seed-eco-terra-jobs.ts',
    seeded_at: now.toISOString(),
    ubicacion_string: ubicacionString,
    ...extraPrivate,
  });
}

function adisoToDbRow(adiso: Adiso) {
  const u = adiso.ubicacion as {
    pais?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    direccion?: string;
  };
  const ubicacionString =
    typeof adiso.ubicacion === 'string'
      ? adiso.ubicacion
      : `${u.distrito || ''}, ${u.provincia || ''}, ${u.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');

  const row: Record<string, unknown> = {
    id: adiso.id,
    categoria: adiso.categoria,
    titulo: adiso.titulo,
    descripcion: adiso.descripcion || '',
    contacto: adiso.contacto,
    ubicacion: ubicacionString,
    fecha_publicacion: adiso.fechaPublicacion,
    hora_publicacion: adiso.horaPublicacion,
    tamaño: adiso.tamaño,
    imagenes_urls: adiso.imagenesUrls ? JSON.stringify(adiso.imagenesUrls) : null,
    imagen_url: adiso.imagenUrl || null,
    esta_activo: true,
    es_historico: false,
    publish_tier: 'paid',
    features: adiso.features || {},
    private_data: adiso.privateData || {},
    user_id: adiso.user_id,
    contactos_multiples: adiso.contactosMultiples?.length
      ? JSON.stringify(adiso.contactosMultiples)
      : null,
  };

  if (u.departamento) {
    row.pais = u.pais || 'Perú';
    row.departamento = u.departamento;
    row.provincia = u.provincia || null;
    row.distrito = u.distrito || null;
    if (u.direccion) row.direccion = u.direccion;
  }

  return row;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const dataPath = path.join(__dirname, 'data', 'eco-terra-jobs.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as JobData;

  console.log('Eco Terra Lodge — publicación de avisos');
  console.log(`Batch: ${data.batchId}`);
  console.log(`Owner placeholder: ${data.ownerEmail}`);

  if (await batchExists(data.batchId)) {
    console.log('⚠️  Ya existen avisos con este batch_id. Abortando para evitar duplicados.');
    console.log('   Para transferir: npx tsx scripts/transfer-adisos-owner.ts --batch', data.batchId, '--email NUEVO@EMAIL');
    process.exit(0);
  }

  const userId = await findUserIdByEmail(data.ownerEmail);
  console.log(`Usuario encontrado: ${userId}`);

  const created: { slug: string; id: string; titulo: string }[] = [];

  for (const job of data.jobs) {
    const adiso = buildAdiso(job, userId, data);
    created.push({ slug: job.slug, id: adiso.id, titulo: adiso.titulo });
    console.log(`\n→ ${job.slug}`);
    console.log(`  ID: ${adiso.id}`);
    console.log(`  Título (${adiso.titulo.length} chars): ${adiso.titulo}`);

    if (dryRun) continue;

    const { supabaseAdmin } = await import('../lib/supabase-admin');
    const { error } = await supabaseAdmin.from('adisos').insert(adisoToDbRow(adiso));
    if (error) {
      console.error('  Error:', error.message);
      throw error;
    }
    onAdisoSearchIndexUpdate(adiso);
    console.log('  ✓ Publicado');
  }

  const relatedIds = created.map((c) => c.id);
  const aggregator = buildAdiso(data.aggregator, userId, data, {
    is_aggregator: true,
    related_adiso_ids: relatedIds,
    related_slugs: data.jobs.map((j) => j.slug),
  });
  created.unshift({ slug: data.aggregator.slug, id: aggregator.id, titulo: aggregator.titulo });

  console.log(`\n→ ${data.aggregator.slug} (captador)`);
  console.log(`  ID: ${aggregator.id}`);

  if (!dryRun) {
    const { supabaseAdmin } = await import('../lib/supabase-admin');
    const { error } = await supabaseAdmin.from('adisos').insert(adisoToDbRow(aggregator));
    if (error) throw error;
    onAdisoSearchIndexUpdate(aggregator);
    console.log('  ✓ Publicado');
  }

  console.log('\n--- Resumen ---');
  for (const c of created) {
    console.log(`  ${c.slug}: ${c.id}`);
  }

  if (dryRun) {
    console.log('\n(dry-run — no se insertó nada en la base de datos)');
  } else {
    console.log('\nPara transferir al cliente real:');
    console.log(`  npx tsx scripts/transfer-adisos-owner.ts --batch ${data.batchId} --email EMAIL_DEL_CLIENTE`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
