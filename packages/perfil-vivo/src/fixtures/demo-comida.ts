import type {
  FotoGaleria,
  ItemFaq,
  Negocio,
  PerfilPayload,
  Producto,
  Resena,
} from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { distribuirEstrellas, promedioEstrellas } from '../resenas/helpers';

const placeholder = (label: string, hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="hsl(${hue} 42% 78%)" width="600" height="600"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#3A3843" font-family="sans-serif" font-size="24">${label}</text></svg>`
  )}`;

const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '11:00', hasta: '22:00' }],
    mar: [{ desde: '11:00', hasta: '22:00' }],
    mie: [{ desde: '11:00', hasta: '22:00' }],
    jue: [{ desde: '11:00', hasta: '22:00' }],
    vie: [{ desde: '11:00', hasta: '23:00' }],
    sab: [{ desde: '11:00', hasta: '23:00' }],
    dom: [{ desde: '12:00', hasta: '21:00' }],
  },
};

const rawNegocio = {
  id: 'demo-comida-001',
  slug: 'demo-comida',
  nombre: 'Huatia Andina',
  eslogan: 'Comida cusqueña para llevar o pedir',
  categoria: { id: 'comida', nombre: 'Restaurante' },
  arquetipo: 'comida' as const,
  plan: 'free' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#B85C38',
    tema: 'claro' as const,
    formaCards: 'suave' as const,
  },
  contacto: {
    whatsapp: '+51977777001',
    telefono: '+51977777001',
    redes: [
      { tipo: 'instagram', url: 'https://instagram.com/buscadis', activa: true },
      { tipo: 'facebook', url: 'https://facebook.com/buscadis', activa: true },
    ],
  },
  ubicacion: {
    direccion: 'Av. El Sol 412',
    referencia: 'Frente a la Municipalidad',
    distrito: 'Cusco',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.518,
    lng: -71.978,
    mostrarDireccionExacta: true,
  },
  horario,
  metodosPago: ['efectivo', 'yape', 'plin', 'visa'] as const,
  verificacion: { nivel: 1 as const, fecha: '2026-06-01' },
  metricasDeclaradas: [{ icono: 'años', valor: '4', etiqueta: 'años cocinando' }],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'estado' as const, visible: true, orden: 1 },
    { tipo: 'acciones' as const, visible: true, orden: 2 },
    { tipo: 'categorias' as const, visible: true, orden: 3 },
    { tipo: 'catalogo' as const, visible: true, orden: 4 },
    { tipo: 'promocion' as const, visible: true, orden: 5 },
    { tipo: 'resenas' as const, visible: true, orden: 6 },
    { tipo: 'ubicacion' as const, visible: true, orden: 7 },
    { tipo: 'horario' as const, visible: true, orden: 8 },
    { tipo: 'pago' as const, visible: true, orden: 9 },
    { tipo: 'novedades' as const, visible: true, orden: 10 },
    { tipo: 'canales' as const, visible: true, orden: 11 },
    { tipo: 'faq' as const, visible: true, orden: 12 },
  ],
  conteos: {
    productos: 6,
    resenas: 3,
    fotosGaleria: 0,
    faqs: 3,
    promociones: 1,
    novedades: 1,
  },
  creadoEn: '2026-06-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_COMIDA_NEGOCIO: Negocio = parseNegocio(rawNegocio);

function plato(
  id: string,
  nombre: string,
  grupo: string,
  precio: number,
  hue: number,
  etiqueta?: Producto['etiquetas'][0]
): Producto {
  return {
    id,
    negocioId: DEMO_COMIDA_NEGOCIO.id,
    nombre,
    descripcion: `${grupo} · porción generosa`,
    precio: { valor: precio, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [
      { url: placeholder(nombre.slice(0, 14), hue), ancho: 600, alto: 600, alt: nombre },
    ],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: etiqueta ? [etiqueta] : [],
    grupo,
    activo: true,
  };
}

export const DEMO_COMIDA_PRODUCTOS: Producto[] = [
  plato('pl-chicharron', 'Chicharrón cusqueño', 'Platos fuertes', 28, 25, 'mas_vendido'),
  plato('pl-rocoto', 'Rocoto relleno', 'Platos fuertes', 32, 8, 'popular'),
  plato('pl-lomo', 'Lomo saltado', 'Platos fuertes', 30, 15),
  plato('pl-anticucho', 'Anticuchos (3)', 'Piqueos', 18, 5, 'oferta'),
  plato('pl-causa', 'Causa limeña', 'Piqueos', 16, 55),
  plato('pl-mazamorra', 'Mazamorra morada', 'Postres', 8, 280),
];

export const DEMO_COMIDA_RESENAS: Resena[] = [
  {
    id: 'cm-1',
    autor: { nombre: 'María Quispe', iniciales: 'MQ' },
    estrellas: 5,
    texto: 'Pedí el chicharrón por WhatsApp y llegó caliente. Porción buena.',
    contactoVerificado: true,
    creadaEn: '2026-08-01T19:00:00.000Z',
  },
  {
    id: 'cm-2',
    autor: { nombre: 'Luis Flores', iniciales: 'LF' },
    estrellas: 4,
    texto: 'El rocoto está picante de verdad. Delivery puntual.',
    contactoVerificado: true,
    creadaEn: '2026-07-22T13:00:00.000Z',
  },
  {
    id: 'cm-3',
    autor: { nombre: 'Ana Torres', iniciales: 'AT' },
    estrellas: 5,
    texto: 'Anticuchos ricos para compartir. Yapean sin drama.',
    contactoVerificado: false,
    creadaEn: '2026-07-10T20:00:00.000Z',
  },
];

export const DEMO_COMIDA_FAQS: ItemFaq[] = [
  {
    id: 'cf1',
    pregunta: '¿Hacen delivery en Cusco?',
    respuesta:
      'Sí, en el centro y alrededores. Confirma zona y tiempo estimado por WhatsApp al pedir.',
  },
  {
    id: 'cf2',
    pregunta: '¿Puedo recoger en local?',
    respuesta: 'Claro. Pide por WhatsApp y te avisamos cuando esté listo en Av. El Sol 412.',
  },
  {
    id: 'cf3',
    pregunta: '¿Aceptan Yape?',
    respuesta: 'Sí: Yape, Plin, efectivo y tarjeta en local.',
  },
];

export const DEMO_COMIDA_GALERIA: FotoGaleria[] = [];

export function buildDemoComidaPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_COMIDA_NEGOCIO;
  const resenas = DEMO_COMIDA_RESENAS;
  const promedio = promedioEstrellas(resenas);
  const vence = new Date(now.getTime() + 36 * 3_600_000).toISOString();

  return {
    negocio,
    productos: DEMO_COMIDA_PRODUCTOS,
    resenas,
    faqs: DEMO_COMIDA_FAQS,
    galeria: DEMO_COMIDA_GALERIA,
    promocion: {
      id: 'promo-comida',
      titulo: '2 anticuchos + gaseosa a S/ 25',
      condicion: 'Solo delivery hasta agotar',
      codigo: 'HUATIA25',
      venceEn: vence,
      ctaLabel: 'Pedir con promo',
    },
    nosotros: {
      eslogan: negocio.eslogan,
      texto:
        'Cocina cusqueña de barrio. Platos del día, piqueos y postres. Pedís por WhatsApp y te lo llevamos o lo recoges.',
    },
    novedades: [
      {
        id: 'nov-c1',
        titulo: 'Hoy hay rocoto relleno hasta las 4 pm',
        publicadaEn: now.toISOString(),
      },
    ],
    equipo: [],
    certificaciones: [],
    publicaciones: [],
    documentos: [],
    totalProductos: DEMO_COMIDA_PRODUCTOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 8,
      contactos30d: 140,
      calificacion: {
        promedio,
        total: resenas.length,
        distribucion: distribuirEstrellas(resenas),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 8,
      deliveryActivo: true,
    }),
  };
}
