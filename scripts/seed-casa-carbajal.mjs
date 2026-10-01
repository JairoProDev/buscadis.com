/**
 * One-off: Casa Carbajal, Plan Destacado S/30, 25–2 oct 2026.
 * Run: node --env-file=.env.local scripts/seed-casa-carbajal.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { nanoid } from 'nanoid';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase admin env');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = 'casacarbajalrest@gmail.com';
const PHONE = '+51994303412';
const PUBLISHED = '2026-09-25T21:40:00.000Z'; // 16:40 Lima
const EXPIRES = '2026-10-02T21:40:00.000Z';
const FLYER = '/tmp/carbajal/flyer.jpg';

const TITULO = 'Casa Carbajal — Restaurante busca personal en el Centro Histórico';
const DESCRIPCION = [
  'Casa Carbajal (Centro Histórico de Cusco).',
  'Estamos en búsqueda de personal para las siguientes áreas:',
  '• CAJA',
  '• Ayudantes de cocina',
  '• Mozos(a) con experiencia',
  '• Jalador / Anfitrión de puerta',
  '• STEWARD (limpieza y apoyo en cocina)',
  '',
  'Disponibilidad inmediata.',
  'Centro Histórico de Cusco. Calle Márquez 208, 2.º piso.',
  'Enviar CV solo por WhatsApp.',
].join('\n');

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

async function findUserId() {
  const { data: profile } = await admin
    .from('profiles')
    .select('id,email,telefono')
    .eq('email', EMAIL)
    .maybeSingle();
  if (profile?.id) return { id: profile.id, created: false };

  const password = nanoid(18);
  const created = await admin.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
    password,
    user_metadata: {
      nombre: 'Casa Carbajal',
      full_name: 'Casa Carbajal',
      rol: 'anunciante',
    },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || 'No se pudo crear la cuenta');
  }
  return { id: created.data.user.id, created: true, password };
}

async function main() {
  const existing = await admin
    .from('adisos')
    .select('id')
    .eq('id', 'yyNepGVyWs')
    .maybeSingle();
  if (existing.data?.id) {
    console.log(JSON.stringify({ alreadyPublished: true, adisoId: existing.data.id }));
    return;
  }

  const user = await findUserId();

  const profilePatch = {
    id: user.id,
    email: EMAIL,
    nombre: 'Casa Carbajal',
    telefono: '994303412',
    rol: 'anunciante',
  };
  const { error: profileError } = await admin.from('profiles').upsert(profilePatch, { onConflict: 'id' });
  if (profileError) {
    const { error: updateError } = await admin.from('profiles').update({
      email: EMAIL,
      nombre: 'Casa Carbajal',
      telefono: '994303412',
      rol: 'anunciante',
    }).eq('id', user.id);
    if (updateError) console.error('profile:', profileError.message, updateError.message);
  }

  const bytes = readFileSync(FLYER);
  const imagePath = `${user.id}/adisos/casa-carbajal-personal-2026-09-25.jpg`;
  let imageUrl = null;
  for (const bucket of ['adisos-images', 'images']) {
    const upload = await admin.storage.from(bucket).upload(imagePath, bytes, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (!upload.error) {
      imageUrl = admin.storage.from(bucket).getPublicUrl(imagePath).data.publicUrl;
      break;
    }
    console.error('upload', bucket, upload.error.message);
  }
  if (!imageUrl) throw new Error('No se pudo subir el flyer');

  const id = nanoid(10);
  const row = {
    id,
    categoria: 'empleos',
    subcategoria: 'restaurante',
    titulo: TITULO,
    descripcion: DESCRIPCION,
    contacto: '994303412',
    contactos_multiples: [{ tipo: 'whatsapp', valor: '994303412', principal: true }],
    ubicacion: 'Centro Histórico, Cusco',
    pais: 'Perú',
    departamento: 'Cusco',
    provincia: 'Cusco',
    distrito: 'Cusco',
    direccion: 'Calle Márquez 208, 2do piso',
    latitud: -13.5183948,
    longitud: -71.9825432,
    fecha_publicacion: '2026-09-25',
    hora_publicacion: '16:40',
    imagen_url: imageUrl,
    imagenes_urls: JSON.stringify([imageUrl]),
    fecha_expiracion: EXPIRES,
    expires_at: EXPIRES,
    esta_activo: true,
    es_historico: false,
    fuente_original: 'usuario',
    user_id: user.id,
    contact_locked: false,
    payment_status: 'verified',
    publish_tier: 'paid',
    promotion_tier: 'destacada',
    promotion_rank: 1,
    promotion_expires_at: EXPIRES,
    promoted_at: PUBLISHED,
    tamaño: 'mediano',
    tipo_precio: 'a_convenir',
    moneda: 'PEN',
    atributos: {
      negocio: 'Casa Carbajal',
      areas: ['CAJA', 'Ayudantes de cocina', 'Mozos(a)', 'Jalador/Anfitrión', 'STEWARD'],
      plan: 'destacado',
    },
    features: {
      plan_comercial: 'destacado',
      paid_days: 7,
      total_amount: 30,
      moneda: 'PEN',
    },
    private_data: {
      cliente: 'Casa Carbajal',
      email: EMAIL,
      plan: 'destacado',
      pagado_el: '2026-09-25',
      monto: 30,
      metodo: 'plin',
    },
  };

  const inserted = await admin.from('adisos').insert(row).select('id,titulo,esta_activo,promotion_tier,latitud,longitud').single();
  if (inserted.error) throw new Error(inserted.error.message);

  const publicPath = `/a/${id}/${slugify(TITULO)}`;
  const story = await admin.from('stories').insert({
    user_id: user.id,
    media_url: imageUrl,
    media_type: 'image',
    caption: TITULO,
    categoria: 'empleos',
    adiso_id: id,
    promotion_tier: 'destacada',
    objective: 'contactos',
    source: 'adiso_auto',
    cta_url: `https://buscadis.com${publicPath}`,
    status: 'active',
    visible_until: EXPIRES,
    expires_at: EXPIRES,
  }).select('id,visible_until').single();

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });

  console.log(JSON.stringify({
    userId: user.id,
    accountCreated: user.created,
    temporaryPassword: user.password || null,
    adisoId: id,
    path: publicPath,
    imageUrl,
    storyId: story.data?.id || null,
    storyError: story.error?.message || null,
    magicLink: link.data?.properties?.action_link || null,
    magicError: link.error?.message || null,
    active: inserted.data,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
