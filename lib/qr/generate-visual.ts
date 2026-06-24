import type { QrStyleConfig } from './types';
import { createQrMatrix, getQuietZoneModules } from './matrix-masks';
import { fetchLogoLuminanceMap } from './logo-image';
import { drawDataHalftone } from './halftone';
import { drawFinderPatterns, drawTimingPatterns } from './finder-brand';

export interface GenerateVisualQrOptions {
  data: string;
  styleConfig: QrStyleConfig;
  width?: number;
  logoUrl?: string;
  themeColor?: string;
}

export async function generateVisualQrPng(options: GenerateVisualQrOptions): Promise<Buffer> {
  const matrix = createQrMatrix(options.data);
  const quiet = getQuietZoneModules(options.styleConfig.quietZoneModules);
  const totalModules = matrix.size + quiet * 2;
  const width = options.width ?? 512;
  const modulePx = width / totalModules;
  const offsetModules = quiet;

  const dotsColor =
    options.styleConfig.dotsColor ||
    options.themeColor ||
    '#1e293b';
  const finderColor =
    options.styleConfig.finderBrandColor ||
    options.themeColor ||
    dotsColor;
  const bg = options.styleConfig.backgroundColor || '#ffffff';
  const intensity = options.styleConfig.halftoneIntensity ?? 0.75;
  const dotScale = options.styleConfig.dotScale ?? 0.35;
  const buscadisMark = options.styleConfig.buscadisFinderMark !== false;

  const luminance = options.logoUrl
    ? await fetchLogoLuminanceMap(options.logoUrl, matrix.size)
    : null;

  const { createCanvas, loadImage } = await import('canvas');
  const canvas = createCanvas(width, width);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, width);

  drawDataHalftone(
    ctx,
    matrix,
    luminance,
    modulePx,
    offsetModules,
    dotsColor,
    intensity,
    dotScale
  );

  drawTimingPatterns(ctx, matrix, modulePx, offsetModules, dotsColor);

  await drawFinderPatterns(
    ctx,
    matrix,
    {
      modulePx,
      offsetModules,
      finderColor,
      darkColor: dotsColor,
      lightColor: bg,
      cornerStyle:
        options.styleConfig.cornerSquareType === 'dot' ? 'rounded' : 'rounded',
      buscadisMark,
    },
    (buf) => loadImage(buf)
  );

  return canvas.toBuffer('image/png');
}
