/**
 * Sube imágenes locales a avisos Eco Terra y crea historias premium (48h).
 *
 * Uso:
 *   npx tsx scripts/upload-eco-terra-media.ts
 *   npx tsx scripts/upload-eco-terra-media.ts --dry-run
 *   npx tsx scripts/upload-eco-terra-media.ts --force
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ADISO_IMAGES_BUCKET_FALLBACKS } from '../lib/storage-buckets';
import { createStoryFromAdiso } from '../lib/stories/adiso-sync';
import { dbToAdiso } from '../lib/supabase';
import { onAdisoSearchIndexUpdate } from '../lib/search/post-create';
import type { Adiso } from '../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'eco-terra-jobs-2026-06';
const STORY_TIER = 'premium' as const;

/** slug del aviso → nombre de archivo en scripts/data/ */
const IMAGE_BY_SLUG: Record<string, string> = {
  'atencion-cliente': 'atencion-cliente.png',
  recepcionista: 'recepcionista.png',
  housekeeping: 'housekeeping.png',
  cajera: 'cajera.png',
  'chef-ejecutivo': 'chef.png',
  'ayudante-cocina': 'ayudante-cocina.png',
  '6-vacantes': '6-vacantes.png',
};

async function uploadImageFromPath(
  filePath: string,
  userId: string,
  slug: string
): Promise<string> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1) || 'png';
  const contentType = ext === 'png' ? 'image/png' : `image/${ext}`;
  const fileName = `${userId}/adisos/${slug}-${Date.now()}.${ext}`;

  let lastError: string | undefined;

  for (const bucketName of ADISO_IMAGES_BUCKET_FALLBACKS) {
    const { error } = await supabaseAdmin.storage.from(bucketName).upload(fileName, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

    if (!error) {
      const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName);
      return data.publicUrl;
    }

    lastError = error.message;
    const bucketMissing =
      error.message?.toLowerCase().includes('bucket') ||
      error.message?.toLowerCase().includes('not found');
    if (!bucketMissing) break;
  }

  throw new Error(lastError || `No se pudo subir ${filePath}`);
}

async function fetchBatchAdisos(): Promise<Adiso[]> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('*')
    .contains('private_data', { batch_id: BATCH_ID });

  if (error) throw error;
  return (data || []).map((row) => dbToAdiso(row));
}

async function storyExistsForAdiso(adisoId: string): Promise<boolean> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { data, error } = await supabaseAdmin
    .from('stories')
    .select('id')
    .eq('adiso_id', adisoId)
    .limit(1);

  if (error) {
    console.warn(`  No se pudo verificar historias para ${adisoId}:`, error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const dataDir = path.join(__dirname, 'data');

  console.log('Eco Terra Lodge — imágenes + historias (48h premium)');
  console.log(`Batch: ${BATCH_ID}`);

  const adisos = await fetchBatchAdisos();
  if (adisos.length === 0) {
    console.error('No se encontraron avisos con este batch_id.');
    process.exit(1);
  }

  console.log(`Avisos encontrados: ${adisos.length}\n`);

  const results: { slug: string; id: string; imageUrl?: string; story: string }[] = [];

  for (const adiso of adisos) {
    const slug = (adiso.privateData?.job_slug as string) || adiso.id;
    const imageFile = IMAGE_BY_SLUG[slug];
    const userId = adiso.user_id || adiso.usuario_id;

    console.log(`→ ${slug} (${adiso.id})`);

    if (!imageFile) {
      console.warn(`  ⚠ Sin imagen mapeada para slug "${slug}"`);
      results.push({ slug, id: adiso.id, story: 'skipped' });
      continue;
    }

    const imagePath = path.join(dataDir, imageFile);
    if (!fs.existsSync(imagePath)) {
      console.warn(`  ⚠ Archivo no encontrado: ${imagePath}`);
      results.push({ slug, id: adiso.id, story: 'skipped' });
      continue;
    }

    if (!userId) {
      console.warn('  ⚠ Aviso sin user_id');
      results.push({ slug, id: adiso.id, story: 'skipped' });
      continue;
    }

    const hasImage = Boolean(adiso.imagenUrl || adiso.imagenesUrls?.length);
    let imageUrl = adiso.imagenUrl || adiso.imagenesUrls?.[0];

    if (hasImage && !force) {
      console.log(`  Imagen ya presente: ${imageUrl}`);
    } else {
      if (dryRun) {
        console.log(`  (dry-run) Subiría ${imageFile}`);
        imageUrl = `https://example.com/${imageFile}`;
      } else {
        imageUrl = await uploadImageFromPath(imagePath, userId, slug);
        const { supabaseAdmin } = await import('../lib/supabase-admin');
        const { error } = await supabaseAdmin
          .from('adisos')
          .update({
            imagen_url: imageUrl,
            imagenes_urls: JSON.stringify([imageUrl]),
          })
          .eq('id', adiso.id);

        if (error) throw error;
        console.log(`  ✓ Imagen subida: ${imageUrl}`);
      }
    }

    const adisoWithMedia: Adiso = {
      ...adiso,
      imagenUrl: imageUrl,
      imagenesUrls: [imageUrl!],
    };

    if (!dryRun && (!hasImage || force)) {
      onAdisoSearchIndexUpdate(adisoWithMedia);
    }

    const alreadyHasStory = await storyExistsForAdiso(adiso.id);
    let storyStatus = 'skipped';

    if (alreadyHasStory && !force) {
      console.log('  Historia ya existe para este aviso');
      storyStatus = 'exists';
    } else if (dryRun) {
      console.log(`  (dry-run) Crearía historia ${STORY_TIER} (48h)`);
      storyStatus = 'dry-run';
    } else {
      await createStoryFromAdiso(userId, adisoWithMedia, {
        promotionTier: STORY_TIER,
      });
      console.log(`  ✓ Historia ${STORY_TIER} creada (48h)`);
      storyStatus = 'created';
    }

    results.push({ slug, id: adiso.id, imageUrl, story: storyStatus });
  }

  console.log('\n--- Resumen ---');
  for (const r of results) {
    console.log(`  ${r.slug}: imagen=${r.imageUrl ? 'ok' : '—'} | historia=${r.story}`);
  }

  if (dryRun) {
    console.log('\n(dry-run — no se modificó la base de datos ni storage)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
