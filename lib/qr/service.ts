import { supabaseAdmin } from '@/lib/supabase-admin';
import { createShortCode } from './short-code';
import { buildFreeStyleConfig } from './presets';
import type { QrCodeRecord, QrRenderMode, QrStyleConfig } from './types';
import { normalizeStyleConfig } from './default-style';

export async function getQrByShortCode(shortCode: string): Promise<QrCodeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .select('*')
    .eq('short_code', shortCode)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as QrCodeRecord;
}

export async function getQrByBusinessId(businessProfileId: string): Promise<QrCodeRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .maybeSingle();
  if (error) {
    console.error('[qr] get by business:', error.message);
    return null;
  }
  if (!data) return null;
  return data as QrCodeRecord;
}

export async function getQrByBusinessSlug(slug: string): Promise<QrCodeRecord | null> {
  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!profile?.id) return null;
  return getQrByBusinessId(profile.id);
}

async function insertUniqueQrCode(payload: {
  business_profile_id: string;
  destination_slug: string;
  theme_color?: string;
}): Promise<QrCodeRecord | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const short_code = createShortCode();
    const { data, error } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        business_profile_id: payload.business_profile_id,
        short_code,
        destination_slug: payload.destination_slug,
        style_config: buildFreeStyleConfig(payload.theme_color),
      })
      .select()
      .single();
    if (!error && data) return data as QrCodeRecord;
    if (error?.code === '23505') {
      const existing = await getQrByBusinessId(payload.business_profile_id);
      if (existing) return existing;
      continue;
    }
    console.error('[qr] insert error:', error?.message || error);
    return null;
  }
  return null;
}

/** Crea o actualiza el QR de un negocio (auto-provisión). */
export async function ensureQrCodeForBusiness(params: {
  businessProfileId: string;
  slug: string;
  themeColor?: string;
}): Promise<QrCodeRecord | null> {
  const existing = await getQrByBusinessId(params.businessProfileId);
  if (existing) {
    if (existing.destination_slug !== params.slug) {
      const { data } = await supabaseAdmin
        .from('qr_codes')
        .update({
          destination_slug: params.slug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      return (data as QrCodeRecord) || existing;
    }
    return existing;
  }
  return insertUniqueQrCode({
    business_profile_id: params.businessProfileId,
    destination_slug: params.slug,
    theme_color: params.themeColor,
  });
}

export async function updateQrStyle(
  businessProfileId: string,
  styleConfig: QrStyleConfig,
  styleTier: 'free' | 'pro'
): Promise<QrCodeRecord | null> {
  const { invalidateQrAssetCache } = await import('./asset-cache');
  const existing = await getQrByBusinessId(businessProfileId);
  if (existing) await invalidateQrAssetCache(existing.id);

  const renderMode = 'branded' as const;

  const { data, error } = await supabaseAdmin
    .from('qr_codes')
    .update({
      style_config: styleConfig,
      style_tier: styleTier,
      render_mode: renderMode,
      qa_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('business_profile_id', businessProfileId)
    .select()
    .single();
  if (error) {
    console.error('[qr] update style error:', error);
    return null;
  }
  return data as QrCodeRecord;
}

const PROFILE_QR_FIELDS = new Set(['logo_url', 'theme_color', 'name']);

/** Invalida caché QR cuando cambian datos visuales del perfil. */
export async function invalidateQrOnProfileChange(
  businessProfileId: string,
  changedFields: string[]
): Promise<void> {
  const shouldInvalidate = changedFields.some((f) => PROFILE_QR_FIELDS.has(f));
  if (!shouldInvalidate) return;

  const qr = await getQrByBusinessId(businessProfileId);
  if (!qr) return;

  const { invalidateQrAssetCache } = await import('./asset-cache');
  await invalidateQrAssetCache(qr.id);
  await supabaseAdmin
    .from('qr_codes')
    .update({ qa_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', qr.id);
}

export async function eagerGenerateQrPng(params: {
  businessProfileId: string;
  slug: string;
  themeColor?: string;
  logoUrl?: string | null;
  styleTier?: 'free' | 'pro';
}): Promise<void> {
  try {
    const qr = await ensureQrCodeForBusiness({
      businessProfileId: params.businessProfileId,
      slug: params.slug,
      themeColor: params.themeColor,
    });
    if (!qr) return;

    const { getQrTargetUrl } = await import('./resolve-url');
    const { generateQrPng } = await import('./generate');
    const { buildFreeStyleConfig } = await import('./presets');
    const {
      computeQrAssetHash,
      qrAssetStoragePath,
      uploadCachedQrPng,
      persistQrAssetCache,
      persistQrQaStatus,
    } = await import('./asset-cache');

    const targetUrl = getQrTargetUrl(qr.short_code);
    const styleConfig = normalizeStyleConfig(
      {
        ...buildFreeStyleConfig(params.themeColor),
        ...(qr.style_config || {}),
      },
      params.themeColor
    );
    const renderMode = 'branded' as const;
    const tier = params.styleTier || qr.style_tier || 'free';
    const width = 512;

    const result = await generateQrPng({
      data: targetUrl,
      styleConfig,
      width,
      logoUrl: params.logoUrl || undefined,
      themeColor: params.themeColor,
      tier,
      renderMode,
    });

    const hash = computeQrAssetHash({
      targetUrl,
      logoUrl: params.logoUrl,
      shortCode: qr.short_code,
      styleConfig,
      tier,
      width,
      renderMode: result.actualMode,
    });

    const storagePath = qrAssetStoragePath(params.businessProfileId, hash);
    const uploaded = await uploadCachedQrPng(storagePath, result.png);
    if (uploaded) {
      await persistQrAssetCache(qr.id, hash, storagePath);
    }
    await persistQrQaStatus(qr.id, {
      qa_status: result.qaStatus,
      qa_fallback_mode: result.degraded ? result.actualMode : null,
      render_mode: result.actualMode,
      generation_error: null,
    });
  } catch (err) {
    console.warn('[qr] eager generate:', err);
  }
}

export function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

export async function recordQrScan(params: {
  qrCodeId: string;
  userAgent?: string | null;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const device_type = parseDeviceType(params.userAgent ?? null);
  await supabaseAdmin.from('qr_scans').insert({
    qr_code_id: params.qrCodeId,
    user_agent: params.userAgent?.slice(0, 512) ?? null,
    referrer: params.referrer?.slice(0, 512) ?? null,
    country: params.country ?? null,
    city: params.city ?? null,
    device_type,
    session_id: params.sessionId ?? null,
    metadata: params.metadata ?? {},
  });

  const { data: current } = await supabaseAdmin
    .from('qr_codes')
    .select('scan_count')
    .eq('id', params.qrCodeId)
    .single();

  await supabaseAdmin
    .from('qr_codes')
    .update({
      scan_count: (current?.scan_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.qrCodeId);
}

export async function getQrScanStats(
  qrCodeId: string,
  days = 7
): Promise<{
  total: number;
  byDay: { date: string; count: number }[];
  byDevice: { device: string; count: number }[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabaseAdmin
    .from('qr_scans')
    .select('scanned_at, device_type')
    .eq('qr_code_id', qrCodeId)
    .gte('scanned_at', since.toISOString());

  const rows = data || [];
  const dayMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();

  for (const row of rows) {
    const day = row.scanned_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
    const dev = row.device_type || 'unknown';
    deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);
  }

  const byDay: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    byDay.push({ date, count: dayMap.get(date) || 0 });
  }

  return {
    total: rows.length,
    byDay,
    byDevice: [...deviceMap.entries()].map(([device, count]) => ({ device, count })),
  };
}
