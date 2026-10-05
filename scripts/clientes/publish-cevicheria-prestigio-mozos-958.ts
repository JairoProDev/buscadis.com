/**
 * Plan destacado S/50 · 30 días — Mozos/as y ayudantes de cocina (cevichería de prestigio).
 * Conteo desde 6 oct 2026 (día extra acordado con cliente).
 *
 *   npx tsx scripts/clientes/publish-cevicheria-prestigio-mozos-958.ts
 *   npx tsx scripts/clientes/publish-cevicheria-prestigio-mozos-958.ts --dry-run
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

const BATCH_ID = 'cliente-cevicheria-prestigio-mozos-ayudantes-2026-10';
const CLIENT_LABEL = 'Cevichería de prestigio';
const EMAIL = 'cevicheria958110360@anunciantes.buscadis.com';
const WHATSAPP = '958110360';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

const FECHA_PUB = '2026-10-06';
const HORA_PUB = '08:30';
const PROMOTED_AT = '2026-10-06T08:30:00-05:00';
const EXPIRES = '2026-11-05T23:59:59-05:00';
const REBOOST_AT = '2026-10-13T10:00:00-05:00';

const FLYER_FILE = path.join(
  process.cwd(),
  'docs/clientes/cevicheria-prestigio-mozos-ayudantes/media/flyer-mozos-ayudantes.jpg',
);

const TITULO = 'Mozos/as y ayudantes de cocina | Cevichería de prestigio, Cusco';

const DESCRIPCION = [
  'Cevichería de prestigio en Cusco busca personal con experiencia comprobada.',
  '',
  'Vacantes:',
  '• 3 mozos/as',
  '• 3 ayudantes de cocina',
  '',
  'Requisitos:',
  '• Experiencia mínima comprobada.',
  '• Disponibilidad de lunes a domingo.',
  '• Vocación de servicio y puntualidad.',
  '',
  'Se ofrece:',
  '• Ingreso a planilla desde el primer día.',
  '• Remuneración desde S/ 350 semanales (a más según desempeño).',
  '• Descanso semanal (1 día por semana).',
  '',
  'Horario: lunes a domingo, 8:30 a. m. a 5:00 p. m.',
  'Zona: Wanchaq, Cusco (tres locales en la ciudad).',
  '',
  'Postular: enviar CV o mensaje al WhatsApp 958 110 360.',
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

async function ensureUser(): Promise<{ id: string; created: boolean; password?: string }> {
  const admin = await getAdmin();
  const { data: profile } = await admin.from('profiles').select('id').eq('email', EMAIL).maybeSingle();
  if (profile?.id) return { id: profile.id, created: false };

  const password = nanoid(18);
  const created = await admin.auth.admin.createUser({
    email: EMAIL,
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
      email: EMAIL,
      nombre: CLIENT_LABEL,
      telefono: WHATSAPP,
      rol: 'anunciante',
    },
    { onConflict: 'id' },
  );
  return { id, created: true, password };
}

async function uploadFlyer(userId: string): Promise<string> {
  if (!fs.existsSync(FLYER_FILE)) {
    throw new Error(`Falta flyer: ${FLYER_FILE}`);
  }
  const admin = await getAdmin();
  const buffer = fs.readFileSync(FLYER_FILE);
  const storagePath = `${userId}/adisos/cevicheria-mozos-ayudantes-${Date.now()}.jpg`;

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

async function insertStory(userId: string, adiso: Adiso, imageUrl: string) {
  const admin = await getAdmin();
  const publicPath = getAdisoUrl(adiso);
  const { error } = await admin.from('stories').insert({
    user_id: userId,
    media_url: imageUrl,
    media_type: 'image',
    caption: adiso.titulo,
    categoria: adiso.categoria,
    adiso_id: adiso.id,
    promotion_tier: 'destacada',
    objective: 'contactos',
    source: 'adiso_auto',
    cta_url: `${SITE}${publicPath}`,
    status: 'active',
    visible_until: EXPIRES,
    expires_at: EXPIRES,
    sort_order: 0,
  });
  if (error) throw new Error(`story: ${error.message}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const existing = await findExistingBatch();
  if (existing.length > 0) {
    const id = existing[0].id;
    const shareUrl = `${SITE}${getAdisoUrl({ id, titulo: existing[0].titulo || TITULO, categoria: 'empleos' })}`;
    console.log(JSON.stringify({ skipped: true, reason: 'already_published', existing, shareUrl }, null, 2));
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          batch: BATCH_ID,
          titulo: TITULO,
          plan: 'destacada_30d_50_pen',
          expires: EXPIRES,
        },
        null,
        2,
      ),
    );
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
      { tipo: 'whatsapp', valor: WHATSAPP, principal: true, etiqueta: 'WhatsApp / CV' },
    ],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Wanchaq',
      direccion: 'Cusco — Wanchaq (varios locales)',
      latitud: -13.5312,
      longitud: -71.9678,
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
    paymentStatus: 'verified',
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
      areas: ['Mozos(as)', 'Ayudante de cocina'],
      plan: 'destacado_30d_50',
      empleos_sueldo: '350+ semanal',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_whatsapp: WHATSAPP,
      client_docs_path: 'docs/clientes/cevicheria-prestigio-mozos-ayudantes',
      plan_amount_pen: 50,
      plan_days: 30,
      plan_start: FECHA_PUB,
      plan_end: '2026-11-05',
      factura_ruc: '10238972731',
      factura_titular: 'Adelaida Mamani Quispe',
      payment_note: 'Yape pendiente tras revisión web — acordado 5 oct',
      promotion_bumps: [
        {
          at: new Date(REBOOST_AT).toISOString(),
          kind: 'day_7_repost',
          story: true,
        },
      ],
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
  const { runInstantMatchCampaign } = await import('../../lib/activation/instant-match');

  onAdisoSearchIndexUpdate(adiso);
  try {
    await generateAndStoreEmbedding(adiso.id);
  } catch (e) {
    console.warn('[embedding]', e);
  }
  await insertStory(user.id, adiso, imageUrl);

  try {
    const { prewarmStoryCoverForAdiso } = await import('../../lib/stories/prewarm-cover');
    await prewarmStoryCoverForAdiso(adiso.id, user.id);
  } catch (e) {
    console.warn('[prewarm]', e);
  }

  try {
    const { syncPaidClientAdisoToCrm } = await import('../../lib/comercial/paid-client-sync');
    await syncPaidClientAdisoToCrm(adiso.id, user.id);
  } catch (e) {
    console.warn('[crm]', e);
  }

  try {
    await runInstantMatchCampaign({
      adisoId: adiso.id,
      advertiserUserId: user.id,
      titulo: adiso.titulo,
      descripcion: adiso.descripcion,
      categoria: adiso.categoria,
      ubicacion: adiso.ubicacion as unknown as Record<string, unknown>,
    });
  } catch (e) {
    console.warn('[instant-match]', e);
  }

  const sharePath = getAdisoUrl(adiso);
  const shareUrl = `${SITE}${sharePath}`;

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });

  console.log(
    JSON.stringify(
      {
        published: true,
        userId: user.id,
        accountCreated: user.created,
        adisoId: id,
        shareUrl,
        sharePath,
        empleos: `${SITE}/?categoria=empleos`,
        story: true,
        searchIndex: true,
        magicLink: link.data?.properties?.action_link || null,
        adiso: { titulo: adiso.titulo, promotionTier: adiso.promotionTier },
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
