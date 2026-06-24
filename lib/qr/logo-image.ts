import sharp from 'sharp';

/** Logo listo para qr-code-styling (PNG data URL; rasteriza SVG). */
export async function fetchLogoDataUrl(logoUrl: string, size = 320): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    const isSvg =
      contentType.includes('svg') || logoUrl.toLowerCase().split('?')[0].endsWith('.svg');

    const png = isSvg
      ? await sharp(buf, { density: 300 })
          .resize(size, size, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer()
      : await sharp(buf)
          .resize(size, size, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();

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
    const res = await fetch(logoUrl);
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    const isSvg =
      contentType.includes('svg') || logoUrl.toLowerCase().split('?')[0].endsWith('.svg');

    const pipeline = isSvg
      ? sharp(buf, { density: 300 }).resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
      : sharp(buf).resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        });

    const { data } = await pipeline
      .normalize()
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return new Uint8Array(data);
  } catch (err) {
    console.warn('[qr] logo luminance:', err);
    return null;
  }
}

export async function fetchLogoPngBuffer(logoUrl: string, size: number): Promise<Buffer | null> {
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    const isSvg =
      contentType.includes('svg') || logoUrl.toLowerCase().split('?')[0].endsWith('.svg');

    if (isSvg) {
      return sharp(buf, { density: 300 })
        .resize(size, size, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
    }
    return sharp(buf)
      .resize(size, size, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}
