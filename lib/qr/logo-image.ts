import sharp from 'sharp';

function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('.supabase.co')) return null;
    const match = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

function isSvgUrl(url: string, contentType: string): boolean {
  return contentType.includes('svg') || url.toLowerCase().split('?')[0].endsWith('.svg');
}

async function downloadLogoRaw(logoUrl: string): Promise<{ buf: Buffer; contentType: string } | null> {
  const parsed = parseSupabaseStorageUrl(logoUrl);
  if (parsed) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase-admin');
      const { data, error } = await supabaseAdmin.storage
        .from(parsed.bucket)
        .download(parsed.path);
      if (!error && data) {
        const buf = Buffer.from(await data.arrayBuffer());
        const lower = parsed.path.toLowerCase();
        const contentType = lower.endsWith('.svg')
          ? 'image/svg+xml'
          : lower.endsWith('.png')
            ? 'image/png'
            : lower.endsWith('.webp')
              ? 'image/webp'
              : 'application/octet-stream';
        return { buf, contentType };
      }
      console.warn('[qr] supabase logo download:', error?.message, parsed.bucket, parsed.path);
    } catch (err) {
      console.warn('[qr] supabase logo download error:', err);
    }
  }

  try {
    const res = await fetch(logoUrl, {
      headers: {
        Accept: 'image/*,*/*',
        'User-Agent': 'Buscadis-QR-Generator/1.0',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn('[qr] logo HTTP fetch failed:', res.status, logoUrl.slice(0, 120));
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    return { buf, contentType };
  } catch (err) {
    console.warn('[qr] logo fetch error:', err);
    return null;
  }
}

async function rasterizeToPng(buf: Buffer, isSvg: boolean, size: number): Promise<Buffer> {
  const resizeOpts = {
    fit: 'inside' as const,
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  };

  if (!isSvg) {
    return sharp(buf).resize(size, size, resizeOpts).png().toBuffer();
  }

  try {
    return await sharp(buf, { density: 300 }).resize(size, size, resizeOpts).png().toBuffer();
  } catch {
    return await sharp(buf).resize(size, size, resizeOpts).png().toBuffer();
  }
}

/** Logo listo para qr-code-styling (PNG data URL; rasteriza SVG). */
export async function fetchLogoDataUrl(logoUrl: string, size = 320): Promise<string | null> {
  try {
    const raw = await downloadLogoRaw(logoUrl);
    if (!raw) return null;

    const png = await rasterizeToPng(raw.buf, isSvgUrl(logoUrl, raw.contentType), size);
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (err) {
    console.warn('[qr] fetchLogoDataUrl:', err);
    return null;
  }
}

/** Grayscale luminance map [0..255] row-major, size x size. */
export async function fetchLogoLuminanceMap(
  logoUrl: string,
  size: number
): Promise<Uint8Array | null> {
  try {
    const raw = await downloadLogoRaw(logoUrl);
    if (!raw) return null;

    const isSvg = isSvgUrl(logoUrl, raw.contentType);
    const containOpts = {
      fit: 'contain' as const,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    };

    const pipeline = isSvg
      ? sharp(raw.buf, { density: 300 }).resize(size, size, containOpts)
      : sharp(raw.buf).resize(size, size, containOpts);

    const { data } = await pipeline.normalize().greyscale().raw().toBuffer({ resolveWithObject: true });
    return new Uint8Array(data);
  } catch (err) {
    console.warn('[qr] logo luminance:', err);
    return null;
  }
}

export async function fetchLogoPngBuffer(logoUrl: string, size: number): Promise<Buffer | null> {
  try {
    const raw = await downloadLogoRaw(logoUrl);
    if (!raw) return null;
    return rasterizeToPng(raw.buf, isSvgUrl(logoUrl, raw.contentType), size);
  } catch {
    return null;
  }
}
