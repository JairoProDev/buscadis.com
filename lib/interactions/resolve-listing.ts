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
  estaActivo?: boolean;
  fechaExpiracion?: string | null;
  esHistorico?: boolean;
  edicionNumero?: string | null;
  fechaPublicacion?: string | null;
  fechaPublicacionOriginal?: string | null;
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
      'id, titulo, descripcion, precio, moneda, tipo_precio, ubicacion, imagenes_urls, user_id, publish_tier, features, private_data, contact_locked, payment_status, contacto, categoria, esta_activo, fecha_expiracion, es_historico, edicion_numero, fecha_publicacion, fecha_publicacion_original'
    )
    .eq('id', listingId)
    .maybeSingle();

  if (adiso) {
    // Caducados/históricos siguen contactables (lead capture vía ops).
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
      estaActivo: adiso.esta_activo !== false,
      fechaExpiracion: (adiso.fecha_expiracion as string) || null,
      esHistorico: Boolean(adiso.es_historico),
      edicionNumero: (adiso.edicion_numero as string) || null,
      fechaPublicacion: (adiso.fecha_publicacion as string) || null,
      fechaPublicacionOriginal: (adiso.fecha_publicacion_original as string) || null,
    };
  }

  // catalog_products has no user_id — seller lives on business_profiles.user_id
  const { data: product, error: productError } = await supabaseAdmin
    .from('catalog_products')
    .select(
      'id, title, description, price, currency, images, category, status, business_profile_id, ai_metadata'
    )
    .eq('id', listingId)
    .maybeSingle();

  if (productError) {
    console.error('[resolveListing] catalog_products', productError.message);
    return null;
  }
  if (!product || product.status !== 'published') return null;

  let biz: {
    user_id?: string | null;
    contact_whatsapp?: string | null;
    contact_phone?: string | null;
    is_published?: boolean | null;
  } | null = null;

  if (product.business_profile_id) {
    const { data: business, error: bizError } = await supabaseAdmin
      .from('business_profiles')
      .select('user_id, contact_whatsapp, contact_phone, is_published')
      .eq('id', product.business_profile_id)
      .maybeSingle();
    if (bizError) {
      console.error('[resolveListing] business_profiles', bizError.message);
    } else {
      biz = business;
    }
  }

  if (biz?.is_published === false) return null;

  const images = Array.isArray(product.images)
    ? product.images
        .map((img: unknown) => (typeof img === 'string' ? img : (img as { url?: string })?.url))
        .filter(Boolean)
    : [];

  return {
    id: product.id as string,
    titulo: (product.title as string) || 'Producto',
    descripcion: (product.description as string) || '',
    precio: typeof product.price === 'number' ? product.price : Number(product.price) || null,
    moneda: product.currency === 'USD' ? 'USD' : 'PEN',
    tipoPrecio: null,
    ubicacion: null,
    imagenesUrls: images as string[],
    sellerUserId: biz?.user_id || null,
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
