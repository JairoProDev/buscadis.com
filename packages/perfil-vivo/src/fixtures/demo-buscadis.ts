import { tokens } from '@buscadis/tokens';
import type {
  ItemFaq,
  PerfilPayload,
  Producto,
  Resena,
} from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { distribuirEstrellas, promedioEstrellas } from '../resenas/helpers';

/**
 * Perfil showcase Buscadis — datos reales del seed
 * (scripts/data/buscadis-profile.json) + assets /logo.png y /og-image.jpg.
 */
const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '09:00', hasta: '18:00' }],
    mar: [{ desde: '09:00', hasta: '18:00' }],
    mie: [{ desde: '09:00', hasta: '18:00' }],
    jue: [{ desde: '09:00', hasta: '18:00' }],
    vie: [{ desde: '09:00', hasta: '18:00' }],
    sab: [{ desde: '10:00', hasta: '14:00' }],
    dom: [] as { desde: string; hasta: string }[],
  },
};

/**
 * Premium-feel product thumbnail. Instead of a giant text label (which reads
 * as "generic placeholder"), we render a soft diagonal gradient with a
 * translucent brand mark and a small monogram — the card name provides the
 * copy, the thumb provides the color story.
 */
const thumb = (label: string, c1: string, c2: string) => {
  const initial = label.trim().charAt(0).toUpperCase() || '·';
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
        <radialGradient id="s" cx="30%" cy="26%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
          <stop offset="60%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect width="480" height="480" fill="url(#g)"/>
      <rect width="480" height="480" fill="url(#s)"/>
      <circle cx="360" cy="360" r="150" fill="rgba(255,255,255,0.08)"/>
      <circle cx="360" cy="360" r="90" fill="rgba(255,255,255,0.10)"/>
      <text x="48" y="440" fill="rgba(255,255,255,0.95)"
        font-family="'Bricolage Grotesque', system-ui, sans-serif"
        font-size="120" font-weight="800" letter-spacing="-4">${initial}</text>
    </svg>`
  )}`;
};

const rawNegocio = {
  id: 'buscadis-showcase-001',
  slug: 'demo-buscadis',
  nombre: 'Buscadis',
  eslogan: 'Publica, conecta y vende desde tu perfil @marca',
  etiquetas: ['Marketplace', 'Perú', 'Negocios', 'Deals'],
  categoria: { id: 'plataforma', nombre: 'Marketplace' },
  arquetipo: 'retail' as const,
  plan: 'max' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: tokens['--bs-identity'],
    tema: 'claro' as const,
    formaCards: 'suave' as const,
    logoUrl: '/logo.png',
    portadaUrl: '/og-image.jpg',
  },
  contacto: {
    whatsapp: '+51999888777',
    telefono: '+51999888777',
    web: 'https://buscadis.com',
    redes: [
      { tipo: 'instagram', url: 'https://instagram.com/buscadis', activa: true },
      { tipo: 'facebook', url: 'https://facebook.com/buscadis', activa: true },
      { tipo: 'tiktok', url: 'https://tiktok.com/@buscadis', activa: true },
      { tipo: 'linkedin', url: 'https://linkedin.com/company/buscadis', activa: true },
      { tipo: 'x', url: 'https://twitter.com/buscadis', activa: true },
      {
        tipo: 'maps',
        url: 'https://maps.google.com/?q=Cusco+Peru',
        activa: true,
      },
    ],
  },
  ubicacion: {
    direccion: 'Plataforma digital',
    referencia: 'Marketplace para negocios locales',
    distrito: 'Cusco',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.52,
    lng: -71.97,
    mostrarDireccionExacta: false,
  },
  horario,
  metodosPago: [
    'yape',
    'plin',
    'visa',
    'mastercard',
    'transferencia',
    'efectivo',
  ] as const,
  verificacion: { nivel: 3 as const, fecha: '2025-01-15' },
  metricasDeclaradas: [
    { icono: 'años', valor: '2024', etiqueta: 'lanzamiento' },
  ],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'novedades' as const, visible: true, orden: 1 },
    { tipo: 'catalogo' as const, visible: true, orden: 2 },
    { tipo: 'resenas' as const, visible: true, orden: 3 },
    { tipo: 'ubicacion' as const, visible: true, orden: 4 },
    { tipo: 'horario' as const, visible: true, orden: 5 },
    { tipo: 'pago' as const, visible: true, orden: 6 },
    { tipo: 'faq' as const, visible: true, orden: 7 },
    { tipo: 'nosotros' as const, visible: true, orden: 8 },
    { tipo: 'canales' as const, visible: true, orden: 9 },
  ],
  conteos: {
    productos: 5,
    resenas: 6,
    faqs: 5,
    novedades: 4,
    tieneNosotros: 1,
  },
  creadoEn: '2024-06-01T12:00:00.000Z',
  actualizadoEn: '2026-09-17T12:00:00.000Z',
};

const negocio = parseNegocio(rawNegocio);

const PRODUCTS: Array<{
  id: string;
  nombre: string;
  desc: string;
  precio: number;
  tags: Producto['etiquetas'];
  grupo: string;
  destacado: boolean;
  c1: string;
  c2: string;
  short: string;
}> = [
  {
    id: 'bd-plan-free',
    nombre: 'Perfil de negocio gratis',
    desc: 'Tu página @marca con catálogo, WhatsApp, QR y SEO.',
    precio: 0,
    tags: ['popular'],
    grupo: 'Planes',
    destacado: true,
    c1: tokens['--bs-identity'],
    c2: tokens['--bs-color-adis-800'],
    short: 'Gratis',
  },
  {
    id: 'bd-deals',
    nombre: 'Deals — videos cortos',
    desc: 'Clips promocionales en la micro-red social de Buscadis.',
    precio: 0,
    tags: ['nuevo'],
    grupo: 'Crecimiento',
    destacado: false,
    c1: tokens['--bs-identity-warm'],
    c2: tokens['--bs-color-sol-700'],
    short: 'Deals',
  },
  {
    id: 'bd-marketplace',
    nombre: 'Visibilidad en marketplace',
    desc: 'Aparece en búsquedas, categorías y recomendaciones locales.',
    precio: 0,
    tags: ['mas_vendido'],
    grupo: 'Crecimiento',
    destacado: false,
    c1: '#2dd4bf',
    c2: '#0f3d38',
    short: 'Market',
  },
  {
    id: 'bd-qr-pro',
    nombre: 'QR personalizado Pro',
    desc: 'QR con tu marca para mesas, vitrinas y empaques.',
    precio: 29.9,
    tags: ['oferta'],
    grupo: 'Pro',
    destacado: false,
    c1: '#6366f1',
    c2: '#1e1b4b',
    short: 'QR Pro',
  },
  {
    id: 'bd-catalog-ia',
    nombre: 'Importación de catálogo con IA',
    desc: 'Sube Excel o fotos; la IA organiza títulos y precios.',
    precio: 0,
    tags: ['nuevo'],
    grupo: 'Herramientas',
    destacado: false,
    c1: '#a855f7',
    c2: '#3b0764',
    short: 'IA',
  },
];

const PRODUCTOS: Producto[] = PRODUCTS.map((p) => ({
  id: p.id,
  negocioId: negocio.id,
  nombre: p.nombre,
  descripcion: p.desc,
  precio: { valor: p.precio, moneda: 'PEN' as const, tipo: 'exacto' as const },
  imagenes: [
    { url: thumb(p.short, p.c1, p.c2), ancho: 480, alto: 640, alt: p.nombre },
  ],
  disponibilidad: 'disponible' as const,
  destacado: p.destacado,
  etiquetas: p.tags,
  grupo: p.grupo,
  activo: true,
}));

const RESENAS: Resena[] = [
  {
    id: 'br1',
    autor: { nombre: 'María L.', iniciales: 'ML' },
    estrellas: 5,
    texto:
      'Excelente plataforma para dar visibilidad a mi negocio. El catálogo con WhatsApp es justo lo que necesitaba.',
    contactoVerificado: true,
    creadaEn: '2026-08-12T12:00:00.000Z',
  },
  {
    id: 'br2',
    autor: { nombre: 'Carlos R.', iniciales: 'CR' },
    estrellas: 5,
    texto:
      'Muy fácil de usar y el perfil @ se ve profesional. Mis clientes escanean el QR y llegan directo.',
    contactoVerificado: true,
    creadaEn: '2026-07-28T12:00:00.000Z',
  },
  {
    id: 'br3',
    autor: { nombre: 'Ana P.', iniciales: 'AP' },
    estrellas: 5,
    texto:
      'Gratis y completo. Publicamos ofertas y el flujo de contacto por WhatsApp funciona perfecto.',
    contactoVerificado: false,
    creadaEn: '2026-07-10T12:00:00.000Z',
  },
  {
    id: 'br4',
    autor: { nombre: 'Luis M.', iniciales: 'LM' },
    estrellas: 4,
    texto:
      'Buen marketplace. Me gustaría más filtros por distrito, pero en general muy recomendable.',
    contactoVerificado: true,
    creadaEn: '2026-06-22T12:00:00.000Z',
  },
  {
    id: 'br5',
    autor: { nombre: 'Sofía T.', iniciales: 'ST' },
    estrellas: 5,
    texto:
      'El editor visual es intuitivo. En un día tenía catálogo, banner y redes enlazadas.',
    contactoVerificado: true,
    creadaEn: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'br6',
    autor: { nombre: 'Diego V.', iniciales: 'DV' },
    estrellas: 5,
    texto:
      'Deals es genial para promocionar sin pagar ads. Buscadis entiende a los negocios locales.',
    contactoVerificado: false,
    creadaEn: '2026-05-18T12:00:00.000Z',
  },
];

const FAQS: ItemFaq[] = [
  {
    id: 'bf1',
    pregunta: '¿Es gratis crear mi perfil de negocio?',
    respuesta:
      'Sí. El plan Free incluye perfil @tu-marca, catálogo, WhatsApp, QR básico y SEO. Puedes subir a Pro/Max cuando necesites más.',
  },
  {
    id: 'bf2',
    pregunta: '¿Cómo me contactan mis clientes?',
    respuesta:
      'Por WhatsApp con mensaje prearmado, mensaje en Buscadis, llamada o redes. Tú eliges qué canales mostrar.',
  },
  {
    id: 'bf3',
    pregunta: '¿El QR lleva a mi catálogo?',
    respuesta:
      'Sí. Cada perfil tiene QR que abre tu vitrina. En Pro puedes personalizar el diseño con tu marca.',
  },
  {
    id: 'bf4',
    pregunta: '¿Puedo importar mi catálogo?',
    respuesta:
      'Puedes subir Excel, fotos o productos uno a uno. La importación con IA ayuda a organizar títulos y precios.',
  },
  {
    id: 'bf5',
    pregunta: '¿En qué países funciona?',
    respuesta:
      'Nacimos en Perú (LATAM). La ficha está pensada para negocios locales que venden por WhatsApp y calle.',
  },
];

export function buildDemoBuscadisPayload(now: Date = new Date()): PerfilPayload {
  const promedio = promedioEstrellas(RESENAS);
  return {
    negocio,
    productos: PRODUCTOS,
    resenas: RESENAS,
    faqs: FAQS,
    galeria: [],
    promocion: {
      id: 'bp-promo',
      titulo: 'Crea tu perfil gratis hoy',
      condicion: 'Sin tarjeta · listo en minutos',
      ctaLabel: 'Empezar',
      venceEn: new Date(now.getTime() + 30 * 864e5).toISOString(),
    },
    nosotros: {
      texto:
        'Buscadis es el marketplace donde negocios y personas de Latinoamérica publican catálogos, ofertas y deals en un solo lugar. Perfiles profesionales, QR para tu local, catálogo digital y la micro-red Deals para que tu marca llegue más lejos.',
    },
    novedades: [
      {
        id: 'hl-deals',
        titulo: 'Deals',
        imagenUrl: '/og-image.jpg',
        publicadaEn: now.toISOString(),
      },
      {
        id: 'hl-publicar',
        titulo: 'Publicar',
        imagenUrl: '/logo.png',
        publicadaEn: now.toISOString(),
      },
      {
        id: 'hl-ayuda',
        titulo: 'Ayuda',
        imagenUrl: '/logo-mark.png',
        publicadaEn: now.toISOString(),
      },
      {
        id: 'hl-gratis',
        titulo: 'Es gratis',
        imagenUrl: '/og-image.jpg',
        publicadaEn: now.toISOString(),
      },
    ],
    equipo: [],
    certificaciones: [],
    publicaciones: [
      {
        id: 'pub1',
        titulo: 'Nuevo: perfiles con URL @tu-negocio',
        resumen: 'Editor visual y link corto para compartir tu vitrina.',
        publicadaEn: '2026-09-01T12:00:00.000Z',
        url: '/guia',
      },
      {
        id: 'pub2',
        titulo: 'Deals: micro-red de ofertas',
        resumen: 'Publica clips y llega a compradores cerca de ti.',
        publicadaEn: '2026-08-15T12:00:00.000Z',
        url: '/deals',
      },
    ],
    documentos: [],
    totalProductos: PRODUCTOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 12,
      contactos30d: 980,
      calificacion: {
        promedio,
        total: RESENAS.length,
        distribucion: distribuirEstrellas(RESENAS),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 12,
      deliveryActivo: false,
    }),
  };
}
