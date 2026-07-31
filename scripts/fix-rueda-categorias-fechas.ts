/**
 * Fix Rueda históricos: restore fechas + repair obvious category mislabels.
 * Does NOT wipe. Safe to re-run (idempotent-ish).
 *
 * Usage: npx tsx scripts/fix-rueda-categorias-fechas.ts [--dry]
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
};

function classify(titulo: string, descripcion: string | null): string | null {
  const t = `${titulo} ${descripcion || ''}`.toLowerCase();
  const hasDepto =
    /\bdepartamentos?\b/.test(t) && !/departamento de /.test(t);
  const isInmueble =
    hasDepto ||
    /anticresis|anticr[eé]tico|habitaci[oó]n|alquilo|se alquila|en alquiler|terreno|casa ampl|casa en venta|casa en alquiler|local comercial|oficina en |inmueble|canch[oó]n|lote de |airbnb/.test(
      t
    );
  const isEmpleo =
    /requeri|necesitamos|se necesita|se requiere|vacante|curriculum|currículum|\bcv\b|sueldo S\/|contrato a plazo|personal para |mozos?|cociner[oa]|ayudante de |chofer |conductor /.test(
      t
    );
  const isVehiculo =
    /\b(auto|carro|camioneta|motocicleta)\b|kilometraje|vendo mi (auto|carro)|toyota |hyundai |nissan /.test(t);
  const isProductoLiquidacion =
    /remato|refrigerador|microondas|laptop|celular usado|motor el[eé]ctrico|muebles usados/.test(t) &&
    !isInmueble;

  if (isEmpleo && isInmueble) {
    return /requeri|vacante|\bcv\b|sueldo|personal para|se necesita|se requiere/.test(t)
      ? 'empleos'
      : 'inmuebles';
  }
  if (isEmpleo) return 'empleos';
  if (isInmueble) return 'inmuebles';
  if (isVehiculo) return 'vehiculos';
  if (isProductoLiquidacion) return 'productos';
  if (/traspaso de (tienda|negocio|restaurante|botica)/.test(t)) return 'negocios';
  return null;
}

async function fetchAllHistoricos(): Promise<Row[]> {
  const pageSize = 1000;
  let from = 0;
  const all: Row[] = [];
  while (true) {
    const { data, error } = await sb
      .from('adisos')
      .select('id,titulo,descripcion,categoria,fecha_publicacion,fecha_publicacion_original')
      .eq('fuente_original', 'rueda_negocios')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  console.log(dry ? 'DRY RUN' : 'APPLYING FIXES');
  const rows = await fetchAllHistoricos();
  console.log('históricos rueda:', rows.length);

  let dateFixes = 0;
  let catFixes = 0;
  const catChanges: Record<string, number> = {};

  // Batch updates
  const dateBatch: { id: string; fecha: string }[] = [];
  const catBatch: { id: string; categoria: string }[] = [];

  for (const r of rows) {
    if (
      r.fecha_publicacion_original &&
      r.fecha_publicacion &&
      r.fecha_publicacion !== r.fecha_publicacion_original
    ) {
      dateBatch.push({ id: r.id, fecha: r.fecha_publicacion_original });
      dateFixes++;
    }
    const next = classify(r.titulo, r.descripcion);
    if (next && next !== r.categoria) {
      catBatch.push({ id: r.id, categoria: next });
      catFixes++;
      const key = `${r.categoria}→${next}`;
      catChanges[key] = (catChanges[key] || 0) + 1;
    }
  }

  console.log('date mismatches to fix:', dateFixes);
  console.log('category fixes:', catFixes, catChanges);

  if (dry) return;

  // Update dates in chunks via individual updates (supabase JS lacks bulk patch by id list easily)
  const chunk = 50;
  for (let i = 0; i < dateBatch.length; i += chunk) {
    const slice = dateBatch.slice(i, i + chunk);
    await Promise.all(
      slice.map(({ id, fecha }) =>
        sb
          .from('adisos')
          .update({
            fecha_publicacion: fecha,
            created_at: `${fecha}T09:00:00.000Z`,
          })
          .eq('id', id)
      )
    );
    process.stdout.write(`\rdates ${Math.min(i + chunk, dateBatch.length)}/${dateBatch.length}`);
  }
  console.log('\ndates done');

  for (let i = 0; i < catBatch.length; i += chunk) {
    const slice = catBatch.slice(i, i + chunk);
    await Promise.all(
      slice.map(({ id, categoria }) => sb.from('adisos').update({ categoria }).eq('id', id))
    );
    process.stdout.write(`\rcats ${Math.min(i + chunk, catBatch.length)}/${catBatch.length}`);
  }
  console.log('\ncats done');
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
