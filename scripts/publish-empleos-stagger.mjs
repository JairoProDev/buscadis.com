/**
 * Publica empleos reales (tier gratis, sin portada) con pausa entre cada uno.
 *
 *   node --env-file=.env.local scripts/publish-empleos-stagger.mjs
 *   node --env-file=.env.local scripts/publish-empleos-stagger.mjs --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.EMPLEOS_OWNER_EMAIL || 'buscadiss@gmail.com';
const BATCH_ID = 'demo-empleos-stagger-2026-09-30';
const DELAY_MS = Number(process.env.EMPLEOS_STAGGER_MS || 4000);

const JOBS = [
  {
    titulo: 'Pollería en San Sebastián busca mozos y cajera',
    descripcion:
      'Turno tarde y noche. Experiencia en atención al cliente. Sueldo S/1,400 + propinas. Entrevistas presenciales de lunes a sábado.',
    contacto: '984352737',
    ubicacion: 'San Sebastián, Cusco',
    distrito: 'San Sebastián',
  },
  {
    titulo: 'Hotel en Wanchaq necesita recepcionista bilingüe',
    descripcion:
      'Inglés intermedio, manejo de reservas y atención turística. Horario rotativo. Beneficios de ley. Enviar CV por WhatsApp.',
    contacto: '974620655',
    ubicacion: 'Wanchaq, Cusco',
    distrito: 'Wanchaq',
  },
  {
    titulo: 'Agencia de viajes contrata asistente de reservas',
    descripcion:
      'Conocimientos de turismo, Excel y atención telefónica. Modalidad presencial en Cusco. Sueldo según experiencia.',
    contacto: '984303228',
    ubicacion: 'Cusco',
    distrito: 'Cusco',
  },
  {
    titulo: 'Pizza Express busca motorizado y ayudante de cocina',
    descripcion:
      'Licencia A-IIB vigente para reparto. Ayudante con disponibilidad inmediata. Zona Av. Los Incas.',
    contacto: '940008078',
    ubicacion: 'Av. Los Incas, Cusco',
    distrito: 'Cusco',
  },
  {
    titulo: 'Cevichería requiere ayudante de cocina y lavavajillas',
    descripcion:
      'Jornada completa. Experiencia mínima 3 meses en cocina o salón. Pago quincenal. Cusco.',
    contacto: '914215252',
    ubicacion: 'Cusco',
    distrito: 'Cusco',
  },
  {
    titulo: 'Empresa de estructuras metálicas busca estibador',
    descripcion:
      'Trabajo en almacén y carga. Sueldo S/1,600. EPP provisto. Prolongación Grau.',
    contacto: '958237692',
    ubicacion: 'Prolongación Grau, Cusco',
    distrito: 'Cusco',
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function limaNow(offsetSeconds = 0) {
  const d = new Date(Date.now() - offsetSeconds * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return {
    fecha: `${get('year')}-${get('month')}-${get('day')}`,
    hora: `${get('hour')}:${get('minute')}`,
  };
}

async function findUserId(admin, email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Usuario no encontrado: ${email}`);
}

async function batchExists(admin) {
  const { data, error } = await admin
    .from('adisos')
    .select('id')
    .contains('private_data', { batch_id: BATCH_ID })
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!url || !key) {
    console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (await batchExists(admin)) {
    console.log(`Ya existen adisos del batch ${BATCH_ID}. Nada que hacer.`);
    return;
  }

  const userId = await findUserId(admin, OWNER_EMAIL);
  console.log(`Owner: ${OWNER_EMAIL} (${userId})`);
  console.log(`Publicando ${JOBS.length} empleos (gratis, sin destacar), cada ${DELAY_MS}ms…\n`);

  const published = [];

  for (let i = 0; i < JOBS.length; i += 1) {
    const job = JOBS[i];
    const id = nanoid(10);
    const { fecha, hora } = limaNow(i * 2);
    const row = {
      id,
      categoria: 'empleos',
      titulo: job.titulo.slice(0, 120),
      descripcion: job.descripcion.slice(0, 2000),
      contacto: job.contacto,
      contactos_multiples: [{ tipo: 'whatsapp', valor: job.contacto, principal: true }],
      ubicacion: job.ubicacion,
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: job.distrito,
      fecha_publicacion: fecha,
      hora_publicacion: hora,
      esta_activo: true,
      es_historico: false,
      fuente_original: 'usuario',
      user_id: userId,
      contact_locked: false,
      payment_status: 'free',
      publish_tier: 'free',
      promotion_rank: 0,
      promotion_tier: 'gratis',
      tamaño: 'miniatura',
      private_data: {
        batch_id: BATCH_ID,
        demo_contacto_clientes: true,
      },
    };

    console.log(`[${i + 1}/${JOBS.length}] ${job.titulo}`);
    if (dryRun) {
      published.push({ id, titulo: job.titulo });
      if (i < JOBS.length - 1) await sleep(DELAY_MS);
      continue;
    }

    const { error } = await admin.from('adisos').insert(row);
    if (error) {
      console.error('  Error:', error.message);
      throw error;
    }
    published.push({ id, titulo: job.titulo, url: `https://buscadis.com/a/${id}` });
    console.log(`  ✓ ${id}`);
    if (i < JOBS.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n--- Publicados ---');
  for (const p of published) {
    console.log(`  ${p.id} — ${p.titulo}`);
  }
  if (dryRun) console.log('\n(dry-run)');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
