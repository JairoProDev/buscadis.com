'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  emitPvCommerceEvent,
  loadPvCart,
  pvCartCount,
  pvCartTotal,
  savePvCart,
  PV_CART_EVENT,
  type PvCartItem,
} from './cart';

type CartCtx = {
  items: PvCartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  addItem: (item: Omit<PvCartItem, 'qty'> & { qty?: number }) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function PvCartProvider({
  businessId,
  children,
}: {
  businessId: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<PvCartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(loadPvCart(businessId));
  }, [businessId]);

  const persist = useCallback(
    (next: PvCartItem[]) => {
      setItems(next);
      savePvCart(businessId, next);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PV_CART_EVENT, { detail: { businessId } }));
      }
    },
    [businessId]
  );

  const addItem = useCallback(
    (item: Omit<PvCartItem, 'qty'> & { qty?: number }) => {
      const qty = item.qty ?? 1;
      setItems((prev) => {
        const existing = prev.find((p) => p.productId === item.productId);
        const next = existing
          ? prev.map((p) =>
              p.productId === item.productId ? { ...p, qty: p.qty + qty } : p
            )
          : [...prev, { ...item, qty }];
        savePvCart(businessId, next);
        emitPvCommerceEvent({
          businessProfileId: businessId,
          eventType: 'add_to_cart',
          productId: item.productId,
          metadata: { title: item.title, qty },
        });
        window.dispatchEvent(new CustomEvent(PV_CART_EVENT));
        return next;
      });
      setOpen(true);
    },
    [businessId]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      persist(
        qty <= 0
          ? items.filter((i) => i.productId !== productId)
          : items.map((i) => (i.productId === productId ? { ...i, qty } : i))
      );
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({
      items,
      count: pvCartCount(items),
      total: pvCartTotal(items),
      open,
      setOpen,
      addItem,
      setQty,
      clear,
    }),
    [items, open, addItem, setQty, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePvCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePvCart must be used within PvCartProvider');
  return ctx;
}

export function usePvCartOptional(): CartCtx | null {
  return useContext(Ctx);
}
