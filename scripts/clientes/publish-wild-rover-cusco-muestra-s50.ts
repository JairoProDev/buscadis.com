/**
 * Muestra plan S/50 (pago pendiente) — Wild Rover Hostel Cusco, Estefanía (RRHH).
 * Flyer del cliente; redes/grupos tras confirmar pago.
 *
 *   npx tsx scripts/clientes/publish-wild-rover-cusco-muestra-s50.ts
 *   npx tsx scripts/clientes/publish-wild-rover-cusco-muestra-s50.ts --dry-run
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from '../../lib/storage-buckets';
import { adisoToDb } from '../../lib/supabase';
import { getAdisoUrl } from '../../lib/url';
import { featuresForTier } from '../../lib/publish/tiers';
import type { Adiso } from '../../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-wild-rover-cusco-2026-10';
const CLIENT_LABEL = 'Wild Rover Hostel — Cusco';
const EMAIL = 'cuscojobs@wildroverhostels.com';
const WHATSAPP = '974442205';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

const FECHA_PUB = '2026-10-06';
const HORA_PUB = '12:00';
const PROMOTED_AT = '2026-10-06T12:00:00-05:00';
const EXPIRES = '2026-11-05T23:59:59-05:00';

const FLYER_FILE = path.join(
  process.cwd(),
  'docs/clientes/wild-rover-cusco-estefania/media/flyer-wild-rover-cusco-oct-2026.jpg',
);

const TITULO =
  'Wild Rover Hostel Cusco | Asistentes cocina, housekeeping, mozos bar y mantenimiento';

const DESCRIPCION = [
  '¡Únete al equipo de Wild Rover Hostel en Cusco! Buscamos personal con ganas de aprender y pertenecer al grupo.',
  '',
  'Se ofrece:',
  '• Sueldo acorde al mercado',
  '• Todos los beneficios de ley',
  '• Excelente ambiente laboral',
  '',
  'Vacantes:',
  '• 02 Asistentes de cocina — turno tarde',
  '• 01 Housekeeping — turno mañana',
  '• 01 Housekeeping — turno tarde',
  '• 03 Mozos / bar — turno noche',
  '• 01 Mantenimiento — turno mañana',
  '',
  'Postular:',
  'Presentar CV en Cuesta de Santa Ana Nº 782 (frente al templo Santa Ana, Cusco) o enviar CV indicando el puesto en el asunto.',
  '',
  'WhatsApp RRHH: 974 442 205',
  'Email: cuscojobs@wildroverhostels.com · jobs@wildroverhostels.com',
].join('\n');

async function getAdmin() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  return supabaseAdmin;
}

async function findExistingBatch() {
  const admin = await getAdmin();
  const { data } = await admin
    .from('adisos')
    .select('id, titulo')
    .contains('private_data', { batch_id: BATCH_ID });
  return data || [];
}

async function ensureUser(): Promise<{ id: string; created: boolean }> {
  const admin = await getAdmin();
  const stubEmail = 'wildrover974442205@anunciantes.buscadis.com';
  const { data: profile } = await admin.from('profiles').select('id').eq('email', stubEmail).maybeSingle();
  if (profile?.id) return { id: profile.id, created: false };

  const password = nanoid(18);
  const created = await admin.auth.admin.createUser({
    email: stubEmail,
    email_confirm: true,
    password,
    user_metadata: { nombre: CLIENT_LABEL, full_name: CLIENT_LABEL, rol: 'anunciante' },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || 'No se pudo crear usuario');
  }
  const id = created.data.user.id;
  await admin.from('profiles').upsert(
    {
      id,
      email: stubEmail,
      nombre: CLIENT_LABEL,
      telefono: WHATSAPP,
      rol: 'anunciante',
    },
    { onConflict: 'id' },
  );
  return { id, created: true };
}

async function uploadFlyer(userId: string): Promise<string> {
  if (!fs.existsSync(FLYER_FILE)) {
    throw new Error(`Falta flyer: ${FLYER_FILE}`);
  }
  const admin = await getAdmin();
  const buffer = fs.readFileSync(FLYER_FILE);
  const storagePath = `${userId}/adisos/wild-rover-cusco-${Date.now()}.jpg`;

  for (const bucket of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error } = await admin.storage.from(bucket).upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });
    if (!error) {
      return admin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    }
  }
  throw new Error('No se pudo subir el flyer');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const existing = await findExistingBatch();
  if (existing.length > 0) {
    const id = existing[0].id;
    const shareUrl = `${SITE}${getAdisoUrl({ id, titulo: existing[0].titulo || TITULO, categoria: 'empleos' })}`;
    console.log(JSON.stringify({ skipped: true, existing, shareUrl }, null, 2));
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, batch: BATCH_ID, plan: 'S/50 muestra pago pendiente' }, null, 2));
    return;
  }

  const user = await ensureUser();
  const imageUrl = await uploadFlyer(user.id);
  const features = featuresForTier('paid', 'mediano');
  const id = nanoid(10);

  const adiso: Adiso = {
    id,
    categoria: 'empleos',
    subcategoria: 'gastronomia',
    titulo: TITULO.slice(0, 120),
    descripcion: DESCRIPCION.slice(0, 2000),
    contacto: WHATSAPP,
    contactosMultiples: [
      { tipo: 'whatsapp', valor: WHATSAPP, principal: true, etiqueta: 'RRHH WhatsApp' },
      { tipo: 'telefono', valor: WHATSAPP, principal: false, etiqueta: 'Cel. RRHH' },
      { tipo: 'email', valor: 'cuscojobs@wildroverhostels.com', principal: false, etiqueta: 'CV Cusco' },
      { tipo: 'email', valor: 'jobs@wildroverhostels.com', principal: false, etiqueta: 'CV general' },
    ],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: 'Cuesta de Santa Ana Nº 782, frente al templo Santa Ana',
      latitud: -13.5167,
      longitud: -71.9785,
    },
    fechaPublicacion: FECHA_PUB,
    horaPublicacion: HORA_PUB,
    tamaño: 'mediano',
    imagenUrl: imageUrl,
    imagenesUrls: [imageUrl],
    user_id: user.id,
    usuario_id: user.id,
    estaActivo: true,
    esHistorico: false,
    fuenteOriginal: 'usuario',
    fechaExpiracion: EXPIRES,
    expiresAt: EXPIRES,
    publishTier: 'paid',
    paymentStatus: 'pending',
    promotionTier: 'destacada',
    promotionRank: 1,
    promotionExpiresAt: EXPIRES,
    promotedAt: PROMOTED_AT,
    tipoPrecio: 'a_convenir',
    moneda: 'PEN',
    features: {
      ...(features as unknown as Record<string, unknown>),
      plan_comercial: 'destacado',
      paid_days: 30,
      total_amount: 50,
      moneda: 'PEN',
      interest_campaign: true,
      story_priority: true,
    },
    atributos: {
      negocio: CLIENT_LABEL,
      empleos_jornada: 'completo',
      empleos_modalidad: 'presencial',
      areas: [
        'Asistente de cocina',
        'Housekeeping',
        'Mozos bar',
        'Mantenimiento',
      ],
      plan: 'destacado_30d_50_muestra',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_name: 'Estefanía (RRHH)',
      contact_whatsapp: WHATSAPP,
      client_docs_path: 'docs/clientes/wild-rover-cusco-estefania',
      plan_amount_pen: 50,
      plan_days: 30,
      plan_start: FECHA_PUB,
      plan_end: '2026-11-05',
      muestra_plan_s50: true,
      social_diffusion_hold: true,
      payment_note: 'Muestra web oct 6 — flyer cliente; redes tras Yape',
      campaign_ref: 'rueda-oct-2026',
    },
  };

  const admin = await getAdmin();
  const row = {
    ...adisoToDb(adiso),
    promotion_tier: 'destacada',
    promotion_rank: 1,
    promotion_expires_at: EXPIRES,
    promoted_at: PROMOTED_AT,
  };

  const { error } = await admin.from('adisos').insert(row);
  if (error) throw new Error(error.message);

  const { onAdisoSearchIndexUpdate } = await import('../../lib/search/post-create');
  const { generateAndStoreEmbedding } = await import('../../lib/ai/embeddings');

  onAdisoSearchIndexUpdate(adiso);
  try {
    await generateAndStoreEmbedding(adiso.id);
  } catch (e) {
    console.warn('[embedding]', e);
  }

  try {
    const { syncPaidClientAdisoToCrm } = await import('../../lib/comercial/paid-client-sync');
    await syncPaidClientAdisoToCrm(adiso.id, user.id);
  } catch (e) {
    console.warn('[crm]', e);
  }

  const sharePath = getAdisoUrl(adiso);
  const shareUrl = `${SITE}${sharePath}`;

  console.log(
    JSON.stringify(
      {
        published: true,
        adisoId: id,
        shareUrl,
        sharePath,
        paymentStatus: 'pending',
        social_hold: true,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
