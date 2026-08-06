/**
 * API Route: papelera del catálogo.
 *
 * Las filas en papelera son invisibles vía RLS (todas las políticas SELECT
 * exigen `deleted_at is null`), así que aquí se leen con service role una vez
 * verificado el permiso `catalog:write` del usuario sobre el negocio.
 *
 * Cubre los dos orígenes que se muestran en el catálogo del dueño:
 *   - `catalog_products` (id uuid)
 *   - `adisos` del dueño, mostrados como clasificados (id text)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessIdFromRequest, resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 30;
const KINDS = ['catalog_product', 'classified_ad'] as const;
type TrashKind = (typeof KINDS)[number];

type Ctx = { businessId: string; ownerUserId: string | null };

async function authorize(
  request: NextRequest,
  body: Record<string, unknown> | null
): Promise<{ ctx: Ctx | null; response: NextResponse | null }> {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return {
      ctx: null,
      response: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }),
    };
  }

  const supabase = await createServerClient();
  const businessId = getBusinessIdFromRequest(request, body);
  const resolved = await resolveBusinessForUser(supabase, user.id, businessId);

  if (!resolved) {
    return {
      ctx: null,
      response: NextResponse.json(
        { success: false, error: 'Negocio no encontrado o sin acceso' },
        { status: 404 }
      ),
    };
  }
  if (!hasPermission(resolved.role, 'catalog:write')) {
    return {
      ctx: null,
      response: NextResponse.json(
        { success: false, error: 'Sin permiso sobre el catálogo' },
        { status: 403 }
      ),
    };
  }

  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select('user_id')
    .eq('id', resolved.id)
    .maybeSingle();

  return {
    ctx: { businessId: resolved.id, ownerUserId: (profile?.user_id as string) ?? null },
    response: null,
  };
}

function expiresAt(deletedAt: string): string {
  return new Date(
    new Date(deletedAt).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

/** Lista lo que hay en papelera, con la fecha en que se purgará. */
export async function GET(request: NextRequest) {
  const { ctx, response } = await authorize(request, null);
  if (!ctx) return response!;

  const [productsRes, adisosRes] = await Promise.all([
    supabaseAdmin
      .from('catalog_products')
      .select('id, title, images, price, currency, category, status, deleted_at')
      .eq('business_profile_id', ctx.businessId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    ctx.ownerUserId
      ? supabaseAdmin
          .from('adisos')
          .select('id, titulo, imagenes_urls, precio, moneda, categoria, deleted_at')
          .eq('user_id', ctx.ownerUserId)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsRes.error || adisosRes.error) {
    return NextResponse.json(
      { success: false, error: productsRes.error?.message || adisosRes.error?.message },
      { status: 500 }
    );
  }

  const items = [
    ...(productsRes.data || []).map((p) => ({
      id: p.id as string,
      kind: 'catalog_product' as TrashKind,
      title: (p.title as string) || 'Producto',
      imageUrl: Array.isArray(p.images)
        ? (typeof p.images[0] === 'string' ? p.images[0] : (p.images[0] as any)?.url) || null
        : null,
      price: p.price ?? null,
      currency: (p.currency as string) || 'PEN',
      category: (p.category as string) || null,
      deletedAt: p.deleted_at as string,
      purgeAt: expiresAt(p.deleted_at as string),
    })),
    ...(adisosRes.data || []).map((a: any) => ({
      id: a.id as string,
      kind: 'classified_ad' as TrashKind,
      title: (a.titulo as string) || 'Aviso',
      imageUrl: Array.isArray(a.imagenes_urls) ? a.imagenes_urls[0] || null : null,
      price: a.precio ?? null,
      currency: (a.moneda as string) || 'PEN',
      category: (a.categoria as string) || null,
      deletedAt: a.deleted_at as string,
      purgeAt: expiresAt(a.deleted_at as string),
    })),
  ].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));

  return NextResponse.json({ success: true, items, retentionDays: RETENTION_DAYS });
}

/** Restaura un elemento de la papelera. */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const { ctx, response } = await authorize(request, body);
  if (!ctx) return response!;

  const id = typeof body.id === 'string' ? body.id : '';
  const kind = body.kind as TrashKind;
  if (!id || !KINDS.includes(kind)) {
    return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
  }

  if (kind === 'catalog_product') {
    const { data, error } = await supabaseAdmin
      .from('catalog_products')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id)
      .eq('business_profile_id', ctx.businessId)
      .not('deleted_at', 'is', null)
      .select('id');

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!data?.length) {
      return NextResponse.json({ success: false, error: 'No está en la papelera' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  if (!ctx.ownerUserId) {
    return NextResponse.json({ success: false, error: 'Negocio sin dueño' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('adisos')
    .update({ deleted_at: null, deleted_by: null, esta_activo: true })
    .eq('id', id)
    .eq('user_id', ctx.ownerUserId)
    .not('deleted_at', 'is', null)
    .select('id');

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!data?.length) {
    return NextResponse.json({ success: false, error: 'No está en la papelera' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

/** Vacía definitivamente un elemento sin esperar a los 30 días. */
export async function DELETE(request: NextRequest) {
  const { ctx, response } = await authorize(request, null);
  if (!ctx) return response!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const kind = searchParams.get('kind') as TrashKind;
  if (!id || !KINDS.includes(kind)) {
    return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
  }

  const query =
    kind === 'catalog_product'
      ? supabaseAdmin
          .from('catalog_products')
          .delete()
          .eq('id', id)
          .eq('business_profile_id', ctx.businessId)
      : supabaseAdmin.from('adisos').delete().eq('id', id).eq('user_id', ctx.ownerUserId || '');

  const { data, error } = await query.not('deleted_at', 'is', null).select('id');

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!data?.length) {
    return NextResponse.json({ success: false, error: 'No está en la papelera' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
