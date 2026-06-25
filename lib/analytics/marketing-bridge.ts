'use client';

import type { BehavioralEventType } from '@/lib/events/schema';
import { hasAnalyticsConsent } from './consent';
import { getAttributionContext } from './attribution';
import { trackGaEvent, trackGenerateLead, trackPurchase, trackSignUp } from './gtag';

const VERCEL_TRACK_EVENTS = new Set<BehavioralEventType | string>([
  'search.performed',
  'ad.contact_whatsapp',
  'ad.contact_chat',
  'publish.abandon',
  'promotion.purchased',
  'auth.sign_up',
]);

async function trackVercelCustomEvent(name: string, data?: Record<string, string | number>): Promise<void> {
  if (!VERCEL_TRACK_EVENTS.has(name)) return;
  try {
    const { track } = await import('@vercel/analytics');
    track(name, data);
  } catch {
    // non-blocking
  }
}

function mapBehavioralToGa4(
  eventType: BehavioralEventType | string,
  payload?: Record<string, unknown>
): { name: string; params?: Record<string, string | number | boolean | undefined> } | null {
  switch (eventType) {
    case 'search.performed':
      return {
        name: 'search',
        params: {
          search_term: typeof payload?.query === 'string' ? payload.query : undefined,
        },
      };
    case 'ad.contact_whatsapp':
    case 'ad.contact_chat':
      return {
        name: 'generate_lead',
        params: {
          method: eventType === 'ad.contact_whatsapp' ? 'whatsapp' : 'chat',
          ad_id: typeof payload?.adisoId === 'string' ? payload.adisoId : undefined,
        },
      };
    case 'ad.favorite':
      return {
        name: 'add_to_wishlist',
        params: {
          item_id: typeof payload?.adisoId === 'string' ? payload.adisoId : undefined,
        },
      };
    case 'publish.step_view':
      if (payload?.isLastStep === true) {
        return { name: 'begin_checkout' };
      }
      return null;
    case 'promotion.purchased':
      return {
        name: 'purchase',
        params: {
          transaction_id: typeof payload?.orderId === 'string' ? payload.orderId : undefined,
        },
      };
    case 'auth.sign_up':
      return {
        name: 'sign_up',
        params: {
          method: typeof payload?.method === 'string' ? payload.method : 'email',
        },
      };
    default:
      return null;
  }
}

const DEAL_GA4_MAP: Record<string, string> = {
  'deal.feed.open': 'deal_feed_open',
  'deal.clip.view': 'deal_clip_view',
  'deal.clip.like': 'deal_clip_like',
  'deal.clip.share': 'deal_clip_share',
  'deal.clip.whatsapp_click': 'generate_lead',
  'deal.clip.cta_click': 'deal_cta_click',
  'deal.publish.complete': 'deal_publish_complete',
};

export function bridgeBehavioralEvent(
  eventType: BehavioralEventType | string,
  options: {
    payload?: Record<string, unknown>;
    entityId?: string;
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const attribution = getAttributionContext();
  const payload = { ...options.payload, ...attribution };

  void trackVercelCustomEvent(eventType, {
    ...(options.entityId ? { entity_id: options.entityId } : {}),
    ...Object.fromEntries(
      Object.entries(attribution).filter(([, v]) => typeof v === 'string') as [string, string][]
    ),
  });

  if (!hasAnalyticsConsent()) return;

  const dealGaName = DEAL_GA4_MAP[eventType];
  if (dealGaName) {
    if (dealGaName === 'generate_lead') {
      trackGenerateLead({ method: 'whatsapp', clip_id: options.entityId });
    } else {
      trackGaEvent(dealGaName, {
        clip_id: options.entityId,
        ...getAttributionContext(),
        ...(options.payload as Record<string, string | number | undefined>),
      });
    }
    return;
  }

  if (eventType === 'auth.sign_up') {
    trackSignUp(typeof payload.method === 'string' ? payload.method : 'email');
    return;
  }

  if (eventType === 'promotion.purchased') {
    trackPurchase({
      transactionId: typeof payload.orderId === 'string' ? payload.orderId : undefined,
      itemName: 'ad_promotion',
    });
    return;
  }

  const mapped = mapBehavioralToGa4(eventType, payload);
  if (mapped) {
    if (mapped.name === 'generate_lead') {
      trackGenerateLead(mapped.params as Record<string, string | number | undefined>);
    } else {
      trackGaEvent(mapped.name, mapped.params);
    }
  }
}

export function bridgeDealEvent(
  eventType: string,
  clipId: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  void trackVercelCustomEvent(eventType, { clip_id: clipId });

  if (!hasAnalyticsConsent()) return;

  const gaName = DEAL_GA4_MAP[eventType];
  if (!gaName) return;

  if (gaName === 'generate_lead') {
    trackGenerateLead({ method: 'whatsapp', clip_id: clipId });
    return;
  }

  trackGaEvent(gaName, {
    clip_id: clipId,
    ...getAttributionContext(),
    ...(metadata as Record<string, string | number | undefined>),
  });
}
