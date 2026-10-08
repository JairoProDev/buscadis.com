/**
 * Black Llama Hostel — bar centro histórico. Plan S/50 pagado (Yape).
 * Contacto postulantes: 912403101. Comercial Antu: 955009160 (solo private).
 *
 *   npx tsx scripts/clientes/publish-black-llama-bar-pagado-s50.ts
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

const BATCH_ID = 'cliente-black-llama-bar-2026-10';
const CLIENT_LABEL = 'Black Llama Hostel';
const WHATSAPP = '912403101';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

const FECHA_PUB = '2026-10-08';
const HORA_PUB = '09:30';
const PROMOTED_AT = '2026-10-08T09:30:00-05:00';
const EXPIRES = '2026-11-07T23:59:59-05:00';

const FLYER_FILE = path.join(
  process.cwd(),
  'docs/clientes/black-llama-hostel-antu/media/flyer-black-llama-bar-oct-2026.jpg',
);

const TITULO = 'Black Llama Hostel | Mozo, bartender, limpieza y seguridad — centro histórico';

const DESCRIPCION = [
  'Black Llama Hostel busca personal para su bar en el centro histórico de Cusco (zona Mesón de la Estrella).',
  '',
  'Vacantes:',
  '• Mozo/a de servicio — turno tarde/noche',
  '• Bartender — turno noche',
  '• Personal de limpieza — turno rotativo de día',
  '• Seguridad (con o sin experiencia) — turno rotativo',
  '',
  'En planilla, con beneficios de ley.',
  '',
  'Informes y CV por WhatsApp: 912 403 101',
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

async function ensureUser(): Promise<{ id: string }> {
  const admin = await getAdmin();
  const stubEmail = 'blackllama912403101@anunciantes.buscadis.com';
  const { data: profile } = await admin.from('profiles').select('id').eq('email', stubEmail).maybeSingle();
  if (profile?.id) return { id: profile.id };

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
    { id, email: stubEmail, nombre: CLIENT_LABEL, telefono: WHATSAPP, rol: 'anunciante' },
    { onConflict: 'id' },
  );
  return { id };
}

async function uploadFlyer(userId: string): Promise<string> {
  if (!fs.existsSync(FLYER_FILE)) throw new Error(`Falta flyer: ${FLYER_FILE}`);
  const admin = await getAdmin();
  const buffer = fs.readFileSync(FLYER_FILE);
  const storagePath = `${userId}/adisos/black-llama-bar-${Date.now()}.jpg`;

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
  const existing = await findExistingBatch();
  if (existing.length > 0) {
    const id = existing[0].id;
    const shareUrl = `${SITE}${getAdisoUrl({ id, titulo: existing[0].titulo || TITULO, categoria: 'empleos' })}`;
    console.log(JSON.stringify({ skipped: true, existing, shareUrl }, null, 2));
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
      { tipo: 'whatsapp', valor: WHATSAPP, principal: true, etiqueta: 'CV / informes' },
      { tipo: 'telefono', valor: WHATSAPP, principal: false, etiqueta: 'Cel.' },
    ],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: 'Centro histórico — zona Mesón de la Estrella',
      latitud: -13.5169,
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
      areas: ['Mozo/a', 'Bartender', 'Limpieza', 'Seguridad'],
      plan: 'destacado_30d_50',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_name: 'Antu',
      contact_whatsapp: '955009160',
      applicant_whatsapp: WHATSAPP,
      client_docs_path: 'docs/clientes/black-llama-hostel-antu',
      plan_amount_pen: 50,
      plan_days: 30,
      plan_start: FECHA_PUB,
      plan_end: '2026-11-07',
      factura_ruc: '20610881212',
      factura_titular: 'ROFFA TRIP SAC',
      factura_ref: 'E001-1',
      paid_at: new Date().toISOString(),
      social_diffusion_hold: false,
      payment_note: 'Yape S/50 confirmado por Jairo oct 2026 — aviso bar (no CM)',
      campaign_ref: 'rueda-oct-2026',
      cm_backup: true,
    },
  };

  const admin = await getAdmin();
  const row = {
    ...adisoToDb(adiso),
    promotion_tier: 'destacada',
    promotion_rank: 1,
    promotion_expires_at: EXPIRES,
    promoted_at: PROMOTED_AT,
    payment_status: 'verified',
  };

  const { error } = await admin.from('adisos').insert(row);
  if (error) throw new Error(error.message);

  const publicPath = getAdisoUrl(adiso);
  await admin.from('stories').insert({
    user_id: user.id,
    media_url: imageUrl,
    media_type: 'image',
    caption: adiso.titulo,
    categoria: adiso.categoria,
    adiso_id: id,
    promotion_tier: 'destacada',
    objective: 'contactos',
    source: 'adiso_auto',
    cta_url: `${SITE}${publicPath}`,
    status: 'active',
    visible_until: EXPIRES,
    expires_at: EXPIRES,
    sort_order: 0,
  });

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

  console.log(
    JSON.stringify(
      {
        published: true,
        paid: true,
        adisoId: id,
        shareUrl: `${SITE}${publicPath}`,
        applicantWhatsApp: WHATSAPP,
        note: 'Difusión FB/IG/TK/grupos (Shantall). CM queda en backup.',
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
