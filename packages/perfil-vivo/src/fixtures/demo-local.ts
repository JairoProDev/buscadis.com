import type { ItemFaq, Negocio, PerfilPayload, Resena } from '../types';
import { parseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { distribuirEstrellas, promedioEstrellas } from '../resenas/helpers';

const horario = {
  zona: 'America/Lima' as const,
  semana: {
    lun: [{ desde: '08:00', hasta: '20:00' }],
    mar: [{ desde: '08:00', hasta: '20:00' }],
    mie: [{ desde: '08:00', hasta: '20:00' }],
    jue: [{ desde: '08:00', hasta: '20:00' }],
    vie: [{ desde: '08:00', hasta: '20:00' }],
    sab: [{ desde: '08:00', hasta: '18:00' }],
    dom: [{ desde: '09:00', hasta: '14:00' }],
  },
};

const rawNegocio = {
  id: 'demo-local-001',
  slug: 'demo-local',
  nombre: 'Farmacia San Blas',
  eslogan: 'Medicinas y orientación cerca de tu casa',
  categoria: { id: 'farmacia', nombre: 'Farmacia' },
  arquetipo: 'local' as const,
  plan: 'free' as const,
  estado: 'activo' as const,
  identidad: {
    colorSemilla: '#0B7C8C',
    tema: 'claro' as const,
    formaCards: 'marcado' as const,
  },
  contacto: {
    whatsapp: '+51955555001',
    telefono: '+51955555001',
    redes: [],
  },
  ubicacion: {
    direccion: 'Calle Carmen Alto 215',
    referencia: 'Bajando hacia la plazuela de San Blas',
    distrito: 'Cusco',
    provincia: 'Cusco',
    departamento: 'Cusco',
    lat: -13.513,
    lng: -71.975,
    mostrarDireccionExacta: true,
  },
  horario,
  metodosPago: ['efectivo', 'yape', 'plin', 'visa'] as const,
  verificacion: { nivel: 1 as const, fecha: '2026-03-01' },
  metricasDeclaradas: [{ icono: 'años', valor: '8', etiqueta: 'años en el barrio' }],
  modulos: [
    { tipo: 'hero' as const, visible: true, orden: 0 },
    { tipo: 'estado' as const, visible: true, orden: 1 },
    { tipo: 'ubicacion' as const, visible: true, orden: 2 },
    { tipo: 'acciones' as const, visible: true, orden: 3 },
    { tipo: 'promocion' as const, visible: true, orden: 4 },
    { tipo: 'horario' as const, visible: true, orden: 5 },
    { tipo: 'pago' as const, visible: true, orden: 6 },
    { tipo: 'canales' as const, visible: true, orden: 7 },
    { tipo: 'faq' as const, visible: true, orden: 8 },
  ],
  conteos: {
    productos: 0,
    resenas: 2,
    fotosGaleria: 0,
    faqs: 2,
    promociones: 1,
  },
  creadoEn: '2026-03-01T12:00:00.000Z',
  actualizadoEn: '2026-08-08T12:00:00.000Z',
};

export const DEMO_LOCAL_NEGOCIO: Negocio = parseNegocio(rawNegocio);

export const DEMO_LOCAL_RESENAS: Resena[] = [
  {
    id: 'loc-1',
    autor: { nombre: 'Julia Paredes', iniciales: 'JP' },
    estrellas: 5,
    texto: 'Siempre tienen lo básico. Cómo llegar está claro en el perfil.',
    contactoVerificado: true,
    creadaEn: '2026-07-20T12:00:00.000Z',
  },
  {
    id: 'loc-2',
    autor: { nombre: 'Marco Díaz', iniciales: 'MD' },
    estrellas: 4,
    texto: 'Buen Yape y abren temprano.',
    contactoVerificado: false,
    creadaEn: '2026-07-02T09:00:00.000Z',
  },
];

export const DEMO_LOCAL_FAQS: ItemFaq[] = [
  {
    id: 'lf1',
    pregunta: '¿Están abiertos hoy?',
    respuesta: 'Revisa la franja de estado al inicio del perfil; el horario completo está debajo del mapa.',
  },
  {
    id: 'lf2',
    pregunta: '¿Hacen delivery de medicinas?',
    respuesta: 'En San Blas y alrededores, según disponibilidad. Confirma por WhatsApp.',
  },
];

export function buildDemoLocalPayload(now: Date = new Date()): PerfilPayload {
  const negocio = DEMO_LOCAL_NEGOCIO;
  const resenas = DEMO_LOCAL_RESENAS;
  const promedio = promedioEstrellas(resenas);
  const vence = new Date(now.getTime() + 72 * 3_600_000).toISOString();

  return {
    negocio,
    productos: [],
    resenas,
    faqs: DEMO_LOCAL_FAQS,
    galeria: [],
    promocion: {
      id: 'promo-local',
      titulo: '10% en vitaminas esta semana',
      condicion: 'Presenta este perfil en caja',
      codigo: 'SANBLAS10',
      venceEn: vence,
      ctaLabel: 'Consultar por WhatsApp',
    },
    nosotros: {
      eslogan: negocio.eslogan,
      texto:
        'Farmacia de barrio: lo importante es que sepas dónde estamos, si estamos abiertos y cómo pagas. El catálogo completo no es el foco de este perfil.',
    },
    novedades: [],
    equipo: [],
    certificaciones: [],
    publicaciones: [],
    documentos: [],
    totalProductos: 0,
    metricas: {
      antiguedadDesde: negocio.creadoEn,
      respuestaMedianaMin: 5,
      contactos30d: 90,
      calificacion: {
        promedio,
        total: resenas.length,
        distribucion: distribuirEstrellas(resenas),
      },
    },
    estadoVivo: calcularEstadoVivo(negocio.horario, now, {
      respuestaMedianaMin: 5,
    }),
  };
}
