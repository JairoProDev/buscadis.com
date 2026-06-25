import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlugAdmin } from '@/lib/qr/get-business-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { canManageBusinessProfile, getBusinessMemberRole } from '@/lib/business-access';
import { canUseProQr } from '@/lib/business/subscription';
import { ensureQrCodeForBusiness, getQrScanStats } from '@/lib/qr/service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** businessId is slug */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const slug = decodeURIComponent((await params).businessId);
  const profile = await getBusinessProfileBySlugAdmin(slug);
  if (!profile) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const canManage = await canManageBusinessProfile({
    userId: user.id,
    email: user.email,
    businessProfileId: profile.id,
    ownerUserId: profile.user_id,
  });
  const role = canManage ? null : await getBusinessMemberRole(user.id, profile.id);
  const canView = canManage || role === 'viewer';
  if (!canView) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const qr = await ensureQrCodeForBusiness({
    businessProfileId: profile.id,
    slug: profile.slug,
    themeColor: profile.theme_color,
  });
  if (!qr) return NextResponse.json({ error: 'QR no encontrado' }, { status: 404 });

  const days = Number(req.nextUrl.searchParams.get('days') || '7');
  const stats = await getQrScanStats(qr.id, days);

  let whatsappClicks = 0;
  if (canUseProQr(profile)) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { count } = await supabaseAdmin
      .from('page_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('business_profile_id', profile.id)
      .eq('event_type', 'whatsapp_click')
      .gte('created_at', since.toISOString());
    whatsappClicks = count ?? 0;
  }

  return NextResponse.json({
    scanCount: qr.scan_count,
    periodScans: stats.total,
    byDay: stats.byDay,
    byDevice: stats.byDevice,
    whatsappClicks,
    isPro: canUseProQr(profile),
  });
}
