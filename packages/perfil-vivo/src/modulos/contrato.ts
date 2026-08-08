import type { Plan, TipoModulo } from '../types';

export type EstadoVacioPolitica = 'ocultar' | 'invitar' | 'mostrar';

export interface ModuloMeta {
  tipo: TipoModulo;
  fijo: boolean;
  minDatos: number;
  planMin: Plan;
  /** Clave en negocio.conteos para evaluar minDatos; null = siempre con datos si fijo */
  conteoKey:
    | 'productos'
    | 'resenas'
    | 'fotosGaleria'
    | 'faqs'
    | 'promociones'
    | 'tieneNosotros'
    | 'novedades'
    | 'equipo'
    | 'certificaciones'
    | 'publicaciones'
    | 'documentos'
    | null;
  ancla: string;
  tituloDefault: string;
}

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, max: 2 };

export const MODULO_META: Record<TipoModulo, ModuloMeta> = {
  hero: {
    tipo: 'hero',
    fijo: true,
    minDatos: 0,
    planMin: 'free',
    conteoKey: null,
    ancla: 'identidad',
    tituloDefault: 'Identidad',
  },
  metricas: {
    tipo: 'metricas',
    fijo: true,
    minDatos: 0,
    planMin: 'free',
    conteoKey: null,
    ancla: 'metricas',
    tituloDefault: 'Confianza',
  },
  estado: {
    tipo: 'estado',
    fijo: true,
    minDatos: 0,
    planMin: 'free',
    conteoKey: null,
    ancla: 'estado',
    tituloDefault: 'Estado',
  },
  acciones: {
    tipo: 'acciones',
    fijo: true,
    minDatos: 0,
    planMin: 'free',
    conteoKey: null,
    ancla: 'acciones',
    tituloDefault: 'Acciones',
  },
  novedades: {
    tipo: 'novedades',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: 'novedades',
    ancla: 'novedades',
    tituloDefault: 'Novedades',
  },
  categorias: {
    tipo: 'categorias',
    fijo: false,
    minDatos: 3,
    planMin: 'free',
    conteoKey: 'productos',
    ancla: 'categorias',
    tituloDefault: 'Categorías',
  },
  catalogo: {
    tipo: 'catalogo',
    fijo: false,
    minDatos: 3,
    planMin: 'free',
    conteoKey: 'productos',
    ancla: 'catalogo',
    tituloDefault: 'Catálogo',
  },
  servicios: {
    tipo: 'servicios',
    fijo: false,
    minDatos: 2,
    planMin: 'free',
    conteoKey: 'productos',
    ancla: 'servicios',
    tituloDefault: 'Servicios y precios',
  },
  promocion: {
    tipo: 'promocion',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: 'promociones',
    ancla: 'promocion',
    tituloDefault: 'Promoción',
  },
  resenas: {
    tipo: 'resenas',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: 'resenas',
    ancla: 'resenas',
    tituloDefault: 'Reseñas',
  },
  galeria: {
    tipo: 'galeria',
    fijo: false,
    minDatos: 3,
    planMin: 'free',
    conteoKey: 'fotosGaleria',
    ancla: 'galeria',
    tituloDefault: 'Galería',
  },
  publicaciones: {
    tipo: 'publicaciones',
    fijo: false,
    minDatos: 1,
    planMin: 'pro',
    conteoKey: 'publicaciones',
    ancla: 'publicaciones',
    tituloDefault: 'Publicaciones',
  },
  pago: {
    tipo: 'pago',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: null,
    ancla: 'pago',
    tituloDefault: 'Métodos de pago',
  },
  canales: {
    tipo: 'canales',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: null,
    ancla: 'canales',
    tituloDefault: 'Canales',
  },
  horario: {
    tipo: 'horario',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: null,
    ancla: 'horario',
    tituloDefault: 'Horario',
  },
  ubicacion: {
    tipo: 'ubicacion',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: null,
    ancla: 'ubicacion',
    tituloDefault: 'Ubicación',
  },
  nosotros: {
    tipo: 'nosotros',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: 'tieneNosotros',
    ancla: 'nosotros',
    tituloDefault: 'Quiénes somos',
  },
  faq: {
    tipo: 'faq',
    fijo: false,
    minDatos: 2,
    planMin: 'free',
    conteoKey: 'faqs',
    ancla: 'faq',
    tituloDefault: 'Preguntas frecuentes',
  },
  equipo: {
    tipo: 'equipo',
    fijo: false,
    minDatos: 1,
    planMin: 'free',
    conteoKey: 'equipo',
    ancla: 'equipo',
    tituloDefault: 'Equipo',
  },
  certificaciones: {
    tipo: 'certificaciones',
    fijo: false,
    minDatos: 1,
    planMin: 'pro',
    conteoKey: 'certificaciones',
    ancla: 'certificaciones',
    tituloDefault: 'Certificaciones',
  },
  documentos: {
    tipo: 'documentos',
    fijo: false,
    minDatos: 1,
    planMin: 'pro',
    conteoKey: 'documentos',
    ancla: 'documentos',
    tituloDefault: 'Documentos',
  },
  ia: {
    tipo: 'ia',
    fijo: false,
    minDatos: 3,
    planMin: 'max',
    conteoKey: 'productos',
    ancla: 'ia',
    tituloDefault: 'Pregúntale al negocio',
  },
};

export function planSuficiente(negocioPlan: Plan, requerido: Plan): boolean {
  return PLAN_RANK[negocioPlan] >= PLAN_RANK[requerido];
}
