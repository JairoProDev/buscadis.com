import { Adiso, Categoria, Ubicacion } from '@/types';
import { createAdisoInSupabase } from '@/lib/supabase';
import { normalizeContactoForApi, resolveUbicacionForPublish } from '@/lib/publish-helpers';
import {
  FREE_TIER_LIMITS,
  featuresForTier,
  expiresAtForTier,
  heuristicSplitAdText,
  inferCategoryFromText,
} from './tiers';
import { createStoryFromAdiso } from '@/lib/stories/adiso-sync';

export interface FreePublishInput {
  userId: string;
  text: string;
  categoria?: Categoria;
  contacto?: string;
  ubicacion?: unknown;
  imageUrl?: string;
}

export function validateFreePublishInput(input: FreePublishInput): string | null {
  const text = input.text.trim();
  if (!text) return 'Escribe algo sobre tu anuncio';
  if (text.length > FREE_TIER_LIMITS.maxDescChars + FREE_TIER_LIMITS.maxTitleChars) {
    return `Máximo ${FREE_TIER_LIMITS.maxDescChars + FREE_TIER_LIMITS.maxTitleChars} caracteres en plan gratis`;
  }
  if (!input.contacto?.trim()) return 'Agrega un número de contacto';
  return null;
}

export async function publishFreeAdiso(input: FreePublishInput): Promise<Adiso> {
  const err = validateFreePublishInput(input);
  if (err) throw new Error(err);

  const { titulo, descripcion } = heuristicSplitAdText(input.text);
  const categoria = (input.categoria || inferCategoryFromText(input.text)) as Categoria;
  const now = new Date();
  const features = featuresForTier('free');
  const expiresAt = expiresAtForTier('free');

  const tituloFinal = titulo.slice(0, FREE_TIER_LIMITS.maxTitleChars);
  const descFinal = descripcion.slice(0, FREE_TIER_LIMITS.maxDescChars);

  const adiso: Adiso = {
    id: `adiso-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    categoria,
    titulo: tituloFinal,
    descripcion: descFinal,
    contacto: normalizeContactoForApi(input.contacto!),
    ubicacion: resolveUbicacionForPublish(input.ubicacion as Ubicacion | undefined),
    fechaPublicacion: now.toISOString().split('T')[0],
    horaPublicacion: now.toTimeString().slice(0, 5),
    tamaño: 'miniatura',
    usuario_id: input.userId,
    user_id: input.userId,
    estaActivo: true,
    esHistorico: false,
    esGratuito: true,
    fechaExpiracion: expiresAt || undefined,
    imagenesUrls: input.imageUrl ? [input.imageUrl] : undefined,
    imagenUrl: input.imageUrl,
    publishTier: 'free',
    expiresAt: expiresAt || undefined,
    features: features as unknown as Record<string, unknown>,
    privateData: {},
  };

  const created = await createAdisoInSupabase(adiso);
  await createStoryFromAdiso(input.userId, created, { promotionTier: 'gratis' });
  return created;
}
