/**
 * Preparación de imágenes para el PDF del catálogo.
 *
 * jsPDF no recorta, no aplica degradados ni entiende SVG: todo se resuelve en
 * un canvas y se entrega ya compuesto. Las imágenes se aplanan sobre un fondo
 * opaco para no depender del soporte de transparencia del visor de PDF.
 */

import { PDF_ICONS, type PdfIcon, type PdfIconKey } from '@/lib/pdf/icon-paths';

export type Rgb = { r: number; g: number; b: number };

export const INK: Rgb = { r: 15, g: 23, b: 42 };
export const SLATE_500: Rgb = { r: 100, g: 116, b: 139 };
export const SLATE_400: Rgb = { r: 148, g: 163, b: 184 };
export const SLATE_200: Rgb = { r: 226, g: 232, b: 240 };
export const WHITE: Rgb = { r: 255, g: 255, b: 255 };

/** Celeste + amarillo de Buscadis (globals.css). */
export const BUSCADIS_BLUE: Rgb = { r: 83, g: 172, b: 197 };
export const BUSCADIS_YELLOW: Rgb = { r: 255, g: 194, b: 74 };

export function hexToRgb(hex: string | undefined, fallback: Rgb): Rgb {
  if (!hex) return fallback;
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
  if (!match) return fallback;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

export function rgbToCss({ r, g, b }: Rgb, alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const ratio = clamp(t, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * ratio),
    g: Math.round(a.g + (b.g - a.g) * ratio),
    b: Math.round(a.b + (b.b - a.b) * ratio),
  };
}

export function tint(color: Rgb, amount: number): Rgb {
  return mix(color, WHITE, amount);
}

export function shade(color: Rgb, amount: number): Rgb {
  return mix(color, { r: 0, g: 0, b: 0 }, amount);
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (raw: number) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Tinta legible sobre un fondo (blanco o casi negro según contraste). */
export function readableInk(background: Rgb): Rgb {
  return relativeLuminance(background) > 0.45 ? INK : WHITE;
}

/** Versión del color de marca con contraste suficiente sobre blanco. */
export function brandOnWhite(color: Rgb): Rgb {
  let result = color;
  let guard = 0;
  while (relativeLuminance(result) > 0.42 && guard < 12) {
    result = shade(result, 0.12);
    guard += 1;
  }
  return result;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');
  return { canvas, ctx };
}

function imageFromSrc(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/** Descarga una imagen remota como data URL (proxy propio → CORS → canvas). */
export async function loadImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  const attempts = [`/api/catalog/image-proxy?url=${encodeURIComponent(url)}`, url];
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt);
      if (res.ok) {
        const dataUrl = await blobToDataUrl(await res.blob());
        if (dataUrl) return dataUrl;
      }
    } catch {
      // siguiente estrategia
    }
  }

  const img = await imageFromSrc(url);
  if (!img) return null;
  try {
    const { canvas, ctx } = createCanvas(img.naturalWidth || 1, img.naturalHeight || 1);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return null;
  }
}

export function imageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  return dataUrl.slice(0, 30).toLowerCase().includes('png') ? 'PNG' : 'JPEG';
}

export async function imageAspectRatio(dataUrl: string): Promise<number> {
  const img = await imageFromSrc(dataUrl);
  if (!img || !img.naturalWidth || !img.naturalHeight) return 1;
  return img.naturalWidth / img.naturalHeight;
}

/** Dibuja la imagen cubriendo todo el destino (equivalente a object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  focusY = 0.42
) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  ctx.drawImage(img, (width - drawW) / 2, (height - drawH) * focusY, drawW, drawH);
}

export type BannerOptions = {
  brand: Rgb;
  widthPx?: number;
  heightPx?: number;
};

/**
 * Cabecera de la portada: banner recortado con un degradado quemado encima para
 * que el logo y los textos blancos siempre tengan contraste. Sin banner, genera
 * un degradado de marca con textura sutil.
 */
export async function renderCoverBanner(
  bannerDataUrl: string | null,
  { brand, widthPx = 1400, heightPx = 720 }: BannerOptions
): Promise<string> {
  const { canvas, ctx } = createCanvas(widthPx, heightPx);
  const deep = shade(brand, 0.55);

  const img = bannerDataUrl ? await imageFromSrc(bannerDataUrl) : null;
  if (img) {
    drawCover(ctx, img, widthPx, heightPx);
    const scrim = ctx.createLinearGradient(0, 0, 0, heightPx);
    scrim.addColorStop(0, rgbToCss(shade(brand, 0.2), 0.34));
    scrim.addColorStop(0.42, rgbToCss(INK, 0.22));
    scrim.addColorStop(1, rgbToCss(deep, 0.88));
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, widthPx, heightPx);
  } else {
    const base = ctx.createLinearGradient(0, 0, widthPx, heightPx);
    base.addColorStop(0, rgbToCss(shade(brand, 0.12)));
    base.addColorStop(1, rgbToCss(deep));
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, widthPx, heightPx);

    const glow = ctx.createRadialGradient(
      widthPx * 0.78,
      heightPx * 0.16,
      0,
      widthPx * 0.78,
      heightPx * 0.16,
      widthPx * 0.62
    );
    glow.addColorStop(0, rgbToCss(WHITE, 0.16));
    glow.addColorStop(1, rgbToCss(WHITE, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, widthPx, heightPx);

    ctx.save();
    ctx.strokeStyle = rgbToCss(WHITE, 0.05);
    ctx.lineWidth = Math.max(2, widthPx / 260);
    for (let x = -heightPx; x < widthPx + heightPx; x += widthPx / 22) {
      ctx.beginPath();
      ctx.moveTo(x, heightPx);
      ctx.lineTo(x + heightPx, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Logo dentro de un cuadrado (object-fit: contain) sobre fondo opaco, listo
 * para la tarjeta de la portada.
 */
export async function renderLogoTile(
  logoDataUrl: string | null,
  sizePx = 480,
  background: Rgb = WHITE
): Promise<string | null> {
  if (!logoDataUrl) return null;
  const img = await imageFromSrc(logoDataUrl);
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;

  const { canvas, ctx } = createCanvas(sizePx, sizePx);
  ctx.fillStyle = rgbToCss(background);
  ctx.fillRect(0, 0, sizePx, sizePx);

  const pad = sizePx * 0.08;
  const box = sizePx - pad * 2;
  const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  ctx.drawImage(img, (sizePx - drawW) / 2, (sizePx - drawH) / 2, drawW, drawH);

  return canvas.toDataURL('image/png');
}

/** Aplana una imagen sobre fondo opaco conservando nitidez (QR, logos). */
export async function flattenImage(
  dataUrl: string | null,
  sizePx = 640,
  background: Rgb = WHITE,
  padRatio = 0
): Promise<string | null> {
  if (!dataUrl) return null;
  const img = await imageFromSrc(dataUrl);
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;

  const { canvas, ctx } = createCanvas(sizePx, sizePx);
  ctx.fillStyle = rgbToCss(background);
  ctx.fillRect(0, 0, sizePx, sizePx);

  const pad = sizePx * padRatio;
  const box = sizePx - pad * 2;
  const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  ctx.drawImage(img, (sizePx - drawW) / 2, (sizePx - drawH) / 2, drawW, drawH);

  return canvas.toDataURL('image/png');
}

/** Rasteriza un icono a PNG opaco del color y fondo indicados. */
export async function rasterizeIcon(
  key: PdfIconKey,
  color: Rgb,
  background: Rgb,
  sizePx = 96,
  scale = 0.62
): Promise<string | null> {
  const icon: PdfIcon | undefined = PDF_ICONS[key];
  if (!icon) return null;

  const glyphPx = Math.round(sizePx * scale);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" width="${glyphPx}" height="${glyphPx}">`,
    ...icon.paths.map((d) => `<path fill="${rgbToHex(color)}" d="${d}"/>`),
    '</svg>',
  ].join('');

  const img = await imageFromSrc(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  );
  if (!img) return null;

  const { canvas, ctx } = createCanvas(sizePx, sizePx);
  ctx.fillStyle = rgbToCss(background);
  ctx.fillRect(0, 0, sizePx, sizePx);
  const offset = (sizePx - glyphPx) / 2;
  ctx.drawImage(img, offset, offset, glyphPx, glyphPx);

  return canvas.toDataURL('image/png');
}
