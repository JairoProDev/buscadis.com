/**
 * PATCH /api/business/[businessId]/reviews/[reviewId]
 * Dueño responde a una reseña (response_text / responded_at).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  response_text: z.string().trim().min(2).max(600),
});

async function authorizeOwner(
  req: NextRequest,
  slug: string
): Promise<{ profile: NonNullable<Awaited<ReturnType<typeof getBusinessProfileBySlug>>> } | NextResponse> {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
  }
  const profile = await getBusinessProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }
  let authorized = profile.user_id === user.id;
  if (!authorized && supabaseAdmin) {
    const { data: membership } = await supabaseAdmin
      .from('business_members')
      .select('role')
      .eq('business_profile_id', profile.id)
      .eq('user_id', user.id)
      .maybeSingle();
    authorized = Boolean(membership);
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  return { profile };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; reviewId: string }> }
) {
  const { businessId, reviewId } = await params;
  const slug = decodeURIComponent(businessId);
  const auth = await authorizeOwner(req, slug);
  if (auth instanceof NextResponse) return auth;
  const { profile } = auth;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'No disponible' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Escribe una respuesta (2–600 caracteres)' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('business_reviews')
    .update({
      response_text: parsed.data.response_text,
      responded_at: now,
      updated_at: now,
    })
    .eq('id', reviewId)
    .eq('business_profile_id', profile.id)
    .select('id, response_text, responded_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true, review: data });
}
