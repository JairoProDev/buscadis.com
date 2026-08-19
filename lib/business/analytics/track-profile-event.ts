import { supabase } from '@/lib/supabase';

export type ProfileAnalyticsEvent =
  | 'page_view'
  | 'profile_view'
  | 'product_view'
  | 'whatsapp_click'
  | 'discovery_cta_click'
  | 'signup_from_profile'
  | 'share_click'
  | 'add_to_cart'
  | 'purchase_intent'
  | 'order_created'
  | 'order_paid'
  | 'order_confirmed'
  | 'qr_scan'
  | 'ia_unanswered';

/** Eventos del funnel Commerce OS (centro comercial digital). */
export const COMMERCE_FUNNEL_EVENTS = [
  'profile_view',
  'product_view',
  'purchase_intent',
  'add_to_cart',
  'order_created',
  'order_confirmed',
  'order_paid',
  'whatsapp_click',
] as const;

export function getAnalyticsSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr-session';
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

export type TrackProfileViewResult = {
  success: boolean;
  counted: boolean;
  view_count: number;
};

export type TrackProfileViewOptions = {
  businessProfileId: string;
  fromQr?: boolean;
};

/** Registra visita al perfil; devuelve view_count actualizado para refrescar métricas en UI. */
export async function trackProfileView({
  businessProfileId,
  fromQr = false,
}: TrackProfileViewOptions): Promise<TrackProfileViewResult | null> {
  if (!businessProfileId || typeof fetch === 'undefined') return null;

  try {
    const sessionId = `${getAnalyticsSessionId()}_${Date.now()}`;
    const res = await fetch(`/api/business/${encodeURIComponent(businessProfileId)}/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as TrackProfileViewResult;
    if (fromQr && json.success) {
      await trackProfileEvent(businessProfileId, 'qr_scan');
    }
    return json;
  } catch {
    return null;
  }
}

export async function trackProfileEvent(
  businessProfileId: string,
  eventType: ProfileAnalyticsEvent,
  productId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!businessProfileId || typeof navigator === 'undefined') return;
  try {
    await supabase!.from('page_analytics').insert({
      business_profile_id: businessProfileId,
      event_type: eventType,
      product_id: productId || null,
      session_id: getAnalyticsSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || '',
      metadata: metadata ?? {},
    });
  } catch {
    /* offline or RLS */
  }
}

/** Pregunta que la IA del perfil no pudo responder → corpus para el dueño. */
export async function trackIaUnanswered(
  businessProfileId: string,
  pregunta: string
): Promise<void> {
  const q = pregunta.trim().slice(0, 280);
  if (!q) return;
  await trackProfileEvent(businessProfileId, 'ia_unanswered', undefined, {
    pregunta: q,
  });
}
