import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';
import { getBusinessProfileBySlug } from '@/lib/business';
import { waMeUrl } from '@/lib/business/commerce';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';

const createSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(6).max(40),
  customerNote: z.string().max(500).optional(),
  serviceProductId: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(businessId));
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Reserva inválida' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('commerce_reservations')
    .insert({
      business_profile_id: profile.id,
      service_product_id: parsed.data.serviceProductId ?? null,
      customer_name: parsed.data.customerName,
      customer_phone: parsed.data.customerPhone,
      customer_note: parsed.data.customerNote ?? null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt ?? null,
      status: 'requested',
      source: 'perfil_vivo',
    })
    .select('id, starts_at, status')
    .single();

  const phone = profile.contact_whatsapp || profile.contact_phone;
  const when = new Date(parsed.data.startsAt).toLocaleString('es-PE');
  const text = [
    `Hola, quiero agendar en ${profile.name} (Buscadis).`,
    `Nombre: ${parsed.data.customerName}`,
    `Tel: ${parsed.data.customerPhone}`,
    `Fecha: ${when}`,
    parsed.data.customerNote ? `Nota: ${parsed.data.customerNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (error || !data) {
    return NextResponse.json({
      ok: true,
      reservationId: null,
      waUrl: phone ? waMeUrl(phone, text) : null,
      persisted: false,
    });
  }

  return NextResponse.json({
    ok: true,
    reservationId: data.id,
    waUrl: phone ? waMeUrl(phone, text) : null,
    persisted: true,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });

  const profile = await getBusinessProfileBySlug(decodeURIComponent((await params).businessId));
  if (!profile) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });

  const supabase = await createServerClient();
  const ctx = await resolveBusinessForUser(supabase, user.id, profile.id);
  if (!ctx || !hasPermission(ctx.role, 'catalog:read')) {
    return NextResponse.json({ ok: false, error: 'Sin acceso' }, { status: 403 });
  }

  const { data } = await supabase
    .from('commerce_reservations')
    .select('*')
    .eq('business_profile_id', profile.id)
    .order('starts_at', { ascending: false })
    .limit(40);

  return NextResponse.json({ ok: true, reservations: data ?? [] });
}
