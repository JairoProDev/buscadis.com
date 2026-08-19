/**
 * Cura el catálogo Quival para venta presencial (iPad / PDF offline):
 * 1. Separa y ordena categorías: Tubos → Accesorios → Pinturas → Malla Rashell → Arpilleras → Plásticos → resto
 * 2. Archiva productos publicados sin imagen (reversible: status = archived)
 *
 *   npx tsx scripts/curate-quival-catalog.ts --dry-run
 *   npx tsx scripts/curate-quival-catalog.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SLUG = 'quival';

/** Orden de categorías prioritarias (el resto conserva su nombre y va después). */
const PRIORITY_CATEGORIES = [
  'Tubos',
  'Accesorios',
  'Pinturas',
  'Malla Rashell',
  'Arpilleras',
  'Plásticos',
] as const;

const REST_ORDER = [
  'Grifería',
  'Ferretería Varios',
  'Accesorios Eléctricos',
  'Iluminación',
  'Mangueras y Riego',
] as const;

type Product = {
  id: string;
  title: string;
  category: string | null;
  images: unknown;
  status: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

function hasImage(images: unknown): boolean {
  if (!Array.isArray(images) || images.length === 0) return false;
  return images.some((img) =>
    typeof img === 'string' ? img.trim().length > 0 : Boolean((img as { url?: string })?.url?.trim())
  );
}

function categorySlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'categoria'
  );
}

/** Clasifica productos de las categorías mezcladas hacia las nuevas. */
function mapProductCategory(title: string, current: string | null): string | null {
  const t = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const cat = (current || '').trim();

  if (cat === 'Tuberías y Accesorios' || cat === 'Tuberías') {
    if (/\btubo/.test(t)) return 'Tubos';
    return 'Accesorios';
  }

  if (cat === 'Plásticos, Mallas y Arpilleras') {
    if (/raschel|rachel|rashell|malla/.test(t)) return 'Malla Rashell';
    if (/arpillera/.test(t)) return 'Arpilleras';
    if (/plastico/.test(t)) return 'Plásticos';
    return 'Plásticos';
  }

  if (cat === 'Pinturas y Accesorios') return 'Pinturas';

  return null; // sin cambio
}

async function fetchAllProducts(sb: SupabaseClient, profileId: string): Promise<Product[]> {
  let all: Product[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('catalog_products')
      .select('id, title, category, images, status')
      .eq('business_profile_id', profileId)
      .is('deleted_at', null)
      .range(from, from + 999);
    if (error) throw error;
    all = all.concat((data as Product[]) || []);
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return all;
}

async function ensureCategory(
  sb: SupabaseClient,
  profileId: string,
  existing: CategoryRow[],
  name: string,
  sortOrder: number
): Promise<CategoryRow> {
  const found = existing.find((c) => c.name === name);
  if (found) {
    if (found.sort_order !== sortOrder) {
      await sb.from('business_categories').update({ sort_order: sortOrder }).eq('id', found.id);
      found.sort_order = sortOrder;
    }
    return found;
  }

  // Reutilizar categorías vacías/huérfanas por nombre similar
  const aliases: Record<string, string[]> = {
    Tubos: ['Tuberías', 'Tuberías y Accesorios'],
    Pinturas: ['Pinturas y Accesorios'],
    Plásticos: ['Plásticos, Mallas y Arpilleras'],
  };
  for (const alias of aliases[name] || []) {
    const reuse = existing.find((c) => c.name === alias);
    if (reuse) {
      const { error } = await sb
        .from('business_categories')
        .update({ name, slug: categorySlug(name), sort_order: sortOrder })
        .eq('id', reuse.id);
      if (error) throw error;
      reuse.name = name;
      reuse.slug = categorySlug(name);
      reuse.sort_order = sortOrder;
      return reuse;
    }
  }

  const { data, error } = await sb
    .from('business_categories')
    .insert({
      business_profile_id: profileId,
      name,
      slug: categorySlug(name),
      sort_order: sortOrder,
    })
    .select('id, name, slug, sort_order')
    .single();
  if (error) throw error;
  const row = data as CategoryRow;
  existing.push(row);
  return row;
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

  const products = await fetchAllProducts(sb, profile.id);
  const { data: catsData, error: catsErr } = await sb
    .from('business_categories')
    .select('id, name, slug, sort_order')
    .eq('business_profile_id', profile.id)
    .order('sort_order', { ascending: true });
  if (catsErr) throw catsErr;
  const categories = (catsData as CategoryRow[]) || [];

  const toArchive = products.filter(
    (p) => p.status === 'published' && !hasImage(p.images)
  );
  const withImage = products.filter((p) => p.status === 'published' && hasImage(p.images));

  const recategorizations = new Map<string, string[]>(); // newCat -> titles
  const updates: { id: string; from: string; to: string; title: string }[] = [];
  for (const p of products) {
    const next = mapProductCategory(p.title, p.category);
    if (next && next !== p.category) {
      updates.push({ id: p.id, from: p.category || '(sin)', to: next, title: p.title });
      if (!recategorizations.has(next)) recategorizations.set(next, []);
      recategorizations.get(next)!.push(p.title);
    }
  }

  console.log(`\n=== Quival catalog curation ${dryRun ? '(DRY-RUN)' : '(APPLY)'} ===\n`);
  console.log(`Productos totales: ${products.length}`);
  console.log(`Publicados CON imagen: ${withImage.length}`);
  console.log(`Publicados SIN imagen → archivar: ${toArchive.length}`);
  console.log(`Reclasificaciones de categoría: ${updates.length}`);

  console.log('\n— Destino de reclasificación —');
  for (const [cat, titles] of [...recategorizations.entries()].sort()) {
    console.log(`  ${cat}: ${titles.length}`);
  }

  console.log('\n— Orden de categorías objetivo —');
  const finalOrder = [...PRIORITY_CATEGORIES, ...REST_ORDER];
  finalOrder.forEach((name, i) => console.log(`  ${i}. ${name}`));

  if (dryRun) {
    console.log('\nModo dry-run. Usa --apply para ejecutar.');
    return;
  }

  // 1) Asegurar categorías prioritarias + resto en orden
  for (let i = 0; i < PRIORITY_CATEGORIES.length; i++) {
    await ensureCategory(sb, profile.id, categories, PRIORITY_CATEGORIES[i], i);
  }
  for (let i = 0; i < REST_ORDER.length; i++) {
    await ensureCategory(
      sb,
      profile.id,
      categories,
      REST_ORDER[i],
      PRIORITY_CATEGORIES.length + i
    );
  }

  // Eliminar categorías viejas ya no usadas (si quedaron sin renombrar)
  const keepNames = new Set<string>([...PRIORITY_CATEGORIES, ...REST_ORDER]);
  const stale = categories.filter((c) => !keepNames.has(c.name));
  for (const c of stale) {
    const stillUsed = products.some(
      (p) =>
        p.category === c.name &&
        !mapProductCategory(p.title, p.category)
    );
    // Si todos se reclasifican o no hay productos, borrar categoría
    const remaining = products.filter((p) => {
      const mapped = mapProductCategory(p.title, p.category);
      return (mapped ?? p.category) === c.name;
    });
    if (remaining.length === 0 && !stillUsed) {
      await sb.from('business_categories').delete().eq('id', c.id);
      console.log(`Categoría eliminada (vacía): ${c.name}`);
    } else {
      // Empujar al final
      const sortOrder = finalOrder.length;
      await sb.from('business_categories').update({ sort_order: sortOrder }).eq('id', c.id);
      console.log(`Categoría conservada al final: ${c.name} (sort ${sortOrder})`);
    }
  }

  // 2) Reclasificar productos
  const byTarget = new Map<string, string[]>();
  for (const u of updates) {
    if (!byTarget.has(u.to)) byTarget.set(u.to, []);
    byTarget.get(u.to)!.push(u.id);
  }
  let moved = 0;
  for (const [to, ids] of byTarget) {
    // batch in chunks of 100
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { error } = await sb
        .from('catalog_products')
        .update({ category: to, updated_at: new Date().toISOString() })
        .in('id', chunk);
      if (error) throw error;
      moved += chunk.length;
    }
  }
  console.log(`\nProductos reclasificados: ${moved}`);

  // 3) Archivar sin imagen
  let archived = 0;
  const archiveIds = toArchive.map((p) => p.id);
  for (let i = 0; i < archiveIds.length; i += 100) {
    const chunk = archiveIds.slice(i, i + 100);
    const { error } = await sb
      .from('catalog_products')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .in('id', chunk);
    if (error) throw error;
    archived += chunk.length;
  }
  console.log(`Productos archivados (sin imagen): ${archived}`);

  // 4) Ordenar productos publicados: prioridad de categoría → sort_order previo
  const catRank = new Map(finalOrder.map((name, i) => [name, i]));
  const { data: publishedRows, error: pubErr } = await sb
    .from('catalog_products')
    .select('id, category, sort_order, title')
    .eq('business_profile_id', profile.id)
    .eq('status', 'published')
    .is('deleted_at', null);
  if (pubErr) throw pubErr;
  const sorted = [...(publishedRows || [])].sort((a, b) => {
    const ar = catRank.get(a.category || '') ?? 999;
    const br = catRank.get(b.category || '') ?? 999;
    if (ar !== br) return ar - br;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.title.localeCompare(b.title);
  });
  for (let i = 0; i < sorted.length; i += 50) {
    const chunk = sorted.slice(i, i + 50);
    await Promise.all(
      chunk.map((p, idx) =>
        sb
          .from('catalog_products')
          .update({ sort_order: i + idx, updated_at: new Date().toISOString() })
          .eq('id', p.id)
      )
    );
  }
  console.log(`sort_order actualizado en ${sorted.length} publicados (Tubos primero).`);

  // Verificar
  const { count: publishedCount } = await sb
    .from('catalog_products')
    .select('id', { count: 'exact', head: true })
    .eq('business_profile_id', profile.id)
    .eq('status', 'published')
    .is('deleted_at', null);

  const { data: finalCats } = await sb
    .from('business_categories')
    .select('name, sort_order')
    .eq('business_profile_id', profile.id)
    .order('sort_order', { ascending: true });

  console.log(`\nPublicados restantes: ${publishedCount}`);
  console.log('Categorías finales:');
  for (const c of finalCats || []) {
    console.log(`  ${c.sort_order}. ${c.name}`);
  }
  console.log('\nListo. Los archivados se pueden republicar cuando tengan foto.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
