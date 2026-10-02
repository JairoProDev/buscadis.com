import type { FlyerConfig, FlyerDensity } from './types';

function scaled(scale: number, minRem: number, cqi: number, maxRem: number): string {
  const s = Math.max(0.45, Math.min(2.4, scale));
  return `clamp(${minRem * s}rem, ${cqi * s}cqi, ${maxRem * s}rem)`;
}

export function flyerTitleFontSize(
  titleScale: FlyerConfig['titleScale'] = 'm',
  density: FlyerDensity = 'comfortable',
  pieceScale = 1,
): string {
  if (density === 'compact') {
    return scaled(pieceScale, 0.78, 8.8, 1.45);
  }
  if (titleScale === 's') return scaled(pieceScale, 1.1, 7, 2.4);
  if (titleScale === 'l') return scaled(pieceScale, 1.55, 9.5, 3.2);
  return scaled(pieceScale, 1.3, 8.2, 2.8);
}

export function flyerMetaFontSize(density: FlyerDensity = 'comfortable', pieceScale = 1): string {
  return density === 'compact' ? scaled(pieceScale, 0.52, 3.6, 0.8) : scaled(pieceScale, 0.65, 3.2, 0.95);
}

export function flyerPriceFontSize(density: FlyerDensity = 'comfortable', pieceScale = 1): string {
  return density === 'compact' ? scaled(pieceScale, 0.7, 5.6, 1.1) : scaled(pieceScale, 1.05, 5.5, 1.85);
}
