import { supabase } from '@/lib/supabase';

export type ProfileAnalyticsEvent =
  | 'page_view'
  | 'profile_view'
  | 'whatsapp_click'
  | 'discovery_cta_click'
  | 'signup_from_profile'
  | 'share_click'
  | 'add_to_cart';

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr-session';
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
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
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || '',
    });
  } catch {
    /* offline or RLS */
  }
}
