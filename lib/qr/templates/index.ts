import type { QrKitTemplate } from '../types';
import { generateQrPng } from '../generate';
import { resolveRenderMode } from '../presets';
import type { QrStyleConfig } from '../types';

export interface KitTemplateInput {
  businessName: string;
  tagline: string;
  themeColor: string;
  profileUrl: string;
  qrTargetUrl: string;
  styleConfig: QrStyleConfig;
  usePro: boolean;
  logoUrl?: string;
}

async function getQrImageTag(input: KitTemplateInput, size = 400): Promise<string> {
  const renderMode = resolveRenderMode(input.styleConfig, 'branded');
  const result = await generateQrPng({
    data: input.qrTargetUrl,
    styleConfig: input.styleConfig,
    width: size,
    logoUrl: input.logoUrl,
    themeColor: input.themeColor,
    tier: input.usePro ? 'pro' : 'free',
    renderMode,
  });
  const b64 = result.png.toString('base64');
  return `<image href="data:image/png;base64,${b64}" width="${size}" height="${size}"/>`;
}

function esc(text: string): string {
  return text.slice(0, 120).replace(/[<>&]/g, '');
}

export async function buildKitSvg(
  template: QrKitTemplate,
  input: KitTemplateInput
): Promise<{ svg: string; width: number; height: number; mime: string }> {
  const name = esc(input.businessName);
  const tagline = esc(input.tagline);
  const color = input.themeColor || '#3c6997';
  const qrBlock = await getQrImageTag(input);

  switch (template) {
    case 'story': {
      const w = 1080;
      const h = 1920;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <text x="80" y="200" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="#ffffff" opacity="0.9">BUSCADIS</text>
  <text x="80" y="340" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="#ffffff">${name}</text>
  <text x="80" y="420" font-family="Arial,sans-serif" font-size="32" fill="#e2e8f0">${tagline}</text>
  <rect x="240" y="900" width="600" height="600" rx="32" fill="#ffffff"/>
  <g transform="translate(340, 1000)">${qrBlock}</g>
  <text x="540" y="1620" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#ffffff">Escanea para ver más</text>
  <text x="540" y="1680" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#94a3b8">${esc(input.profileUrl)}</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
    case 'table-tent': {
      const w = 794;
      const h = 1123;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#ffffff"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" rx="16" fill="${color}" opacity="0.08"/>
  <text x="80" y="120" font-family="Arial,sans-serif" font-size="42" font-weight="bold" fill="${color}">${name}</text>
  <text x="80" y="170" font-family="Arial,sans-serif" font-size="22" fill="#64748b">${tagline}</text>
  <g transform="translate(247, 350) scale(0.75)">${qrBlock}</g>
  <text x="397" y="750" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#0f172a">Escanea el QR</text>
  <text x="397" y="790" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#64748b">Menú · Servicios · Promociones</text>
  <line x1="80" y1="850" x2="714" y2="850" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="397" y="900" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#94a3b8">Dobla por la línea · Coloca en tu mesa</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
    case 'sticker': {
      const w = 500;
      const h = 500;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="24" fill="#ffffff" stroke="${color}" stroke-width="4"/>
  <g transform="translate(50, 40) scale(0.25)">${qrBlock}</g>
  <text x="250" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${name.slice(0, 28)}</text>
  <text x="250" y="450" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#64748b">Escanea aquí</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
    case 'poster': {
      const w = 794;
      const h = 1123;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${color}"/>
  <rect x="60" y="80" width="${w - 120}" height="${h - 160}" rx="24" fill="#ffffff"/>
  <text x="100" y="180" font-family="Arial,sans-serif" font-size="28" fill="#64748b">BUSCADIS</text>
  <text x="100" y="280" font-family="Arial,sans-serif" font-size="56" font-weight="bold" fill="#0f172a">${name}</text>
  <text x="100" y="340" font-family="Arial,sans-serif" font-size="24" fill="#475569">${tagline}</text>
  <g transform="translate(197, 420) scale(0.5)">${qrBlock}</g>
  <text x="397" y="780" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${color}">¡Escanea y descubre más!</text>
  <text x="397" y="830" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#64748b">${esc(input.profileUrl)}</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
    case 'business-card': {
      const w = 340;
      const h = 200;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="20" y="50" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#0f172a">${name.slice(0, 24)}</text>
  <text x="20" y="75" font-family="Arial,sans-serif" font-size="12" fill="#64748b">${tagline.slice(0, 40)}</text>
  <g transform="translate(220, 30) scale(0.2)">${qrBlock}</g>
  <text x="20" y="175" font-family="Arial,sans-serif" font-size="10" fill="${color}">${esc(input.profileUrl)}</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
    case 'flyer-basic':
    default: {
      const w = 1080;
      const h = 1920;
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${color}"/>
  <rect x="60" y="120" width="960" height="1680" rx="40" fill="#ffffff"/>
  <text x="100" y="280" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="#64748b">BUSCADIS</text>
  <text x="100" y="420" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="#0f172a">${name}</text>
  <text x="100" y="500" font-family="Arial,sans-serif" font-size="32" fill="#475569">${tagline}</text>
  <g transform="translate(340, 1100) scale(1)">${qrBlock}</g>
  <text x="100" y="1620" font-family="Arial,sans-serif" font-size="24" fill="#2563eb">${esc(input.profileUrl)}</text>
  <text x="100" y="1680" font-family="Arial,sans-serif" font-size="22" fill="#94a3b8">Escanea el QR · Tu tarjeta digital</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
  }
}
