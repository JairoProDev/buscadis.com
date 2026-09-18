import type { PerfilPayload, Producto } from '../types';
import { buildDemoComidaPayload } from './demo-comida';

function foodThumb(label: string, c1: string, c2: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="38%" r="45%">
          <stop stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="480" height="640" fill="url(#bg)"/>
      <rect width="480" height="640" fill="url(#glow)"/>
      <circle cx="240" cy="250" r="110" fill="#ffffff22"/>
      <circle cx="240" cy="250" r="72" fill="#ffffff33"/>
      <text x="50%" y="78%" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif"
        font-size="28" font-weight="800">${label}</text>
    </svg>`
  )}`;
}

const THUMBS: Array<{ c1: string; c2: string; short: string }> = [
  { c1: '#c45c26', c2: '#5c1f0f', short: 'Chicharrón' },
  { c1: '#d62828', c2: '#6a040f', short: 'Rocoto' },
  { c1: '#bc6c25', c2: '#432818', short: 'Lomo' },
  { c1: '#9b2226', c2: '#370617', short: 'Anticucho' },
  { c1: '#f4a261', c2: '#9c6644', short: 'Causa' },
  { c1: '#7209b7', c2: '#3a0ca3', short: 'Mazamorra' },
];

/** Banner demo — foto de comida (placeholder con atmósfera) */
const BANNER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="320" viewBox="0 0 960 320">
    <defs>
      <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#5c1f0f"/><stop offset=".45" stop-color="#c45c26"/>
        <stop offset="1" stop-color="#3d1a0a"/>
      </linearGradient>
    </defs>
    <rect width="960" height="320" fill="url(#b)"/>
    <circle cx="720" cy="80" r="120" fill="#ffffff18"/>
    <text x="48" y="250" fill="#ffffffcc" font-family="system-ui,sans-serif"
      font-size="36" font-weight="700">Cusco · al horno de tierra</text>
  </svg>`
)}`;

/**
 * Demo skin TikTok: reusa payload comida (grid visual fuerte)
 * y ajusta identidad para la URL /v/demo-tiktok.
 */
export function buildDemoTikTokPayload(now?: Date): PerfilPayload {
  const base = buildDemoComidaPayload(now);
  const logo = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#ff7a45"/><stop offset="1" stop-color="#c45c26"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="52" fill="url(#g)"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        fill="white" font-family="system-ui,sans-serif" font-size="92" font-weight="800">H</text>
    </svg>`
  )}`;

  const productos: Producto[] = base.productos.map((p, i) => {
    const t = THUMBS[i % THUMBS.length];
    return {
      ...p,
      destacado: i < 3,
      imagenes: [
        {
          url: foodThumb(t.short, t.c1, t.c2),
          ancho: 480,
          alto: 640,
          alt: p.nombre,
        },
      ],
    };
  });

  return {
    ...base,
    negocio: {
      ...base.negocio,
      id: 'demo-tiktok-001',
      slug: 'demo-tiktok',
      nombre: 'Huatia Andina',
      eslogan: 'Comida cusqueña para llevar · Wanchaq',
      etiquetas: ['Huatia', 'Cusco', 'Para llevar'],
      identidad: {
        ...base.negocio.identidad,
        logoUrl: logo,
        colorSemilla: '#53ACC5',
        tema: 'claro',
        portadaUrl: BANNER,
      },
      contacto: {
        ...base.negocio.contacto,
        web: 'https://buscadis.com/@demo-tiktok',
      },
      conteos: {
        ...base.negocio.conteos,
        productos: 12,
        resenas: 312,
      },
      verificacion: { nivel: 2 as const, fecha: '2026-06-15' },
    },
    productos,
    nosotros: {
      texto:
        'Huatia al horno de tierra, anticuchos y chicha. Pedí por WhatsApp y retirá en local.',
    },
    metricas: {
      ...base.metricas,
      antiguedadDesde: base.metricas?.antiguedadDesde ?? '2022-03-01T00:00:00.000Z',
      contactos30d: 1840,
      calificacion: {
        promedio: 4.8,
        total: 312,
        distribucion: { 5: 240, 4: 50, 3: 15, 2: 5, 1: 2 },
      },
    },
  };
}
