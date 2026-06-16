/**
 * Fase 2: attribution / commission tracking scaffold.
 * Full payout integration TBD (Mercado Pago split / manual reconciliation).
 */

export interface DealAttribution {
  clipId: string;
  adisoId: string;
  creatorUserId: string;
  referralCode?: string;
  commissionPct?: number;
}

export function buildAttributionLink(baseUrl: string, clipId: string, code?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('clip', clipId);
  if (code) url.searchParams.set('ref', code);
  return url.toString();
}

export const DEFAULT_CREATOR_COMMISSION_PCT = 5;
