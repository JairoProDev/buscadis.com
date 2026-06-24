import QRCode from 'qrcode';
import type { GenerateQrResult, QrRenderMode, QrStyleConfig } from './types';
import { resolveRenderMode } from './presets';
import { runFullQualityGate } from './quality-robust';

export interface GenerateQrOptions {
  data: string;
  styleConfig: QrStyleConfig;
  width?: number;
  logoUrl?: string;
  themeColor?: string;
  tier?: 'free' | 'pro';
  renderMode?: QrRenderMode;
  skipQa?: boolean;
}

async function generateClassicPng(options: GenerateQrOptions): Promise<Buffer> {
  const config = options.styleConfig;
  const width = options.width ?? 512;
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const light = config.backgroundColor || '#ffffff';

  return QRCode.toBuffer(options.data, {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 2,
    width,
    color: { dark, light },
  });
}

async function generateBrandedPng(options: GenerateQrOptions): Promise<Buffer> {
  const { compositeLogoOnQr } = await import('./composite-logo');
  const tier = options.tier || 'free';
  const width = options.width ?? 512;

  if (options.logoUrl) {
    const { generateProQrPng } = await import('./generate-pro');
    const styled = await generateProQrPng({
      data: options.data,
      styleConfig: options.styleConfig,
      width,
      skipLogo: true,
    });
    return compositeLogoOnQr(styled, options.logoUrl, width);
  }

  if (tier === 'pro') {
    const { generateProQrPng } = await import('./generate-pro');
    return generateProQrPng({
      data: options.data,
      styleConfig: options.styleConfig,
      width,
      skipLogo: true,
    });
  }
  const { generateFreeQrPng } = await import('./generate-free');
  return generateFreeQrPng({
    data: options.data,
    themeColor: options.themeColor,
    styleConfig: { ...options.styleConfig, renderMode: 'branded' },
    width,
  });
}

async function generateVisualPng(options: GenerateQrOptions): Promise<Buffer> {
  const { generateVisualQrPng } = await import('./generate-visual');
  return generateVisualQrPng({
    data: options.data,
    styleConfig: options.styleConfig,
    width: options.width,
    logoUrl: options.logoUrl,
    themeColor: options.themeColor,
  });
}

async function tryMode(
  mode: QrRenderMode,
  options: GenerateQrOptions
): Promise<{ png: Buffer; qaOk: boolean; message?: string }> {
  let png: Buffer;
  if (mode === 'classic') {
    png = await generateClassicPng(options);
  } else if (mode === 'visual') {
    png = await generateVisualPng(options);
  } else {
    png = await generateBrandedPng(options);
  }

  if (options.skipQa) return { png, qaOk: true };

  const dots = options.styleConfig.dotsColor || options.themeColor || '#1e293b';
  const bg = options.styleConfig.backgroundColor || '#ffffff';
  const qa = await runFullQualityGate(png, options.data, dots, bg, {
    mode,
    requireRobust: mode === 'visual',
  });

  return { png, qaOk: qa.ok, message: qa.message };
}

/**
 * Genera PNG con fallback automático: visual → branded → classic.
 * Nunca entrega un QR que no pase QA en al menos un modo.
 */
export async function generateQrPng(options: GenerateQrOptions): Promise<GenerateQrResult> {
  const requested =
    options.renderMode || resolveRenderMode(options.styleConfig, 'branded');

  const chain: QrRenderMode[] =
    requested === 'visual'
      ? ['visual', 'branded', 'classic']
      : requested === 'branded'
        ? ['branded', 'classic']
        : ['classic'];

  let lastError: string | undefined;
  let lastPng: Buffer | null = null;

  for (const mode of chain) {
    try {
      const { png, qaOk, message } = await tryMode(mode, {
        ...options,
        styleConfig: { ...options.styleConfig, renderMode: mode },
      });
      lastPng = png;
      if (qaOk) {
        const degraded = mode !== requested;
        return {
          png,
          requestedMode: requested,
          actualMode: mode,
          qaStatus: degraded ? 'degraded' : 'passed',
          degraded,
        };
      }
      lastError = message;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Error de generación';
      console.warn(`[qr] mode ${mode} failed:`, err);
    }
  }

  if (lastPng) {
    return {
      png: lastPng,
      requestedMode: requested,
      actualMode: 'classic',
      qaStatus: 'degraded',
      degraded: true,
    };
  }

  throw new Error(lastError || 'No se pudo generar el código QR');
}

export async function generateQrSvg(options: GenerateQrOptions): Promise<string> {
  const mode = options.renderMode || resolveRenderMode(options.styleConfig, 'branded');
  if (mode === 'classic') {
    const dark = options.styleConfig.dotsColor || options.themeColor || '#1e293b';
    const light = options.styleConfig.backgroundColor || '#ffffff';
    return QRCode.toString(options.data, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      width: options.width ?? 400,
      color: { dark, light },
    });
  }

  const tier = options.tier || 'free';
  if (tier === 'pro') {
    const { generateProQrSvg } = await import('./generate-pro');
    return generateProQrSvg({
      data: options.data,
      styleConfig: options.styleConfig,
      width: options.width,
      logoUrl: options.logoUrl,
    });
  }
  const { generateFreeQrSvg } = await import('./generate-free');
  return generateFreeQrSvg({
    data: options.data,
    themeColor: options.themeColor,
    styleConfig: options.styleConfig,
    width: options.width,
    logoUrl: options.logoUrl,
  });
}
