/**
 * Crea/actualiza el perfil Buscadis de Villa Chaco y su catálogo en Supabase.
 * Sube imágenes locales a catalog-images y vincula productos con metadata completa.
 *
 * Uso:
 *   npx tsx scripts/seed-villachaco-catalog.ts
 *   npx tsx scripts/seed-villachaco-catalog.ts --dry-run
 *   npx tsx scripts/seed-villachaco-catalog.ts --owner-email dueña@ejemplo.com
 *   npx tsx scripts/seed-villachaco-catalog.ts --transfer-email dueña@ejemplo.com
 *
 * Si la dueña aún no tiene cuenta, --owner-email guarda pending_owner_email y
 * al registrarse con ese correo recibe la página automáticamente.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const CATALOG_BUCKET = 'catalog-images';
const IMAGES_DIR = path.join(process.cwd(), 'public/villachaco/images');
const DATA_PATH = path.join(__dirname, 'data/villachaco-catalog.json');

interface CatalogImageRef {
  file: string;
  is_primary: boolean;
  alt: string;
}

interface CatalogProductSeed {
  sku: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  brand: string;
  attributes: Record<string, string>;
  images: CatalogImageRef[];
  sort_order: number;
  is_featured: boolean;
}

interface CatalogSeedFile {
  business: {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    contact_whatsapp: string;
    contact_phone?: string;
    contact_email?: string;
    contact_address: string;
    theme_color: string;
    template_id: string;
    site_tier: string;
    publicadis_site_url: string;
    logo_file?: string;
    banner_file?: string;
    og_image_file?: string;
    meta_title?: string;
    meta_description?: string;
    pending_owner_email?: string;
  };
  products: CatalogProductSeed[];
}

function parseArgs() {
  const args = process.argv.slice(2);
  let ownerEmail = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--owner-email' || args[i] === '--transfer-email') {
      ownerEmail = args[++i] || '';
    }
  }
  return { dryRun: args.includes('--dry-run'), ownerEmail: ownerEmail.trim().toLowerCase() };
}

async function uploadCatalogImage(
  businessId: string,
  fileName: string,
  folder: 'products' | 'brand',
  dryRun: boolean
): Promise<string> {
  const localPath = path.join(IMAGES_DIR, fileName);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Imagen no encontrada: ${localPath}`);
  }

  const publicUrl = `https://buscadis.com/villachaco/images/${fileName}`;
  if (dryRun) {
    console.log(`  [dry-run] subiría ${fileName}`);
    return publicUrl;
  }

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const buffer = fs.readFileSync(localPath);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : ext === 'jpeg' ? 'image/jpeg' : 'image/jpeg';
  const storagePath = `${businessId}/${folder}/${fileName}`;

  const { error } = await supabaseAdmin.storage.from(CATALOG_BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) {
    console.warn(`  Storage upload falló (${error.message}), usando URL estática temporal`);
    return publicUrl;
  }

  const { data } = supabaseAdmin.storage.from(CATALOG_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

function buildSocialLinks(publicadisUrl: string) {
  return [
    { network: 'custom' as const, url: publicadisUrl, label: 'Sitio web Publicadis' },
    {
      network: 'custom' as const,
      url: 'https://buscadis.com/p/villachaco',
      label: 'Perfil Buscadis',
    },
  ];
}

async function main() {
  const { dryRun, ownerEmail } = parseArgs();
  const seed: CatalogSeedFile = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const { supabaseAdmin } = await import('../lib/supabase-admin');

  const reservedEmail = (ownerEmail || seed.business.pending_owner_email || '').trim().toLowerCase();

  console.log(`Villa Chaco — seed catálogo Buscadis${dryRun ? ' (dry-run)' : ''}`);

  let ownerUserId: string | null = null;
  if (reservedEmail) {
    ownerUserId = await findUserIdByEmail(reservedEmail);
    if (!ownerUserId) {
      console.log(`Usuario aún no registrado (${reservedEmail}); se guardará pending_owner_email.`);
    }
  }

  const { data: existing } = await supabaseAdmin
    .from('business_profiles')
    .select('id, slug')
    .eq('slug', seed.business.slug)
    .maybeSingle();

  let businessId = existing?.id as string | undefined;

  if (dryRun) {
    businessId = businessId || '00000000-0000-0000-0000-000000000001';
  }

  let logoUrl: string | undefined;
  let bannerUrl: string | undefined;
  let ogImageUrl: string | undefined;
  if (seed.business.logo_file && businessId) {
    logoUrl = await uploadCatalogImage(businessId, seed.business.logo_file, 'brand', dryRun);
  }
  if (seed.business.banner_file && businessId) {
    bannerUrl = await uploadCatalogImage(businessId, seed.business.banner_file, 'brand', dryRun);
  }
  if (seed.business.og_image_file && businessId) {
    ogImageUrl = await uploadCatalogImage(businessId, seed.business.og_image_file, 'brand', dryRun);
  }

  const profilePayload: Record<string, unknown> = {
    slug: seed.business.slug,
    name: seed.business.name,
    tagline: seed.business.tagline,
    description: seed.business.description,
    contact_whatsapp: seed.business.contact_whatsapp,
    contact_phone: seed.business.contact_phone || seed.business.contact_whatsapp,
    contact_email: seed.business.contact_email || null,
    contact_address: seed.business.contact_address,
    theme_color: seed.business.theme_color,
    template_id: seed.business.template_id,
    logo_url: logoUrl,
    banner_url: bannerUrl,
    og_image_url: ogImageUrl || bannerUrl,
    meta_title: seed.business.meta_title,
    meta_description: seed.business.meta_description,
    is_published: true,
    site_tier: seed.business.site_tier || 'both',
    publicadis_template_id: 'artisan-brand',
    publicadis_published: true,
    social_links: buildSocialLinks(seed.business.publicadis_site_url),
    ...(ownerUserId
      ? { user_id: ownerUserId, created_by: ownerUserId, pending_owner_email: null }
      : reservedEmail
        ? { pending_owner_email: reservedEmail }
        : {}),
  };

  if (dryRun) {
    console.log('[dry-run] business_profiles upsert:', profilePayload);
  } else if (businessId) {
    const { error } = await supabaseAdmin.from('business_profiles').update(profilePayload).eq('id', businessId);
    if (error) throw error;
    console.log(`✓ Perfil actualizado: ${businessId}`);
  } else {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .insert(profilePayload)
      .select('id')
      .single();
    if (error) throw error;
    businessId = data.id;
    console.log(`✓ Perfil creado: ${businessId}`);
  }

  if (!businessId) throw new Error('No se pudo resolver business_profile_id');

  if (ownerUserId && !dryRun) {
    await supabaseAdmin.from('business_members').upsert(
      {
        business_profile_id: businessId,
        user_id: ownerUserId,
        role: 'owner',
        invited_by: ownerUserId,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: 'business_profile_id,user_id' }
    );
    console.log(`✓ Dueño asignado: ${reservedEmail}`);
  } else if (reservedEmail && !dryRun) {
    console.log(`✓ Dueño pendiente por correo: ${reservedEmail}`);
  }

  for (const product of seed.products) {
    console.log(`→ ${product.sku}: ${product.title}`);

    const images = [];
    for (const img of product.images) {
      const url = await uploadCatalogImage(businessId, img.file, 'products', dryRun);
      images.push({
        url,
        is_primary: img.is_primary,
        ai_enhanced: false,
        alt_text: img.alt,
      });
    }

    const row = {
      business_profile_id: businessId,
      title: product.title,
      description: product.description,
      sku: product.sku,
      brand: product.brand,
      images,
      currency: 'PEN',
      category: product.category,
      tags: product.tags,
      attributes: product.attributes,
      status: 'published' as const,
      is_featured: product.is_featured,
      sort_order: product.sort_order,
      track_inventory: false,
      seo_title: `${product.title} | Villa Chaco`,
      seo_description: product.description,
      seo_keywords: product.tags,
      ai_metadata: { seed_source: 'villachaco-catalog.json', seeded_at: new Date().toISOString() },
      published_at: new Date().toISOString(),
    };

    if (dryRun) {
      console.log('  [dry-run] catalog_products upsert por sku');
      continue;
    }

    const { data: existingProduct } = await supabaseAdmin
      .from('catalog_products')
      .select('id')
      .eq('business_profile_id', businessId)
      .eq('sku', product.sku)
      .maybeSingle();

    if (existingProduct?.id) {
      const { error } = await supabaseAdmin.from('catalog_products').update(row).eq('id', existingProduct.id);
      if (error) throw error;
      console.log(`  ✓ actualizado (${existingProduct.id})`);
    } else {
      const { error } = await supabaseAdmin.from('catalog_products').insert(row);
      if (error) throw error;
      console.log('  ✓ creado');
    }
  }

  const publicadisSite = {
    business_profile_id: businessId,
    slug: seed.business.slug,
    template_id: 'artisan-brand',
    static_path: '/villachaco/index.html',
    is_published: true,
    published_at: new Date().toISOString(),
    config: {
      hero_image: seed.business.banner_file || 'catalog-chocolate-dark-fresa-70cacao-50g.jpg',
      buscadis_profile_url: `https://buscadis.com/p/${seed.business.slug}`,
      canonical_url: seed.business.publicadis_site_url,
    },
  };

  if (dryRun) {
    console.log('[dry-run] publicadis_sites upsert:', publicadisSite);
  } else {
    const { error: siteError } = await supabaseAdmin
      .from('publicadis_sites')
      .upsert(publicadisSite, { onConflict: 'business_profile_id' });
    if (siteError) {
      console.warn('publicadis_sites:', siteError.message);
    } else {
      console.log('✓ Sitio Publicadis registrado');
    }
  }

  console.log('\nListo.');
  console.log(`Perfil Buscadis: https://buscadis.com/p/${seed.business.slug}`);
  console.log(`Sitio Publicadis: ${seed.business.publicadis_site_url}`);
  if (reservedEmail && !ownerUserId) {
    console.log(`Asignación pendiente: ${reservedEmail} (al crear cuenta)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
