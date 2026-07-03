import { Categoria, Ubicacion } from '@/types';

export type PublishPlan = 'free' | 'paid';
export type PaymentStatus = 'free' | 'pending' | 'verified' | 'underpaid';

export interface PublishChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface PublishDraft {
  categoria?: Categoria;
  subcategoria?: string;
  subsubcategoria?: string;
  titulo?: string;
  descripcion?: string;
  contacto?: string;
  ubicacion?: Ubicacion;
  imagenes: string[];
  precio?: number;
  moneda?: 'PEN' | 'USD';
  tipoPrecio?: 'fijo' | 'a_convenir' | 'gratis' | 'consultar';
  atributos: Record<string, string | string[] | boolean | number>;

  aiConfidence: Record<string, number>;
  missingFields: string[];
  chatHistory: PublishChatMessage[];

  plan: PublishPlan;
  paidDays?: number;
  dailyRate?: number;
}

export const EMPTY_PUBLISH_DRAFT: PublishDraft = {
  imagenes: [],
  atributos: {},
  aiConfidence: {},
  missingFields: [],
  chatHistory: [],
  plan: 'paid',
  paidDays: 7,
  dailyRate: 5,
};

export function draftToAdisoPreview(draft: PublishDraft): {
  categoria: Categoria;
  titulo: string;
  descripcion: string;
  contacto: string;
  imagenesUrls?: string[];
  imagenUrl?: string;
  precio?: number;
  moneda?: 'PEN' | 'USD';
  tipoPrecio?: 'fijo' | 'a_convenir' | 'gratis';
  subcategoria?: string;
  ubicacion?: Ubicacion;
} {
  return {
    categoria: draft.categoria || 'productos',
    titulo: draft.titulo || 'Tu aviso',
    descripcion: draft.descripcion || '',
    contacto: draft.contacto || '',
    imagenesUrls: draft.imagenes.length > 0 ? draft.imagenes : undefined,
    imagenUrl: draft.imagenes[0],
    precio: draft.precio,
    moneda: draft.moneda,
    tipoPrecio: draft.tipoPrecio === 'consultar' ? 'a_convenir' : draft.tipoPrecio,
    subcategoria: draft.subcategoria,
    ubicacion: draft.ubicacion,
  };
}

export function hasMinimumContent(draft: PublishDraft): boolean {
  return Boolean(
    draft.titulo?.trim() ||
      draft.descripcion?.trim() ||
      draft.imagenes.length > 0
  );
}

export function detectMissingFields(draft: PublishDraft): string[] {
  const missing: string[] = [];
  if (!draft.categoria) missing.push('categoria');
  if (!draft.titulo?.trim()) missing.push('titulo');
  if (!draft.descripcion?.trim() && draft.imagenes.length === 0) missing.push('descripcion');
  if (!draft.contacto?.trim()) missing.push('contacto');
  return missing;
}
