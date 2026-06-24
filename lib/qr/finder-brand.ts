import { readFileSync } from 'fs';
import { join } from 'path';
import type { CanvasRenderingContext2D, Image } from 'canvas';
import type { QrMatrix } from './matrix-masks';

export interface FinderBrandOptions {
  modulePx: number;
  offsetModules: number;
  finderColor: string;
  darkColor: string;
  lightColor: string;
  cornerStyle: 'square' | 'rounded';
  buscadisMark: boolean;
}

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return [37, 99, 235];
  const v = parseInt(n, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  modulePx: number,
  finderColor: string,
  darkColor: string,
  lightColor: string,
  cornerStyle: 'square' | 'rounded',
  markImg: Image | null
) {
  const pattern = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];

  const [fr, fg, fb] = parseHex(finderColor);
  const [dr, dg, db] = parseHex(darkColor);

  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const cx = startX + x * modulePx;
      const cy = startY + y * modulePx;
      const isOuter = x === 0 || y === 0 || x === 6 || y === 6;
      const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      const filled = pattern[y][x] === 1;

      if (!filled) continue;

      if (isOuter) {
        ctx.fillStyle = `rgb(${dr},${dg},${db})`;
      } else if (isInner) {
        ctx.fillStyle = `rgb(${fr},${fg},${fb})`;
      } else {
        ctx.fillStyle = lightColor;
      }

      if (cornerStyle === 'rounded' && isOuter) {
        ctx.beginPath();
        ctx.roundRect(cx, cy, modulePx, modulePx, modulePx * 0.2);
        ctx.fill();
      } else {
        ctx.fillRect(cx, cy, modulePx, modulePx);
      }
    }
  }

  if (markImg) {
    const markSize = modulePx * 2.2;
    const mx = startX + 2.4 * modulePx;
    const my = startY + 2.4 * modulePx;
    ctx.drawImage(markImg, mx, my, markSize, markSize);
  }
}

let cachedMark: Buffer | null = null;

async function loadBuscadisMark(
  loadImage: (b: Buffer) => Promise<Image>
): Promise<Image | null> {
  try {
    if (!cachedMark) {
      cachedMark = readFileSync(join(process.cwd(), 'public/qr/buscadis-finder-mark.svg'));
    }
    return await loadImage(cachedMark);
  } catch {
    return null;
  }
}

export async function drawFinderPatterns(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  options: FinderBrandOptions,
  loadImage: (b: Buffer) => Promise<Image>
): Promise<void> {
  const { modulePx, offsetModules, finderColor, darkColor, lightColor, cornerStyle, buscadisMark } =
    options;
  const markImg = buscadisMark ? await loadBuscadisMark(loadImage) : null;
  const o = offsetModules * modulePx;
  const size = matrix.size;
  const corners = [
    { x: o, y: o },
    { x: o + (size - 7) * modulePx, y: o },
    { x: o, y: o + (size - 7) * modulePx },
  ];

  for (const c of corners) {
    drawFinderPattern(
      ctx,
      c.x,
      c.y,
      modulePx,
      finderColor,
      darkColor,
      lightColor,
      cornerStyle,
      markImg
    );
  }
}

export function drawTimingPatterns(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  modulePx: number,
  offsetModules: number,
  dotColor: string
) {
  const o = offsetModules * modulePx;
  const size = matrix.size;
  ctx.fillStyle = dotColor;

  for (let i = 8; i < size - 8; i++) {
    if (matrix.get(6, i)) {
      ctx.beginPath();
      ctx.arc(o + i * modulePx + modulePx / 2, o + 6 * modulePx + modulePx / 2, modulePx * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    if (matrix.get(i, 6)) {
      ctx.beginPath();
      ctx.arc(o + 6 * modulePx + modulePx / 2, o + i * modulePx + modulePx / 2, modulePx * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
