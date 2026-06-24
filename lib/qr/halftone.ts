import type { CanvasRenderingContext2D } from 'canvas';
import type { QrMatrix } from './matrix-masks';
import { isProtectedModule } from './matrix-masks';

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return [30, 41, 59];
  const v = parseInt(n, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
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
      const radius = modulePx * dotScale * (0.5 + darkness * intensity);
      const alpha = 0.65 + darkness * 0.35;

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      ctx.arc(
        o + col * modulePx + modulePx / 2,
        o + row * modulePx + modulePx / 2,
        Math.max(0.5, radius),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
