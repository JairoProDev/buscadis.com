/**
 * Publica aviso Restaurante Pucara (empleo gratis, admin).
 * Alineado a lib/publish/free-publish.ts + flyer template.
 *
 *   npx tsx scripts/publish-pucara-empleo.ts
 *   npx tsx scripts/publish-pucara-empleo.ts --dry-run
 *
 * Desactivar cuando consigan personal:
 *   npx tsx scripts/deactivate-adiso.ts --id <ID>
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '../lib/supabase-admin';
import { adisoToDb } from '../lib/supabase';
import { createStoryFromAdiso } from '../lib/stories/adiso-sync';
import { featuresForTier } from '../lib/publish/tiers';
import type { Adiso } from '../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'pucara-ayudante-cocina-2026-09-30';
const OWNER_EMAIL = process.env.EMPLEOS_OWNER_EMAIL || 'buscadiss@gmail.com';
const EXPIRES_DAYS = 30;

const TITULO = 'Ayudante de cocina – Restaurante Pucara (Saphy, Cusco)';

const DESCRIPCION = `Restaurante Pucara busca ayudante de cocina para trabajo en general.

Horario 1: de 10:00 a.m. hasta el cierre (aprox. 9:45 p.m.). Pago: S/1,725 + S/200 de movilidad + propina.
Horario 2: desde las 5:30 p.m. hasta el cierre (aprox. 9:45 p.m.), hora de entrada conversable. Pago: S/600 + S/100 de movilidad + propina.

Se pagan horas extras exactas. Descanso los miércoles. Se brinda alimentación.

Cómo postular: escribir por WhatsApp al 940 897 397 (o llamar al 973 527 683) y presentarse en la esquina de calle Amargura con Saphy, de 4 p.m. a 7 p.m., con DNI físico.`;

async function findUserIdByEmail(email: string): Promise<string> {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Usuario no encontrado: ${email}`);
}

async function findDuplicate(): Promise<{ id: string; titulo: string } | null> {
  const { data: byBatch } = await supabaseAdmin
    .from('adisos')
    .select('id,titulo')
    .contains('private_data', { batch_id: BATCH_ID })
    .limit(1);
  if (byBatch?.[0]) return byBatch[0];

  const { data: byTitle } = await supabaseAdmin
    .from('adisos')
    .select('id,titulo')
    .eq('categoria', 'empleos')
    .eq('esta_activo', true)
    .ilike('titulo', '%Pucara%')
    .ilike('titulo', '%cocina%')
    .limit(3);

  const hit = (byTitle || []).find((r) => /pucara/i.test(r.titulo));
  return hit || null;
}

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

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const dup = await findDuplicate();
  if (dup) {
    console.log(JSON.stringify({ skipped: true, reason: 'duplicate', existing: dup }, null, 2));
    return;
  }

  const userId = await findUserIdByEmail(OWNER_EMAIL);
  const { fecha, hora } = limaNow();
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const id = nanoid(10);
  const features = featuresForTier('free');

  const adiso: Adiso = {
    id,
    categoria: 'empleos',
    subcategoria: 'cocina',
    titulo: TITULO.slice(0, 120),
    descripcion: DESCRIPCION.slice(0, 2000),
    contacto: '940897397',
    contactosMultiples: [
      { tipo: 'whatsapp', valor: '940897397', principal: true, etiqueta: 'WhatsApp' },
      { tipo: 'telefono', valor: '973527683', principal: false, etiqueta: 'Llamadas' },
    ],
    ubicacion: {
      pais: 'Perú',
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      direccion: 'Esquina calle Amargura con Saphy',
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
    precio: 1725,
    moneda: 'PEN',
    tipoPrecio: 'a_convenir',
    features: features as unknown as Record<string, unknown>,
    privateData: {
      batch_id: BATCH_ID,
      client_name: 'Restaurante Pucara',
      pending_owner_transfer: true,
      owner_contact_email: null,
      coverSource: 'template',
      flyerTemplateId: 'bold-type',
      flyerConfig: {},
      deactivate_note: 'Cliente retira al conseguir personal: esta_activo=false',
    },
  };

  console.log('--- Comando / payload (dry-run preview) ---');
  console.log(
    JSON.stringify(
      {
        action: 'insert adisos + story',
        owner: OWNER_EMAIL,
        id,
        titulo: adiso.titulo,
        categoria: adiso.categoria,
        subcategoria: adiso.subcategoria,
        expiresAt,
        publishTier: 'free',
        url: `https://buscadis.com/a/${id}`,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log('\n(dry-run — no insert)');
    return;
  }

  const { error } = await supabaseAdmin.from('adisos').insert(adisoToDb(adiso));
  if (error) throw new Error(error.message);

  const created = { ...adiso };
  await createStoryFromAdiso(userId, created, { promotionTier: 'gratis' });

  const { data: check } = await supabaseAdmin
    .from('adisos')
    .select('id,titulo,esta_activo,categoria')
    .eq('id', id)
    .single();

  console.log('\n--- Publicado ---');
  console.log(JSON.stringify({ adiso: check, url: `https://buscadis.com/a/${id}`, empleos: '/?categoria=empleos' }, null, 2));
  console.log('\nDesactivar: UPDATE adisos SET esta_activo = false WHERE id =', `'${id}';`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
