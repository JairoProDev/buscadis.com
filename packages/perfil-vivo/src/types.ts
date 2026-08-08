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

export interface ConfigModulo {
  tipo: TipoModulo;
  visible: boolean;
  orden: number;
  titulo?: string;
}

export interface Negocio {
  id: string;
  slug: string;
  nombre: string;
  eslogan?: string;
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
  verificacion: { nivel: NivelVerificacion; fecha?: string };
  metricasDeclaradas: { icono: string; valor: string; etiqueta: string }[];
  modulos: ConfigModulo[];
  /** Conteos usados para filtrar módulos (Sprint 0: catalogo minDatos). */
  conteos?: {
    productos?: number;
    resenas?: number;
    fotosGaleria?: number;
  };
  creadoEn: string;
  actualizadoEn: string;
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
