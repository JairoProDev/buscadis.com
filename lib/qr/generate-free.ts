import QRCode from 'qrcode';
import type { QrStyleConfig } from './types';
import { buildFreeStyleConfig } from './presets';
import { compositeLogoOnQr, plainQrPng } from './composite-logo';
import { generateProQrPng } from './generate-pro';

export interface GenerateFreeQrOptions {
  data: string;
  themeColor?: string;
  styleConfig?: QrStyleConfig;
  width?: number;
  logoUrl?: string;
}

/** QR con logo del negocio (estilo + composición sharp fiable). */
export async function generateFreeQrPng(options: GenerateFreeQrOptions): Promise<Buffer> {
  const config = options.styleConfig || buildFreeStyleConfig(options.themeColor);
  const width = options.width ?? 512;
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';

  if (config.renderMode === 'classic') {
    return plainQrPng(options.data, width, dark, light);
  }

  if (options.logoUrl) {
    try {
      const styled = await generateProQrPng({
        data: options.data,
        styleConfig: {
          ...config,
          dotType: config.dotType || 'rounded',
          cornerSquareType: config.cornerSquareType || 'extra-rounded',
          cornerDotType: config.cornerDotType || 'dot',
        },
        width,
        skipLogo: true,
      });
      return compositeLogoOnQr(styled, options.logoUrl, width);
    } catch (err) {
      console.warn('[qr] styled branded failed, plain composite:', err);
      const plain = await plainQrPng(options.data, width, dark, light);
      return compositeLogoOnQr(plain, options.logoUrl, width);
    }
  }

  try {
    return await generateProQrPng({
      data: options.data,
      styleConfig: config,
      width,
      skipLogo: true,
    });
  } catch {
    return plainQrPng(options.data, width, dark, light);
  }
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
