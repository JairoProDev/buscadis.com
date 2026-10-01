import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Repara títulos, descripciones, ubicación y plantillas del batch R2764.
 * Opcional: --ai para pulir con GPT (más lento, mejor calidad).
 *
 *   npx tsx scripts/rueda/extract-edition.ts
 *   npx tsx scripts/rueda/repair-r2764-batch.ts --apply
 *   npx tsx scripts/rueda/repair-r2764-batch.ts --apply --ai
 */
import * as fs from 'fs';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { RUEDA_R2764_BATCH_ID, RUEDA_R2764_EDICION } from '../../lib/rueda/batch-constants';
import { polishRuedaListing } from '../../lib/rueda/listing-quality';
import { classifyRuedaListing } from '../../lib/rueda/classify-from-text';
import type { Categoria } from '../../types';
import { aiPolishRuedaListing } from '../../lib/rueda/ai-polish';
import { parseUbicacionFromText } from '../../lib/rueda/parse-ubicacion';
import type { RuedaExtractedAd } from './extract-edition';

const useAi = process.argv.includes('--ai');
const aiAll = process.argv.includes('--ai-all');
const apply = process.argv.includes('--apply');

async function main() {
  const jsonPath = path.join(process.cwd(), 'output', 'rueda', RUEDA_R2764_EDICION, 'avisos.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Falta avisos.json — ejecuta extract-edition.ts');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as { avisos: RuedaExtractedAd[] };
  const byKey = new Map(payload.avisos.map((a) => [a.import_key, a]));

  const { data: rows, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, descripcion, ubicacion, contacto, private_data, promotion_rank')
    .contains('private_data', { batch_id: RUEDA_R2764_BATCH_ID });

  if (error) throw error;
  console.log(`Filas batch: ${rows?.length ?? 0}, JSON: ${payload.avisos.length}`);

  let updated = 0;
  for (const row of rows || []) {
    const priv = (row.private_data || {}) as Record<string, unknown>;
    const importKey = String(priv.import_key || '');
    const src = byKey.get(importKey);
    const textoRaw =
      src?.texto_raw ||
      `${row.titulo} ${row.descripcion}`;

    let polished = polishRuedaListing({
      id: row.id as string,
      titulo: src?.titulo || (row.titulo as string),
      descripcion: src?.descripcion || (row.descripcion as string),
      textoRaw,
      categoria: src?.categoria || 'productos',
    });

    const needsAi =
      useAi &&
      src &&
      (aiAll ||
        src.requiere_revision ||
        polished.titulo.length < 22 ||
        /^[).,;\s]/.test(polished.titulo) ||
        /\b9\d{8}\b/.test(polished.titulo) ||
        /@/.test(polished.titulo) ||
        /@/.test(polished.descripcion));

    if (needsAi) {
      try {
        const ai = await aiPolishRuedaListing({
          texto: textoRaw,
          categoria: src.categoria,
          telefono: src.telefonos[0] || '',
        });
        if (ai) {
          polished = {
            ...polished,
            titulo: ai.titulo.slice(0, 120),
            descripcion: ai.descripcion.slice(0, 2000),
            ubicacion: {
              pais: 'Perú',
              departamento: 'Cusco',
              provincia: 'Cusco',
              distrito: ai.distrito || polished.ubicacion.distrito || '',
              direccion: ai.direccion || polished.ubicacion.direccion,
            },
          };
        }
      } catch (e) {
        console.warn('AI skip', row.id, e);
      }
    }

    const flyerTemplateId = src?.flyer_template || polished.flyerTemplateId;

    const nextPrivate = {
      ...priv,
      flyerTemplateId,
      flyerConfig: {},
      coverSource: 'template',
      hide_generic_location: polished.hideGenericLocation,
      quality_repaired_at: new Date().toISOString(),
    };

    if (!apply) {
      updated += 1;
      continue;
    }

    const phone = (src?.telefonos?.[0] || (row.contacto as string) || '').replace(/\D/g, '').slice(-9);
    const categoria = classifyRuedaListing(
      polished.titulo,
      polished.descripcion
    ) as Categoria;
    const contactosMultiples = phone
      ? [
          {
            tipo: 'whatsapp',
            valor: phone,
            principal: true,
            etiqueta: 'WhatsApp',
          },
        ]
      : null;

    const { error: upErr } = await supabaseAdmin
      .from('adisos')
      .update({
        titulo: polished.titulo.slice(0, 120),
        descripcion: polished.descripcion.slice(0, 2000),
        ubicacion: polished.ubicacion,
        categoria,
        contacto: phone || row.contacto,
        contactos_multiples: contactosMultiples,
        promotion_rank: 0,
        promotion_tier: 'gratis',
        private_data: { ...nextPrivate, categoria_reclasificada: categoria },
      })
      .eq('id', row.id);

    if (upErr) console.error(row.id, upErr.message);
    else {
      updated += 1;
      if (updated % 25 === 0) process.stdout.write(`\r${updated}`);
    }
  }

  console.log(`\n${apply ? 'Actualizados' : 'Preview'}: ${updated} (ai=${useAi})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
