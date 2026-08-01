/**
 * Crea/actualiza el perfil Buscadis de Cristalimag + catálogo de servicios.
 *
 * Uso:
 *   npx tsx scripts/seed-cristalimag-catalog.ts
 *   npx tsx scripts/seed-cristalimag-catalog.ts --dry-run
 *   npx tsx scripts/seed-cristalimag-catalog.ts --owner-email cristalimag@gmail.com
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const CATALOG_BUCKET = 'catalog-images';
const IMAGES_DIR = path.join(process.cwd(), 'public/cristalimag/images');
const DATA_PATH = path.join(__dirname, 'data/cristalimag-catalog.json');

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
    contact_maps_url?: string;
    theme_color: string;
    theme_accent_color?: string;
    template_id: string;
    site_tier: string;
    subscription_tier?: string;
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

  const fallback = `https://cristalimag.adis.lat/cristalimag/images/brand/${fileName}`;
  if (dryRun) {
    console.log(`  [dry-run] subiría ${fileName}`);
    return fallback;
  }

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const buffer = fs.readFileSync(localPath);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const contentType =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'jpeg' || ext === 'jpg'
          ? 'image/jpeg'
          : 'image/jpeg';
  const storagePath = `${businessId}/${folder}/${fileName}`;

  const { error } = await supabaseAdmin.storage.from(CATALOG_BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) {
    console.warn(`  Storage upload falló (${error.message}), usando fallback`);
    return fallback;
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

function buildSocialLinks(seed: CatalogSeedFile['business']) {
  const links: { network: 'custom' | 'instagram' | 'facebook' | 'tiktok'; url: string; label?: string }[] = [];
  if (seed.publicadis_site_url) {
    links.push({
      network: 'custom',
      url: seed.publicadis_site_url,
      label: 'Sitio web',
    });
  }
  links.push({
    network: 'custom',
    url: `https://buscadis.com/@${seed.slug}`,
    label: 'Perfil Buscadis',
  });
  if (seed.contact_maps_url) {
    links.push({
      network: 'custom',
      url: seed.contact_maps_url,
      label: 'Cómo llegar',
    });
  }
  return links;
}

function buildCustomBlocks(seed: CatalogSeedFile['business']) {
  const blocks: {
    id: string;
    type: 'link' | 'text';
    label: string;
    content: string;
    style: 'default' | 'filled';
  }[] = [];

  const wa1 = (seed.contact_whatsapp || '').replace(/\D/g, '');
  const phone2 = (seed.contact_phone || '').replace(/\D/g, '');

  if (wa1) {
    blocks.push({
      id: 'link-whatsapp-1',
      type: 'link',
      label: 'WhatsApp 959 206 666',
      content: `https://wa.me/${wa1}?text=${encodeURIComponent('Hola Cristalimag, quiero cotizar un proyecto.')}`,
      style: 'filled',
    });
  }

  if (phone2 && phone2 !== wa1) {
    blocks.push({
      id: 'link-whatsapp-2',
      type: 'link',
      label: 'WhatsApp / Tel. 958 910 762',
      content: `https://wa.me/${phone2}?text=${encodeURIComponent('Hola Cristalimag, quiero cotizar un proyecto.')}`,
      style: 'filled',
    });
  }

  if (seed.publicadis_site_url) {
    blocks.push({
      id: 'link-web',
      type: 'link',
      label: 'Ver proyectos en la web',
      content: seed.publicadis_site_url,
      style: 'default',
    });
  }

  if (seed.contact_maps_url) {
    blocks.push({
      id: 'link-maps',
      type: 'link',
      label: 'Ver ubicación en Maps',
      content: seed.contact_maps_url,
      style: 'default',
    });
  }

  blocks.push({
    id: 'text-servicios',
    type: 'text',
    label: 'Servicios',
    content:
      'Vidrios arquitectónicos · Aluminio · Mamparas · Barandas · Fachadas · Drywall · Pérgolas · Obra completa',
    style: 'default',
  });

  return blocks;
}

function buildStoryHighlights(uploaded: Record<string, string>) {
  const pick = (file: string, title: string, id: string) =>
    uploaded[file]
      ? { id, title, cover_url: uploaded[file] }
      : null;

  return [
    pick('banner-fachada-residencial-vidrio-aluminio.jpg', 'Fachadas', 'hl-fachadas'),
    pick('mampara-corrediza-patio-residencial.jpg', 'Mamparas', 'hl-mamparas'),
    pick('baranda-vidrio-balcon-atardecer.jpg', 'Barandas', 'hl-barandas'),
    pick('detalle-ventana-aluminio-negro-mate.jpg', 'Ventanas', 'hl-ventanas'),
    pick('local-cristalimag-esquina-cerro-colorado.jpg', 'Local', 'hl-local'),
  ].filter(Boolean);
}

async function main() {
  const { dryRun, ownerEmail } = parseArgs();
  const seed: CatalogSeedFile = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const { supabaseAdmin } = await import('../lib/supabase-admin');

  const reservedEmail = (ownerEmail || seed.business.pending_owner_email || '').trim().toLowerCase();

  console.log(`Cristalimag — seed perfil Buscadis${dryRun ? ' (dry-run)' : ''}`);

  let ownerUserId: string | null = null;
  if (reservedEmail) {
    ownerUserId = await findUserIdByEmail(reservedEmail);
    if (!ownerUserId) {
      console.log(`Usuario aún no registrado (${reservedEmail}); se guardará pending_owner_email.`);
    } else {
      console.log(`Usuario encontrado: ${reservedEmail} → ${ownerUserId}`);
    }
  }

  const { data: existing } = await supabaseAdmin
    .from('business_profiles')
    .select('id, slug')
    .eq('slug', seed.business.slug)
    .maybeSingle();

  let businessId = existing?.id as string | undefined;

  if (!businessId && !dryRun) {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .insert({
        slug: seed.business.slug,
        name: seed.business.name,
        is_published: false,
        ...(ownerUserId
          ? { user_id: ownerUserId, created_by: ownerUserId }
          : reservedEmail
            ? { pending_owner_email: reservedEmail }
            : {}),
      })
      .select('id')
      .single();
    if (error) throw error;
    businessId = data.id;
    console.log(`✓ Perfil creado (borrador): ${businessId}`);
  }

  if (dryRun) {
    businessId = businessId || '00000000-0000-0000-0000-000000000001';
  }

  if (!businessId) throw new Error('No se pudo resolver business_profile_id');

  const brandFiles = [
    seed.business.logo_file,
    seed.business.banner_file,
    seed.business.og_image_file,
  ].filter(Boolean) as string[];

  const productFiles = Array.from(
    new Set(seed.products.flatMap((p) => p.images.map((i) => i.file)))
  );

  const uploaded: Record<string, string> = {};
  for (const file of brandFiles) {
    uploaded[file] = await uploadCatalogImage(businessId, file, 'brand', dryRun);
  }
  for (const file of productFiles) {
    if (!uploaded[file]) {
      uploaded[file] = await uploadCatalogImage(businessId, file, 'products', dryRun);
    }
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
    contact_maps_url: seed.business.contact_maps_url || null,
    theme_color: seed.business.theme_color,
    theme_accent_color: seed.business.theme_accent_color || null,
    template_id: seed.business.template_id,
    logo_url: seed.business.logo_file ? uploaded[seed.business.logo_file] : null,
    banner_url: seed.business.banner_file ? uploaded[seed.business.banner_file] : null,
    og_image_url: seed.business.og_image_file
      ? uploaded[seed.business.og_image_file]
      : seed.business.banner_file
        ? uploaded[seed.business.banner_file]
        : null,
    meta_title: seed.business.meta_title,
    meta_description: seed.business.meta_description,
    is_published: true,
    site_tier: seed.business.site_tier || 'both',
    subscription_tier: seed.business.subscription_tier || 'pro',
    publicadis_template_id: 'atelier-glass',
    publicadis_published: true,
    social_links: buildSocialLinks(seed.business),
    custom_blocks: buildCustomBlocks(seed.business),
    story_highlights: buildStoryHighlights(uploaded),
    business_hours: [
      { day: 'monday', open: '08:00', close: '18:00', closed: false },
      { day: 'tuesday', open: '08:00', close: '18:00', closed: false },
      { day: 'wednesday', open: '08:00', close: '18:00', closed: false },
      { day: 'thursday', open: '08:00', close: '18:00', closed: false },
      { day: 'friday', open: '08:00', close: '18:00', closed: false },
      { day: 'saturday', open: '08:00', close: '18:00', closed: false },
      { day: 'sunday', open: '00:00', close: '00:00', closed: true },
    ],
    banner_config: {
      mode: 'image',
      imageUrl: seed.business.banner_file ? uploaded[seed.business.banner_file] : undefined,
      headline: seed.business.name,
      subheadline: seed.business.tagline,
      ctaLabel: 'Cotizar por WhatsApp',
      ctaUrl: `https://wa.me/${(seed.business.contact_whatsapp || '').replace(/\D/g, '')}`,
    },
    ...(ownerUserId
      ? { user_id: ownerUserId, created_by: ownerUserId, pending_owner_email: null }
      : reservedEmail
        ? { pending_owner_email: reservedEmail }
        : {}),
  };

  if (dryRun) {
    console.log('[dry-run] business_profiles upsert keys:', Object.keys(profilePayload));
  } else {
    const { error } = await supabaseAdmin.from('business_profiles').update(profilePayload).eq('id', businessId);
    if (error) throw error;
    console.log(`✓ Perfil actualizado: ${businessId}`);
  }

  if (ownerUserId && !dryRun) {
    await supabaseAdmin.from('business_members').upsert(
      {
        business_profile_id: businessId,
        user_id: ownerUserId,
        role: 'owner',
        invited_by: ownerUserId,
        accepted_at: new Date().toISOString(),
        status: 'active',
      },
      { onConflict: 'business_profile_id,user_id' }
    );
    console.log(`✓ Dueño asignado: ${reservedEmail}`);
  } else if (reservedEmail && !dryRun) {
    console.log(`✓ Dueño pendiente por correo: ${reservedEmail}`);
  }

  for (const product of seed.products) {
    console.log(`→ ${product.sku}: ${product.title}`);

    const images = product.images.map((img) => ({
      url: uploaded[img.file],
      is_primary: img.is_primary,
      ai_enhanced: !img.file.includes('local-') && !img.file.includes('proceso-') && !img.file.includes('pergola-'),
      alt_text: img.alt,
    }));

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
      seo_title: `${product.title} | Cristalimag Arequipa`,
      seo_description: product.description,
      seo_keywords: product.tags,
      ai_metadata: { seed_source: 'cristalimag-catalog.json', seeded_at: new Date().toISOString() },
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
    template_id: 'atelier-glass',
    static_path: '/cristalimag/index.html',
    is_published: true,
    published_at: new Date().toISOString(),
    config: {
      hero_image: seed.business.banner_file,
      buscadis_profile_url: `https://buscadis.com/@${seed.business.slug}`,
      canonical_url: seed.business.publicadis_site_url,
    },
  };

  if (!dryRun) {
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
  console.log(`Perfil Buscadis: https://buscadis.com/@${seed.business.slug}`);
  console.log(`Sitio web: ${seed.business.publicadis_site_url}`);
  if (reservedEmail && !ownerUserId) {
    console.log(`Asignación pendiente: ${reservedEmail} (al crear cuenta en Buscadis)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
