import sharp from 'sharp';
import type { QualityGateResult } from './quality-gate';
import { validateQrDecodable } from './quality-gate';

export interface RobustnessResult {
  ok: boolean;
  passed: number;
  total: number;
  message?: string;
}

const ROBUST_TESTS = 4;

/** Simula escaneo en condiciones adversas (blur, escala, JPEG). */
export async function validateQrRobustness(
  imageBuffer: Buffer,
  expectedData: string
): Promise<RobustnessResult> {
  let passed = 0;

  const base = await validateQrDecodable(imageBuffer, expectedData);
  if (base.ok) passed++;

  try {
    const blurred = await sharp(imageBuffer).blur(1.0).png().toBuffer();
    const blurResult = await validateQrDecodable(blurred, expectedData);
    if (blurResult.ok) passed++;
  } catch {
    /* skip */
  }

  try {
    const meta = await sharp(imageBuffer).metadata();
    const w = meta.width || 512;
    const scaled = await sharp(imageBuffer)
      .resize(Math.max(128, Math.round(w * 0.5)))
      .png()
      .toBuffer();
    const scaleResult = await validateQrDecodable(scaled, expectedData);
    if (scaleResult.ok) passed++;
  } catch {
    /* skip */
  }

  try {
    const jpeg = await sharp(imageBuffer).jpeg({ quality: 85 }).toBuffer();
    const jpegResult = await validateQrDecodable(jpeg, expectedData);
    if (jpegResult.ok) passed++;
  } catch {
    /* skip */
  }

  const ok = passed >= 3;
  return {
    ok,
    passed,
    total: ROBUST_TESTS,
    message: ok
      ? undefined
      : `Robustez insuficiente (${passed}/${ROBUST_TESTS} pruebas).`,
  };
}

export async function runFullQualityGate(
  png: Buffer,
  expectedData: string,
  dotsColor: string,
  backgroundColor: string,
  options: { mode: 'classic' | 'branded' | 'visual'; requireRobust?: boolean }
): Promise<QualityGateResult & { robust?: RobustnessResult }> {
  const { validateQrContrast } = await import('./quality-gate');
  const minContrast = options.mode === 'visual' ? 4.5 : 4.5;

  const contrast = validateQrContrast(dotsColor, backgroundColor);
  if (contrast.contrast < minContrast) {
    return { ...contrast, ok: false };
  }

  const decode = await validateQrDecodable(png, expectedData);
  if (!decode.ok) return decode;

  if (options.requireRobust && options.mode === 'visual') {
    const robust = await validateQrRobustness(png, expectedData);
    if (!robust.ok) {
      return {
        ok: false,
        contrast: contrast.contrast,
        message: robust.message,
        robust,
      };
    }
    return { ok: true, contrast: contrast.contrast, robust };
  }

  return { ok: true, contrast: contrast.contrast };
}
