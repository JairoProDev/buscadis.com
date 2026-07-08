import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessIdFromRequest, resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.filter((id: unknown) => typeof id === 'string')
      : [];

    if (orderedIds.length === 0) {
      return NextResponse.json({ success: false, error: 'orderedIds requerido' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { profile, error: profileError } = await (async () => {
      const businessId = getBusinessIdFromRequest(request, body);
      const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
      if (!ctx || !hasPermission(ctx.role, 'catalog:write')) {
        return { profile: null as { id: string } | null, error: ctx ? 'forbidden' : 'not_found' };
      }
      return { profile: { id: ctx.id }, error: null as string | null };
    })();

    if (profileError === 'not_found' || !profile) {
      return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
    }
    if (profileError === 'forbidden') {
      return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('catalog_products')
      .select('id')
      .eq('business_profile_id', profile.id)
      .in('id', orderedIds);

    if (fetchError) throw fetchError;

    const validIds = new Set((existing || []).map((r) => r.id));
    const filtered = orderedIds.filter((id: string) => validIds.has(id));

    if (filtered.length !== orderedIds.length) {
      return NextResponse.json({ success: false, error: 'IDs inválidos en la lista' }, { status: 400 });
    }

    const updates = filtered.map((id: string, index: number) =>
      supabase
        .from('catalog_products')
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_profile_id', profile.id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;

    return NextResponse.json({ success: true, count: filtered.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Reorder products error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
