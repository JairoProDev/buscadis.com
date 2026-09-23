import { Categoria, Ubicacion } from '@/types';
import type { FlyerConfig, FlyerTemplateId } from '@/lib/flyer/types';

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
  /** Fotos del aviso (galería). No sustituyen la plantilla hasta que elijas portada. */
  imagenes: string[];
  /** Foto opcional sobre la plantilla (portada manual). */
  portadaUrl?: string;
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

  /** Flyer cover when no real photos */
  flyerTemplateId?: FlyerTemplateId;
  flyerConfig?: FlyerConfig;

  /** Texto, stickers y trazos sobre la portada. Entra en deshacer/rehacer. */
  coverOverlay?: PublishCoverOverlay;

  /** Posición de cada pieza sobre el card. x/y son fracción del cuadrado. */
  cardLayout?: Partial<Record<CardPieceId, CardPieceLayout>>;
  /** Piezas ocultas en la portada (arrastrar al tachito). */
  cardHidden?: Partial<Record<CardPieceId, boolean>>;
}

export type CardPieceId = 'categoria' | 'titulo' | 'precio' | 'ubicacion';

export interface CardPieceLayout {
  x: number;
  y: number;
  scale: number;
}

export const DEFAULT_CARD_LAYOUT: Record<CardPieceId, CardPieceLayout> = {
  categoria: { x: 0.08, y: 0.08, scale: 1 },
  titulo: { x: 0.08, y: 0.3, scale: 1 },
  precio: { x: 0.08, y: 0.58, scale: 1 },
  ubicacion: { x: 0.08, y: 0.78, scale: 1 },
};

export interface PublishCoverOverlay {
  texts: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    font: string;
    size: number;
    align: 'left' | 'center' | 'right';
    bg: 'none' | 'solid' | 'soft';
  }>;
  stickers: Array<{ id: string; emoji: string; x: number; y: number }>;
  strokes: Array<{ color: string; width: number; points: Array<{ x: number; y: number }> }>;
}

export const EMPTY_COVER_OVERLAY: PublishCoverOverlay = {
  texts: [],
  stickers: [],
  strokes: [],
};

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
