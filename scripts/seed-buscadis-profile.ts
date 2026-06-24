/**
 * Perfil showcase de Buscadis — datos completos para demo del motor de perfiles.
 * Sube og-image.jpg a Supabase Storage y vincula dueño + reseñas.
 *
 *   npx tsx scripts/seed-buscadis-profile.ts
 *   npx tsx scripts/seed-buscadis-profile.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { buildDefaultLayout } from '../packages/profile-engine/src/index';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const CATALOG_BUCKET = 'catalog-images';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DATA_PATH = path.join(__dirname, 'data/buscadis-profile.json');

const BRAND_FILES = {
  logo: 'og-image.jpg',
  banner: 'og-image.jpg',
  og: 'og-image.jpg',
};

interface SeedReview {
  customer_name: string;
  rating: number;
  comment: string;
  is_verified?: boolean;
}

interface SeedFile {
  business: Record<string, unknown> & {
    slug: string;
    social_instagram?: string;
    social_facebook?: string;
    social_tiktok?: string;
    social_linkedin?: string;
    social_twitter?: string;
    website_url?: string;
    story_highlights?: Array<{ id: string; title: string; cover_url?: string; link_url?: string }>;
    profile_hashtags?: string[];
    metrics_config?: { keys: string[] };
    banner_config?: Record<string, unknown>;
    pending_owner_email?: string;
  };
  products: Array<{
    sku: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    price: number;
    sort_order: number;
    is_featured: boolean;
  }>;
  reviews?: SeedReview[];
}

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
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

async function uploadBrandImage(
  businessId: string,
  fileName: string,
  dryRun: boolean
): Promise<string> {
  const localPath = path.join(PUBLIC_DIR, fileName);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Imagen no encontrada: ${localPath}`);
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');
  const fallbackUrl = `${siteUrl}/${fileName}`;

  if (dryRun) {
    console.log(`  [dry-run] subiría ${fileName}`);
    return fallbackUrl;
  }

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const buffer = fs.readFileSync(localPath);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
  const storagePath = `${businessId}/brand/${fileName}`;

  const { error } = await supabaseAdmin.storage.from(CATALOG_BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) {
    console.warn(`  Storage upload falló (${error.message}), usando URL pública del sitio`);
    return fallbackUrl;
  }

  const { data } = supabaseAdmin.storage.from(CATALOG_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function buildSocialLinks(b: SeedFile['business']) {
  const links: { network: string; url: string; label?: string }[] = [];
  if (b.website_url) links.push({ network: 'custom', url: b.website_url, label: 'Sitio web' });
  if (b.social_instagram) links.push({ network: 'instagram', url: b.social_instagram });
  if (b.social_facebook) links.push({ network: 'facebook', url: b.social_facebook });
  if (b.social_tiktok) links.push({ network: 'tiktok', url: b.social_tiktok });
  if (b.social_linkedin) links.push({ network: 'linkedin', url: b.social_linkedin });
  if (b.social_twitter) links.push({ network: 'twitter', url: b.social_twitter });
  return links;
}

async function seedReviews(
  businessId: string,
  reviews: SeedReview[],
  dryRun: boolean
) {
  if (!reviews.length) return;

  if (dryRun) {
    console.log(`  [dry-run] ${reviews.length} reseñas`);
    return;
  }

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  await supabaseAdmin.from('business_reviews').delete().eq('business_profile_id', businessId);

  const rows = reviews.map((r) => ({
    business_profile_id: businessId,
    customer_name: r.customer_name,
    rating: r.rating,
    comment: r.comment,
    text: r.comment,
    is_visible: true,
    is_verified: r.is_verified ?? false,
  }));

  const { error } = await supabaseAdmin.from('business_reviews').insert(rows);
  if (error) throw error;
  console.log(`✓ ${reviews.length} reseñas cargadas`);
}

async function main() {
  const { dryRun } = parseArgs();
  const seed: SeedFile = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const b = seed.business;

  const ownerEmail = (b.pending_owner_email || 'buscadiss@gmail.com').trim().toLowerCase();
  const ownerUserId = await findUserIdByEmail(ownerEmail);
  if (ownerUserId) {
    console.log(`✓ Dueño encontrado: ${ownerEmail}`);
  } else {
    console.log(`Usuario aún no registrado (${ownerEmail}); pending_owner_email activo.`);
  }

  const layout = buildDefaultLayout('social_wireframe_v1');
  const profileBlocks = [
    { id: 'hero-0', type: 'hero', visible: true, config: {} },
    { id: 'highlights-1', type: 'highlights', visible: true, config: {} },
    { id: 'catalog-2', type: 'catalog', visible: true, config: { viewMode: 'grid' } },
    { id: 'deals-3', type: 'deals', visible: true, config: {} },
    { id: 'links-4', type: 'links', visible: true, config: {} },
    { id: 'reviews-5', type: 'reviews', visible: true, config: {} },
    { id: 'map-6', type: 'map', visible: true, config: {} },
  ];

  const { data: existing } = await supabaseAdmin
    .from('business_profiles')
    .select('id')
    .eq('slug', b.slug)
    .maybeSingle();

  let businessId = existing?.id as string | undefined;
  if (dryRun) {
    businessId = businessId || '00000000-0000-0000-0000-000000000001';
  }

  if (!businessId) {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .insert({ slug: b.slug, name: b.name, is_published: true })
      .select('id')
      .single();
    if (error) throw error;
    businessId = data.id;
    console.log(`✓ Perfil creado (borrador): ${businessId}`);
  }

  const logoUrl = await uploadBrandImage(businessId, BRAND_FILES.logo, dryRun);
  const bannerUrl = await uploadBrandImage(businessId, BRAND_FILES.banner, dryRun);
  const ogImageUrl = await uploadBrandImage(businessId, BRAND_FILES.og, dryRun);

  const profilePayload: Record<string, unknown> = {
    slug: b.slug,
    name: b.name,
    tagline: b.tagline,
    description: b.description,
    contact_whatsapp: b.contact_whatsapp,
    contact_phone: b.contact_phone || b.contact_whatsapp,
    contact_email: b.contact_email,
    contact_address: b.contact_address,
    contact_maps_url: b.contact_maps_url,
    theme_color: b.theme_color || '#f97316',
    theme_preset: b.theme_preset || 'executive',
    template_id: b.template_id || 'modern_tabs',
    logo_url: logoUrl,
    banner_url: bannerUrl,
    og_image_url: ogImageUrl,
    meta_title: b.meta_title,
    meta_description: b.meta_description,
    is_verified: b.is_verified ?? true,
    is_published: true,
    view_count: 12840,
    announcement_text: b.announcement_text,
    announcement_active: b.announcement_active ?? false,
    business_hours: b.business_hours || {},
    social_links: buildSocialLinks(b),
    custom_blocks: [
      {
        id: 'link-publicar',
        type: 'link',
        label: 'Crea tu perfil gratis',
        content: 'https://buscadis.com/publicar',
        style: 'filled',
      },
      {
        id: 'link-deals',
        type: 'link',
        label: 'Ver Deals',
        content: 'https://buscadis.com/deals',
        style: 'default',
      },
    ],
    profile_blocks: profileBlocks,
    profile_layout: layout,
    profile_style: { skinId: 'buscadis_default' },
    banner_config: {
      ...(b.banner_config as object),
      mode: 'image',
      imageUrl: bannerUrl,
      fadeBottom: false,
    },
    metrics_config: b.metrics_config || { keys: ['views', 'products', 'reviews'] },
    story_highlights: (b.story_highlights || []).map((h) => ({
      ...h,
      cover_url: ogImageUrl,
    })),
    profile_hashtags: b.profile_hashtags || [],
    location_display_level: b.location_display_level || 'city',
    ...(ownerUserId
      ? { user_id: ownerUserId, created_by: ownerUserId, pending_owner_email: null }
      : { pending_owner_email: ownerEmail }),
  };

  if (dryRun) {
    console.log('[dry-run] business_profiles:', JSON.stringify(profilePayload, null, 2));
  } else {
    const { error } = await supabaseAdmin.from('business_profiles').update(profilePayload).eq('id', businessId);
    if (error) throw error;
    console.log(`✓ Perfil actualizado: ${businessId}`);
  }

  if (!businessId || dryRun) {
    console.log(`\nPerfil demo: https://buscadis.com/@${b.slug}`);
    return;
  }

  if (ownerUserId) {
    await supabaseAdmin.from('business_members').upsert(
      {
        business_profile_id: businessId,
        user_id: ownerUserId,
        role: 'owner',
        status: 'active',
        invited_by: ownerUserId,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: 'business_profile_id,user_id' }
    );
    console.log(`✓ Miembro owner vinculado`);
  }

  for (const product of seed.products) {
    const { data: existingProduct } = await supabaseAdmin
      .from('catalog_products')
      .select('id')
      .eq('business_profile_id', businessId)
      .eq('sku', product.sku)
      .maybeSingle();

    const row = {
      business_profile_id: businessId,
      title: product.title,
      description: product.description,
      sku: product.sku,
      price: product.price,
      currency: 'PEN',
      category: product.category,
      tags: product.tags,
      images: [{ url: logoUrl, is_primary: true, alt_text: product.title }],
      status: 'published' as const,
      is_featured: product.is_featured,
      sort_order: product.sort_order,
      track_inventory: false,
    };

    if (existingProduct?.id) {
      await supabaseAdmin.from('catalog_products').update(row).eq('id', existingProduct.id);
    } else {
      await supabaseAdmin.from('catalog_products').insert(row);
    }
    console.log(`  ✓ ${product.sku}`);
  }

  await seedReviews(businessId, seed.reviews || [], dryRun);

  console.log(`\nListo → https://buscadis.com/@${b.slug}`);
  if (ownerUserId) {
    console.log(`Editar (logueado como ${ownerEmail}): https://buscadis.com/@${b.slug}?edit=true`);
  } else {
    console.log(`Regístrate con ${ownerEmail} para reclamar y editar el perfil.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
