/**
 * Crea/actualiza perfil Buscadis de AGRIL SUR + catálogo (19 productos).
 * Imágenes desde ../agrilsur/web/public/images/
 *
 * Uso:
 *   npx tsx scripts/seed-agrilsur-catalog.ts
 *   npx tsx scripts/seed-agrilsur-catalog.ts --dry-run
 *   npx tsx scripts/seed-agrilsur-catalog.ts --transfer-email cliente@ejemplo.com
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const CATALOG_BUCKET = 'catalog-images';
const IMAGES_DIR = path.join(process.cwd(), '../agrilsur/web/public/images');
const DATA_PATH = path.join(__dirname, 'data/agrilsur-catalog.json');

const LINE_CATEGORY: Record<string, string> = {
  'anis-inka': 'Anís Inka',
  muna: 'Muña del Inka',
  maca: 'Maca Andina',
  derivados: 'Derivados y Macerados',
};

type ProductSeed = {
  slug: string;
  line: string;
  name: string;
  subtitle?: string;
  imageFile: string | null;
  description: string;
  tasting?: string;
  tags: string[];
  graduacion?: string;
  volumen?: string;
  featured?: boolean;
};

const PRODUCTS: ProductSeed[] = [
  { slug: 'anis-inka-seco', line: 'anis-inka', name: 'Anís Inka', subtitle: 'Seco', imageFile: 'Anís inka seco.png', description: 'Destilado seco de anís, intenso en aroma y equilibrado al paladar. Ideal para quienes valoran la pureza del anís andino.', tasting: 'Notas limpias a anís, final persistente y elegante.', tags: ['Anís', 'Seco', 'Digestivo tradicional'], volumen: 'Presentación según disponibilidad', featured: true },
  { slug: 'anis-inka-semi-seco', line: 'anis-inka', name: 'Anís Inka', subtitle: 'Semiseco', imageFile: 'Anís inka semi seco.png', description: 'Punto intermedio entre seco y dulzor suave; versátil para degustación o coctelería.', tasting: 'Anís dominante con redondez discreta.', tags: ['Anís', 'Semiseco'] },
  { slug: 'anis-inka-intenso-premium', line: 'anis-inka', name: 'Anís Inka Intenso', subtitle: 'Premium', imageFile: 'Anís inka intenso premium.PNG', description: 'Selección cuidadosa de anís de la región; perfil aromático marcado y textura suave.', tasting: 'Intensidad aromática elevada, final limpio.', tags: ['Premium', 'Anís'], volumen: 'Botella premium vidrio', featured: true },
  { slug: 'anis-inka-crema-especial', line: 'anis-inka', name: 'Anís Inka Crema', subtitle: 'Especial dulce', imageFile: 'Anís inka crema especial.PNG', description: 'Licor de crema que combina la calidez del anís con notas dulces equilibradas.', tasting: 'Cremoso, aromático, postgusto confortable.', tags: ['Crema', 'Anís', 'Dulce'], featured: true },
  { slug: 'anis-cafe-especial', line: 'anis-inka', name: 'Anís Café', subtitle: 'Especial', imageFile: 'Anís café especial.PNG', description: 'Encuentro entre el carácter del anís y las notas tostadas del café peruano.', tasting: 'Robusto, aromático, ideal después de comer.', tags: ['Café', 'Anís'], featured: true },
  { slug: 'anis-canela', line: 'anis-inka', name: 'Anís Canela', subtitle: 'Clásico', imageFile: 'Anís canela.PNG', description: 'Destilado aromático que integra la calidez de la canela con la base de anís.', tasting: 'Especiado, envolvente.', tags: ['Canela', 'Anís'], featured: true },
  { slug: 'anis-canela-600', line: 'anis-inka', name: 'Anís Canela', subtitle: '600 ml', imageFile: 'Anís canela 600ml.png', description: 'Formato familiar del Anís Canela.', tags: ['Canela', 'Formato 600 ml'], volumen: '600 ml' },
  { slug: 'anis-menta', line: 'anis-inka', name: 'Anís Menta', imageFile: 'Anís menta.PNG', description: 'Refrescante encuentro entre anís y menta; propuesta aromática distinta.', tasting: 'Fresco, herbal, persistente.', tags: ['Menta', 'Anís'] },
  { slug: 'muna-del-inka', line: 'muna', name: 'Muña del Inka', subtitle: 'Clásico', imageFile: 'Muña del inka.png', description: 'Licor que destaca la muña, hierba aromática propia del altiplano cusqueño, en armonía con el anís.', tasting: 'Herbal fresco, equilibrado, muy cusqueño.', tags: ['Muña', 'Digestivo tradicional'], featured: true },
  { slug: 'muna-del-inka-500', line: 'muna', name: 'Muña del Inka', subtitle: '500 ml', imageFile: 'Muña del inka 500ml.png', description: 'Formato estándar de la línea Muña del Inka.', tags: ['Muña', '500 ml'], volumen: '500 ml' },
  { slug: 'muna-del-inka-250', line: 'muna', name: 'Muña del Inka', subtitle: '250 ml', imageFile: 'Muña del inka 250ml.PNG', description: 'Formato compacto ideal para regalo o degustación.', tags: ['Muña', '250 ml'], volumen: '250 ml' },
  { slug: 'muna-del-inka-tejido', line: 'muna', name: 'Muña del Inka', subtitle: 'Edición tejido andino', imageFile: 'Muña del inka tejido.png', description: 'Presentación con revestimiento textil artesanal — pieza de alto valor para coleccionistas y turismo consciente.', tags: ['Tejido', 'Souvenir premium', 'Artesanía'] },
  { slug: 'maca-negra', line: 'maca', name: 'Maca Andina', subtitle: 'Macerado premium', imageFile: 'IMG_6034.PNG', description: 'Expresión de maca en formato macerado; propuesta de la línea energética andina.', tags: ['Maca', 'Macerado'] },
  { slug: 'crema-cafe-pisco', line: 'derivados', name: 'Crema de café con pisco', imageFile: 'Crema de café con pisco.png', description: 'Licor de crema que une el café peruano con la suavidad del pisco en un perfil indulgente.', tags: ['Crema', 'Pisco', 'Café'] },
  { slug: 'crema-lucuma-pisco', line: 'derivados', name: 'Crema de lúcuma con pisco', imageFile: 'Crema de lúcuma con pisco.PNG', description: 'La lúcuma dorada del Perú en un licor de crema elegante y suave.', tags: ['Lúcuma', 'Crema', 'Pisco'] },
  { slug: 'limoncello-anis', line: 'derivados', name: 'Limoncello Anís', imageFile: 'Limoncello anís.PNG', description: 'Cítricos vibrantes y anís en una propuesta refrescante y aromática.', tags: ['Limón', 'Anís'], graduacion: '25° GL', volumen: '500 ml' },
  { slug: 'macerado-copoazu', line: 'derivados', name: 'Copoazú macerado exótico', imageFile: 'Macerado exótico copoazu.PNG', description: 'Macerado que rescata el sabor del copoazú amazónico en destilado premium.', tags: ['Fruta amazónica', 'Macerado'], graduacion: '28° GL', volumen: '500 ml' },
  { slug: 'macerado-camu-camu', line: 'derivados', name: 'Camu camu macerado exótico', imageFile: 'Macerado exótico camu camu.PNG', description: 'Intensidad cítrica y color profundo del camu camu, fruta nativa con fuerte identidad peruana.', tags: ['Camu camu', 'Macerado'], graduacion: '25° GL', volumen: '500 ml' },
  { slug: 'coleccion-huacos', line: 'derivados', name: 'Colección cerámica / Huacos', subtitle: 'Revestimiento premium', imageFile: 'Huacos.png', description: 'Presentaciones con cerámica y textiles andinos para el canal souvenir de alto valor.', tags: ['Cerámica', 'Artesanía', 'Regalo'] },
];

function parseArgs() {
  const args = process.argv.slice(2);
  let transferEmail = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--transfer-email') transferEmail = args[++i] || '';
  }
  return { dryRun: args.includes('--dry-run'), transferEmail };
}

function skuFromSlug(slug: string) {
  return `AS-${slug.toUpperCase().replace(/-/g, '-')}`;
}

function productTitle(p: ProductSeed) {
  return p.subtitle ? `${p.name} — ${p.subtitle}` : p.name;
}

async function uploadImage(
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
    return `https://agrilsur.vercel.app/images/${encodeURIComponent(fileName)}`;
  }

  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const buffer = fs.readFileSync(localPath);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${businessId}/${folder}/${safeName}`;

  const { error } = await supabaseAdmin.storage.from(CATALOG_BUCKET).upload(storagePath, buffer, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) {
    console.warn(`  Storage upload falló (${error.message}), URL externa temporal`);
    return `https://agrilsur.vercel.app/images/${encodeURIComponent(fileName)}`;
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

async function main() {
  const { dryRun, transferEmail } = parseArgs();
  const seed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const { supabaseAdmin } = await import('../lib/supabase-admin');

  console.log(`AGRIL SUR — seed catálogo Buscadis${dryRun ? ' (dry-run)' : ''}`);

  if (!fs.existsSync(IMAGES_DIR)) {
    throw new Error(`Carpeta de imágenes no encontrada: ${IMAGES_DIR}`);
  }

  let ownerUserId: string | null = null;
  if (transferEmail) {
    ownerUserId = await findUserIdByEmail(transferEmail);
    if (!ownerUserId) console.warn(`Usuario no encontrado: ${transferEmail}`);
  }

  const { data: existing } = await supabaseAdmin
    .from('business_profiles')
    .select('id, slug')
    .eq('slug', seed.business.slug)
    .maybeSingle();

  let businessId = existing?.id as string | undefined;

  if (dryRun) {
    businessId = businessId || '00000000-0000-0000-0000-000000000002';
  }

  let logoUrl: string | undefined;
  let bannerUrl: string | undefined;
  if (seed.business.logo_file) {
    logoUrl = await uploadImage(businessId!, seed.business.logo_file, 'brand', dryRun);
  }
  if (seed.business.banner_file) {
    bannerUrl = await uploadImage(businessId!, seed.business.banner_file, 'brand', dryRun);
  }

  const profilePayload = {
    slug: seed.business.slug,
    name: seed.business.name,
    tagline: seed.business.tagline,
    description: seed.business.description,
    contact_whatsapp: seed.business.contact_whatsapp,
    contact_phone: seed.business.contact_phone,
    contact_email: seed.business.contact_email,
    contact_address: seed.business.contact_address,
    theme_color: seed.business.theme_color,
    template_id: seed.business.template_id,
    logo_url: logoUrl,
    banner_url: bannerUrl,
    is_published: true,
    site_tier: seed.business.site_tier || 'both',
    publicadis_template_id: 'distillery-premium',
    publicadis_published: true,
    social_links: [
      { network: 'facebook' as const, url: 'https://www.facebook.com/Agrilsurcusco' },
      { network: 'instagram' as const, url: 'https://www.instagram.com/agrilsurcusco/' },
      { network: 'tiktok' as const, url: 'https://www.tiktok.com/@agrilsurcusco' },
      { network: 'custom' as const, url: seed.business.publicadis_site_url, label: 'Sitio web Publicadis' },
    ],
    ...(ownerUserId ? { user_id: ownerUserId, created_by: ownerUserId } : {}),
  };

  if (dryRun) {
    console.log('[dry-run] business_profiles:', profilePayload.name);
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
    console.log(`✓ Dueño asignado: ${transferEmail}`);
  }

  let sortOrder = 1;
  for (const p of PRODUCTS) {
    const title = productTitle(p);
    const sku = skuFromSlug(p.slug);
    console.log(`→ ${sku}: ${title}`);

    const images = [];
    if (p.imageFile) {
      const url = await uploadImage(businessId, p.imageFile, 'products', dryRun);
      images.push({
        url,
        is_primary: true,
        ai_enhanced: false,
        alt_text: `${title} — AGRIL SUR`,
      });
    }

    const description = [p.description, p.tasting].filter(Boolean).join(' ');

    const row = {
      business_profile_id: businessId,
      title,
      description,
      sku,
      brand: 'AGRIL SUR',
      images,
      currency: 'PEN',
      category: LINE_CATEGORY[p.line] || 'Bebidas espirituosas',
      tags: [...p.tags, 'Cusco', 'destilería', p.line],
      attributes: {
        slug: p.slug,
        line: p.line,
        ...(p.graduacion ? { graduacion: p.graduacion } : {}),
        ...(p.volumen ? { volumen: p.volumen } : {}),
        origin: 'San Jerónimo, Cusco, Perú',
      },
      status: 'published' as const,
      is_featured: Boolean(p.featured),
      sort_order: sortOrder++,
      track_inventory: false,
      seo_title: `${title} | AGRIL SUR`,
      seo_description: description,
      seo_keywords: p.tags,
      ai_metadata: { seed_source: 'agrilsur-catalog', slug: p.slug },
      published_at: new Date().toISOString(),
    };

    if (dryRun) {
      console.log('  [dry-run] upsert producto');
      continue;
    }

    const { data: existingProduct } = await supabaseAdmin
      .from('catalog_products')
      .select('id')
      .eq('business_profile_id', businessId)
      .eq('sku', sku)
      .maybeSingle();

    if (existingProduct?.id) {
      const { error } = await supabaseAdmin.from('catalog_products').update(row).eq('id', existingProduct.id);
      if (error) throw error;
      console.log(`  ✓ actualizado`);
    } else {
      const { error } = await supabaseAdmin.from('catalog_products').insert(row);
      if (error) throw error;
      console.log(`  ✓ creado`);
    }
  }

  const publicadisSite = {
    business_profile_id: businessId,
    slug: seed.business.slug,
    template_id: 'distillery-premium',
    is_published: true,
    published_at: new Date().toISOString(),
    config: {
      buscadis_profile_url: `https://buscadis.com/p/${seed.business.slug}`,
      canonical_url: seed.business.publicadis_site_url,
      app_origin: 'https://agrilsur.vercel.app',
      base_path: '/p/agrilsur',
    },
  };

  if (!dryRun) {
    const { error: siteError } = await supabaseAdmin
      .from('publicadis_sites')
      .upsert(publicadisSite, { onConflict: 'business_profile_id' });
    if (siteError) console.warn('publicadis_sites:', siteError.message);
    else console.log('✓ Sitio Publicadis registrado');
  }

  console.log(`\nListo. Perfil: https://buscadis.com/p/${seed.business.slug}`);
  console.log(`Sitio pro (proxy): ${seed.business.publicadis_site_url} → ${seed.business.publicadis_external_url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
