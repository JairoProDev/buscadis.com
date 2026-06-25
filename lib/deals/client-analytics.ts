'use client';

import { DEAL_EVENTS } from '@/lib/deals/analytics';
import { trackEvent } from '@/lib/events/track';
import type { BehavioralEventType } from '@/lib/events/schema';

export function trackDealClientEvent(
  eventType: (typeof DEAL_EVENTS)[keyof typeof DEAL_EVENTS],
  clipId: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent(eventType as BehavioralEventType, {
    entityType: 'deal_clip',
    entityId: clipId,
    payload: metadata,
  });
}

export { DEAL_EVENTS };
