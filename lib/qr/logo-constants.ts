/** Rango del slider de logo: 50% mínimo, 100% = borde a borde del área útil. */
export const QR_LOGO_SIZE_MIN = 0.5;
export const QR_LOGO_SIZE_MAX = 1;

export function clampLogoSizeRatio(ratio?: number): number {
  const r = ratio ?? QR_LOGO_SIZE_MIN;
  return Math.min(QR_LOGO_SIZE_MAX, Math.max(QR_LOGO_SIZE_MIN, r));
}

/** Porcentaje UI (50–100) desde ratio almacenado. */
export function logoSizeToPercent(ratio?: number): number {
  return Math.round(clampLogoSizeRatio(ratio) * 100);
}
