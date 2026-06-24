import type { CanvasRenderingContext2D, Image } from 'canvas';
import type { QrMatrix } from './matrix-masks';
import { isProtectedModule } from './matrix-masks';

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return [30, 41, 59];
  const v = parseInt(n, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Dibuja el logo de fondo suave para reforzar la fusión visual. */
export function drawLogoUnderlay(
  ctx: CanvasRenderingContext2D,
  logoImg: Image,
  canvasWidth: number,
  intensity: number
) {
  const maxW = canvasWidth * 0.42;
  const scale = maxW / Math.max(logoImg.width, logoImg.height);
  const w = logoImg.width * scale;
  const h = logoImg.height * scale;
  const x = (canvasWidth - w) / 2;
  const y = (canvasWidth - h) / 2;
  ctx.save();
  ctx.globalAlpha = 0.18 + intensity * 0.22;
  ctx.drawImage(logoImg, x, y, w, h);
  ctx.restore();
}

export function drawDataHalftone(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  luminance: Uint8Array | null,
  modulePx: number,
  offsetModules: number,
  dotColor: string,
  intensity: number,
  dotScale: number
) {
  const { size } = matrix;
  const [r, g, b] = parseHex(dotColor);
  const o = offsetModules * modulePx;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isProtectedModule(matrix, row, col)) continue;
      if (!matrix.get(row, col)) continue;

      const lum = luminance ? (luminance[row * size + col] ?? 128) : 128;
      const darkness = 1 - lum / 255;

      // Zonas claras del logo → puntos más pequeños o transparentes (deja ver el logo)
      if (darkness < 0.12) {
        const faint = 0.15 + darkness * 2;
        if (faint * intensity < 0.2) continue;
      }

      const sizeMul = 0.25 + darkness * (0.9 + intensity * 0.8);
      const radius = modulePx * dotScale * sizeMul * (1 + intensity * 0.35);
      const alpha = Math.min(1, 0.45 + darkness * (0.35 + intensity * 0.45));

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(
        o + col * modulePx + modulePx / 2,
        o + row * modulePx + modulePx / 2,
        Math.max(0.4, radius),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
