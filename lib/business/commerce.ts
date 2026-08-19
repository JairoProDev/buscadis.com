import type { CartItem } from '@/lib/business/cart';

export type CommerceOrderItem = {
  productId: string;
  title: string;
  qty: number;
  price?: number;
  imageUrl?: string;
};

export type CommerceOrderStatus =
  | 'draft'
  | 'sent_wa'
  | 'confirmed'
  | 'preparing'
  | 'paid'
  | 'delivered'
  | 'cancelled';

export function itemsFromCart(items: CartItem[]): CommerceOrderItem[] {
  return items.map((i) => ({
    productId: i.productId,
    title: i.title,
    qty: i.qty,
    price: i.price,
    imageUrl: i.imageUrl,
  }));
}

export function orderSubtotal(items: CommerceOrderItem[]): number {
  return items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
}

export function buildWhatsappOrderMessage(params: {
  businessName: string;
  orderNumber: string;
  items: CommerceOrderItem[];
  total: number;
  note?: string;
}): string {
  const lines = params.items.map(
    (i) =>
      `• ${i.qty}× ${i.title}${
        i.price != null ? ` — S/ ${(i.price * i.qty).toFixed(2)}` : ''
      }`
  );
  const note = params.note?.trim() ? `\nNota: ${params.note.trim()}` : '';
  return [
    `Hola, quiero hacer un pedido en ${params.businessName} (Buscadis).`,
    `Pedido ${params.orderNumber}:`,
    ...lines,
    `Total: S/ ${params.total.toFixed(2)}`,
    note,
  ]
    .filter(Boolean)
    .join('\n');
}

export function waMeUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Boost ranking 0–1 para Pro/Max en listados. */
export function subscriptionRankingBoost(tier: string | undefined | null): number {
  if (tier === 'enterprise') return 0.2;
  if (tier === 'pro') return 0.12;
  return 0;
}
