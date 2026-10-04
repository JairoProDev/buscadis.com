/**
 * Plan destacado S/30 · 7 días — Supervisor de ventas (cooperativa).
 * Vigencia desde 4 oct 2026; resubida programada día 3 (7 oct).
 *
 *   npx tsx scripts/clientes/publish-cooperativa-supervisor-ventas.ts
 *   npx tsx scripts/clientes/publish-cooperativa-supervisor-ventas.ts --dry-run
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from '../../lib/storage-buckets';
import { adisoToDb } from '../../lib/supabase';
import { featuresForTier } from '../../lib/publish/tiers';
import type { Adiso } from '../../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-cooperativa-supervisor-ventas-2026-10';
const CLIENT_LABEL = 'Cooperativa de Ahorro y Crédito';
const EMAIL = 'supervisorventas932133383@anunciantes.buscadis.com';
const WHATSAPP = '932133383';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

/** Inicio campaña: 4 oct 2026 (Lima). Fin: 11 oct 23:59 Lima. */
const FECHA_PUB = '2026-10-04';
const HORA_PUB = '09:00';
const PROMOTED_AT = '2026-10-04T14:00:00-05:00';
const EXPIRES = '2026-10-11T23:59:59-05:00';
const REBOOST_AT = '2026-10-07T14:00:00-05:00';

const FLYER_FILE = path.join(
  process.cwd(),
  'docs/clientes/cooperativa-supervisor-ventas/media/flyer-supervisor-ventas.jpg',
);

const TITULO = 'Supervisor de ventas — créditos por convenio | Cooperativa';

const DESCRIPCION = [
  'Importante cooperativa de ahorro y crédito busca Supervisor de Ventas para liderar un equipo enfocado en créditos por convenio.',
  '',
  'Requisitos:',
  '• Experiencia mínima de 1 año en puestos similares.',
  '• Orientación a metas, liderazgo de equipo y atención al cliente.',
  '',
  'Se ofrece:',
  '• Planilla directa.',
  '• Sueldo básico + comisiones + bonos.',
  '',
  'Zona: Cusco (consultar sede en entrevista).',
  'Postular: enviar CV al WhatsApp 932 133 383.',
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
  const storagePath = `${userId}/adisos/cooperativa-supervisor-ventas-${Date.now()}.jpg`;

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
  const publicPath = `/a/${adiso.id}/${slugify(adiso.titulo)}`;
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
          promotedAt: PROMOTED_AT,
          expires: EXPIRES,
          reboostAt: REBOOST_AT,
          plan: 'destacada_7d_30_pen',
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
    subcategoria: 'ventas',
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
      distrito: 'Cusco',
      direccion: 'Cusco — sede a confirmar en entrevista',
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
      total_amount: 30,
      moneda: 'PEN',
      interest_campaign: true,
      story_priority: true,
    },
    atributos: {
      negocio: CLIENT_LABEL,
      empleos_jornada: 'completo',
      empleos_modalidad: 'presencial',
      puesto: 'supervisor de ventas',
      plan: 'destacado_7d',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_whatsapp: WHATSAPP,
      plan_amount_pen: 30,
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

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });

  console.log(
    JSON.stringify(
      {
        published: true,
        userId: user.id,
        accountCreated: user.created,
        temporaryPassword: user.password || null,
        adisoId: id,
        url: `${SITE}/a/${id}`,
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
