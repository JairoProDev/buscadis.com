import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';
import { canUsePerfilVivoIa } from '@/lib/business/subscription';

const bodySchema = z.object({
  pregunta: z.string().min(3).max(280),
  respuesta: z.string().min(3).max(1200),
});

/** Dueño aprueba FAQ desde corpus ia_unanswered (P5). */
export async function POST(
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
  if (!ctx || !hasPermission(ctx.role, 'catalog:write')) {
    return NextResponse.json({ ok: false, error: 'Sin acceso' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('business_faq_trained')
    .insert({
      business_profile_id: profile.id,
      pregunta: parsed.data.pregunta.trim(),
      respuesta: parsed.data.respuesta.trim(),
      source: 'ia_unanswered',
      active: true,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

/** FAQ públicas del negocio (visitante + Max AI). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const profile = await getBusinessProfileBySlug(
    decodeURIComponent((await params).businessId)
  );
  if (!profile) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });

  const supabase = await createServerClient();
  const { data } = await supabase
    .from('business_faq_trained')
    .select('id, pregunta, respuesta')
    .eq('business_profile_id', profile.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(40);

  return NextResponse.json({
    ok: true,
    faqs: data ?? [],
    maxAi: canUsePerfilVivoIa({ subscription_tier: profile.subscription_tier }),
  });
}
