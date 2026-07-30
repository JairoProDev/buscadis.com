/** Tipos del módulo Buscadis Envíos */

export const MOTO_CATEGORIES = [
  'paquete',
  'documentos',
  'mandado',
  'olvidado',
  'acompanamiento',
  'otro',
] as const;

export type MotoCategory = (typeof MOTO_CATEGORIES)[number];

export const MOTO_CATEGORY_LABELS: Record<MotoCategory, string> = {
  paquete: 'Paquete o encomienda',
  documentos: 'Documentos',
  mandado: 'Mandado / compra',
  olvidado: 'Olvidado / urgente',
  acompanamiento: 'Asistencia con carga',
  otro: 'Otro',
};

/** Opciones UI Pedir — mirror del formato del grupo, elevado y privado */
export const DELIVERY_ENVIO_OPTIONS: {
  id: MotoCategory;
  label: string;
  hint: string;
  example: string;
}[] = [
  {
    id: 'paquete',
    label: 'Paquete',
    hint: 'Caja, bolsa, encomienda',
    example: 'Ej: caja mediana con ropa',
  },
  {
    id: 'documentos',
    label: 'Documentos',
    hint: 'Sobres, papeles, trámites',
    example: 'Ej: carpeta para la municipalidad',
  },
  {
    id: 'mandado',
    label: 'Mandado',
    hint: 'Que compren y te lo traigan',
    example: 'Ej: comprar pan y leche en la esquina',
  },
  {
    id: 'olvidado',
    label: 'Olvidado',
    hint: 'Llaves, cargador, algo urgente',
    example: 'Ej: llaves dejadas en la oficina',
  },
  {
    id: 'acompanamiento',
    label: 'Asistencia con carga',
    hint: 'Ayuda a mover un envío grande o frágil',
    example: 'Ej: ayudar a subir una caja pesada al recojo',
  },
  {
    id: 'otro',
    label: 'Otro',
    hint: 'Describe abajo qué es',
    example: 'Describe el envío con claridad',
  },
];

export const MOTO_RIDER_STATES = [
  'borrador',
  'pendiente',
  'aprobado',
  'rechazado',
  'suspendido',
] as const;

export type MotoRiderState = (typeof MOTO_RIDER_STATES)[number];

export const MOTO_REQUEST_STATUSES = [
  'pendiente',
  'aceptado',
  'recogido',
  'entregado',
  'cancelado',
] as const;

export type MotoRequestStatus = (typeof MOTO_REQUEST_STATUSES)[number];

export const MOTO_DOC_TYPES = [
  'dni_frente',
  'dni_reverso',
  'selfie',
  'antecedentes_penales',
  'antecedentes_policiales',
  'foto_moto',
  'placa',
  'licencia',
  'soat',
] as const;

export type MotoDocType = (typeof MOTO_DOC_TYPES)[number];

export const MOTO_DOC_LABELS: Record<MotoDocType, string> = {
  dni_frente: 'DNI (frente)',
  dni_reverso: 'DNI (reverso)',
  selfie: 'Selfie',
  antecedentes_penales: 'Antecedentes penales',
  antecedentes_policiales: 'Antecedentes policiales',
  foto_moto: 'Foto de la moto',
  placa: 'Placa',
  licencia: 'Licencia de conducir',
  soat: 'SOAT',
};

/** Analytics de producto (no se muestra al usuario) */
export type UsoDetectado = 'envio' | 'asistencia' | 'desconocido';

export type WhenType = 'ahora' | 'programado';

export interface MotoPoint {
  lat: number;
  lng: number;
  text: string;
  zona?: string | null;
}

export interface MotoRider {
  id: string;
  user_id: string;
  estado: MotoRiderState;
  display_name: string | null;
  telefono_whatsapp: string | null;
  placa: string | null;
  foto_moto_url: string | null;
  foto_perfil_url: string | null;
  rating_avg: number;
  rating_count: number;
  zonas: string[];
  online: boolean;
  last_seen_at: string | null;
  acepta_mandados_compra: boolean;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MotoRiderDoc {
  id: string;
  rider_id: string;
  tipo: MotoDocType;
  url: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface MotoRequest {
  id: string;
  requester_id: string;
  rider_id: string | null;
  category: MotoCategory;
  description: string;
  photo_url: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_text: string;
  pickup_zona: string | null;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_text: string;
  dropoff_zona: string | null;
  when_type: WhenType;
  scheduled_at: string | null;
  budget_estimate: number | null;
  distance_km: number;
  fare_estimate: number;
  tip_amount: number | null;
  fare_agreed: number | null;
  status: MotoRequestStatus;
  uso_detectado: UsoDetectado;
  source_adiso_id: string | null;
  conversation_id: string | null;
  rider_lat: number | null;
  rider_lng: number | null;
  rider_location_at: string | null;
  requester_lat: number | null;
  requester_lng: number | null;
  requester_location_at: string | null;
  evidence_pickup_url: string | null;
  evidence_delivery_url: string | null;
  scheduled_notified_at: string | null;
  share_token: string | null;
  phone_shared_at: string | null;
  cancel_reason: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MotoRating {
  id: string;
  request_id: string;
  from_user_id: string;
  to_rider_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
}

export interface CreateMotoRequestInput {
  category: MotoCategory;
  description?: string | null;
  contact_name?: string | null;
  photo_url?: string | null;
  pickup: MotoPoint;
  dropoff: MotoPoint;
  when_type: WhenType;
  scheduled_at?: string | null;
  budget_estimate?: number | null;
  tip_amount?: number | null;
  source_adiso_id?: string | null;
}

export const STATUS_LABELS: Record<MotoRequestStatus, string> = {
  pendiente: 'Buscando motorizado',
  aceptado: 'Aceptado',
  recogido: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/** Docs mínimos para pasar a pendiente de revisión */
export const REQUIRED_DOCS_FOR_SUBMIT: MotoDocType[] = [
  'dni_frente',
  'dni_reverso',
  'selfie',
  'foto_moto',
  'licencia',
  'soat',
  'antecedentes_penales',
  'antecedentes_policiales',
];
