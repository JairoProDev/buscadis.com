'use client';

import { hasAnalyticsConsent } from './consent';
import { getAttributionContext } from './attribution';

type GtagCommand = 'config' | 'event' | 'js' | 'set';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]): void {
  if (!hasAnalyticsConsent() || typeof window === 'undefined' || !window.gtag) return;
  window.gtag(...args);
}

export function trackPageView(path: string): void {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  gtag('event', 'page_view', {
    page_path: path,
    ...getAttributionContext(),
  });
}

export function trackGaEvent(
  name: string,
  params: Record<string, string | number | boolean | undefined> = {}
): void {
  gtag('event', name, {
    ...getAttributionContext(),
    ...params,
  });
}

export function trackSignUp(method = 'email'): void {
  trackGaEvent('sign_up', { method });
}

export function trackPurchase(params: {
  transactionId?: string;
  value?: number;
  currency?: string;
  itemName?: string;
}): void {
  trackGaEvent('purchase', {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency || 'PEN',
    item_name: params.itemName,
  });
}

export function trackGenerateLead(params: Record<string, string | number | undefined> = {}): void {
  trackGaEvent('generate_lead', params);
}

export type { GtagCommand };
