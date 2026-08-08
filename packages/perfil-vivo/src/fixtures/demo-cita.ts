import type {
  FotoGaleria,
  ItemFaq,
  MiembroEquipo,
  Negocio,
  Novedad,
  PerfilPayload,
  Producto,
  Resena,
} from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { distribuirEstrellas, promedioEstrellas } from '../resenas/helpers';

const placeholder = (label: string, hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="hsl(${hue} 35% 82%)" width="600" height="600"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#3A3843" font-family="sans-serif" font-size="26">${label}</text></svg>`
  )}`;

const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '10:00', hasta: '20:00' }],
    mar: [{ desde: '10:00', hasta: '20:00' }],
    mie: [{ desde: '10:00', hasta: '20:00' }],
    jue: [{ desde: '10:00', hasta: '20:00' }],
    vie: [{ desde: '10:00', hasta: '21:00' }],
    sab: [{ desde: '09:00', hasta: '21:00' }],
    dom: [{ desde: '10:00', hasta: '14:00' }],
  },
};

const rawNegocio = {
  id: 'demo-cita-001',
  slug: 'demo-cita',
  nombre: 'Barbería Norte Cusco',
  eslogan: 'Corte limpio, barba a medida',
  categoria: { id: 'barberia', nombre: 'Barbería' },
  arquetipo: 'cita' as const,
  plan: 'free' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#1A3A2F',
    tema: 'claro' as const,
    formaCards: 'marcado' as const,
  },
  contacto: {
    whatsapp: '+51988888001',
    telefono: '+51988888001',
    redes: [
      { tipo: 'instagram', url: 'https://instagram.com/buscadis', activa: true },
      { tipo: 'facebook', url: 'https://facebook.com/buscadis', activa: true },
      { tipo: 'tiktok', url: 'https://tiktok.com/@buscadis', activa: true },
    ],
  },
  ubicacion: {
    direccion: 'Calle Plateros 220',
    referencia: 'A dos cuadras de la Plaza de Armas',
    distrito: 'Cusco',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.516,
    lng: -71.978,
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
    'bbva',
    'efectivo',
  ] as const,
  verificacion: { nivel: 2 as const, fecha: '2026-05-01' },
  metricasDeclaradas: [{ icono: 'años', valor: '6', etiqueta: 'años en el rubro' }],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'metricas' as const, visible: true, orden: 1 },
    { tipo: 'estado' as const, visible: true, orden: 2 },
    { tipo: 'acciones' as const, visible: true, orden: 3 },
    { tipo: 'servicios' as const, visible: true, orden: 4 },
    { tipo: 'galeria' as const, visible: true, orden: 5 },
    { tipo: 'resenas' as const, visible: true, orden: 6 },
    { tipo: 'equipo' as const, visible: true, orden: 7 },
    { tipo: 'ubicacion' as const, visible: true, orden: 8 },
    { tipo: 'horario' as const, visible: true, orden: 9 },
    { tipo: 'promocion' as const, visible: true, orden: 10 },
    { tipo: 'canales' as const, visible: true, orden: 11 },
    { tipo: 'faq' as const, visible: true, orden: 12 },
  ],
  conteos: {
    productos: 4,
    resenas: 3,
    fotosGaleria: 4,
    faqs: 3,
    promociones: 1,
    equipo: 3,
    novedades: 0,
  },
  creadoEn: '2026-05-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_CITA_NEGOCIO: Negocio = parseNegocio(rawNegocio);

export const DEMO_CITA_SERVICIOS: Producto[] = [
  {
    id: 'svc-corte',
    negocioId: DEMO_CITA_NEGOCIO.id,
    nombre: 'Corte clásico',
    descripcion: 'Lavado, corte y acabado. 35–45 min.',
    precio: { valor: 35, moneda: 'PEN', tipo: 'desde' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
  {
    id: 'svc-barba',
    negocioId: DEMO_CITA_NEGOCIO.id,
    nombre: 'Arreglo de barba',
    descripcion: 'Perfilado con navaja y toalla caliente.',
    precio: { valor: 25, moneda: 'PEN', tipo: 'desde' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
  {
    id: 'svc-combo',
    negocioId: DEMO_CITA_NEGOCIO.id,
    nombre: 'Corte + barba',
    descripcion: 'El combo más pedido. Incluye peinado.',
    precio: { valor: 50, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['popular'],
    activo: true,
  },
  {
    id: 'svc-nino',
    negocioId: DEMO_CITA_NEGOCIO.id,
    nombre: 'Corte niño',
    descripcion: 'Hasta 12 años.',
    precio: { valor: 28, moneda: 'PEN', tipo: 'desde' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
];

export const DEMO_CITA_RESENAS: Resena[] = [
  {
    id: 'cr-1',
    autor: { nombre: 'Diego Mamani', iniciales: 'DM' },
    estrellas: 5,
    texto: 'Pedí por WhatsApp y me atendieron a la hora. El fade quedó impecable.',
    contactoVerificado: true,
    creadaEn: '2026-07-30T12:00:00.000Z',
  },
  {
    id: 'cr-2',
    autor: { nombre: 'Carlos Ríos', iniciales: 'CR' },
    estrellas: 5,
    texto: 'Buena barba, precio claro. Vuelvo.',
    contactoVerificado: true,
    creadaEn: '2026-07-18T10:00:00.000Z',
  },
  {
    id: 'cr-3',
    autor: { nombre: 'Andrés Quispe', iniciales: 'AQ' },
    estrellas: 4,
    texto: 'Un poco de espera el sábado, pero el corte valió.',
    contactoVerificado: false,
    creadaEn: '2026-07-05T16:00:00.000Z',
  },
];

export const DEMO_CITA_FAQS: ItemFaq[] = [
  {
    id: 'cf-1',
    pregunta: '¿Hay que reservar?',
    respuesta:
      'Sí, preferimos reserva por WhatsApp. Si hay hueco el mismo día, te confirmamos al instante.',
  },
  {
    id: 'cf-2',
    pregunta: '¿Atienden sin cita?',
    respuesta: 'A veces, si hay cancelación. Escribe primero para no hacerte venir en vano.',
  },
  {
    id: 'cf-3',
    pregunta: '¿Aceptan Yape?',
    respuesta: 'Sí: efectivo, Yape y Plin.',
  },
];

export const DEMO_CITA_GALERIA: FotoGaleria[] = [
  { id: 'cg1', url: placeholder('Fade', 160), alt: 'Fade', etiqueta: 'resultado' },
  { id: 'cg2', url: placeholder('Barba', 30), alt: 'Barba', etiqueta: 'resultado' },
  { id: 'cg3', url: placeholder('Local', 200), alt: 'Local', etiqueta: 'local' },
  { id: 'cg4', url: placeholder('Antes', 280), alt: 'Trabajo', etiqueta: 'trabajo' },
];

export const DEMO_CITA_EQUIPO: MiembroEquipo[] = [
  { id: 'eq1', nombre: 'Leo', rol: 'Barbero senior' },
  { id: 'eq2', nombre: 'Max', rol: 'Barbero' },
  { id: 'eq3', nombre: 'Sam', rol: 'Aprendiz' },
];

export function buildDemoCitaPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_CITA_NEGOCIO;
  const resenas = DEMO_CITA_RESENAS;
  const promedio = promedioEstrellas(resenas);
  const vence = new Date(now.getTime() + 48 * 3_600_000).toISOString();

  return {
    negocio,
    productos: DEMO_CITA_SERVICIOS,
    resenas,
    faqs: DEMO_CITA_FAQS,
    galeria: DEMO_CITA_GALERIA,
    promocion: {
      id: 'promo-cita',
      titulo: 'Primera visita: −5 soles en combo',
      condicion: 'Menciona Buscadis al agendar',
      codigo: 'NORTE5',
      venceEn: vence,
      ctaLabel: 'Agendar con promo',
    },
    nosotros: {
      eslogan: negocio.eslogan,
      texto:
        'Barbería de barrio en el centro de Cusco. Trabajamos con cita para respetar tu tiempo. El eslogan no va en el hero: aquí te contamos quiénes somos.',
    },
    novedades: [] as Novedad[],
    equipo: DEMO_CITA_EQUIPO,
    certificaciones: [],
    publicaciones: [],
    documentos: [],
    totalProductos: DEMO_CITA_SERVICIOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 12,
      contactos30d: 61,
      calificacion: {
        promedio,
        total: resenas.length,
        distribucion: distribuirEstrellas(resenas),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 12,
    }),
  };
}
