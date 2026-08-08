import type { Negocio, PerfilPayload, Producto } from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';

const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '08:00', hasta: '18:00' }],
    mar: [{ desde: '08:00', hasta: '18:00' }],
    mie: [{ desde: '08:00', hasta: '18:00' }],
    jue: [{ desde: '08:00', hasta: '18:00' }],
    vie: [{ desde: '08:00', hasta: '18:00' }],
    sab: [{ desde: '08:00', hasta: '14:00' }],
    dom: [] as { desde: string; hasta: string }[],
  },
};

const rawNegocio = {
  id: 'demo-retail-001',
  slug: 'demo',
  nombre: 'Ferretería Demo Quival',
  eslogan: 'Todo para tu obra en Wanchaq',
  categoria: { id: 'ferreteria', nombre: 'Ferretería' },
  arquetipo: 'retail' as const,
  plan: 'free' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#1F4FD8',
    tema: 'claro' as const,
    formaCards: 'suave' as const,
  },
  contacto: {
    whatsapp: '+51999999001',
    telefono: '+51999999002',
    web: 'https://buscadis.com',
    redes: [
      {
        tipo: 'instagram',
        url: 'https://instagram.com/buscadis',
        activa: true,
      },
      {
        tipo: 'facebook',
        url: 'https://facebook.com/buscadis',
        activa: true,
      },
    ],
  },
  ubicacion: {
    direccion: 'Av. De la Cultura 123',
    referencia: 'Frente al Real Plaza',
    distrito: 'Wanchaq',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.522,
    lng: -71.967,
    mostrarDireccionExacta: true,
  },
  horario,
  metodosPago: ['efectivo', 'yape', 'plin', 'visa', 'transferencia'] as const,
  verificacion: { nivel: 2 as const, fecha: '2026-06-15' },
  metricasDeclaradas: [
    { icono: 'años', valor: '12', etiqueta: 'años en el rubro' },
  ],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'metricas' as const, visible: true, orden: 1 },
    { tipo: 'estado' as const, visible: true, orden: 2 },
    { tipo: 'acciones' as const, visible: true, orden: 3 },
    { tipo: 'catalogo' as const, visible: true, orden: 4 },
    { tipo: 'ubicacion' as const, visible: true, orden: 5 },
    { tipo: 'horario' as const, visible: true, orden: 6 },
    { tipo: 'pago' as const, visible: true, orden: 7 },
    { tipo: 'canales' as const, visible: true, orden: 8 },
  ],
  conteos: { productos: 4, resenas: 0, fotosGaleria: 0 },
  creadoEn: '2026-07-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_RETAIL_NEGOCIO: Negocio = parseNegocio(rawNegocio);

const placeholder = (label: string, hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="hsl(${hue} 40% 88%)" width="600" height="600"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#3A3843" font-family="sans-serif" font-size="28">${label}</text></svg>`
  )}`;

export const DEMO_RETAIL_PRODUCTOS: Producto[] = [
  {
    id: 'prod-cemento',
    negocioId: DEMO_RETAIL_NEGOCIO.id,
    nombre: 'Cemento Sol 42.5 kg',
    descripcion: 'Cemento Portland tipo I para obra general.',
    precio: { valor: 32.5, moneda: 'PEN', tipo: 'exacto' },
    precioAnterior: 36,
    imagenes: [
      {
        url: placeholder('Cemento', 210),
        ancho: 600,
        alto: 600,
        alt: 'Cemento Sol',
      },
    ],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['mas_vendido'],
    activo: true,
  },
  {
    id: 'prod-pintura',
    negocioId: DEMO_RETAIL_NEGOCIO.id,
    nombre: 'Pintura látex blanco 1 galón',
    descripcion: 'Acabado mate, alto cubrimiento.',
    precio: { valor: 48, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [
      {
        url: placeholder('Pintura', 40),
        ancho: 600,
        alto: 600,
        alt: 'Pintura látex',
      },
    ],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['popular'],
    activo: true,
  },
  {
    id: 'prod-taladro',
    negocioId: DEMO_RETAIL_NEGOCIO.id,
    nombre: 'Taladro percutor 850W',
    descripcion: 'Incluye maletín y juego de brocas.',
    precio: { valor: 189, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [
      {
        url: placeholder('Taladro', 200),
        ancho: 600,
        alto: 600,
        alt: 'Taladro',
      },
    ],
    disponibilidad: 'ultimas_unidades',
    destacado: true,
    etiquetas: ['oferta'],
    activo: true,
  },
  {
    id: 'prod-tuberia',
    negocioId: DEMO_RETAIL_NEGOCIO.id,
    nombre: 'Tubo PVC 1/2" × 3m',
    precio: { valor: 9.9, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [
      {
        url: placeholder('PVC', 160),
        ancho: 600,
        alto: 600,
        alt: 'Tubo PVC',
      },
    ],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['nuevo'],
    activo: true,
  },
];

export function buildDemoRetailPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_RETAIL_NEGOCIO;
  return {
    negocio,
    productos: DEMO_RETAIL_PRODUCTOS,
    totalProductos: DEMO_RETAIL_PRODUCTOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 8,
      contactos30d: 47,
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 8,
    }),
  };
}
