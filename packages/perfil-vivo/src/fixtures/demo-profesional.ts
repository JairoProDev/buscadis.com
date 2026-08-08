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

const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '09:00', hasta: '18:00' }],
    mar: [{ desde: '09:00', hasta: '18:00' }],
    mie: [{ desde: '09:00', hasta: '18:00' }],
    jue: [{ desde: '09:00', hasta: '18:00' }],
    vie: [{ desde: '09:00', hasta: '17:00' }],
    sab: [{ desde: '09:00', hasta: '13:00' }],
    dom: [],
  },
};

const rawNegocio = {
  id: 'demo-profesional-001',
  slug: 'demo-profesional',
  nombre: 'Dra. Elena Vargas',
  eslogan: 'Dermatología clínica en Cusco',
  etiquetas: ['Dermatología', 'Consultorio', 'Salud'],
  categoria: { id: 'salud', nombre: 'Dermatología' },
  arquetipo: 'profesional' as const,
  plan: 'pro' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#1B3A6B',
    tema: 'claro' as const,
    formaCards: 'suave' as const,
  },
  contacto: {
    whatsapp: '+51966666001',
    telefono: '+51966666001',
    email: 'consulta@ejemplo.pe',
    redes: [
      { tipo: 'linkedin', url: 'https://linkedin.com', activa: true },
      { tipo: 'instagram', url: 'https://instagram.com/buscadis', activa: true },
    ],
  },
  ubicacion: {
    direccion: 'Calle Heladeros 118, consultorio 302',
    referencia: 'Edificio frente a Qoricancha',
    distrito: 'Cusco',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.517,
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
    'interbank',
    'bbva',
    'efectivo',
  ] as const,
  verificacion: { nivel: 3 as const, fecha: '2026-04-01' },
  metricasDeclaradas: [
    { icono: 'años', valor: '12', etiqueta: 'años de experiencia' },
    { icono: 'colegiatura', valor: 'CMP', etiqueta: 'colegiada' },
  ],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'metricas' as const, visible: true, orden: 1 },
    { tipo: 'acciones' as const, visible: true, orden: 2 },
    { tipo: 'servicios' as const, visible: true, orden: 3 },
    { tipo: 'certificaciones' as const, visible: true, orden: 4 },
    { tipo: 'resenas' as const, visible: true, orden: 5 },
    { tipo: 'equipo' as const, visible: true, orden: 6 },
    { tipo: 'publicaciones' as const, visible: true, orden: 7 },
    { tipo: 'documentos' as const, visible: true, orden: 8 },
    { tipo: 'faq' as const, visible: true, orden: 9 },
    { tipo: 'ubicacion' as const, visible: true, orden: 10 },
    { tipo: 'horario' as const, visible: true, orden: 11 },
    { tipo: 'canales' as const, visible: true, orden: 12 },
  ],
  conteos: {
    productos: 4,
    resenas: 3,
    fotosGaleria: 0,
    faqs: 3,
    equipo: 2,
    certificaciones: 3,
    publicaciones: 2,
    documentos: 2,
  },
  creadoEn: '2026-04-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_PROFESIONAL_NEGOCIO: Negocio = parseNegocio(rawNegocio);

export const DEMO_PROFESIONAL_SERVICIOS: Producto[] = [
  {
    id: 'svc-consulta',
    negocioId: DEMO_PROFESIONAL_NEGOCIO.id,
    nombre: 'Consulta dermatológica',
    descripcion: 'Evaluación clínica. 30–40 min.',
    precio: { valor: 120, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['popular'],
    activo: true,
  },
  {
    id: 'svc-control',
    negocioId: DEMO_PROFESIONAL_NEGOCIO.id,
    nombre: 'Control de tratamiento',
    descripcion: 'Seguimiento de plan previo.',
    precio: { valor: 80, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
  {
    id: 'svc-biopsia',
    negocioId: DEMO_PROFESIONAL_NEGOCIO.id,
    nombre: 'Biopsia de piel',
    descripcion: 'Procedimiento en consultorio. Incluye informe.',
    precio: { valor: 250, moneda: 'PEN', tipo: 'desde' },
    imagenes: [],
    disponibilidad: 'bajo_pedido',
    destacado: true,
    etiquetas: [],
    activo: true,
  },
  {
    id: 'svc-tele',
    negocioId: DEMO_PROFESIONAL_NEGOCIO.id,
    nombre: 'Teleconsulta',
    descripcion: 'Videollamada para pacientes fuera de Cusco.',
    precio: { valor: 100, moneda: 'PEN', tipo: 'exacto' },
    imagenes: [],
    disponibilidad: 'disponible',
    destacado: true,
    etiquetas: ['nuevo'],
    activo: true,
  },
];

export const DEMO_PROFESIONAL_RESENAS: Resena[] = [
  {
    id: 'pr-1',
    autor: { nombre: 'Rosa Huamán', iniciales: 'RH' },
    estrellas: 5,
    texto: 'Explicó el tratamiento con claridad. Agenda puntual.',
    contactoVerificado: true,
    creadaEn: '2026-07-28T12:00:00.000Z',
  },
  {
    id: 'pr-2',
    autor: { nombre: 'Pedro Salas', iniciales: 'PS' },
    estrellas: 5,
    texto: 'Buen diagnóstico. Me dio opciones y precios claros.',
    contactoVerificado: true,
    creadaEn: '2026-07-12T10:00:00.000Z',
  },
  {
    id: 'pr-3',
    autor: { nombre: 'Lucía Méndez', iniciales: 'LM' },
    estrellas: 4,
    texto: 'La teleconsulta funcionó bien desde Abancay.',
    contactoVerificado: false,
    creadaEn: '2026-06-30T16:00:00.000Z',
  },
];

export const DEMO_PROFESIONAL_FAQS: ItemFaq[] = [
  {
    id: 'pf1',
    pregunta: '¿Cómo agendo una cita?',
    respuesta: 'Escríbenos por WhatsApp con tu nombre y horario preferido. Confirmamos en el día.',
  },
  {
    id: 'pf2',
    pregunta: '¿Atienden seguros?',
    respuesta: 'Consulta particular. Emitimos boleta o factura para reembolso según tu póliza.',
  },
  {
    id: 'pf3',
    pregunta: '¿Dónde está el consultorio?',
    respuesta: 'Calle Heladeros 118, consultorio 302, frente a Qoricancha.',
  },
];

export const DEMO_PROFESIONAL_EQUIPO: MiembroEquipo[] = [
  { id: 'eq-p1', nombre: 'Elena Vargas', rol: 'Dermatóloga' },
  { id: 'eq-p2', nombre: 'Karina', rol: 'Asistente' },
];

export const DEMO_PROFESIONAL_CERTS: Certificacion[] = [
  { id: 'cert1', titulo: 'Especialidad en Dermatología', emisor: 'UNMSM', anio: '2014' },
  { id: 'cert2', titulo: 'Colegio Médico del Perú', emisor: 'CMP', anio: 'Vigente' },
  { id: 'cert3', titulo: 'Curso de dermatoscopia', emisor: 'SPD', anio: '2023' },
];

export const DEMO_PROFESIONAL_PUBS: Publicacion[] = [
  {
    id: 'pub1',
    titulo: 'Cuándo preocuparse por un lunar',
    resumen: 'Señales ABCDE explicadas en lenguaje claro para pacientes en Cusco.',
    publicadaEn: '2026-06-15T12:00:00.000Z',
  },
  {
    id: 'pub2',
    titulo: 'Acné adulto: mitos frecuentes',
    resumen: 'Qué sí funciona y qué conviene evitar sin indicación médica.',
    publicadaEn: '2026-05-02T12:00:00.000Z',
  },
];

export const DEMO_PROFESIONAL_DOCS: DocumentoPublico[] = [
  {
    id: 'doc1',
    titulo: 'Tarifa de consultas 2026',
    tipo: 'pdf',
    url: 'https://buscadis.com/llms.txt',
  },
  {
    id: 'doc2',
    titulo: 'Preparación para biopsia',
    tipo: 'link',
    url: 'https://buscadis.com/ayuda',
  },
];

export function buildDemoProfesionalPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_PROFESIONAL_NEGOCIO;
  const resenas = DEMO_PROFESIONAL_RESENAS;
  const promedio = promedioEstrellas(resenas);

  return {
    negocio,
    productos: DEMO_PROFESIONAL_SERVICIOS,
    resenas,
    faqs: DEMO_PROFESIONAL_FAQS,
    galeria: [],
    promocion: null,
    nosotros: {
      eslogan: negocio.eslogan,
      texto:
        'Atención dermatológica con enfoque clínico. Agenda por WhatsApp; el eslogan no sustituye la historia profesional.',
    },
    novedades: [],
    equipo: DEMO_PROFESIONAL_EQUIPO,
    certificaciones: DEMO_PROFESIONAL_CERTS,
    publicaciones: DEMO_PROFESIONAL_PUBS,
    documentos: DEMO_PROFESIONAL_DOCS,
    totalProductos: DEMO_PROFESIONAL_SERVICIOS.length,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 25,
      contactos30d: 38,
      calificacion: {
        promedio,
        total: resenas.length,
        distribucion: distribuirEstrellas(resenas),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 25,
    }),
  };
}
