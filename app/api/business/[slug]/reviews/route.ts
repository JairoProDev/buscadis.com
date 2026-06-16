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

  const [{ data: reviews }, { data: aggregate }] = await Promise.all([
    supabaseAdmin
      .from('business_reviews')
      .select('id, rating, text, verified_purchase, created_at, user_id')
      .eq('business_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('business_review_aggregates')
      .select('*')
      .eq('business_profile_id', profile.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    reviews: reviews || [],
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
        updated_at: new Date().toISOString(),
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
