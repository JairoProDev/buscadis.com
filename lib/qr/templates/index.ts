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

const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';

function esc(text: string): string {
  return text
    .slice(0, 120)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function darken(hex: string, pct: number): string {
  const n = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return '#0f172a';
  const v = parseInt(n, 16);
  const r = Math.max(0, ((v >> 16) & 255) * (1 - pct));
  const g = Math.max(0, ((v >> 8) & 255) * (1 - pct));
  const b = Math.max(0, (v & 255) * (1 - pct));
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
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
  return `<image href="data:image/png;base64,${b64}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
}

function kitDefs(color: string) {
  const dark = darken(color, 0.35);
  return { color, dark, FONT };
}

export async function buildKitSvg(
  template: QrKitTemplate,
  input: KitTemplateInput
): Promise<{ svg: string; width: number; height: number; mime: string }> {
  const name = esc(input.businessName);
  const tagline = esc(input.tagline || 'Escanea y descubre más');
  const { color, dark, FONT: font } = kitDefs(input.themeColor || '#3c6997');
  const url = esc(input.profileUrl);
  const qr = async (size: number) => getQrImageTag(input, size);

  const shadow = `
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
  </defs>`;

  switch (template) {
    case 'sticker': {
      const w = 800;
      const h = 800;
      const qrImg = await qr(520);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#ffffff"/>
  <rect x="0" y="0" width="${w}" height="6" fill="url(#brandGrad)"/>
  <text x="${w / 2}" y="56" text-anchor="middle" font-family="${font}" font-size="22" font-weight="700" fill="#0f172a" letter-spacing="0.5">${name}</text>
  <rect x="80" y="80" width="640" height="640" rx="24" fill="#fafafa" stroke="#e2e8f0" stroke-width="1"/>
  <g transform="translate(140, 140)">${qrImg}</g>
  <rect x="${w / 2 - 72}" y="748" width="144" height="32" rx="16" fill="${color}"/>
  <text x="${w / 2}" y="769" text-anchor="middle" font-family="${font}" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="1.5">ESCANEA</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }

    case 'packaging': {
      const w = 1200;
      const h = 1200;
      const qrImg = await qr(720);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#ffffff"/>
  <rect x="0" y="0" width="${w}" height="8" fill="url(#brandGrad)"/>
  <text x="${w / 2}" y="72" text-anchor="middle" font-family="${font}" font-size="36" font-weight="700" fill="#0f172a">${name}</text>
  <text x="${w / 2}" y="112" text-anchor="middle" font-family="${font}" font-size="18" fill="#64748b">${tagline}</text>
  <rect x="120" y="150" width="960" height="960" rx="32" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <g transform="translate(240, 270)">${qrImg}</g>
  <text x="${w / 2}" y="1160" text-anchor="middle" font-family="${font}" font-size="16" font-weight="600" fill="${color}" letter-spacing="2">CATÁLOGO · OFERTAS · CONTACTO</text>
  <text x="${w / 2}" y="1188" text-anchor="middle" font-family="${font}" font-size="12" fill="#94a3b8">buscadis.com</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }

    case 'business-card': {
      const w = 420;
      const h = 240;
      const qrImg = await qr(400);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${shadow}
  <rect width="${w}" height="${h}" rx="16" fill="#ffffff" filter="url(#softShadow)"/>
  <rect x="0" y="0" width="8" height="${h}" rx="4" fill="url(#brandGrad)"/>
  <rect x="24" y="0" width="200" height="${h}" fill="${color}" opacity="0.06"/>
  <text x="32" y="72" font-family="${font}" font-size="22" font-weight="700" fill="#0f172a">${name.slice(0, 22)}</text>
  <text x="32" y="98" font-family="${font}" font-size="12" fill="#64748b">${tagline.slice(0, 42)}</text>
  <text x="32" y="${h - 28}" font-family="${font}" font-size="10" font-weight="600" fill="${color}">${url}</text>
  <rect x="268" y="32" width="136" height="176" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <g transform="translate(286, 50) scale(0.35)">${qrImg}</g>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }

    case 'flyer-basic':
    default: {
      const w = 1080;
      const h = 1920;
      const qrImg = await qr(400);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${shadow}
  <rect width="${w}" height="${h}" fill="url(#brandGrad)"/>
  <rect x="48" y="120" width="${w - 96}" height="${h - 200}" rx="40" fill="#ffffff" filter="url(#softShadow)"/>
  <text x="96" y="240" font-family="${font}" font-size="20" font-weight="600" letter-spacing="3" fill="${color}">BUSCADIS</text>
  <text x="96" y="360" font-family="${font}" font-size="64" font-weight="800" fill="#0f172a">${name}</text>
  <text x="96" y="430" font-family="${font}" font-size="28" fill="#64748b">${tagline}</text>
  <rect x="190" y="520" width="700" height="700" rx="32" fill="#f8fafc" stroke="#e2e8f0"/>
  <g transform="translate(340, 670)">${qrImg}</g>
  <text x="${w / 2}" y="1320" text-anchor="middle" font-family="${font}" font-size="26" font-weight="700" fill="${color}">Escanea con tu cámara</text>
  <text x="${w / 2}" y="1370" text-anchor="middle" font-family="${font}" font-size="20" fill="#64748b">${url}</text>
  <line x1="120" y1="1450" x2="${w - 120}" y2="1450" stroke="#e2e8f0" stroke-width="2"/>
  <text x="${w / 2}" y="1520" text-anchor="middle" font-family="${font}" font-size="18" fill="#94a3b8">Catálogo · Ofertas · Contacto</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }

    case 'story': {
      const w = 1080;
      const h = 1920;
      const qrImg = await qr(320);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${shadow}
  <rect width="${w}" height="${h}" fill="url(#brandGrad)"/>
  <circle cx="900" cy="200" r="180" fill="#ffffff" opacity="0.08"/>
  <circle cx="120" cy="1700" r="240" fill="#ffffff" opacity="0.06"/>
  <text x="72" y="200" font-family="${font}" font-size="28" font-weight="600" letter-spacing="2" fill="#ffffff" opacity="0.85">BUSCADIS</text>
  <text x="72" y="340" font-family="${font}" font-size="56" font-weight="800" fill="#ffffff">${name}</text>
  <text x="72" y="410" font-family="${font}" font-size="26" fill="#ffffff" opacity="0.9">${tagline}</text>
  <rect x="140" y="720" width="800" height="800" rx="40" fill="#ffffff" filter="url(#softShadow)"/>
  <g transform="translate(380, 920)">${qrImg}</g>
  <text x="${w / 2}" y="1680" text-anchor="middle" font-family="${font}" font-size="30" font-weight="700" fill="#ffffff">Desliza arriba · Escanea</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }

    case 'table-tent': {
      const w = 794;
      const h = 1123;
      const qrImg = await qr(400);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${shadow}
  <rect width="${w}" height="${h}" fill="#f8fafc"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" rx="24" fill="#ffffff" filter="url(#softShadow)"/>
  <rect x="40" y="40" width="${w - 80}" height="120" rx="24" fill="url(#brandGrad)"/>
  <text x="${w / 2}" y="115" text-anchor="middle" font-family="${font}" font-size="36" font-weight="800" fill="#ffffff">${name}</text>
  <text x="${w / 2}" y="200" text-anchor="middle" font-family="${font}" font-size="18" fill="#64748b">${tagline}</text>
  <g transform="translate(197, 280) scale(0.75)">${qrImg}</g>
  <text x="${w / 2}" y="640" text-anchor="middle" font-family="${font}" font-size="22" font-weight="700" fill="#0f172a">Menú · Servicios · Promos</text>
  <line x1="80" y1="700" x2="${w - 80}" y2="700" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="10 8"/>
  <text x="${w / 2}" y="760" text-anchor="middle" font-family="${font}" font-size="14" fill="#94a3b8">Dobla por la línea central</text>
  <g transform="translate(197, 820) scale(0.75)">${qrImg}</g>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }

    case 'poster': {
      const w = 794;
      const h = 1123;
      const qrImg = await qr(280);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${shadow}
  <rect width="${w}" height="${h}" fill="url(#brandGrad)"/>
  <rect x="48" y="64" width="${w - 96}" height="${h - 128}" rx="28" fill="#ffffff" filter="url(#softShadow)"/>
  <text x="88" y="150" font-family="${font}" font-size="18" font-weight="600" letter-spacing="2" fill="${color}">BUSCADIS</text>
  <text x="88" y="230" font-family="${font}" font-size="48" font-weight="800" fill="#0f172a">${name}</text>
  <text x="88" y="280" font-family="${font}" font-size="20" fill="#64748b">${tagline}</text>
  <rect x="147" y="340" width="500" height="500" rx="24" fill="#f8fafc"/>
  <g transform="translate(257, 450)">${qrImg}</g>
  <text x="${w / 2}" y="920" text-anchor="middle" font-family="${font}" font-size="26" font-weight="700" fill="${color}">¡Escanea y descubre más!</text>
  <text x="${w / 2}" y="960" text-anchor="middle" font-family="${font}" font-size="16" fill="#64748b">${url}</text>
</svg>`;
      return { svg, width: w, height: h, mime: 'image/svg+xml' };
    }
  }
}
