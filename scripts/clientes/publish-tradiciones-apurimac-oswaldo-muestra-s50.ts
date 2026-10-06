/**
 * Muestra plan S/50 (pago pendiente) — Restaurante Tradiciones Apurímac, Oswaldo.
 *
 *   npx tsx scripts/clientes/publish-tradiciones-apurimac-oswaldo-muestra-s50.ts
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

const BATCH_ID = 'cliente-tradiciones-apurimac-oswaldo-2026-10';
const CLIENT_LABEL = 'Restaurante Tradiciones Apurímac';
const WHATSAPP = '984903140';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

const FECHA_PUB = '2026-10-06';
const HORA_PUB = '12:45';
const PROMOTED_AT = '2026-10-06T12:45:00-05:00';
const EXPIRES = '2026-11-05T23:59:59-05:00';

const FLYER_FILE = path.join(
  process.cwd(),
  'docs/clientes/tradiciones-apurimac-oswaldo/media/flyer-tradiciones-apurimac-oct-2026.jpg',
);

const TITULO = 'Restaurante Tradiciones Apurímac | Ayudante cocina y mozas — urgente';

const DESCRIPCION = [
  '¡Urgente! Restaurante Tradiciones Apurímac busca personal para sumarse al equipo.',
  '',
  'Vacantes:',
  '• Ayudante de cocina',
  '• Señoritas mozas (atención en salón)',
  '',
  'Horarios / modalidad:',
  '• Tiempo completo o medio tiempo',
  '',
  'Se brinda:',
  '• Buen sueldo',
  '',
  'Presentarse en Calle San Andrés 372.',
  '',
  'Contacto WhatsApp: 984 903 140',
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
  const stubEmail = 'tradicionesapurimac984903140@anunciantes.buscadis.com';
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
  const storagePath = `${userId}/adisos/tradiciones-apurimac-${Date.now()}.jpg`;

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
      { tipo: 'whatsapp', valor: WHATSAPP, principal: true, etiqueta: 'WhatsApp' },
      { tipo: 'telefono', valor: WHATSAPP, principal: false, etiqueta: 'Cel.' },
    ],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: 'Calle San Andrés 372',
      latitud: -13.52,
      longitud: -71.97,
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
      areas: ['Ayudante de cocina', 'Moza'],
      plan: 'destacado_30d_50_muestra',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_name: 'Oswaldo',
      contact_whatsapp: WHATSAPP,
      client_docs_path: 'docs/clientes/tradiciones-apurimac-oswaldo',
      plan_amount_pen: 50,
      plan_days: 30,
      plan_start: FECHA_PUB,
      plan_end: '2026-11-05',
      muestra_plan_s50: true,
      social_diffusion_hold: true,
      payment_note: 'Muestra web oct 6 — pidió precio; redes tras Yape',
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
  console.log(
    JSON.stringify(
      {
        published: true,
        adisoId: id,
        shareUrl: `${SITE}${sharePath}`,
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
