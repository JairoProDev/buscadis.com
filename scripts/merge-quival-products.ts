/**
 * Analiza y fusiona productos Quival duplicados (variantes por medida/tamaño).
 *
 *   npx tsx scripts/merge-quival-products.ts --dry-run
 *   npx tsx scripts/merge-quival-products.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SLUG = 'quival';
const MIN_GROUP_SIZE = 3;

type Product = {
  id: string;
  title: string;
  category: string | null;
  images: unknown;
  attributes: Record<string, unknown> | null;
  sort_order: number | null;
  status: string;
  created_at: string;
};

function hasImage(images: unknown): boolean {
  if (!Array.isArray(images)) return false;
  return images.some((img) =>
    typeof img === 'string' ? img.trim().length > 0 : Boolean((img as { url?: string })?.url)
  );
}

/** Normaliza título para agrupar variantes (quita medidas/números). */
function baseTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\d+\/?\d*\s*(\"|pulg|mm|cm|m|kg|g|l|ml|w|v|a|u|\s)/gi, '#')
    .replace(/\b\d+\b/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function variantLabel(title: string, base: string): string {
  const rest = title.replace(new RegExp(base, 'i'), '').trim();
  return rest || title;
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');

  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await sb
    .from('business_profiles')
    .select('id, slug')
    .eq('slug', SLUG)
    .maybeSingle();
  if (!profile) throw new Error(`Perfil ${SLUG} no encontrado`);

  let all: Product[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('catalog_products')
      .select('id, title, category, images, attributes, sort_order, status, created_at')
      .eq('business_profile_id', profile.id)
      .range(from, from + 999);
    if (error) throw error;
    all = all.concat((data as Product[]) || []);
    if (!data || data.length < 1000) break;
    from += 1000;
  }

  const groups = new Map<string, Product[]>();
  for (const p of all) {
    const cat = p.category || 'Otros';
    const key = `${cat}::${baseTitle(p.title)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const mergeGroups = [...groups.entries()]
    .filter(([, items]) => items.length >= MIN_GROUP_SIZE)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`\nQuival: ${all.length} productos, ${mergeGroups.length} grupos fusionables (≥${MIN_GROUP_SIZE})\n`);

  let toArchive = 0;
  for (const [key, items] of mergeGroups.slice(0, 15)) {
    const keeper =
      items.find((p) => hasImage(p.images)) ||
      items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
    const variants = items
      .filter((p) => p.id !== keeper.id)
      .map((p) => ({
        id: p.id,
        label: variantLabel(p.title, baseTitle(p.title)),
        title: p.title,
      }));
    toArchive += variants.length;
    console.log(`• ${items.length}x [${key.split('::')[0]}] ${keeper.title.slice(0, 55)}`);
    console.log(`  → conservar ${keeper.id.slice(0, 8)}… + ${variants.length} variantes`);
  }
  console.log(`\nTotal a archivar si aplicas: ${toArchive} filas\n`);

  if (dryRun) {
    console.log('Modo dry-run. Usa --apply para fusionar.');
    return;
  }

  let merged = 0;
  for (const [, items] of mergeGroups) {
    const keeper =
      items.find((p) => hasImage(p.images)) ||
      items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
    const variants = items
      .filter((p) => p.id !== keeper.id)
      .map((p) => ({
        source_id: p.id,
        label: variantLabel(p.title, baseTitle(p.title)),
        title: p.title,
      }));

    const attrs = { ...(keeper.attributes || {}), variants };
    await sb
      .from('catalog_products')
      .update({ attributes: attrs, updated_at: new Date().toISOString() })
      .eq('id', keeper.id);

    const archiveIds = variants.map((v) => v.source_id);
    if (archiveIds.length > 0) {
      await sb
        .from('catalog_products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .in('id', archiveIds);
      merged += archiveIds.length;
    }
  }

  console.log(`Fusionados: ${merged} productos archivados como variantes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
