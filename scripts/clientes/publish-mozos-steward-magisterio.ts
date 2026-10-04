/**
 * Plan destacado S/15 · 7 días — Mozos(as) y steward (Urb. Magisterio).
 *
 *   npx tsx scripts/clientes/publish-mozos-steward-magisterio.ts
 *   npx tsx scripts/clientes/publish-mozos-steward-magisterio.ts --dry-run
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

const BATCH_ID = 'cliente-mozos-steward-magisterio-2026-10';
const CLIENT_LABEL = 'Restaurante — Urb. Magisterio';
const EMAIL = 'mozos984646887@anunciantes.buscadis.com';
const WHATSAPP = '984646887';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

const FECHA_PUB = '2026-10-04';
const HORA_PUB = '13:30';
const PROMOTED_AT = '2026-10-04T13:30:00-05:00';
const EXPIRES = '2026-10-11T23:59:59-05:00';
const REBOOST_AT = '2026-10-07T14:00:00-05:00';

const FLYER_FILE = path.join(
  process.cwd(),
  'docs/clientes/mozos-steward-magisterio/media/flyer-mozos-steward.jpg',
);

const TITULO = 'Mozos(as) y steward | Urb. Magisterio, Cusco';

const DESCRIPCION = [
  '¡Estamos buscando mozos(as) y steward para nuestro equipo!',
  '',
  'Horarios disponibles:',
  '• Turno 12:30 p. m. a 9:30 p. m.',
  '• Turno 11:00 a. m. a 8:00 p. m.',
  '',
  'Local en Urb. Magisterio, Av. Alfredo Yepez G-4 (a espaldas del BCP), Cusco.',
  'Sueldo: a tratar en entrevista.',
  '',
  'Postular: enviar mensaje o CV al WhatsApp 984 646 887.',
].join('\n');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

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
  const storagePath = `${userId}/adisos/mozos-steward-magisterio-${Date.now()}.jpg`;

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
    console.log(JSON.stringify({ skipped: true, reason: 'already_published', existing }, null, 2));
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          batch: BATCH_ID,
          titulo: TITULO,
          plan: 'destacada_7d_15_pen',
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
      { tipo: 'whatsapp', valor: WHATSAPP, principal: true, etiqueta: 'WhatsApp' },
    ],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: 'Urb. Magisterio, Av. Alfredo Yepez G-4 (a espaldas del BCP)',
      latitud: -13.5218,
      longitud: -71.9589,
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
      paid_days: 7,
      total_amount: 15,
      moneda: 'PEN',
      interest_campaign: true,
      story_priority: true,
    },
    atributos: {
      negocio: CLIENT_LABEL,
      empleos_jornada: 'completo',
      empleos_modalidad: 'presencial',
      areas: ['Mozos(as)', 'Steward'],
      plan: 'destacado_7d_15',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_whatsapp: WHATSAPP,
      plan_amount_pen: 15,
      plan_days: 7,
      plan_start: FECHA_PUB,
      plan_end: '2026-10-11',
      promotion_bumps: [
        {
          at: new Date(REBOOST_AT).toISOString(),
          kind: 'day_3_repost',
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
        qrHint: 'Abrir shareUrl en móvil → Compartir → QR del navegador',
        empleos: `${SITE}/?categoria=empleos`,
        story: true,
        searchIndex: true,
        reboostScheduled: REBOOST_AT,
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
