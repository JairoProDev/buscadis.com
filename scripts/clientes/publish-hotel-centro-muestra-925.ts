/**
 * Muestra comercial gratis — Hotel 3★ centro histórico (925 040 653).
 * Web + App + historia tier gratis (1 h en carril). Vigencia muestra: 7 días.
 *
 *   npx tsx scripts/clientes/publish-hotel-centro-muestra-925.ts --dry-run
 *   npx tsx scripts/clientes/publish-hotel-centro-muestra-925.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { adisoToDb } from '../../lib/supabase';
import { createStoryFromAdiso } from '../../lib/stories/adiso-sync';
import { featuresForTier } from '../../lib/publish/tiers';
import type { Adiso } from '../../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'muestra-hotel-centro-925040653-2026-10';
const CLIENT_LABEL = 'Hotel 3 estrellas — Centro histórico Cusco';
const WHATSAPP = '925040653';
const EMAIL = 'hotel925040653@anunciantes.buscadis.com';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

/** Muestra comercial: más que 24 h free estándar para que el cliente pueda compartir el link. */
const MUESTRA_DAYS = 7;

const TITULO = 'Hotel 3★ centro histórico — recepción, auditor nocturno y más vacantes';

const DESCRIPCION = `Importante hotel 3 estrellas en el centro histórico de Cusco amplía su equipo. Buscamos personal proactivo con disponibilidad inmediata:

• Recepcionista (mujer), inglés intermedio, experiencia indispensable en el área, conocimiento de OTAs y reservas.
• Auditor nocturno con experiencia indispensable en el área.
• Personal volante para cubrir áreas A y B, alimentos y bebidas, recepción, housekeeping y otras.
• Personal de mantenimiento con conocimiento de distintas habilidades.
• Practicantes y egresados de turismo o afines que deseen adquirir experiencia en hotelería.

Mayor información y postulaciones por WhatsApp: 925 040 653.`;

function limaNow() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return {
    fecha: `${get('year')}-${get('month')}-${get('day')}`,
    hora: `${get('hour')}:${get('minute')}`,
  };
}

async function findDuplicate() {
  const { data } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo')
    .contains('private_data', { batch_id: BATCH_ID })
    .limit(1);
  return data?.[0] ?? null;
}

async function ensureUser(): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', EMAIL)
    .maybeSingle();
  if (profile?.id) return profile.id;

  const password = nanoid(18);
  const created = await supabaseAdmin.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
    password,
    user_metadata: { nombre: CLIENT_LABEL, full_name: CLIENT_LABEL, rol: 'anunciante' },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || 'No se pudo crear usuario');
  }
  const id = created.data.user.id;
  await supabaseAdmin.from('profiles').upsert(
    {
      id,
      email: EMAIL,
      nombre: CLIENT_LABEL,
      telefono: WHATSAPP,
      rol: 'anunciante',
    },
    { onConflict: 'id' },
  );
  console.log('[auth] Usuario creado', EMAIL);
  return id;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const dup = await findDuplicate();
  if (dup) {
    console.log(JSON.stringify({ skipped: true, existing: dup, url: `${SITE}/a/${dup.id}` }, null, 2));
    return;
  }

  const userId = await ensureUser();
  const { fecha, hora } = limaNow();
  const expiresAt = new Date(Date.now() + MUESTRA_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const id = nanoid(10);
  const features = featuresForTier('free');

  const adiso: Adiso = {
    id,
    categoria: 'empleos',
    subcategoria: 'hoteleria',
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
      direccion: 'Centro histórico',
    },
    fechaPublicacion: fecha,
    horaPublicacion: hora,
    tamaño: 'miniatura',
    user_id: userId,
    usuario_id: userId,
    estaActivo: true,
    esHistorico: false,
    esGratuito: true,
    fechaExpiracion: expiresAt,
    expiresAt,
    publishTier: 'free',
    paymentStatus: 'free',
    promotionTier: 'gratis',
    promotionRank: 0,
    tipoPrecio: 'a_convenir',
    features: features as unknown as Record<string, unknown>,
    privateData: {
      batch_id: BATCH_ID,
      client_name: CLIENT_LABEL,
      contact_whatsapp: WHATSAPP,
      muestra_comercial: true,
      campana: 'rueda-negocios-2026-10',
      coverSource: 'template',
      flyerTemplateId: 'bold-type',
      flyerConfig: { accent: 'hotel' },
      nota_ops: 'Muestra sin costo prometida 5 oct; upsell S/50 plan empresa',
    },
  };

  const payload = {
    id,
    titulo: adiso.titulo,
    expiresAt,
    muestra_dias: MUESTRA_DAYS,
    story: 'gratis 1h en carril + OG',
    url: `${SITE}/a/${id}`,
  };
  console.log(JSON.stringify(payload, null, 2));

  if (dryRun) return;

  const { error } = await supabaseAdmin.from('adisos').insert(adisoToDb(adiso));
  if (error) throw new Error(error.message);

  const created = { ...adiso };
  await createStoryFromAdiso(userId, created, { promotionTier: 'gratis' });

  const { onAdisoSearchIndexUpdate } = await import('../../lib/search/post-create');
  try {
    onAdisoSearchIndexUpdate(created);
  } catch (e) {
    console.warn('[search]', e);
  }

  try {
    const { generateAndStoreEmbedding } = await import('../../lib/ai/embeddings');
    await generateAndStoreEmbedding(created.id);
  } catch (e) {
    console.warn('[embedding]', e);
  }

  const { syncPaidClientAdisoToCrm } = await import('../../lib/comercial/paid-client-sync');
  try {
    await syncPaidClientAdisoToCrm(created, BATCH_ID);
  } catch (e) {
    console.warn('[crm sync]', e);
  }

  console.log('\nPublicado:', `${SITE}/a/${id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
