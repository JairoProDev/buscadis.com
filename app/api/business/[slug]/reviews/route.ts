import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessProfileBySlug } from '@/lib/business';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(slug));
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const [{ data: rawReviews }, { data: aggregate }] = await Promise.all([
    supabaseAdmin
      .from('business_reviews')
      .select('id, rating, text, comment, verified_purchase, is_verified, created_at, user_id, customer_name')
      .eq('business_profile_id', profile.id)
      .or('is_visible.is.null,is_visible.eq.true')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('business_review_aggregates')
      .select('*')
      .eq('business_profile_id', profile.id)
      .maybeSingle(),
  ]);

  const reviews = (rawReviews || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text || r.comment || undefined,
    verified_purchase: r.verified_purchase ?? r.is_verified ?? false,
    created_at: r.created_at,
    user_id: r.user_id,
    customer_name: r.customer_name,
  }));

  return NextResponse.json({
    reviews,
    aggregate: aggregate || { avg_rating: 0, review_count: 0 },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) {
    return NextResponse.json({ error: 'Inicia sesión para reseñar' }, { status: 401 });
  }

  const { slug } = await params;
  const profile = await getBusinessProfileBySlug(decodeURIComponent(slug));
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const parsed = reviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('business_reviews')
    .upsert(
      {
        business_profile_id: profile.id,
        user_id: user.id,
        rating: parsed.data.rating,
        text: parsed.data.text || null,
        comment: parsed.data.text || null,
        updated_at: new Date().toISOString(),
        is_visible: true,
      },
      { onConflict: 'business_profile_id,user_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
