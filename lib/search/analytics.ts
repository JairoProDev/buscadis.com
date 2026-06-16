'use client';

import { trackEvent } from '@/lib/events';

export type SearchAnalyticsEvent =
  | 'search.suggest_impression'
  | 'search.suggest_click'
  | 'search.submit'
  | 'search.zero_results';

export function trackSearchEvent(
  name: SearchAnalyticsEvent,
  payload: Record<string, unknown> & { query?: string; userId?: string | null },
): void {
  trackEvent('search.performed', {
    entityType: 'search',
    entityId: typeof payload.query === 'string' ? payload.query.slice(0, 200) : undefined,
    payload: { ...payload, searchEvent: name },
    userId: payload.userId ?? null,
  });
}
