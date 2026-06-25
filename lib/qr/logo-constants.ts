/** Logo fijo al 50% del QR — máxima legibilidad al escanear. */
export const QR_LOGO_SIZE_RATIO = 0.5;

export function clampLogoSizeRatio(_ratio?: number): number {
  return QR_LOGO_SIZE_RATIO;
}

export function logoSizeToPercent(): number {
  return 50;
}
