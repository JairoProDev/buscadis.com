import sharp from 'sharp';
import type { QrStyleConfig } from './types';

export function isTransparentBackground(config: QrStyleConfig): boolean {
  return config.transparentBackground === true;
}

export function resolveBackgroundColor(config: QrStyleConfig): string {
  if (isTransparentBackground(config)) return '#ffffff00';
  return config.backgroundColor || '#ffffff';
}

/** Convierte píxeles blancos (fondo) en alpha 0. */
export async function applyTransparentBackground(
  png: Buffer,
  tolerance = 20
): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}
