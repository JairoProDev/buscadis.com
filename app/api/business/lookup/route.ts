import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getProfile } from '@/lib/user';
import { isPlatformAdminUser } from '@/lib/platform-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/business/lookup?slug=agrilsur
 * Platform admin only — resolve business id by slug for assign-owner flows.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!isPlatformAdminUser(user.email, profile)) {
    return NextResponse.json({ success: false, error: 'Solo admins de Buscadis' }, { status: 403 });
  }

  const slug = (request.nextUrl.searchParams.get('slug') || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  if (!slug) {
    return NextResponse.json({ success: false, error: 'Indica un slug' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, name, slug, pending_owner_email, logo_url')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, business: data });
}
