import { Adiso } from '@/types';
import { DealClip } from '@/types';

export function commerceFromAdiso(adiso: Adiso): Partial<DealClip> {
  const price = adiso.precio;
  const features = adiso.features as Record<string, unknown> | undefined;
  const original = typeof features?.precioOriginal === 'number' ? features.precioOriginal : undefined;

  let discount_pct: number | undefined;
  if (price != null && original != null && original > price) {
    discount_pct = Math.round(((original - price) / original) * 100);
  }

  return {
    title: adiso.titulo,
    caption: adiso.descripcion?.slice(0, 300),
    categoria: adiso.categoria,
    price_display: price ?? undefined,
    price_original: original,
    currency: adiso.moneda || 'PEN',
    discount_pct,
    cta_type: 'adiso',
    adiso_id: adiso.id,
  };
}

export function formatDealPrice(amount?: number, currency = 'PEN'): string {
  if (amount == null) return '';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'PEN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function dealExpiresLabel(iso?: string): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Expirado';
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 24) return `Expira en ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Expira en ${days}d`;
}

export function validateDiscount(priceOriginal?: number, priceDisplay?: number): boolean {
  if (priceOriginal == null || priceDisplay == null) return true;
  return priceOriginal >= priceDisplay;
}
