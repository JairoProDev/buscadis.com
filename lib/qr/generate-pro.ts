import type { QrStyleConfig } from './types';
import { fetchLogoDataUrl } from './logo-image';

export interface GenerateProQrOptions {
  data: string;
  styleConfig: QrStyleConfig;
  width?: number;
  logoUrl?: string;
  skipLogo?: boolean;
}

type QrCodeStylingCtor = new (options: Record<string, unknown>) => {
  getRawData: (ext: string) => Promise<Buffer | Blob | null>;
  update: (options: Record<string, unknown>) => void;
};

async function loadQrCodeStyling(): Promise<QrCodeStylingCtor> {
  const mod = await import('qr-code-styling');
  return mod.default as unknown as QrCodeStylingCtor;
}

async function buildStylingOptions(
  options: GenerateProQrOptions
): Promise<Record<string, unknown>> {
  const { styleConfig, data, width = 512, logoUrl, skipLogo } = options;

  let image: string | undefined;
  if (!skipLogo) {
    const imgUrl = logoUrl || styleConfig.logoUrl;
    if (imgUrl) {
      image = (await fetchLogoDataUrl(imgUrl)) || undefined;
    }
  }

  const dotsOptions: Record<string, unknown> = {
    type: styleConfig.dotType || 'rounded',
  };
  if (styleConfig.gradient) {
    dotsOptions.gradient = styleConfig.gradient;
  } else {
    dotsOptions.color = styleConfig.dotsColor || '#0f172a';
  }

  return {
    width,
    height: width,
    type: 'canvas',
    data,
    margin: 8,
    qrOptions: {
      errorCorrectionLevel: image ? 'H' : 'Q',
    },
    dotsOptions,
    backgroundOptions: {
      color: styleConfig.backgroundColor || '#ffffff',
    },
    cornersSquareOptions: {
      type: styleConfig.cornerSquareType || 'extra-rounded',
      color: styleConfig.dotsColor || '#0f172a',
    },
    cornersDotOptions: {
      type: styleConfig.cornerDotType || 'dot',
      color: styleConfig.dotsColor || '#0f172a',
    },
    imageOptions: image
      ? {
          hideBackgroundDots: styleConfig.hideBackgroundDots ?? true,
          imageSize: styleConfig.imageSize ?? 0.35,
          margin: 4,
          crossOrigin: 'anonymous',
          saveAsBlob: true,
        }
      : undefined,
    image,
  };
}

export async function generateProQrPng(options: GenerateProQrOptions): Promise<Buffer> {
  const QRCodeStyling = await loadQrCodeStyling();
  const { createCanvas, loadImage } = await import('canvas');
  const { JSDOM } = await import('jsdom');

  const stylingOptions = await buildStylingOptions(options);
  const qr = new QRCodeStyling({
    ...stylingOptions,
    jsdom: JSDOM,
    nodeCanvas: { createCanvas, loadImage },
  });

  const raw = await qr.getRawData('png');
  if (!raw) throw new Error('No se pudo generar el QR Pro');
  if (Buffer.isBuffer(raw)) return raw;
  const arr = await (raw as Blob).arrayBuffer();
  return Buffer.from(arr);
}

export async function generateProQrSvg(options: GenerateProQrOptions): Promise<string> {
  const QRCodeStyling = await loadQrCodeStyling();
  const { createCanvas, loadImage } = await import('canvas');
  const { JSDOM } = await import('jsdom');

  const stylingOptions = {
    ...(await buildStylingOptions({ ...options, width: options.width ?? 400 })),
    type: 'svg',
  };

  const qr = new QRCodeStyling({
    ...stylingOptions,
    jsdom: JSDOM,
    nodeCanvas: { createCanvas, loadImage },
  });

  const raw = await qr.getRawData('svg');
  if (!raw) throw new Error('No se pudo generar el QR Pro SVG');
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  const text = await (raw as Blob).text();
  return text;
}
