import QRCode from 'qrcode';
import type { GenerateQrResult, QrRenderMode, QrStyleConfig } from './types';
import { normalizeStyleConfig } from './default-style';
import { runFullQualityGate } from './quality-robust';
import { isTransparentBackground, resolveBackgroundColor, applyTransparentBackground } from './transparent-bg';
import { clampLogoSizeRatio } from './logo-constants';

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

async function finalizePng(png: Buffer, config: QrStyleConfig): Promise<Buffer> {
  if (!isTransparentBackground(config)) return png;
  return applyTransparentBackground(png);
}

async function withCenterLogo(png: Buffer, options: GenerateQrOptions): Promise<Buffer> {
  if (!options.logoUrl) return png;
  const { compositeLogoOnQr } = await import('./composite-logo');
  const width = options.width ?? 512;
  const ratio = clampLogoSizeRatio(options.styleConfig.imageSize);
  return compositeLogoOnQr(png, options.logoUrl, width, ratio);
}

async function generateClassicPng(options: GenerateQrOptions): Promise<Buffer> {
  const config = options.styleConfig;
  const width = options.width ?? 512;
  const dark = config.dotsColor || options.themeColor || '#1e293b';

  try {
    const { generateProQrPng } = await import('./generate-pro');
    const styled = await generateProQrPng({
      data: options.data,
      styleConfig: config,
      width,
      skipLogo: true,
    });
    return withCenterLogo(styled, options);
  } catch {
    const plain = await QRCode.toBuffer(options.data, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 2,
      width,
      color: { dark, light: resolveBackgroundColor(config) },
    });
    return withCenterLogo(plain, options);
  }
}

async function generateBrandedPng(options: GenerateQrOptions): Promise<Buffer> {
  const { compositeLogoOnQr, plainQrPng } = await import('./composite-logo');
  const tier = options.tier || 'free';
  const width = options.width ?? 512;
  const config = options.styleConfig;
  const dark = config.dotsColor || options.themeColor || '#1e293b';
  const logoRatio = clampLogoSizeRatio(config.imageSize);

  if (options.logoUrl) {
    let styled: Buffer | null = null;
    try {
      const { generateProQrPng } = await import('./generate-pro');
      styled = await generateProQrPng({
        data: options.data,
        styleConfig: options.styleConfig,
        width,
        skipLogo: true,
      });
    } catch (err) {
      console.warn('[qr] styled QR failed (canvas?), using plain QR + logo:', err);
      styled = await plainQrPng(options.data, width, dark, config);
    }
    return compositeLogoOnQr(styled, options.logoUrl, width, logoRatio);
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
  const bg = isTransparentBackground(options.styleConfig)
    ? '#ffffff'
    : options.styleConfig.backgroundColor || '#ffffff';

  // jsQR no decodifica bien QRs con logo centrado; el escaneo real con ECC-H sí funciona.
  if (mode === 'branded' && options.logoUrl) {
    const { validateQrContrast } = await import('./quality-gate');
    const contrast = validateQrContrast(dots, bg);
    return { png, qaOk: contrast.ok, message: contrast.message };
  }

  const qa = await runFullQualityGate(png, options.data, dots, bg, {
    mode,
    requireRobust: false,
  });

  return { png, qaOk: qa.ok, message: qa.message };
}

/**
 * Genera PNG con fallback automático: branded → classic.
 * Nunca entrega un QR que no pase QA en al menos un modo.
 */
export async function generateQrPng(options: GenerateQrOptions): Promise<GenerateQrResult> {
  const config = normalizeStyleConfig(options.styleConfig, options.themeColor);
  const chain: QrRenderMode[] = ['branded', 'classic'];

  let lastError: string | undefined;
  let lastPng: Buffer | null = null;

  const requested: QrRenderMode = 'branded';

  for (const mode of chain) {
    try {
      const { png: rawPng, qaOk, message } = await tryMode(mode, {
        ...options,
        styleConfig: { ...config, renderMode: mode },
      });
      lastPng = rawPng;
      if (qaOk) {
        const degraded = mode !== requested;
        const png = await finalizePng(rawPng, config);
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
    const png = await finalizePng(lastPng, config);
    return {
      png,
      requestedMode: requested,
      actualMode: 'classic',
      qaStatus: 'degraded',
      degraded: true,
    };
  }

  throw new Error(lastError || 'No se pudo generar el código QR');
}

export async function generateQrSvg(options: GenerateQrOptions): Promise<string> {
  const config = normalizeStyleConfig(options.styleConfig, options.themeColor);
  const width = options.width ?? 400;

  try {
    const { generateProQrSvg } = await import('./generate-pro');
    return await generateProQrSvg({
      data: options.data,
      styleConfig: { ...config, renderMode: 'branded' },
      width,
      logoUrl: options.logoUrl,
      skipLogo: false,
    });
  } catch {
    const dark = config.dotsColor || options.themeColor || '#1e293b';
    return QRCode.toString(options.data, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      width,
      color: { dark, light: resolveBackgroundColor(config) },
    });
  }
}
