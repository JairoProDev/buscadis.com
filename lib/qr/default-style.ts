import type { QrStyleConfig } from './types';

/** Único estilo QR: logo centrado, puntos circulares, esquinas redondeadas, logo al 50%. */
export function buildQrStudioDefaults(themeColor?: string): QrStyleConfig {
  const dots =
    themeColor && /^#[0-9a-fA-F]{6}$/.test(themeColor) ? themeColor : '#1e293b';
  return {
    renderMode: 'branded',
    dotsColor: dots,
    backgroundColor: '#ffffff',
    dotType: 'dots',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    hideBackgroundDots: true,
    imageSize: 0.5,
    buscadisFinderMark: true,
  };
}

/** Fuerza el estilo único al cargar o guardar (ignora modos viejos). */
export function normalizeStyleConfig(
  config: Partial<QrStyleConfig> | undefined,
  themeColor?: string
): QrStyleConfig {
  const base = buildQrStudioDefaults(themeColor);
  if (!config) return base;
  return {
    ...base,
    dotsColor: config.dotsColor || base.dotsColor,
    backgroundColor: config.backgroundColor || base.backgroundColor,
    transparentBackground: config.transparentBackground,
  };
}
