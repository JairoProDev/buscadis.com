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
  customerEmail: z.string().email().optional().or(z.literal('')),
  summary: z.string().min(8).max(800),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const profile = await getBusinessProfileBySlug(
    decodeURIComponent((await params).businessId)
  );
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Cotización inválida' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('commerce_quotes')
    .insert({
      business_profile_id: profile.id,
      customer_name: parsed.data.customerName,
      customer_phone: parsed.data.customerPhone,
      customer_email: parsed.data.customerEmail || null,
      summary: parsed.data.summary,
      status: 'sent_wa',
      source: 'perfil_vivo',
    })
    .select('id')
    .single();

  const phone = profile.contact_whatsapp || profile.contact_phone;
  const text = [
    `Hola, quiero una cotización de ${profile.name} (Buscadis).`,
    `Nombre: ${parsed.data.customerName}`,
    `Tel: ${parsed.data.customerPhone}`,
    parsed.data.customerEmail ? `Email: ${parsed.data.customerEmail}` : '',
    `Detalle: ${parsed.data.summary}`,
  ]
    .filter(Boolean)
    .join('\n');

  return NextResponse.json({
    ok: true,
    quoteId: data?.id ?? null,
    waUrl: phone ? waMeUrl(phone, text) : null,
    persisted: !error && Boolean(data),
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });

  const profile = await getBusinessProfileBySlug(
    decodeURIComponent((await params).businessId)
  );
  if (!profile) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });

  const supabase = await createServerClient();
  const ctx = await resolveBusinessForUser(supabase, user.id, profile.id);
  if (!ctx || !hasPermission(ctx.role, 'catalog:read')) {
    return NextResponse.json({ ok: false, error: 'Sin acceso' }, { status: 403 });
  }

  const { data } = await supabase
    .from('commerce_quotes')
    .select('*')
    .eq('business_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(40);

  return NextResponse.json({ ok: true, quotes: data ?? [] });
}
