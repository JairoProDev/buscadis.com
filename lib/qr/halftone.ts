import type { CanvasRenderingContext2D, Image } from 'canvas';
import type { QrDotType } from './types';
import type { QrMatrix } from './matrix-masks';
import { isProtectedModule } from './matrix-masks';

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return [30, 41, 59];
  const v = parseInt(n, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dotType: QrDotType
) {
  const r = Math.max(0.4, radius);
  if (dotType === 'square' || dotType === 'classy') {
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    return;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Logo de fondo + halo suave para que se distinga bajo los puntos. */
export function drawLogoUnderlay(
  ctx: CanvasRenderingContext2D,
  logoImg: Image,
  canvasWidth: number,
  intensity: number,
  logoRatio = 0.5
) {
  const maxW = canvasWidth * Math.min(0.55, Math.max(0.2, logoRatio));
  const scale = maxW / Math.max(logoImg.width, logoImg.height);
  const w = logoImg.width * scale;
  const h = logoImg.height * scale;
  const x = (canvasWidth - w) / 2;
  const y = (canvasWidth - h) / 2;

  ctx.save();
  // Halo claro detrás del logo para separarlo del patrón
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.beginPath();
  ctx.ellipse(canvasWidth / 2, canvasWidth / 2, w * 0.58, h * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.35 + intensity * 0.4;
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
  dotScale: number,
  dotType: QrDotType = 'rounded'
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

      // Zonas claras del logo → omitir puntos para dejar ver el logo
      if (luminance && darkness < 0.22) {
        if (darkness * intensity < 0.12) continue;
      }

      const sizeMul = 0.3 + darkness * (0.85 + intensity * 0.75);
      const radius = modulePx * dotScale * sizeMul * (1 + intensity * 0.25);
      const alpha = Math.min(1, 0.5 + darkness * (0.3 + intensity * 0.4));

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      drawDot(
        ctx,
        o + col * modulePx + modulePx / 2,
        o + row * modulePx + modulePx / 2,
        radius,
        dotType
      );
    }
  }
}
