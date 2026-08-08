export type Arquetipo =
  | 'retail'
  | 'cita'
  | 'comida'
  | 'profesional'
  | 'alto_ticket'
  | 'local';

export type Plan = 'free' | 'pro' | 'max';

export type NivelVerificacion = 0 | 1 | 2 | 3;

export type TipoModulo =
  | 'hero'
  | 'metricas'
  | 'estado'
  | 'acciones'
  | 'novedades'
  | 'categorias'
  | 'catalogo'
  | 'servicios'
  | 'promocion'
  | 'resenas'
  | 'galeria'
  | 'publicaciones'
  | 'ubicacion'
  | 'horario'
  | 'pago'
  | 'canales'
  | 'nosotros'
  | 'faq'
  | 'equipo'
  | 'certificaciones'
  | 'documentos'
  | 'ia';

export type DiaSemana = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';

export type MetodoPago =
  | 'efectivo'
  | 'yape'
  | 'plin'
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'transferencia'
  | 'credito'
  | 'cripto'
  | 'bcp'
  | 'interbank'
  | 'bbva'
  | 'scotiabank'
  | 'banbif';

export type EtiquetaProducto = 'nuevo' | 'mas_vendido' | 'oferta' | 'popular';

export interface ConfigModulo {
  tipo: TipoModulo;
  visible: boolean;
  orden: number;
  titulo?: string;
}

export interface Franja {
  desde: string;
  hasta: string;
}

export interface Horario {
  zona: 'America/Lima';
  semana: Record<DiaSemana, Franja[]>;
  excepciones?: { fecha: string; franjas: Franja[]; motivo?: string }[];
}

export interface ImagenProducto {
  url: string;
  ancho: number;
  alto: number;
  lqip?: string;
  alt?: string;
}

export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  descripcion?: string;
  precio?: {
    valor: number;
    moneda: 'PEN' | 'USD';
    tipo: 'exacto' | 'desde' | 'rango';
    valorMax?: number;
  };
  precioAnterior?: number;
  imagenes: ImagenProducto[];
  disponibilidad: 'disponible' | 'agotado' | 'bajo_pedido' | 'ultimas_unidades';
  destacado: boolean;
  etiquetas: EtiquetaProducto[];
  /** Agrupación menú/catálogo (chips Categorías). */
  grupo?: string;
  activo: boolean;
}

export interface MetricasVerificadas {
  calificacion?: {
    promedio: number;
    total: number;
    distribucion?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
  };
  respuestaMedianaMin?: number;
  contactos30d?: number;
  antiguedadDesde: string;
}

export interface EstadoVivo {
  abierto: boolean;
  cierraEn?: string;
  abreEn?: string;
  porCerrar: boolean;
  deliveryActivo?: boolean;
  mensaje: string;
  respuestaMedianaMin?: number;
}

export interface Resena {
  id: string;
  autor: { nombre: string; iniciales: string };
  estrellas: 1 | 2 | 3 | 4 | 5;
  texto?: string;
  contactoVerificado: boolean;
  respuesta?: { texto: string; fecha: string };
  creadaEn: string;
}

export interface ItemFaq {
  id: string;
  pregunta: string;
  /** Texto plano; se renderiza en HTML (visible para SEO aunque el acordeón esté cerrado). */
  respuesta: string;
}

export interface PromocionVigente {
  id: string;
  titulo: string;
  condicion?: string;
  codigo?: string;
  /** ISO — si está vencida, el módulo no se muestra */
  venceEn?: string;
  ctaLabel?: string;
}

export interface FotoGaleria {
  id: string;
  url: string;
  alt?: string;
  etiqueta?: 'local' | 'trabajo' | 'resultado';
}

export interface NosotrosContenido {
  eslogan?: string;
  texto: string;
}

export interface Novedad {
  id: string;
  titulo: string;
  texto?: string;
  imagenUrl?: string;
  /** ISO */
  publicadaEn: string;
}

export interface MiembroEquipo {
  id: string;
  nombre: string;
  rol: string;
  fotoUrl?: string;
}

export interface Certificacion {
  id: string;
  titulo: string;
  emisor?: string;
  /** Año o fecha corta visible */
  anio?: string;
}

export interface Publicacion {
  id: string;
  titulo: string;
  resumen?: string;
  url?: string;
  /** ISO */
  publicadaEn: string;
}

export interface DocumentoPublico {
  id: string;
  titulo: string;
  tipo: 'pdf' | 'link' | 'otro';
  url: string;
}

export interface Negocio {
  id: string;
  slug: string;
  nombre: string;
  eslogan?: string;
  /** Rubro / industria / clasificación visible en hero (SEO local). */
  etiquetas?: string[];
  categoria: { id: string; nombre: string };
  arquetipo: Arquetipo;
  plan: Plan;
  estado: 'activo' | 'pausado' | 'suspendido' | 'vencido';
  identidad: {
    logoUrl?: string;
    portadaUrl?: string;
    colorSemilla: string;
    tema: 'claro' | 'oscuro' | 'auto';
    formaCards: 'suave' | 'marcado';
  };
  contacto: {
    whatsapp?: string;
    telefono?: string;
    email?: string;
    web?: string;
    redes: { tipo: string; url: string; activa: boolean }[];
  };
  ubicacion?: {
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    lat: number;
    lng: number;
    mostrarDireccionExacta: boolean;
    referencia?: string;
  };
  horario?: Horario;
  metodosPago?: MetodoPago[];
  verificacion: { nivel: NivelVerificacion; fecha?: string };
  metricasDeclaradas: { icono: string; valor: string; etiqueta: string }[];
  modulos: ConfigModulo[];
  conteos?: {
    productos?: number;
    resenas?: number;
    fotosGaleria?: number;
    faqs?: number;
    promociones?: number;
    tieneNosotros?: number;
    novedades?: number;
    equipo?: number;
    certificaciones?: number;
    publicaciones?: number;
    documentos?: number;
  };
  creadoEn: string;
  actualizadoEn: string;
}

/** Payload de render del Perfil Vivo (un request = todo el HTML inicial). */
export interface PerfilPayload {
  negocio: Negocio;
  productos: Producto[];
  resenas: Resena[];
  faqs: ItemFaq[];
  galeria: FotoGaleria[];
  promocion: PromocionVigente | null;
  nosotros: NosotrosContenido | null;
  novedades: Novedad[];
  equipo: MiembroEquipo[];
  certificaciones: Certificacion[];
  publicaciones: Publicacion[];
  documentos: DocumentoPublico[];
  metricas?: MetricasVerificadas;
  estadoVivo: EstadoVivo;
  totalProductos: number;
}

export type CanalHandoff = 'whatsapp' | 'llamada' | 'ruta' | 'web';

export interface HandoffPayload {
  negocioId: string;
  slug: string;
  canal: CanalHandoff;
  modulo: string;
  productoId?: string;
  mensaje?: string;
  destino: string;
  ts: number;
}

export type TemaModo = 'light' | 'dark';

export type TemaMarcaVars = {
  '--mk-accion': string;
  '--mk-accion-hover': string;
  '--mk-sobre': string;
  '--mk-suave': string;
  '--mk-texto': string;
  '--mk-borde': string;
};
