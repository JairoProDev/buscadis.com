/**
 * Carrito local del Perfil Vivo (Commerce OS).
 * Misma forma que lib/business/cart para reutilizar APIs.
 */
export type PvCartItem = {
  productId: string;
  title: string;
  price?: number;
  imageUrl?: string;
  qty: number;
};

const key = (businessId: string) => `pv_cart_${businessId}`;

export function loadPvCart(businessId: string): PvCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(businessId));
    return raw ? (JSON.parse(raw) as PvCartItem[]) : [];
  } catch {
    return [];
  }
}

export function savePvCart(businessId: string, items: PvCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(businessId), JSON.stringify(items));
}

export function pvCartTotal(items: PvCartItem[]): number {
  return items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
}

export function pvCartCount(items: PvCartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}

export const PV_CART_EVENT = 'pv:cart-changed';
export const PV_COMMERCE_EVENT = 'pv:commerce-event';

export type PvCommerceTrackDetail = {
  businessProfileId: string;
  eventType:
    | 'product_view'
    | 'purchase_intent'
    | 'add_to_cart'
    | 'order_created'
    | 'order_paid';
  productId?: string;
  metadata?: Record<string, unknown>;
};

export function emitPvCommerceEvent(detail: PvCommerceTrackDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PV_COMMERCE_EVENT, { detail }));
}
