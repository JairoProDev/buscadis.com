/**
 * Restaurante Mapacho — plan S/50 oct 2026 (8 vacantes + perfil + historias).
 *
 *   npx tsx scripts/clientes/publish-restaurante-mapacho.ts
 *   npx tsx scripts/clientes/publish-restaurante-mapacho.ts --dry-run
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from '../../lib/storage-buckets';
import { adisoToDb } from '../../lib/supabase';
import { onAdisoSearchIndexUpdate } from '../../lib/search/post-create';
import { featuresForTier } from '../../lib/publish/tiers';
import type { Adiso, Categoria } from '../../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-restaurante-mapacho-2026-10';
const CLIENT_NAME = 'Restaurante Mapacho';
const EMAIL = 'mapacho984759634@anunciantes.buscadis.com';
const PHONE = '984759634';
const WHATSAPP = '984759634';
const PROMOTED_AT = '2026-10-01T18:40:00.000Z'; // pago ~13:40 Lima
const EXPIRES = '2026-10-31T23:59:59.000Z';
const FECHA_PUB = '2026-10-02';
const HORA_PUB = '09:45';

const MEDIA_DIR = path.join(process.cwd(), 'docs/clientes/restaurante-mapacho/media');
const FLYER_FILE = path.join(MEDIA_DIR, 'flyer-8-vacantes.jpg');
const RUEDA_FILE = path.join(MEDIA_DIR, 'rueda-negocios-original.png');

const LAT = -13.5164;
const LNG = -71.9785;

const COMMON_FOOTER = [
  '',
  'Beneficios: alimentación, vivienda, sueldo + propinas.',
  'Requisitos: experiencia en el puesto y disponibilidad inmediata.',
  'Zona: Cusco y alrededores.',
  'Postular: enviar CV por WhatsApp al 984 759 634.',
].join('\n');

type JobSpec = {
  slug: string;
  titulo: string;
  descripcion: string;
  subcategoria: string;
  vacantes?: number;
  imageKey?: 'flyer' | 'rueda';
  tamaño?: Adiso['tamaño'];
  promotionRank: number;
};

const JOBS: JobSpec[] = [
  {
    slug: 'principal-8-vacantes',
    titulo: 'Restaurante Mapacho — 8 vacantes (panadería, cocina, mozas)',
    descripcion: [
      'Restaurante Mapacho busca talento para su equipo gastronómico en Cusco.',
      '',
      'Vacantes:',
      '• 01 Maestro panadero – pastelero',
      '• 01 Ayudante de pastelería',
      '• 02 Ayudantes de cocina',
      '• 02 Vajilleros',
      '• 02 Mozas con inglés avanzado',
      COMMON_FOOTER,
    ].join('\n'),
    subcategoria: 'gastronomia',
    imageKey: 'flyer',
    tamaño: 'mediano',
    promotionRank: 3,
  },
  {
    slug: 'maestro-panadero-pastelero',
    titulo: 'Maestro panadero – pastelero | Restaurante Mapacho',
    descripcion: `Vacante: 01 maestro panadero – pastelero.\n${COMMON_FOOTER}`,
    subcategoria: 'gastronomia',
    vacantes: 1,
    promotionRank: 2,
  },
  {
    slug: 'ayudante-pasteleria',
    titulo: 'Ayudante de pastelería | Restaurante Mapacho',
    descripcion: `Vacante: 01 ayudante de pastelería.\n${COMMON_FOOTER}`,
    subcategoria: 'gastronomia',
    vacantes: 1,
    promotionRank: 2,
  },
  {
    slug: 'ayudante-cocina',
    titulo: 'Ayudante de cocina (2 plazas) | Restaurante Mapacho',
    descripcion: `Vacantes: 02 ayudantes de cocina.\n${COMMON_FOOTER}`,
    subcategoria: 'gastronomia',
    vacantes: 2,
    promotionRank: 2,
  },
  {
    slug: 'vajillero',
    titulo: 'Vajillero (2 plazas) | Restaurante Mapacho',
    descripcion: `Vacantes: 02 vajilleros.\n${COMMON_FOOTER}`,
    subcategoria: 'limpieza',
    vacantes: 2,
    promotionRank: 2,
  },
  {
    slug: 'moza-ingles',
    titulo: 'Moza de salón con inglés avanzado (2 plazas) | Restaurante Mapacho',
    descripcion: [
      'Vacantes: 02 mozas de salón.',
      'Requisito: inglés avanzado (atención a turistas).',
      COMMON_FOOTER,
    ].join('\n'),
    subcategoria: 'atencion',
    vacantes: 2,
    promotionRank: 2,
  },
  {
    slug: 'rueda-negocios-referencia',
    titulo: 'Restaurante Mapacho — aviso Rueda de Negocios (referencia)',
    descripcion: [
      'Aviso original publicado en la revista Rueda de Negocios antes de la campaña en Buscadis.',
      'Versión actualizada con 8 vacantes (incluye 2 ayudantes de cocina): ver aviso principal en Buscadis.',
      COMMON_FOOTER,
    ].join('\n'),
    subcategoria: 'gastronomia',
    imageKey: 'rueda',
    tamaño: 'pequeño',
    promotionRank: 1,
  },
];

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
    .select('id, titulo, private_data')
    .contains('private_data', { batch_id: BATCH_ID });
  return data || [];
}

async function uploadImage(userId: string, filePath: string, slug: string): Promise<string> {
  const admin = await getAdmin();
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const storagePath = `${userId}/adisos/mapacho-${slug}-${Date.now()}.${ext}`;

  for (const bucket of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error } = await admin.storage.from(bucket).upload(storagePath, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });
    if (!error) {
      return admin.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    }
  }
  throw new Error(`No se pudo subir ${filePath}`);
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
    user_metadata: { nombre: CLIENT_NAME, full_name: CLIENT_NAME, rol: 'anunciante' },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || 'No se pudo crear usuario');
  }
  const id = created.data.user.id;
  await admin.from('profiles').upsert(
    {
      id,
      email: EMAIL,
      nombre: CLIENT_NAME,
      telefono: PHONE,
      rol: 'anunciante',
    },
    { onConflict: 'id' },
  );
  return { id, created: true, password };
}

async function ensureBusinessProfile(userId: string, logoUrl?: string) {
  const admin = await getAdmin();
  const slug = 'restaurante-mapacho';
  const { data: existing } = await admin.from('business_profiles').select('id').eq('slug', slug).maybeSingle();

  const payload = {
    slug,
    name: CLIENT_NAME,
    tagline: 'Gastronomía — reclutamiento en Cusco',
    description:
      'Restaurante Mapacho publica vacantes de panadería, cocina, vajilleros y mozas con inglés. Contacto para postulantes: WhatsApp 984 759 634.',
    contact_whatsapp: WHATSAPP,
    contact_phone: WHATSAPP,
    contact_email: null,
    contact_address: 'Cusco, Perú',
    theme_color: '#0d9488',
    template_id: 'pack_restaurante',
    is_published: true,
    publicadis_published: true,
    publicadis_template_id: 'artisan-brand',
    user_id: userId,
    created_by: userId,
    logo_url: logoUrl || null,
    banner_url: logoUrl || null,
    og_image_url: logoUrl || null,
    meta_title: `${CLIENT_NAME} | Empleos en Buscadis`,
    meta_description: '8 vacantes gastronómicas en Cusco. Alimentación, vivienda y sueldo + propinas.',
    pending_owner_email: null,
  };

  if (existing?.id) {
    await admin.from('business_profiles').update(payload).eq('id', existing.id);
    return existing.id;
  }

  const { data, error } = await admin.from('business_profiles').insert(payload).select('id').single();
  if (error) throw error;
  await admin.from('business_members').upsert(
    {
      business_profile_id: data.id,
      user_id: userId,
      role: 'owner',
      invited_by: userId,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: 'business_profile_id,user_id' },
  );
  return data.id as string;
}

function buildAdiso(
  userId: string,
  spec: JobSpec,
  imageUrl?: string,
): Adiso {
  const id = nanoid(10);
  const features = featuresForTier('paid', spec.tamaño || 'miniatura');
  return {
    id,
    categoria: 'empleos' as Categoria,
    subcategoria: spec.subcategoria,
    titulo: spec.titulo.slice(0, 120),
    descripcion: spec.descripcion.slice(0, 2000),
    contacto: PHONE,
    contactosMultiples: [{ tipo: 'whatsapp', valor: WHATSAPP, principal: true, etiqueta: 'WhatsApp / CV' }],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: 'Cusco y alrededores',
      latitud: LAT,
      longitud: LNG,
    },
    fechaPublicacion: FECHA_PUB,
    horaPublicacion: HORA_PUB,
    tamaño: spec.tamaño || 'miniatura',
    imagenUrl: imageUrl,
    imagenesUrls: imageUrl ? [imageUrl] : undefined,
    user_id: userId,
    usuario_id: userId,
    estaActivo: true,
    esHistorico: false,
    fuenteOriginal: spec.slug === 'rueda-negocios-referencia' ? 'rueda_negocios' : 'usuario',
    fechaExpiracion: EXPIRES,
    expiresAt: EXPIRES,
    publishTier: 'paid',
    paymentStatus: 'verified',
    promotionTier: 'premium',
    promotionRank: spec.promotionRank,
    promotionExpiresAt: EXPIRES,
    promotedAt: PROMOTED_AT,
    tipoPrecio: 'a_convenir',
    moneda: 'PEN',
    features: features as unknown as Record<string, unknown>,
    atributos: {
      negocio: CLIENT_NAME,
      empleos_jornada: 'completo',
      empleos_modalidad: 'presencial',
      vacantes: spec.vacantes,
      plan: 'mensual_50',
    },
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_NAME,
      job_slug: spec.slug,
      yape_operation: '04018571',
      plan_amount_pen: 50,
      plan_end: '2026-10-31',
      contact_whatsapp: WHATSAPP,
    },
  };
}

async function insertStory(
  userId: string,
  adiso: Adiso,
  imageUrl: string,
) {
  const admin = await getAdmin();
  const publicPath = `/a/${adiso.id}/${slugify(adiso.titulo)}`;
  const { error } = await admin.from('stories').insert({
    user_id: userId,
    media_url: imageUrl,
    media_type: 'image',
    caption: adiso.titulo,
    categoria: adiso.categoria,
    adiso_id: adiso.id,
    promotion_tier: 'premium',
    objective: 'contactos',
    source: 'adiso_auto',
    cta_url: `https://buscadis.com${publicPath}`,
    status: 'active',
    visible_until: EXPIRES,
    expires_at: EXPIRES,
  });
  if (error) throw new Error(`story ${adiso.id}: ${error.message}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!fs.existsSync(FLYER_FILE) || !fs.existsSync(RUEDA_FILE)) {
    throw new Error(`Faltan medios en ${MEDIA_DIR}`);
  }

  const existing = await findExistingBatch();
  if (existing.length > 0) {
    console.log(
      JSON.stringify(
        {
          skipped: true,
          reason: 'already_published',
          count: existing.length,
          ids: existing.map((r) => r.id),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          batch: BATCH_ID,
          jobs: JOBS.map((j) => j.slug),
          email: EMAIL,
          businessSlug: 'restaurante-mapacho',
        },
        null,
        2,
      ),
    );
    return;
  }

  const user = await ensureUser();
  const flyerUrl = await uploadImage(user.id, FLYER_FILE, 'flyer');
  const ruedaUrl = await uploadImage(user.id, RUEDA_FILE, 'rueda');
  const businessId = await ensureBusinessProfile(user.id, flyerUrl);

  const published: { slug: string; id: string; url: string; story: boolean }[] = [];

  for (const spec of JOBS) {
    let imageUrl: string | undefined;
    if (spec.imageKey === 'flyer') imageUrl = flyerUrl;
    if (spec.imageKey === 'rueda') imageUrl = ruedaUrl;

    const adiso = buildAdiso(user.id, spec, imageUrl);
    const row = {
      ...adisoToDb(adiso),
      promotion_tier: adiso.promotionTier,
      promotion_rank: adiso.promotionRank,
      promotion_expires_at: EXPIRES,
      promoted_at: PROMOTED_AT,
    };

    const admin = await getAdmin();
    const { error } = await admin.from('adisos').insert(row);
    if (error) throw new Error(`${spec.slug}: ${error.message}`);

    onAdisoSearchIndexUpdate(adiso);

    if (spec.slug === 'principal-8-vacantes') {
      await insertStory(user.id, adiso, flyerUrl);
    }

    published.push({
      slug: spec.slug,
      id: adiso.id,
      url: `https://buscadis.com/a/${adiso.id}`,
      story: spec.slug === 'principal-8-vacantes',
    });
  }

  const link = await (await getAdmin()).auth.admin.generateLink({ type: 'magiclink', email: EMAIL });

  console.log(
    JSON.stringify(
      {
        client: CLIENT_NAME,
        batch: BATCH_ID,
        userId: user.id,
        accountCreated: user.created,
        temporaryPassword: user.password || null,
        businessProfileId: businessId,
        businessUrl: 'https://buscadis.com/@restaurante-mapacho',
        published,
        magicLink: link.data?.properties?.action_link || null,
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
