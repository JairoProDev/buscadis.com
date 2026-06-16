export interface CartItem {
  productId: string;
  title: string;
  price?: number;
  imageUrl?: string;
  qty: number;
}

const storageKey = (businessId: string) => `buscadis_cart_${businessId}`;

export function loadCart(businessId: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(businessId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(businessId: string, items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(businessId), JSON.stringify(items));
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
}
