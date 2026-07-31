import { supabaseAdmin } from '@/lib/supabase-admin';

export type InteractionListing = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number | null;
  moneda: string | null;
  tipoPrecio: string | null;
  ubicacion: unknown;
  imagenesUrls: string[] | undefined;
  sellerUserId: string | null;
  categoria: string | null;
  publishTier: string;
  features: Record<string, unknown>;
  privateData: Record<string, unknown>;
  contactLocked: boolean;
  contacto: string | null;
  source: 'adiso' | 'catalog_product';
};

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return {};
}

function parseImageUrls(value: unknown): string[] | undefined {
  try {
    const urls = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(urls) ? (urls as string[]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve a marketplace listing for chat/ask flows.
 * Catalog products live in `catalog_products`, not `adisos` — both must work.
 */
export async function resolveListingForInteraction(
  listingId: string
): Promise<InteractionListing | null> {
  const { data: adiso } = await supabaseAdmin
    .from('adisos')
    .select(
      'id, titulo, descripcion, precio, moneda, tipo_precio, ubicacion, imagenes_urls, user_id, publish_tier, features, private_data, contact_locked, payment_status, contacto, categoria, esta_activo'
    )
    .eq('id', listingId)
    .maybeSingle();

  if (adiso) {
    if (adiso.esta_activo === false) return null;
    const priv = parseJsonObject(adiso.private_data);
    const features = parseJsonObject(adiso.features);
    const contactLocked =
      Boolean(adiso.contact_locked) ||
      adiso.payment_status === 'pending' ||
      adiso.payment_status === 'underpaid';

    return {
      id: adiso.id as string,
      titulo: (adiso.titulo as string) || 'Aviso',
      descripcion: (adiso.descripcion as string) || '',
      precio: (priv.precio as number) ?? (adiso.precio as number | null) ?? null,
      moneda: ((priv.moneda as string) ?? (adiso.moneda as string)) || null,
      tipoPrecio: ((priv.tipoPrecio as string) ?? (adiso.tipo_precio as string)) || null,
      ubicacion: priv.ubicacion ?? adiso.ubicacion,
      imagenesUrls: (priv.imagenesUrls as string[]) || parseImageUrls(adiso.imagenes_urls),
      sellerUserId: (adiso.user_id as string) || null,
      categoria: (adiso.categoria as string) || null,
      publishTier: (adiso.publish_tier as string) || 'paid',
      features,
      privateData: priv,
      contactLocked,
      contacto: (adiso.contacto as string) || null,
      source: 'adiso',
    };
  }

  const { data: product } = await supabaseAdmin
    .from('catalog_products')
    .select(
      `
      id, title, description, price, currency, images, category, status, user_id, business_profile_id, ai_metadata,
      business_profiles ( user_id, contact_whatsapp, contact_phone, is_published )
    `
    )
    .eq('id', listingId)
    .maybeSingle();

  if (!product || product.status !== 'published') return null;

  const business = Array.isArray(product.business_profiles)
    ? product.business_profiles[0]
    : product.business_profiles;
  if (business && (business as { is_published?: boolean }).is_published === false) return null;

  const images = Array.isArray(product.images)
    ? product.images
        .map((img: unknown) => (typeof img === 'string' ? img : (img as { url?: string })?.url))
        .filter(Boolean)
    : [];

  const biz = business as { user_id?: string; contact_whatsapp?: string; contact_phone?: string } | null;

  return {
    id: product.id as string,
    titulo: (product.title as string) || 'Producto',
    descripcion: (product.description as string) || '',
    precio: typeof product.price === 'number' ? product.price : null,
    moneda: product.currency === 'USD' ? 'USD' : 'PEN',
    tipoPrecio: null,
    ubicacion: null,
    imagenesUrls: images as string[],
    sellerUserId: (product.user_id as string) || biz?.user_id || null,
    categoria: (product.category as string) || 'productos',
    publishTier: 'paid',
    features: { auto_reply: true },
    privateData: {
      ...(parseJsonObject(product.ai_metadata)),
      source: 'catalog_product',
      business_profile_id: product.business_profile_id,
    },
    contactLocked: false,
    contacto: biz?.contact_whatsapp || biz?.contact_phone || null,
    source: 'catalog_product',
  };
}
