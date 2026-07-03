import { Categoria } from '@/types';

/** Base multipliers for funnel level A (total network reach estimate) */
const CATEGORY_NETWORK_MULTIPLIER: Record<Categoria, number> = {
  empleos: 1.2,
  inmuebles: 1.1,
  vehiculos: 1.0,
  servicios: 0.9,
  productos: 1.3,
  eventos: 0.7,
  negocios: 0.8,
  comunidad: 0.6,
};

const BASE_NETWORK = 12500;

export interface AudienceFunnel {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface FunnelInput {
  categoria?: string;
  subcategoria?: string;
  titulo?: string;
  descripcion?: string;
  dailyRate?: number;
  specificMatchCount?: number;
}

export function estimateAudienceFunnel(input: FunnelInput): AudienceFunnel {
  const cat = (input.categoria || 'productos') as Categoria;
  const mult = CATEGORY_NETWORK_MULTIPLIER[cat] ?? 1;
  const A = Math.round(BASE_NETWORK * mult);

  const B = Math.round(A * 0.35);
  const C = Math.round(B * 0.45);
  const D = input.subcategoria ? Math.round(C * 0.55) : Math.round(C * 0.3);
  const E = input.specificMatchCount ?? 0;

  return { A, B, C, D, E: Math.max(E, input.titulo?.trim() ? Math.round(D * 0.15) : 0) };
}

export function scaleReachByRate(baseReach: number, dailyRate: number): number {
  const base = 500;
  const bonus = Math.pow(dailyRate / 5, 1.15);
  return Math.round(baseReach * bonus);
}

export const FUNNEL_LABELS = {
  A: 'Personas que ven anuncios en todos nuestros canales',
  B: 'Búsquedas registradas en marketplace y ADIS AI',
  C: 'Interesados en esta categoría',
  D: 'Interesados en esta subcategoría',
  E: 'Match específico con tu aviso',
} as const;

export const FUNNEL_CHANNELS = [
  { id: 'adisAI', label: 'ADIS AI Chat' },
  { id: 'marketplace', label: 'Marketplace Buscadis' },
  { id: 'publicadis', label: 'Páginas Publicadis' },
  { id: 'social', label: 'Redes sociales' },
  { id: 'webApps', label: 'Webs y apps' },
  { id: 'influencers', label: 'Influencers y UGC' },
] as const;
