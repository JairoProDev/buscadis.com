/**
 * Arregla categorías mal etiquetadas + títulos cortos de Rueda.
 * Restaura fechas oficiales (fecha_publicacion = original) y prioriza ediciones recientes.
 *
 *   npx tsx scripts/oficializar-rueda-feed.ts --dry
 *   npx tsx scripts/oficializar-rueda-feed.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dry = process.argv.includes('--dry');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  fecha_publicacion: string | null;
  fecha_publicacion_original: string | null;
  edicion_numero: string | null;
};

function classify(titulo: string, descripcion: string | null): string | null {
  const t = `${titulo} ${descripcion || ''}`.toLowerCase();

  const isEmpleo =
    /niñer|nan[ny]|requeri|necesitamos|se necesita|se requiere|vacante|curriculum|currículum|\bcv\b|sueldo|personal para |mozos?|cociner|ayudante|chofer|conductor|recepcionista|practicante|oferta laboral|busca personal|solicita personal/.test(
      t
    );
  const isInmueble =
    /\bdepartamentos?\b|ambientes?|anticresis|habitaci[oó]n|alquilo|se alquila|en alquiler|terreno|casa |local |oficina|inmueble|canch[oó]n|lote |airbnb|tiendas?|consultorio|alquiler|m²|m2|rr\.?\s*pp|condominio/.test(
      t
    );
  const isVehiculo =
    /\b(auto|carro|camioneta|motocicleta)\b|kilometraje|toyota |hyundai |nissan /.test(t);
  const isNegocio =
    /traspaso|negocio en marcha|fondo de comercio|cafeter[ií]a|creper[ií]a|restaurante en venta|pollería en venta/.test(
      t
    );
  const isServicio =
    /servicio de |clases de |reparaci[oó]n|gasfiter|electricista|limpieza a domicilio/.test(t);

  if (isEmpleo && !/vendo |alquilo |se alquila|terreno|departamento/.test(titulo.toLowerCase())) {
    return 'empleos';
  }
  if (isInmueble) return 'inmuebles';
  if (isVehiculo) return 'vehiculos';
  if (isNegocio) return 'negocios';
  if (isServicio) return 'servicios';
  if (isEmpleo) return 'empleos';
  return null;
}

/** Título más llamativo a partir de descripción si el actual es demasiado corto. */
function enrichTitle(titulo: string, descripcion: string | null): string | null {
  const t = (titulo || '').trim();
  const words = t.split(/\s+/).filter(Boolean);
  const tooShort = t.length < 28 || words.length <= 3;
  if (!tooShort || !descripcion) return null;

  const desc = descripcion.replace(/\s+/g, ' ').trim();
  // Preferir fragmento útil: primeros ~70 chars hasta coma/punto
  let extra = desc.slice(0, 90);
  const cut = extra.search(/[.;](\s|$)/);
  if (cut > 25) extra = extra.slice(0, cut);
  extra = extra.replace(/[,:\-–\s]+$/, '').trim();
  if (extra.length < 15) return null;

  // Evitar duplicar si ya empieza igual
  if (extra.toLowerCase().startsWith(t.toLowerCase())) {
    return extra.slice(0, 100);
  }
  const combined = `${t}: ${extra}`.slice(0, 100);
  return combined.length > t.length + 8 ? combined : null;
}

async function fetchAll(): Promise<Row[]> {
  const all: Row[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('adisos')
      .select('id,titulo,descripcion,categoria,fecha_publicacion,fecha_publicacion_original,edicion_numero')
      .eq('fuente_original', 'rueda_negocios')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

async function main() {
  console.log(dry ? 'DRY' : 'APPLY');
  const rows = await fetchAll();
  let catOk = 0,
    catFail = 0,
    titleOk = 0,
    dateOk = 0;

  const catUpdates: { id: string; categoria: string }[] = [];
  const titleUpdates: { id: string; titulo: string }[] = [];
  const dateUpdates: { id: string; fecha: string }[] = [];

  for (const r of rows) {
    const next = classify(r.titulo, r.descripcion);
    if (next && next !== r.categoria) {
      catUpdates.push({ id: r.id, categoria: next });
    }
    const richer = enrichTitle(r.titulo, r.descripcion);
    if (richer) titleUpdates.push({ id: r.id, titulo: richer });

    const orig = (r.fecha_publicacion_original || '').toString().slice(0, 10);
    const cur = (r.fecha_publicacion || '').toString().slice(0, 10);
    if (orig && orig !== cur) {
      dateUpdates.push({ id: r.id, fecha: orig });
    }
  }

  console.log({
    total: rows.length,
    catFixes: catUpdates.length,
    titleFixes: titleUpdates.length,
    dateFixes: dateUpdates.length,
    sampleCat: catUpdates.slice(0, 8),
    sampleTitle: titleUpdates.slice(0, 5),
  });

  if (dry) return;

  for (let i = 0; i < catUpdates.length; i += 20) {
    const chunk = catUpdates.slice(i, i + 20);
    await Promise.all(
      chunk.map(async (u) => {
        const { error } = await sb.from('adisos').update({ categoria: u.categoria }).eq('id', u.id);
        if (error) catFail++;
        else catOk++;
      })
    );
  }
  for (let i = 0; i < titleUpdates.length; i += 20) {
    const chunk = titleUpdates.slice(i, i + 20);
    await Promise.all(
      chunk.map(async (u) => {
        const { error } = await sb.from('adisos').update({ titulo: u.titulo }).eq('id', u.id);
        if (!error) titleOk++;
      })
    );
  }
  for (let i = 0; i < dateUpdates.length; i += 20) {
    const chunk = dateUpdates.slice(i, i + 20);
    await Promise.all(
      chunk.map(async (u) => {
        const { error } = await sb.from('adisos').update({ fecha_publicacion: u.fecha }).eq('id', u.id);
        if (!error) dateOk++;
      })
    );
  }

  // Asegurar ediciones nuevas activas y con hora ordenable
  for (const [ed, fecha] of [
    ['R2747', '2026-07-27'],
    ['R2746', '2026-07-23'],
    ['R2745', '2026-07-20'],
  ] as const) {
    await sb
      .from('adisos')
      .update({
        fecha_publicacion: fecha,
        fecha_publicacion_original: fecha,
        esta_activo: true,
        hora_publicacion: '10:00',
      })
      .eq('edicion_numero', ed)
      .eq('fuente_original', 'rueda_negocios');
  }

  console.log({ catOk, catFail, titleOk, dateOk, recentEditions: 'R2745-47 dates set official' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
