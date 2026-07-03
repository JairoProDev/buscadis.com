import { Adiso, Categoria, Ubicacion } from '@/types';
import { createAdisoInSupabase } from '@/lib/supabase';
import { normalizeContactoForApi, resolveUbicacionForPublish } from '@/lib/publish-helpers';
import { removePhonesFromText } from '@/lib/phone';
import {
  FREE_TIER_LIMITS,
  featuresForTier,
  expiresAtForTier,
  heuristicSplitAdText,
  inferCategoryFromText,
} from './tiers';
import { createStoryFromAdiso } from '@/lib/stories/adiso-sync';
import { PublishDraft, hasMinimumContent } from './publish-draft-types';
import { calculateTotalPrice } from './pricing';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { runInstantMatchCampaign } from '@/lib/activation/instant-match';

export interface PublishStudioInput {
  userId: string;
  draft: PublishDraft;
}

export function validateStudioPublish(input: PublishStudioInput): string | null {
  if (!hasMinimumContent(input.draft)) {
    return 'Agrega al menos un título, descripción o imagen';
  }
  return null;
}

function buildTitleAndDescription(draft: PublishDraft): { titulo: string; descripcion: string } {
  if (draft.titulo?.trim() && draft.descripcion?.trim()) {
    return {
      titulo: draft.titulo.trim().slice(0, 120),
      descripcion: draft.descripcion.trim().slice(0, 2000),
    };
  }
  const combined = [draft.titulo, draft.descripcion].filter(Boolean).join('. ');
  if (combined.trim()) {
    const split = heuristicSplitAdText(combined);
    return {
      titulo: (split.titulo || 'Aviso').slice(0, 120),
      descripcion: (split.descripcion || combined).slice(0, 2000),
    };
  }
  return { titulo: 'Aviso en Buscadis', descripcion: '' };
}

export async function publishFromStudio(input: PublishStudioInput): Promise<{
  adiso: Adiso;
  orderId?: string;
}> {
  const err = validateStudioPublish(input);
  if (err) throw new Error(err);

  const { draft, userId } = input;
  const { titulo, descripcion } = buildTitleAndDescription(draft);
  const categoria = (draft.categoria || inferCategoryFromText(`${titulo} ${descripcion}`)) as Categoria;
  const now = new Date();
  const isFree = draft.plan === 'free';
  const features = featuresForTier(isFree ? 'free' : 'paid');
  const expiresAt = isFree ? expiresAtForTier('free') : null;

  const tituloFinal = isFree ? titulo.slice(0, FREE_TIER_LIMITS.maxTitleChars) : titulo;
  const descFinal = isFree ? descripcion.slice(0, FREE_TIER_LIMITS.maxDescChars) : descripcion;

  const paidDays = draft.paidDays ?? 7;
  const dailyRate = draft.dailyRate ?? 5;
  const totalAmount = isFree ? 0 : calculateTotalPrice(paidDays, dailyRate);
  const paymentStatus = isFree ? 'free' : 'pending';
  const contactLocked = !isFree;

  const paidExpiresAt = !isFree
    ? new Date(now.getTime() + paidDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const adiso: Adiso = {
    id: `adiso-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    categoria,
    subcategoria: draft.subcategoria,
    subsubcategoria: draft.subsubcategoria,
    atributos: draft.atributos,
    titulo: tituloFinal,
    descripcion: removePhonesFromText(descFinal),
    contacto: draft.contacto ? normalizeContactoForApi(draft.contacto) : '',
    ubicacion: resolveUbicacionForPublish(draft.ubicacion as Ubicacion | undefined),
    fechaPublicacion: now.toISOString().split('T')[0],
    horaPublicacion: now.toTimeString().slice(0, 5),
    tamaño: isFree ? 'miniatura' : 'mediano',
    imagenesUrls: draft.imagenes.length > 0 ? draft.imagenes : undefined,
    imagenUrl: draft.imagenes[0],
    usuario_id: userId,
    user_id: userId,
    estaActivo: true,
    esHistorico: false,
    esGratuito: isFree,
    fechaExpiracion: (expiresAt || paidExpiresAt) || undefined,
    precio: draft.precio,
    moneda: draft.moneda || 'PEN',
    tipoPrecio: draft.tipoPrecio === 'consultar' ? 'a_convenir' : draft.tipoPrecio,
    publishTier: isFree ? 'free' : 'paid',
    expiresAt: expiresAt || paidExpiresAt || undefined,
    contactLocked,
    paymentStatus: paymentStatus as Adiso['paymentStatus'],
    features: {
      ...features,
      paid_days: paidDays,
      daily_rate: dailyRate,
      total_amount: totalAmount,
    } as unknown as Record<string, unknown>,
    privateData: isFree
      ? {}
      : {
          precio: draft.precio,
          ubicacion: draft.ubicacion,
          imagenesUrls: draft.imagenes,
        },
  };

  const created = await createAdisoInSupabase(adiso);

  let orderId: string | undefined;
  if (!isFree) {
    const { data: order, error } = await supabaseAdmin
      .from('adiso_publish_orders')
      .insert({
        adiso_id: created.id,
        user_id: userId,
        plan: 'paid',
        days: paidDays,
        daily_rate: dailyRate,
        total_amount: totalAmount,
        payment_status: 'pending',
        payment_method: 'yape',
      })
      .select('id')
      .single();

    if (error) console.error('[publish-studio] order insert:', error.message);
    else orderId = order?.id;
  }

  await createStoryFromAdiso(userId, created, {
    promotionTier: isFree ? 'gratis' : 'destacada',
  });

  if (!isFree) {
    try {
      await runInstantMatchCampaign({
        adisoId: created.id,
        advertiserUserId: userId,
        titulo: tituloFinal,
        descripcion: descFinal,
        categoria,
        ubicacion: typeof draft.ubicacion === 'object'
          ? (draft.ubicacion as unknown as Record<string, unknown>)
          : draft.ubicacion ? { label: String(draft.ubicacion) } : {},
      });
    } catch (e) {
      console.error('[publish-studio] instant match:', e);
    }
  }

  return { adiso: created, orderId };
}
