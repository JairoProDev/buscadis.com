/**
 * Carga avisos.json en tablas rueda_* (requiere migración 057 + service role).
 *
 *   npx tsx scripts/rueda/load-warehouse.ts --edicion=R2766 --apply
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { getRuedaOutputDir } from '../../lib/rueda/paths';
import { ruedaAvisosPayloadSchema } from '../../lib/rueda/schema';
import { getEditionByCode } from '../../lib/rueda/editions';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const edicion = arg('edicion');
  const apply = process.argv.includes('--apply');
  if (!edicion) {
    console.error('Requiere --edicion=');
    process.exit(1);
  }

  const jsonPath = path.join(getRuedaOutputDir(edicion), 'avisos.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const parsed = ruedaAvisosPayloadSchema.parse(raw);
  const man = getEditionByCode(edicion);

  const editionRow = {
    edicion: parsed.edicion,
    fecha_inicio: man?.fecha_inicio || parsed.fecha_publicacion_original || null,
    fecha_fin: man?.fecha_fin || null,
    archivo: man?.archivo || path.basename(parsed.pdf),
    sha256: man?.sha256 || null,
    page_count: parsed.total_paginas,
    source: man?.source || 'extract',
    batch_id: parsed.batch_id,
    updated_at: new Date().toISOString(),
  };

  const listings = parsed.avisos.map((a) => {
    const phone = (a.telefonos[0] || '').replace(/\D/g, '').slice(-9);
    const advertiser_key = phone ? `tel:${phone}` : `key:${a.import_key}`;
    return {
      import_key: a.import_key,
      edicion: a.edicion,
      pagina: a.pagina,
      advertiser_key,
      titulo: a.titulo,
      categoria: a.categoria,
      subcategoria: a.subcategoria || null,
      ubicacion: a.ubicacion,
      descripcion: a.descripcion,
      texto_raw: a.texto_raw,
      telefonos: a.telefonos,
      email: a.email,
      es_empresa: a.es_empresa,
      score: a.score,
      requiere_revision: a.requiere_revision,
      recurrente: a.recurrente,
      extracted_at: parsed.extracted_at,
    };
  });

  const advertisers = new Map<string, { phone_primary: string; display_name: string }>();
  for (const l of listings) {
    if (!l.advertiser_key.startsWith('tel:')) continue;
    const phone = l.advertiser_key.replace('tel:', '');
    if (!advertisers.has(l.advertiser_key)) {
      advertisers.set(l.advertiser_key, { phone_primary: phone, display_name: l.titulo.slice(0, 80) });
    }
  }

  console.log(
    JSON.stringify(
      {
        apply,
        editionRow,
        listings: listings.length,
        advertisers: advertisers.size,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log('(dry-run — usa --apply)');
    return;
  }

  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { error: eErr } = await supabaseAdmin.from('rueda_editions').upsert(editionRow);
  if (eErr) throw new Error(eErr.message);

  for (const [key, adv] of advertisers) {
    await supabaseAdmin.from('rueda_advertisers').upsert({
      advertiser_key: key,
      phone_primary: adv.phone_primary,
      display_name: adv.display_name,
      last_seen_edicion: edicion,
      updated_at: new Date().toISOString(),
    });
  }

  for (let i = 0; i < listings.length; i += 50) {
    const chunk = listings.slice(i, i + 50);
    const { error } = await supabaseAdmin.from('rueda_listings').upsert(chunk, { onConflict: 'import_key' });
    if (error) throw new Error(error.message);
  }

  console.log('✅ warehouse actualizado');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
