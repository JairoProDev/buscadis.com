export type Categoria =
  | 'empleos'
  | 'inmuebles'
  | 'vehiculos'
  | 'servicios'
  | 'productos'
  | 'eventos'
  | 'negocios'
  | 'comunidad';

export type TamañoPaquete = 'miniatura' | 'pequeño' | 'mediano' | 'grande' | 'gigante';

// ============================================
// TIPOS DE UBICACIÓN
// ============================================

export interface UbicacionDetallada {
  pais: string; // Por defecto "Perú"
  departamento: string;
  provincia: string;
  distrito: string;
  direccion?: string; // Dirección específica (opcional)
  latitud?: number; // Coordenada de latitud
  longitud?: number; // Coordenada de longitud
}

// Mantener compatibilidad: ubicación puede ser string (antigua) o UbicacionDetallada (nueva)
export type Ubicacion = string | UbicacionDetallada;

export interface PaqueteInfo {
  tamaño: TamañoPaquete;
  precio: number;
  nombre: string;
  columnas: number; // En desktop (base 4 columnas)
  filas: number; // En desktop
  maxImagenes: number;
  descripcion: string;
}

export const PAQUETES: Record<TamañoPaquete, PaqueteInfo> = {
  miniatura: {
    tamaño: 'miniatura',
    precio: 15,
    nombre: 'Miniatura',
    columnas: 1,
    filas: 1,
    maxImagenes: 0,
    descripcion: '1x1 - Sin imagen'
  },
  pequeño: {
    tamaño: 'pequeño',
    precio: 25,
    nombre: 'Pequeño',
    columnas: 1,
    filas: 2,
    maxImagenes: 1,
    descripcion: '1x2 - 1 imagen'
  },
  mediano: {
    tamaño: 'mediano',
    precio: 45,
    nombre: 'Mediano',
    columnas: 2,
    filas: 2,
    maxImagenes: 3,
    descripcion: '2x2 - 3 imágenes'
  },
  grande: {
    tamaño: 'grande',
    precio: 85,
    nombre: 'Grande',
    columnas: 2,
    filas: 4,
    maxImagenes: 5,
    descripcion: '2x4 - 5 imágenes'
  },
  gigante: {
    tamaño: 'gigante',
    precio: 125,
    nombre: 'Gigante',
    columnas: 2,
    filas: 6,
    maxImagenes: 10,
    descripcion: '2x6 - 10 imágenes'
  }
};

// ============================================
// HISTORIAS (STORIES)
// ============================================

export type StoryMediaType = 'image' | 'video';
export type StoryPromotionTier = 'gratis' | 'destacada' | 'premium';

export interface StoryTierInfo {
  tier: StoryPromotionTier;
  nombre: string;
  precio: number;
  duracionHoras: number;
  descripcion: string;
}

export const STORY_TIERS: Record<StoryPromotionTier, StoryTierInfo> = {
  gratis: {
    tier: 'gratis',
    nombre: 'Gratis',
    precio: 0,
    duracionHoras: 24,
    descripcion: 'Visible 24 horas, orden normal',
  },
  destacada: {
    tier: 'destacada',
    nombre: 'Destacada',
    precio: 9,
    duracionHoras: 24,
    descripcion: 'Aparece antes que las historias gratuitas, con anillo dorado',
  },
  premium: {
    tier: 'premium',
    nombre: 'Premium',
    precio: 19,
    duracionHoras: 48,
    descripcion: '48 horas visibles y primer lugar en la barra de historias',
  },
};

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: StoryMediaType;
  caption?: string;
  categoria?: Categoria;
  adiso_id?: string;
  promotion_tier: StoryPromotionTier;
  view_count: number;
  created_at: string;
  expires_at: string;
  vendedor?: {
    nombre: string;
    avatarUrl?: string;
  };
}

export interface StoryGroup {
  userId: string;
  vendedor?: { nombre: string; avatarUrl?: string };
  stories: Story[];
  hasUnseen: boolean;
  topTier: StoryPromotionTier;
}

export interface Adiso {
  id: string;
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion: Ubicacion; // Puede ser string (compatibilidad) o UbicacionDetallada
  fechaPublicacion: string;
  horaPublicacion: string;
  tamaño?: TamañoPaquete; // Tamaño del paquete seleccionado
  imagenesUrls?: string[]; // URLs de las imágenes del adiso (opcional, múltiples)
  // Mantener imagenUrl para compatibilidad hacia atrás
  imagenUrl?: string;
  esGratuito?: boolean; // Indica si es un adiso gratuito
  // Nuevos campos para sistema de anuncios históricos
  fechaExpiracion?: string; // Fecha de expiración en formato ISO
  estaActivo?: boolean; // Indica si el anuncio está activo
  esHistorico?: boolean; // Indica si es un anuncio histórico (de PDFs)
  fuenteOriginal?: 'rueda_negocios' | 'usuario' | 'otro'; // Origen del anuncio
  edicionNumero?: string; // Número de edición de la revista
  fechaPublicacionOriginal?: string; // Fecha original de publicación en formato YYYY-MM-DD
  contactosMultiples?: ContactoMultiple[]; // Array de contactos múltiples
  usuario_id?: string; // ID del usuario que creó el anuncio (Supabase Auth ID)
  user_id?: string; // Alias para usuario_id (compatible con Supabase)

  // Propiedades visuales y de negocio
  precio?: number;
  moneda?: 'PEN' | 'USD';
  tipoPrecio?: 'fijo' | 'a_convenir' | 'gratis';
  esDestacado?: boolean;
  vistas?: number;
  contactos?: number;

  // Confianza y Reputación (Trust Architecture)
  vendedor?: {
    id: string;
    nombre: string;
    avatarUrl?: string;
    esVerificado: boolean;
    nivelVerificacion?: 'basico' | 'identidad' | 'negocio';
    badges?: Array<'vendedor_destacado' | 'respuesta_rapida' | 'antiguo'>;
    stats?: {
      tiempoRespuesta?: string; // Ej: "< 1h"
      miembroDesde?: string; // Fecha ISO
      totalVentas?: number;
      rating?: number; // 0-5
    };
  };
}

export interface AdisoGratuito {
  id: string;
  categoria: Categoria;
  titulo: string; // Máximo 30 caracteres
  contacto: string;
  fechaCreacion: string;
  fechaExpiracion: string; // 1 día después de fechaCreacion
}

export interface AdisoFormData {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  ubicacion?: UbicacionDetallada; // Opcional: el anunciante puede decidir no incluir ubicación
  tamaño?: TamañoPaquete; // Tamaño del paquete seleccionado
  imagenes?: File[]; // Archivos de imagen (opcional, múltiples)
  usuario_id?: string; // ID del usuario que creó el anuncio
}

// ============================================
// TIPOS DE AUTENTICACIÓN Y USUARIOS
// ============================================

export type RolUsuario = 'usuario' | 'anunciante' | 'admin';
export type Genero = 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
export type TemaPreferencia = 'light' | 'dark' | 'auto';
export type DisponibilidadProfesional = 'disponible' | 'busco_empleo' | 'no_disponible';
export type TipoVerificacion = 'identidad' | 'telefono' | 'email' | 'negocio';
export type EstadoVerificacion = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
export type TipoEventoAnalytics = 'busqueda' | 'click' | 'favorito' | 'contacto' | 'publicacion' | 'visualizacion';

export interface Profile {
  id: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  avatar_url?: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  rol: RolUsuario;
  es_verificado: boolean;
  fecha_verificacion?: string;
  fecha_nacimiento?: string;
  genero?: Genero;
  bio?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Favorito {
  id: string;
  user_id: string;
  adiso_id: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  categorias_favoritas: Categoria[];
  notificaciones_email: boolean;
  notificaciones_push: boolean;
  idioma: string;
  tema: TemaPreferencia;
  radio_busqueda_km: number;
  created_at: string;
  updated_at: string;
}

export interface Verificacion {
  id: string;
  user_id: string;
  tipo: TipoVerificacion;
  estado: EstadoVerificacion;
  documento_url?: string;
  datos_verificacion?: Record<string, any>;
  motivo_rechazo?: string;
  revisado_por?: string;
  fecha_revision?: string;
  created_at: string;
  updated_at: string;
}

export interface Educacion {
  institucion: string;
  titulo: string;
  año_inicio?: number;
  año_fin?: number;
  descripcion?: string;
}

export interface ExperienciaLaboral {
  empresa: string;
  puesto: string;
  año_inicio?: number;
  año_fin?: number;
  descripcion?: string;
  actual: boolean;
}

export interface Certificacion {
  nombre: string;
  institucion: string;
  año?: number;
  url?: string;
}

export interface PerfilProfesional {
  id: string;
  user_id: string;
  titulo_profesional?: string;
  experiencia_anos?: number;
  habilidades: string[];
  educacion: Educacion[];
  experiencia_laboral: ExperienciaLaboral[];
  certificaciones: Certificacion[];
  idiomas: string[];
  disponibilidad?: DisponibilidadProfesional;
  salario_esperado_min?: number;
  salario_esperado_max?: number;
  cv_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface HorarioAtencion {
  dia: string; // 'lunes', 'martes', etc.
  abierto: boolean;
  hora_apertura?: string;
  hora_cierre?: string;
}

export interface RedesSociales {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
}

export interface PerfilNegocio {
  id: string;
  user_id: string;
  nombre_negocio: string;
  descripcion?: string;
  categoria?: string;
  telefono?: string;
  email?: string;
  website?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  horario_atencion?: HorarioAtencion[];
  redes_sociales: RedesSociales;
  imagenes: string[];
  logo_url?: string;
  es_verificado: boolean;
  rating_promedio: number;
  total_calificaciones: number;
  created_at: string;
  updated_at: string;
}

export interface UserAnalytics {
  id: string;
  user_id?: string;
  evento: string;
  tipo_evento: TipoEventoAnalytics;
  datos: Record<string, any>;
  created_at: string;
}

// ============================================
// TIPOS PARA SISTEMA DE ANUNCIOS HISTÓRICOS
// ============================================

export type TipoContacto = 'telefono' | 'whatsapp' | 'email';

export interface ContactoMultiple {
  tipo: TipoContacto;
  valor: string;
  principal?: boolean; // Indica si es el contacto principal
  etiqueta?: string; // Etiqueta opcional (ej: "Oficina", "Celular", etc.)
}

export interface InteresAnuncioCaducado {
  id: string;
  adisoId: string;
  usuarioId?: string;
  contactoUsuario: string;
  mensaje?: string;
  fechaInteres: string;
  notificadoAnunciante: boolean;
  fechaNotificacion?: string;
  createdAt: string;
}

export interface DatosToonAnuncio {
  id: string;
  adisoId: string;
  contenidoToon: string;
  fechaActualizacion: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  keyHash: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  rateLimitPerHour: number;
  permisos: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export type AdInteractionType = 'favorite' | 'not_interested' | 'view';

export interface UserAdInteraction {
  id: string;
  user_id: string;
  adiso_id: string;
  interaction_type: AdInteractionType;
  reason?: string;
  created_at: string;
}

// ============================================
// SYSTEM NOTIFICATIONS
// ============================================

export type NotificationType = 'system' | 'like' | 'message' | 'ad_approved' | 'ad_rejected';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // For linking to resources (e.g. ad_id, conversation_id)
  read: boolean;
  created_at: string;
}

// ============================================
// MESSAGING SYSTEM
// ============================================

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  last_message?: string;
  last_message_at?: string;
  unread_count?: number; // Calculated field
  updated_at: string;
  created_at: string;
  // Join data
  other_user?: {
    id: string;
    email: string;
    nombre?: string;
    avatar_url?: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
