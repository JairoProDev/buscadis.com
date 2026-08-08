import type {
  FotoGaleria,
  ItemFaq,
  Negocio,
  PerfilPayload,
  Producto,
  PromocionVigente,
  Resena,
} from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { distribuirEstrellas, promedioEstrellas } from '../resenas/helpers';

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

const placeholder = (label: string, hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="hsl(${hue} 40% 88%)" width="600" height="600"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#3A3843" font-family="sans-serif" font-size="28">${label}</text></svg>`
  )}`;

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
    { tipo: 'promocion' as const, visible: true, orden: 5 },
    { tipo: 'resenas' as const, visible: true, orden: 6 },
    { tipo: 'ubicacion' as const, visible: true, orden: 7 },
    { tipo: 'horario' as const, visible: true, orden: 8 },
    { tipo: 'pago' as const, visible: true, orden: 9 },
    { tipo: 'canales' as const, visible: true, orden: 10 },
    { tipo: 'galeria' as const, visible: true, orden: 11 },
    { tipo: 'nosotros' as const, visible: true, orden: 12 },
    { tipo: 'faq' as const, visible: true, orden: 13 },
  ],
  conteos: {
    productos: 4,
    resenas: 4,
    fotosGaleria: 4,
    faqs: 4,
    promociones: 1,
    tieneNosotros: 1,
  },
  creadoEn: '2026-07-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_RETAIL_NEGOCIO: Negocio = parseNegocio(rawNegocio);

export const DEMO_RETAIL_PRODUCTOS: Producto[] = [
  {
    id: 'prod-cemento',
    negocioId: DEMO_RETAIL_NEGOCIO.id,
    nombre: 'Cemento Sol 42.5 kg',
    descripcion: 'Cemento Portland tipo I para obra general.',
    precio: { valor: 32.5, moneda: 'PEN', tipo: 'exacto' },
    precioAnterior: 36,
    imagenes: [
      { url: placeholder('Cemento', 210), ancho: 600, alto: 600, alt: 'Cemento Sol' },
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
      { url: placeholder('Pintura', 40), ancho: 600, alto: 600, alt: 'Pintura látex' },
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
      { url: placeholder('Taladro', 200), ancho: 600, alto: 600, alt: 'Taladro' },
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
      { url: placeholder('PVC', 160), ancho: 600, alto: 600, alt: 'Tubo PVC' },
    ],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['nuevo'],
    activo: true,
  },
];

export const DEMO_RETAIL_RESENAS: Resena[] = [
  {
    id: 'rev-1',
    autor: { nombre: 'María Quispe', iniciales: 'MQ' },
    estrellas: 5,
    texto:
      'Llegué por WhatsApp y en 10 minutos ya tenía el cemento listo para recoger. Precios claros.',
    contactoVerificado: true,
    creadaEn: '2026-07-28T15:00:00.000Z',
    respuesta: {
      texto: '¡Gracias María! Te esperamos cuando armes la losa.',
      fecha: '2026-07-28T18:00:00.000Z',
    },
  },
  {
    id: 'rev-2',
    autor: { nombre: 'José Huamán', iniciales: 'JH' },
    estrellas: 4,
    texto: 'Buen surtido de PVC. El taladro estaba un poco caro pero la atención compensó.',
    contactoVerificado: true,
    creadaEn: '2026-07-20T11:00:00.000Z',
  },
  {
    id: 'rev-3',
    autor: { nombre: 'Ana Torres', iniciales: 'AT' },
    estrellas: 5,
    texto: 'Me ayudaron a armar la lista completa para una remodelación chica. Recomendados.',
    contactoVerificado: false,
    creadaEn: '2026-07-10T09:30:00.000Z',
  },
  {
    id: 'rev-4',
    autor: { nombre: 'Luis Paredes', iniciales: 'LP' },
    estrellas: 3,
    texto: 'Faltaba una medida de tubo ese día, pero me avisaron por WhatsApp cuando llegó.',
    contactoVerificado: true,
    creadaEn: '2026-06-22T16:00:00.000Z',
    respuesta: {
      texto: 'Luis, gracias por la paciencia. Ya reforzamos stock de esa medida.',
      fecha: '2026-06-23T10:00:00.000Z',
    },
  },
];

export const DEMO_RETAIL_FAQS: ItemFaq[] = [
  {
    id: 'faq-1',
    pregunta: '¿Hacen delivery en Cusco?',
    respuesta:
      'Sí, entregamos en Wanchaq, Cusco centro y San Sebastián. El costo depende del peso y la zona; confírmalo por WhatsApp.',
  },
  {
    id: 'faq-2',
    pregunta: '¿Atienden el sábado?',
    respuesta: 'Abrimos de lunes a viernes 8:00–18:00 y sábado 8:00–14:00. Domingos cerramos.',
  },
  {
    id: 'faq-3',
    pregunta: '¿Aceptan Yape y tarjeta?',
    respuesta: 'Aceptamos efectivo, Yape, Plin, Visa y transferencia. El crédito es solo para clientes frecuentes.',
  },
  {
    id: 'faq-4',
    pregunta: '¿Puedo reservar cemento?',
    respuesta:
      'Sí. Escribe por WhatsApp con la cantidad y el día de recojo. Reservamos hasta 48 horas con una seña.',
  },
];

export const DEMO_RETAIL_GALERIA: FotoGaleria[] = [
  { id: 'g1', url: placeholder('Local', 200), alt: 'Fachada del local', etiqueta: 'local' },
  { id: 'g2', url: placeholder('Obra', 30), alt: 'Entrega en obra', etiqueta: 'trabajo' },
  { id: 'g3', url: placeholder('Surtido', 160), alt: 'Pasillo de ferretería', etiqueta: 'local' },
  { id: 'g4', url: placeholder('Equipo', 280), alt: 'Equipo de atención', etiqueta: 'resultado' },
];

export function buildDemoRetailPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_RETAIL_NEGOCIO;
  const resenas = DEMO_RETAIL_RESENAS;
  const promedio = promedioEstrellas(resenas);
  const vence = new Date(now.getTime() + 36 * 3_600_000).toISOString();
  const promocion: PromocionVigente = {
    id: 'promo-demo-1',
    titulo: '3×2 en cemento Sol',
    condicion: 'Lleva 3 bolsas y paga 2. Válido en tienda y recojo.',
    codigo: 'CEMENTO3X2',
    venceEn: vence,
    ctaLabel: 'Pedir esta promo',
  };

  return {
    negocio,
    productos: DEMO_RETAIL_PRODUCTOS,
    resenas,
    faqs: DEMO_RETAIL_FAQS,
    galeria: DEMO_RETAIL_GALERIA,
    promocion,
    nosotros: {
      eslogan: negocio.eslogan,
      texto:
        'Somos una ferretería familiar en Wanchaq. Atendemos obra chica y maestros de zona con precios claros, stock real y entrega el mismo día cuando el pedido lo permite. El eslogan vive aquí, no en el hero: queremos que lo primero que veas sea qué vendemos y cómo contactarnos.',
    },
    totalProductos: DEMO_RETAIL_PRODUCTOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 8,
      contactos30d: 47,
      calificacion: {
        promedio,
        total: resenas.length,
        distribucion: distribuirEstrellas(resenas),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 8,
    }),
  };
}
