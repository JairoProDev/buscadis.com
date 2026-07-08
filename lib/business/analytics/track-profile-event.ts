import { supabase } from '@/lib/supabase';

export type ProfileAnalyticsEvent =
  | 'page_view'
  | 'profile_view'
  | 'whatsapp_click'
  | 'discovery_cta_click'
  | 'signup_from_profile'
  | 'share_click'
  | 'add_to_cart'
  | 'qr_scan';

export function getAnalyticsSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr-session';
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

export type TrackProfileViewOptions = {
  businessProfileId: string;
  fromQr?: boolean;
};

/** Counts a unique profile view (deduped server-side per session/24h). */
export async function trackProfileView({
  businessProfileId,
  fromQr = false,
}: TrackProfileViewOptions): Promise<void> {
  if (!businessProfileId || typeof fetch === 'undefined') return;

  try {
    // Count every page load/refresh as a visit.
    const sessionId = `${getAnalyticsSessionId()}_${Date.now()}`;
    await fetch(`/api/business/${encodeURIComponent(businessProfileId)}/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }),
    });
  } catch {
    /* offline */
  }

  if (fromQr) {
    await trackProfileEvent(businessProfileId, 'qr_scan');
  }
}

export async function trackProfileEvent(
  businessProfileId: string,
  eventType: ProfileAnalyticsEvent,
  productId?: string
): Promise<void> {
  if (!businessProfileId || typeof navigator === 'undefined') return;
  try {
    await supabase!.from('page_analytics').insert({
      business_profile_id: businessProfileId,
      event_type: eventType,
      product_id: productId,
      session_id: getAnalyticsSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || '',
    });
  } catch {
    /* offline or RLS */
  }
}
