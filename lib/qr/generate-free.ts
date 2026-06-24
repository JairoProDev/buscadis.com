import QRCode from 'qrcode';
import sharp from 'sharp';
import type { QrStyleConfig } from './types';
import { buildFreeStyleConfig } from './presets';
import { fetchLogoDataUrl } from './logo-image';

export interface GenerateFreeQrOptions {
  data: string;
  themeColor?: string;
  styleConfig?: QrStyleConfig;
  width?: number;
  logoUrl?: string;
}

async function compositeLogoOnQr(
  qrPng: Buffer,
  logoUrl: string,
  width: number
): Promise<Buffer> {
  const dataUrl = await fetchLogoDataUrl(logoUrl, Math.round(width * 0.4));
  if (!dataUrl) return qrPng;

  const logoBuf = Buffer.from(dataUrl.split(',')[1]!, 'base64');
  const logoSize = Math.round(width * 0.22);
  const pad = Math.round(logoSize * 0.12);
  const plateSize = logoSize + pad * 2;

  const plate = await sharp({
    create: {
      width: plateSize,
      height: plateSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const logo = await sharp(logoBuf)
    .resize(logoSize, logoSize, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const left = Math.round((width - plateSize) / 2);
  const top = Math.round((width - plateSize) / 2);

  return sharp(qrPng)
    .composite([
      { input: plate, left, top },
      { input: logo, left: left + pad, top: top + pad },
    ])
    .png()
    .toBuffer();
}

/** QR con logo del negocio (esquinas redondeadas vía qr-code-styling o composición sharp). */
export async function generateFreeQrPng(options: GenerateFreeQrOptions): Promise<Buffer> {
  const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
  const width = options.width ?? 512;
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';

  if (config.renderMode === 'classic') {
    return QRCode.toBuffer(options.data, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 2,
      width,
      color: { dark, light },
    });
  }

  if (options.logoUrl) {
    let styled: Buffer | null = null;
    try {
      const { generateProQrPng } = await import('./generate-pro');
      styled = await generateProQrPng({
        data: options.data,
        styleConfig: {
          ...config,
          dotType: config.dotType || 'rounded',
          cornerSquareType: config.cornerSquareType || 'extra-rounded',
          cornerDotType: config.cornerDotType || 'dot',
          hideBackgroundDots: true,
          imageSize: config.imageSize ?? 0.28,
        },
        width,
        logoUrl: options.logoUrl,
      });
    } catch (err) {
      console.warn('[qr] styled logo failed:', err);
    }

    // qr-code-styling a veces ignora el logo (SVG) — composición sharp es fiable
    if (!styled || styled.length < 10_000) {
      const plain = await QRCode.toBuffer(options.data, {
        type: 'png',
        errorCorrectionLevel: 'H',
        margin: 2,
        width,
        color: { dark, light },
      });
      return compositeLogoOnQr(plain, options.logoUrl, width);
    }
    return styled;
  }

  return QRCode.toBuffer(options.data, {
    type: 'png',
    errorCorrectionLevel: 'Q',
    margin: 2,
    width,
    color: { dark, light },
  });
}

export async function generateFreeQrSvg(options: GenerateFreeQrOptions): Promise<string> {
  if (options.logoUrl) {
    try {
      const { generateProQrSvg } = await import('./generate-pro');
      const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
      return await generateProQrSvg({
        data: options.data,
        styleConfig: {
          ...config,
          dotType: config.dotType || 'rounded',
          cornerSquareType: config.cornerSquareType || 'extra-rounded',
          cornerDotType: config.cornerDotType || 'dot',
          hideBackgroundDots: true,
          imageSize: config.imageSize ?? 0.28,
        },
        width: options.width ?? 400,
        logoUrl: options.logoUrl,
      });
    } catch {
      /* fallback below */
    }
  }

  const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';
  const width = options.width ?? 400;

  return QRCode.toString(options.data, {
    type: 'svg',
    errorCorrectionLevel: 'Q',
    margin: 2,
    width,
    color: { dark, light },
  });
}

export async function generateFreeQrSvgInline(options: GenerateFreeQrOptions): Promise<string> {
  const svg = await generateFreeQrSvg(options);
  return svg.replace(/<\?xml[^>]*\?>\s*/i, '').trim();
}
