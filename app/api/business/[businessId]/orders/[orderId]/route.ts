import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';

const patchSchema = z.object({
  status: z
    .enum([
      'draft',
      'sent_wa',
      'confirmed',
      'preparing',
      'paid',
      'delivered',
      'cancelled',
    ])
    .optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  payment_method: z
    .enum(['whatsapp', 'yape', 'plin', 'efectivo', 'mercadopago', 'transferencia'])
    .optional(),
});

/** PATCH — dueño actualiza estado / pago (P3A). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; orderId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
  }

  const { businessId, orderId } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(businessId));
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  const supabase = await createServerClient();
  const ctx = await resolveBusinessForUser(supabase, user.id, profile.id);
  if (!ctx || !hasPermission(ctx.role, 'catalog:write')) {
    return NextResponse.json({ ok: false, error: 'Sin acceso' }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.payment_status) updates.payment_status = parsed.data.payment_status;
  if (parsed.data.payment_method) updates.payment_method = parsed.data.payment_method;
  if (parsed.data.payment_status === 'paid' && !parsed.data.status) {
    updates.status = 'paid';
  }

  const { data, error } = await supabase
    .from('commerce_orders')
    .update(updates)
    .eq('id', orderId)
    .eq('business_profile_id', profile.id)
    .select('id, order_number, status, payment_status, payment_method')
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message || 'No encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: data });
}
