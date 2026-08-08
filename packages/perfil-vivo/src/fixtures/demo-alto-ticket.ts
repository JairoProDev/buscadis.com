import type {
  Certificacion,
  DocumentoPublico,
  ItemFaq,
  MiembroEquipo,
  Negocio,
  PerfilPayload,
  Producto,
  Publicacion,
  Resena,
} from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { distribuirEstrellas, promedioEstrellas } from '../resenas/helpers';

const placeholder = (label: string, hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="hsl(${hue} 28% 78%)" width="600" height="600"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#3A3843" font-family="sans-serif" font-size="22">${label}</text></svg>`
  )}`;

const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '09:00', hasta: '18:00' }],
    mar: [{ desde: '09:00', hasta: '18:00' }],
    mie: [{ desde: '09:00', hasta: '18:00' }],
    jue: [{ desde: '09:00', hasta: '18:00' }],
    vie: [{ desde: '09:00', hasta: '17:00' }],
    sab: [{ desde: '10:00', hasta: '14:00' }],
    dom: [],
  },
};

const rawNegocio = {
  id: 'demo-alto-ticket-001',
  slug: 'demo-alto-ticket',
  nombre: 'Andes Solar Cusco',
  eslogan: 'Sistemas solares residenciales y comerciales',
  etiquetas: ['Energía solar', 'Paneles', 'Instalación'],
  categoria: { id: 'energia', nombre: 'Energía solar' },
  arquetipo: 'alto_ticket' as const,
  plan: 'pro' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#1E7A3E',
    tema: 'claro' as const,
    formaCards: 'suave' as const,
  },
  contacto: {
    whatsapp: '+51944444001',
    telefono: '+51944444001',
    email: 'proyectos@ejemplo.pe',
    web: 'https://buscadis.com',
    redes: [
      { tipo: 'instagram', url: 'https://instagram.com/buscadis', activa: true },
    ],
  },
  ubicacion: {
    direccion: 'Av. La Cultura 1234, of. 5',
    referencia: 'Frente a Real Plaza',
    distrito: 'Wanchaq',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.525,
    lng: -71.968,
    mostrarDireccionExacta: true,
  },
  horario,
  metodosPago: [
    'visa',
    'mastercard',
    'amex',
    'yape',
    'plin',
    'bcp',
    'interbank',
    'bbva',
    'scotiabank',
    'efectivo',
    'credito',
    'cripto',
  ] as const,
  verificacion: { nivel: 2 as const, fecha: '2026-02-01' },
  metricasDeclaradas: [
    { icono: 'proyectos', valor: '80+', etiqueta: 'instalaciones' },
    { icono: 'años', valor: '7', etiqueta: 'años en Cusco' },
  ],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'metricas' as const, visible: true, orden: 1 },
    { tipo: 'acciones' as const, visible: true, orden: 2 },
    { tipo: 'catalogo' as const, visible: true, orden: 3 },
    { tipo: 'servicios' as const, visible: true, orden: 4 },
    { tipo: 'resenas' as const, visible: true, orden: 5 },
    { tipo: 'publicaciones' as const, visible: true, orden: 6 },
    { tipo: 'certificaciones' as const, visible: true, orden: 7 },
    { tipo: 'documentos' as const, visible: true, orden: 8 },
    { tipo: 'equipo' as const, visible: true, orden: 9 },
    { tipo: 'ubicacion' as const, visible: true, orden: 10 },
    { tipo: 'canales' as const, visible: true, orden: 11 },
    { tipo: 'faq' as const, visible: true, orden: 12 },
  ],
  conteos: {
    productos: 5,
    resenas: 3,
    fotosGaleria: 0,
    faqs: 3,
    equipo: 3,
    certificaciones: 2,
    publicaciones: 2,
    documentos: 2,
  },
  creadoEn: '2026-02-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_ALTO_TICKET_NEGOCIO: Negocio = parseNegocio(rawNegocio);

export const DEMO_ALTO_TICKET_PRODUCTOS: Producto[] = [
  {
    id: 'kit-3kw',
    negocioId: DEMO_ALTO_TICKET_NEGOCIO.id,
    nombre: 'Kit residencial 3 kW',
    descripcion: 'Paneles + inversor. Cotización según techo.',
    precio: { valor: 9800, moneda: 'PEN', tipo: 'desde' },
    imagenes: [{ url: placeholder('Kit 3kW', 140), ancho: 600, alto: 600, alt: 'Kit 3 kW' }],
    disponibilidad: 'bajo_pedido',
    destacado: true,
    etiquetas: ['popular'],
    activo: true,
  },
  {
    id: 'kit-5kw',
    negocioId: DEMO_ALTO_TICKET_NEGOCIO.id,
    nombre: 'Kit residencial 5 kW',
    descripcion: 'Ideal para casas con alto consumo.',
    precio: { valor: 14500, moneda: 'PEN', tipo: 'desde' },
    imagenes: [{ url: placeholder('Kit 5kW', 150), ancho: 600, alto: 600, alt: 'Kit 5 kW' }],
    disponibilidad: 'bajo_pedido',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
  {
    id: 'kit-com',
    negocioId: DEMO_ALTO_TICKET_NEGOCIO.id,
    nombre: 'Sistema comercial',
    descripcion: 'Diseño a medida para hoteles y oficinas.',
    precio: { valor: 28000, moneda: 'PEN', tipo: 'desde' },
    imagenes: [{ url: placeholder('Comercial', 160), ancho: 600, alto: 600, alt: 'Comercial' }],
    disponibilidad: 'bajo_pedido',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
  {
    id: 'svc-estudio',
    negocioId: DEMO_ALTO_TICKET_NEGOCIO.id,
    nombre: 'Estudio de consumo',
    descripcion: 'Visita técnica y propuesta.',
    precio: { valor: 150, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: false,
    etiquetas: ['nuevo'],
    grupo: 'Servicios',
    activo: true,
  },
  {
    id: 'svc-mant',
    negocioId: DEMO_ALTO_TICKET_NEGOCIO.id,
    nombre: 'Mantenimiento anual',
    descripcion: 'Limpieza e inspección de paneles.',
    precio: { valor: 350, moneda: 'PEN', tipo: 'desde' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: false,
    etiquetas: [],
    grupo: 'Servicios',
    activo: true,
  },
];

export const DEMO_ALTO_TICKET_RESENAS: Resena[] = [
  {
    id: 'at-1',
    autor: { nombre: 'Hotel Inti', iniciales: 'HI' },
    estrellas: 5,
    texto: 'Instalación ordenada. Entregaron ficha técnica y garantía.',
    contactoVerificado: true,
    creadaEn: '2026-07-15T12:00:00.000Z',
  },
  {
    id: 'at-2',
    autor: { nombre: 'Carmen Loayza', iniciales: 'CL' },
    estrellas: 5,
    texto: 'Cotizaron claro por WhatsApp. El kit 3 kW rindió como dijeron.',
    contactoVerificado: true,
    creadaEn: '2026-06-20T12:00:00.000Z',
  },
  {
    id: 'at-3',
    autor: { nombre: 'José Apaza', iniciales: 'JA' },
    estrellas: 4,
    texto: 'Buen seguimiento post-venta.',
    contactoVerificado: false,
    creadaEn: '2026-05-28T12:00:00.000Z',
  },
];

export const DEMO_ALTO_TICKET_FAQS: ItemFaq[] = [
  {
    id: 'af1',
    pregunta: '¿El precio incluye instalación?',
    respuesta: 'Los kits “desde” son referenciales. La cotización final incluye visita, materiales e instalación.',
  },
  {
    id: 'af2',
    pregunta: '¿Dan garantía?',
    respuesta: 'Sí: paneles e inversor según fabricante, más garantía de mano de obra por escrito.',
  },
  {
    id: 'af3',
    pregunta: '¿Financian?',
    respuesta: 'Trabajamos con transferencia y opciones de crédito. Detalles al cotizar.',
  },
];

export const DEMO_ALTO_TICKET_EQUIPO: MiembroEquipo[] = [
  { id: 'eq-a1', nombre: 'Renato', rol: 'Ingeniero de proyectos' },
  { id: 'eq-a2', nombre: 'Sofía', rol: 'Comercial' },
  { id: 'eq-a3', nombre: 'Miguel', rol: 'Instalador senior' },
];

export const DEMO_ALTO_TICKET_CERTS: Certificacion[] = [
  { id: 'ac1', titulo: 'Instaladores autorizados', emisor: 'Marca partner', anio: '2025' },
  { id: 'ac2', titulo: 'Seguridad eléctrica', emisor: 'Capacitación interna', anio: '2024' },
];

export const DEMO_ALTO_TICKET_PUBS: Publicacion[] = [
  {
    id: 'ap1',
    titulo: 'Cuánto ahorra un hotel en Cusco con 10 kW',
    resumen: 'Caso real con cifras de consumo y payback estimado.',
    publicadaEn: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'ap2',
    titulo: 'Checklist antes de cotizar paneles',
    resumen: 'Orientación del techo, sombra y recibo de luz.',
    publicadaEn: '2026-04-18T12:00:00.000Z',
  },
];

export const DEMO_ALTO_TICKET_DOCS: DocumentoPublico[] = [
  {
    id: 'ad1',
    titulo: 'Brochure residencial (PDF)',
    tipo: 'pdf',
    url: 'https://buscadis.com/llms.txt',
  },
  {
    id: 'ad2',
    titulo: 'Condiciones de garantía',
    tipo: 'link',
    url: 'https://buscadis.com/ayuda',
  },
];

export function buildDemoAltoTicketPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_ALTO_TICKET_NEGOCIO;
  const resenas = DEMO_ALTO_TICKET_RESENAS;
  const promedio = promedioEstrellas(resenas);

  return {
    negocio,
    productos: DEMO_ALTO_TICKET_PRODUCTOS,
    resenas,
    faqs: DEMO_ALTO_TICKET_FAQS,
    galeria: [],
    promocion: null,
    nosotros: {
      eslogan: negocio.eslogan,
      texto:
        'Proyectos solares con estudio previo. Precios “desde” porque cada techo es distinto; cotizamos por WhatsApp con datos reales.',
    },
    novedades: [],
    equipo: DEMO_ALTO_TICKET_EQUIPO,
    certificaciones: DEMO_ALTO_TICKET_CERTS,
    publicaciones: DEMO_ALTO_TICKET_PUBS,
    documentos: DEMO_ALTO_TICKET_DOCS,
    totalProductos: DEMO_ALTO_TICKET_PRODUCTOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 40,
      contactos30d: 22,
      calificacion: {
        promedio,
        total: resenas.length,
        distribucion: distribuirEstrellas(resenas),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 40,
    }),
  };
}
