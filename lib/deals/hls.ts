import { isDealHlsEnabled } from '@/lib/deals/config';

/**
 * Fase 1.5: HLS transcoding via Mux / Cloudflare Stream.
 * MVP uses direct mp4 URLs from Supabase Storage.
 */
export function resolvePlaybackUrl(directUrl: string, hlsUrl?: string | null): string {
  if (isDealHlsEnabled() && hlsUrl) return hlsUrl;
  return directUrl;
}

export function shouldUseNativeHls(url: string): boolean {
  return url.includes('.m3u8');
}
