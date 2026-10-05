export const SALES_STAGE_IDS = [
  'nuevo',
  'contactado',
  'interesado',
  'propuesta',
  'negociacion',
  'ganado',
  'perdido',
] as const;

export type SalesStageId = (typeof SALES_STAGE_IDS)[number];

export type SalesOpportunitySource =
  | 'manual'
  | 'rueda'
  | 'inbound'
  | 'referral'
  | 'cliente_existente';

export type SalesActivityType =
  | 'note'
  | 'whatsapp_outbound'
  | 'whatsapp_inbound'
  | 'call'
  | 'email'
  | 'stage_change'
  | 'payment_recorded'
  | 'meeting'
  | 'ai_draft';

export interface SalesStage {
  id: SalesStageId;
  label: string;
  sort_order: number;
  is_closed_won: boolean;
  is_closed_lost: boolean;
}

export interface SalesAccount {
  id: string;
  display_name: string;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  adiso_user_id?: string | null;
  business_profile_id?: string | null;
  docs_path?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SalesOpportunity {
  id: string;
  title: string;
  stage_id: SalesStageId;
  source: SalesOpportunitySource;
  adiso_id?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  business_name?: string | null;
  plan_tier?: string | null;
  amount_pen?: number | null;
  currency: string;
  owner_user_id?: string | null;
  account_id?: string | null;
  lost_reason?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  stage_changed_at: string;
  won_at?: string | null;
  lost_at?: string | null;
}

export interface SalesActivity {
  id: string;
  opportunity_id: string;
  activity_type: SalesActivityType;
  body?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
}

export interface SalesTask {
  id: string;
  opportunity_id?: string | null;
  account_id?: string | null;
  title: string;
  due_at?: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  created_at: string;
}

export interface SalesOpportunityWithAdiso extends SalesOpportunity {
  adiso?: {
    id: string;
    titulo: string;
    categoria: string;
    esta_activo: boolean;
    imagen_url?: string | null;
  } | null;
}

export interface SalesPipelineMetrics {
  byStage: Record<string, number>;
  totals: {
    open: number;
    won: number;
    lost: number;
    amountOpenPen: number;
    amountWonPen: number;
  };
  conversion: {
    contactedRate: number;
    wonRate: number;
  };
}
