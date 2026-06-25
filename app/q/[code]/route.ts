import { NextRequest, NextResponse } from 'next/server';
import { getQrByShortCode, recordQrScan } from '@/lib/qr/service';
import { getProfileRedirectUrl } from '@/lib/qr/resolve-url';
import { parseUtmFromSearchParams } from '@/lib/analytics/attribution';

export const runtime = 'nodejs';

const CACHE_TTL_MS = 5 * 60 * 1000;
const lookupCache = new Map<string, { slug: string; qrId: string; expires: number }>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const shortCode = code?.trim();
  if (!shortCode || shortCode.length > 16) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  let cached = lookupCache.get(shortCode);
  if (!cached || cached.expires < Date.now()) {
    const qr = await getQrByShortCode(shortCode);
    if (!qr?.destination_slug) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    cached = {
      slug: qr.destination_slug,
      qrId: qr.id,
      expires: Date.now() + CACHE_TTL_MS,
    };
    lookupCache.set(shortCode, cached);
  }

  const destinationBase = getProfileRedirectUrl(cached.slug, true);
  const utm = parseUtmFromSearchParams(req.nextUrl.searchParams);
  const destinationUrl = new URL(destinationBase);
  for (const [key, value] of Object.entries(utm)) {
    if (value) destinationUrl.searchParams.set(key, value);
  }
  if (!destinationUrl.searchParams.has('utm_source')) {
    destinationUrl.searchParams.set('utm_source', 'qr');
  }
  if (!destinationUrl.searchParams.has('utm_medium')) {
    destinationUrl.searchParams.set('utm_medium', 'offline');
  }

  const scanPayload = {
    qrCodeId: cached.qrId,
    userAgent: req.headers.get('user-agent'),
    referrer: req.headers.get('referer'),
    country: req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry'),
    city: req.headers.get('x-vercel-ip-city'),
    sessionId: req.headers.get('x-vercel-id'),
    metadata: { utm, short_code: shortCode },
  };

  void recordQrScan(scanPayload).catch(() => {});

  return NextResponse.redirect(destinationUrl, { status: 302 });
}
