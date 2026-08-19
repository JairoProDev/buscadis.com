/**
 * Crea/actualiza el perfil Buscadis de La Casa de Tay + 4 unidades.
 *
 * Uso (desde buscadis.com):
 *   npx tsx scripts/seed-lacasadetay-catalog.ts
 *   npx tsx scripts/seed-lacasadetay-catalog.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const CATALOG_BUCKET = 'catalog-images';
const IMAGES_DIR = path.join(process.cwd(), 'public/lacasadetay/images');
const DATA_PATH = path.join(__dirname, 'data/lacasadetay-catalog.json');

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
    contact_address: string;
    theme_color: string;
    theme_accent_color?: string;
    template_id: string;
    site_tier: string;
    subscription_tier?: string;
    publicadis_site_url: string;
    social_instagram?: string;
    logo_file?: string;
    banner_file?: string;
    og_image_file?: string;
    meta_title?: string;
    meta_description?: string;
  };
  products: CatalogProductSeed[];
}

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
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

  if (dryRun) {
    console.log(`  [dry-run] subiría ${fileName}`);
    return `https://buscadis.com/lacasadetay/images/${fileName}`;
  }

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const buffer = fs.readFileSync(localPath);
  const storagePath = `${businessId}/${folder}/${fileName}`;

  const { error } = await supabaseAdmin.storage.from(CATALOG_BUCKET).upload(storagePath, buffer, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload ${fileName}: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(CATALOG_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function waDigits(seed: CatalogSeedFile['business']) {
  return (seed.contact_whatsapp || '').replace(/\D/g, '');
}

function buildSocialLinks(seed: CatalogSeedFile['business']) {
  const links: { network: 'custom' | 'instagram'; url: string; label?: string }[] = [];
  if (seed.publicadis_site_url) {
    links.push({ network: 'custom', url: seed.publicadis_site_url, label: 'Sitio web' });
  }
  if (seed.social_instagram) {
    links.push({ network: 'instagram', url: seed.social_instagram, label: 'Instagram' });
  }
  links.push({
    network: 'custom',
    url: `https://www.buscadis.com/@${seed.slug}`,
    label: 'Perfil Buscadis',
  });
  return links;
}

function buildCustomBlocks(seed: CatalogSeedFile['business']) {
  const wa = waDigits(seed);
  return [
    {
      id: 'link-whatsapp',
      type: 'link' as const,
      label: 'Consultar fechas por WhatsApp',
      content: `https://wa.me/${wa}?text=${encodeURIComponent('Hola Tay, quiero consultar disponibilidad en La Casa de Tay.')}`,
      style: 'filled' as const,
    },
    {
      id: 'text-por-que',
      type: 'text' as const,
      label: 'Sin mal de altura',
      content:
        'Urubamba está a 2.870 m — casi 600 más abajo que Cusco. Muchos huéspedes bajan directo del aeropuerto para aclimatarse acá, entre girasoles, y al día siguiente salen a Maras, Moray o Ollantaytambo.',
      style: 'default' as const,
    },
    {
      id: 'text-incluye',
      type: 'text' as const,
      label: 'Qué incluye',
      content:
        'Desayuno · WiFi · Estacionamiento privado · Jardín · Fogata · Parrilla · Juegos para niños · Cocina. Check-in 14:00 · check-out 13:00. Te recibe Tay.',
      style: 'default' as const,
    },
  ];
}

function buildStoryHighlights(uploaded: Record<string, string>) {
  const pick = (file: string, title: string, id: string) =>
    uploaded[file] ? { id, title, cover_url: uploaded[file] } : null;

  return [
    pick('exterior-fachada-verde-andes.jpg', 'Andes', 'hl-andes'),
    pick('exterior-bungalow-porche-jardin.jpg', 'Jardín', 'hl-jardin'),
    pick('cama-azul-pared-piedra.jpg', 'Habitar', 'hl-habitar'),
    pick('sofa-vista-jardin.jpg', 'Estar', 'hl-estar'),
    pick('detalle-desayuno.jpg', 'Desayuno', 'hl-desayuno'),
  ].filter(Boolean);
}

async function main() {
  const { dryRun } = parseArgs();
  const seed: CatalogSeedFile = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const wa = waDigits(seed.business);

  console.log(`La Casa de Tay — seed perfil Buscadis${dryRun ? ' (dry-run)' : ''}`);

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

  const brandFiles = [seed.business.logo_file, seed.business.banner_file, seed.business.og_image_file].filter(
    Boolean
  ) as string[];
  const productFiles = Array.from(new Set(seed.products.flatMap((p) => p.images.map((i) => i.file))));

  const uploaded: Record<string, string> = {};
  for (const file of brandFiles) {
    uploaded[file] = await uploadCatalogImage(businessId, file, 'brand', dryRun);
  }
  for (const file of productFiles) {
    if (!uploaded[file]) {
      uploaded[file] = await uploadCatalogImage(businessId, file, 'products', dryRun);
    }
  }

  const businessHours: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const day of [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]) {
    businessHours[day] = { open: '00:00', close: '23:59', closed: false };
  }

  const profilePayload: Record<string, unknown> = {
    slug: seed.business.slug,
    name: seed.business.name,
    tagline: seed.business.tagline,
    description: seed.business.description,
    contact_whatsapp: seed.business.contact_whatsapp,
    contact_phone: seed.business.contact_phone || seed.business.contact_whatsapp,
    contact_address: seed.business.contact_address,
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
    publicadis_published: false,
    social_links: buildSocialLinks(seed.business),
    custom_blocks: buildCustomBlocks(seed.business),
    story_highlights: buildStoryHighlights(uploaded),
    profile_hashtags: [
      'girasoles',
      'valle sagrado',
      'urubamba',
      'bungalows',
      'sin mal de altura',
      'casa de campo',
    ],
    business_hours: businessHours,
    announcement_text: 'Reserva directa por WhatsApp. Desayuno, WiFi y parking incluidos.',
    announcement_active: true,
    show_contact_form: true,
    banner_config: {
      mode: 'image',
      imageUrl: seed.business.banner_file ? uploaded[seed.business.banner_file] : undefined,
      headline: seed.business.name,
      subheadline: seed.business.tagline,
      ctaLabel: 'Consultar fechas',
      ctaUrl: `https://wa.me/${wa}?text=${encodeURIComponent('Hola Tay, quiero consultar disponibilidad en La Casa de Tay.')}`,
    },
  };

  if (dryRun) {
    console.log('[dry-run] perfil keys:', Object.keys(profilePayload));
    console.log('[dry-run] productos:', seed.products.length);
  } else {
    const { error } = await supabaseAdmin.from('business_profiles').update(profilePayload).eq('id', businessId);
    if (error) throw error;
    console.log(`✓ Perfil publicado: ${businessId}`);
  }

  for (const product of seed.products) {
    console.log(`→ ${product.sku}: ${product.title}`);
    const images = product.images.map((img) => ({
      url: uploaded[img.file],
      is_primary: img.is_primary,
      ai_enhanced: false,
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
      seo_title: `${product.title} | La Casa de Tay Urubamba`,
      seo_description: product.description.slice(0, 155),
      seo_keywords: product.tags,
      ai_metadata: { seed_source: 'lacasadetay-catalog.json', seeded_at: new Date().toISOString() },
      published_at: new Date().toISOString(),
    };

    if (dryRun) continue;

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

  console.log('\nListo.');
  console.log(`Perfil: https://www.buscadis.com/${seed.business.slug}`);
  console.log(`Perfil @: https://www.buscadis.com/@${seed.business.slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
