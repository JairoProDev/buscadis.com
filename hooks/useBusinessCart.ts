'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CartItem } from '@/lib/business/cart';
import { loadCart, saveCart } from '@/lib/business/cart';

export function useBusinessCart(businessId: string | undefined) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (businessId) setItems(loadCart(businessId));
  }, [businessId]);

  const persist = useCallback(
    (next: CartItem[]) => {
      if (!businessId) return;
      setItems(next);
      saveCart(businessId, next);
    },
    [businessId]
  );

  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qty = 1) => {
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === item.productId);
        let next: CartItem[];
        if (idx >= 0) {
          next = prev.map((i, n) =>
            n === idx ? { ...i, qty: i.qty + qty } : i
          );
        } else {
          next = [...prev, { ...item, qty }];
        }
        if (businessId) saveCart(businessId, next);
        return next;
      });
      setOpen(true);
    },
    [businessId]
  );

  const updateQty = useCallback(
    (productId: string, qty: number) => {
      persist(
        qty <= 0
          ? items.filter((i) => i.productId !== productId)
          : items.map((i) => (i.productId === productId ? { ...i, qty } : i))
      );
    },
    [items, persist]
  );

  const removeItem = useCallback(
    (productId: string) => {
      persist(items.filter((i) => i.productId !== productId));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, count, open, setOpen, addItem, updateQty, removeItem, clear };
}
