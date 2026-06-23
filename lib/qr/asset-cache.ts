import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { QrCodeRecord, QrStyleConfig } from './types';

export const QR_ASSETS_BUCKET = 'qr-assets';

/** Incrementar al cambiar motor de generación (invalida PNG cacheados). */
export const QR_ENGINE_VERSION = 'v6-logo-composite2';

export function computeQrAssetHash(params: {
  targetUrl: string;
  logoUrl?: string | null;
  shortCode: string;
  styleConfig: QrStyleConfig;
  tier: 'free' | 'pro';
  width: number;
}): string {
  const payload = JSON.stringify({
    engine: QR_ENGINE_VERSION,
    targetUrl: params.targetUrl,
    logoUrl: params.logoUrl || null,
    shortCode: params.shortCode,
    style: params.styleConfig,
    tier: params.tier,
    width: params.width,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 20);
}

export function qrAssetStoragePath(businessProfileId: string, hash: string): string {
  return `${businessProfileId}/${hash}.png`;
}

export async function downloadCachedQrPng(storagePath: string): Promise<Buffer | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(QR_ASSETS_BUCKET)
      .download(storagePath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

export async function uploadCachedQrPng(
  storagePath: string,
  png: Buffer
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(QR_ASSETS_BUCKET)
      .upload(storagePath, png, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000',
      });
    if (error) {
      console.warn('[qr-cache] upload:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function persistQrAssetCache(
  qrId: string,
  hash: string,
  storagePath: string
): Promise<void> {
  await supabaseAdmin
    .from('qr_codes')
    .update({
      asset_hash: hash,
      cached_png_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', qrId);
}

export async function invalidateQrAssetCache(qrId: string): Promise<void> {
  await supabaseAdmin
    .from('qr_codes')
    .update({
      asset_hash: null,
      cached_png_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', qrId);
}

export function isCacheValid(qr: QrCodeRecord, hash: string): boolean {
  return Boolean(qr.cached_png_path && qr.asset_hash === hash);
}
