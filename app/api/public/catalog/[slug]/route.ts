import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPublishedBusinessProfileBySlug } from '@/lib/business/get-public-profile';
import { CATALOG_DEFAULT_ORDER } from '@/lib/catalog/sort-products';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    process.env.NEXT_PUBLIC_PUBLICADIS_URL?.replace(/\/$/, '') ||
    'https://publicadis.com';
  const allowList = [
    allowed,
    'https://www.publicadis.com',
    'https://publicadis.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const matched = origin && allowList.some((o) => origin === o || origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': matched ? origin! : allowList[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function productHasImage(images: unknown): boolean {
  if (!Array.isArray(images) || images.length === 0) return false;
  return images.some((img) => {
    if (typeof img === 'string') return img.trim().length > 0;
    return Boolean((img as { url?: string })?.url?.trim());
  });
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => (typeof img === 'string' ? img : (img as { url?: string })?.url))
    .filter(Boolean) as string[];
}

/** Catálogo público para sitios Publicadis y integraciones externas. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const { slug } = await params;
  const imagesOnly = req.nextUrl.searchParams.get('imagesOnly') === '1';

  const profile = await getPublishedBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'Negocio no encontrado' },
      { status: 404, headers }
    );
  }

  const client = getAdminClient();
  if (!client) {
    return NextResponse.json(
      { success: false, error: 'server_config' },
      { status: 500, headers }
    );
  }

  let query = client
    .from('catalog_products')
    .select(
      'id, title, description, category, price, currency, images, attributes, sort_order, is_featured, status, created_at, updated_at'
    )
    .eq('business_profile_id', profile.id)
    .eq('status', 'published')
    .is('deleted_at', null);

  for (const { column, ascending } of CATALOG_DEFAULT_ORDER) {
    query = query.order(column, { ascending });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers }
    );
  }

  let products = (data || []).map((p) => ({
    id: p.id,
    name: p.title,
    title: p.title,
    description: p.description,
    category: p.category || 'Otros',
    subcategory: (p.attributes as Record<string, unknown>)?.subcategory ?? null,
    brand: (p.attributes as Record<string, unknown>)?.brand ?? null,
    details: (p.attributes as Record<string, unknown>)?.details ?? null,
    price: p.price,
    currency: p.currency,
    image_url: normalizeImages(p.images)[0] ?? null,
    images: normalizeImages(p.images),
    attributes: p.attributes,
    sort_order: p.sort_order,
    featured: p.is_featured,
    in_stock: true,
  }));

  if (imagesOnly) {
    products = products.filter((p) => p.images.length > 0);
  }

  return NextResponse.json(
    {
      success: true,
      business: {
        id: profile.id,
        slug: profile.slug,
        name: profile.name,
        logo_url: profile.logo_url,
        banner_url: profile.banner_url,
      },
      products,
      total: products.length,
    },
    {
      headers: {
        ...headers,
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    }
  );
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  });
}
