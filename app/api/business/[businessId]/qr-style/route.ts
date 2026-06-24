import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlugAdmin } from '@/lib/qr/get-business-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessMemberRole } from '@/lib/business-access';
import { canUseProQr } from '@/lib/business/subscription';
import { ensureQrCodeForBusiness, updateQrStyle, eagerGenerateQrPng } from '@/lib/qr/service';
import { validateQrContrast } from '@/lib/qr/quality-gate';
import { getQrTargetUrl } from '@/lib/qr/resolve-url';
import { QR_PRESETS } from '@/lib/qr/presets';
import type { QrStyleConfig } from '@/lib/qr/types';

/** businessId is slug */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const slug = decodeURIComponent((await params).businessId);
  const profile = await getBusinessProfileBySlugAdmin(slug);
  if (!profile) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const qr = await ensureQrCodeForBusiness({
    businessProfileId: profile.id,
    slug: profile.slug,
    themeColor: profile.theme_color,
  });

  return NextResponse.json({
    qr,
    shortUrl: qr ? getQrTargetUrl(qr.short_code) : null,
    isPro: canUseProQr(profile),
    presets: QR_PRESETS.filter((p) => canUseProQr(profile) || p.tier === 'free'),
    hasLogo: Boolean(profile.logo_url),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const user = await getUserFromRouteRequest(req);
  if (!user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const slug = decodeURIComponent((await params).businessId);
  const profile = await getBusinessProfileBySlugAdmin(slug);
  if (!profile) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const role = await getBusinessMemberRole(user.id, profile.id);
  const isOwner = profile.user_id === user.id;
  if (!isOwner && !role) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  if (role && !['owner', 'admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const body = (await req.json()) as { styleConfig?: QrStyleConfig };
  const styleConfig = body.styleConfig;
  if (!styleConfig) {
    return NextResponse.json({ error: 'styleConfig requerido' }, { status: 400 });
  }

  const isPro = canUseProQr(profile);
  const contrast = validateQrContrast(
    styleConfig.dotsColor || '#0f172a',
    styleConfig.backgroundColor || '#ffffff'
  );
  if (!contrast.ok) {
    return NextResponse.json({ error: contrast.message }, { status: 422 });
  }

  await ensureQrCodeForBusiness({
    businessProfileId: profile.id,
    slug: profile.slug,
    themeColor: profile.theme_color,
  });

  const updated = await updateQrStyle(profile.id, styleConfig, isPro ? 'pro' : 'free');
  if (!updated) {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }

  void eagerGenerateQrPng({
    businessProfileId: profile.id,
    slug: profile.slug,
    themeColor: profile.theme_color,
    logoUrl: profile.logo_url,
    styleTier: isPro ? 'pro' : 'free',
  });

  return NextResponse.json({ success: true, qr: updated });
}
