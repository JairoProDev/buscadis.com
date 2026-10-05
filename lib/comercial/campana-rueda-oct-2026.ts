import type { SalesStageId } from './types';

/** Campaña manual WhatsApp (sep–oct 2026), distinta del backfill PDF (~340 sin contactar). */
export const CAMPANA_RUEDA_OCT_2026 = 'rueda-negocios-2026-10';

export type CampanaEtapaLabel =
  | 'PAGÓ'
  | 'ESPERANDO PAGO'
  | 'ACORDADO'
  | 'EVALÚA'
  | 'PIDIÓ PRECIO'
  | 'FRÍO'
  | 'CLIENTE PREVIO'
  | 'GRATIS'
  | 'SIN HUMANO'
  | 'DATOS'
  | 'SIGUE BUSCANDO'
  | 'RESPONDIÓ'
  | 'PAUSA'
  | 'LOTE3'
  | 'ALERTA'
  | 'SIN ENVIAR';

export function campanaEtapaToStage(etapa: string): SalesStageId {
  const map: Record<string, SalesStageId> = {
    'PAGÓ': 'ganado',
    'ESPERANDO PAGO': 'negociacion',
    ACORDADO: 'negociacion',
    EVALÚA: 'interesado',
    'PIDIÓ PRECIO': 'propuesta',
    FRÍO: 'contactado',
    'CLIENTE PREVIO': 'interesado',
    GRATIS: 'contactado',
    'SIN HUMANO': 'contactado',
    DATOS: 'interesado',
    'SIGUE BUSCANDO': 'contactado',
    RESPONDIÓ: 'contactado',
    PAUSA: 'perdido',
    LOTE3: 'contactado',
    ALERTA: 'interesado',
    'SIN ENVIAR': 'nuevo',
  };
  return map[etapa] || 'contactado';
}

export interface CampanaProspectInput {
  title: string;
  business_name?: string;
  contact_name?: string;
  contact_whatsapp?: string;
  contact_handle?: string;
  etapa_label: CampanaEtapaLabel | string;
  plan?: string;
  ultimo_movimiento?: string;
  proxima_accion?: string;
  amount_pen?: number;
  segment: 'pipeline' | 'cobros' | 'agenda' | 'pausa' | 'lote3' | 'alerta' | 'sin_enviar';
  notas_extra?: string;
}
