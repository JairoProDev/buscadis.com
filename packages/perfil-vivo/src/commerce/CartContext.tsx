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
  /** Último producto agregado — para toast sin interrumpir browse */
  toast: string | null;
  clearToast: () => void;
  /** Nota traída por deep link `?pedido=` */
  pendingNote: string | null;
  setPendingNote: (n: string | null) => void;
  addItem: (item: Omit<PvCartItem, 'qty'> & { qty?: number }) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  /** Reemplaza el carrito (deep link / compartir). */
  replaceItems: (items: PvCartItem[]) => void;
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
  const [toast, setToast] = useState<string | null>(null);
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadPvCart(businessId));
  }, [businessId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

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
        emitPvCommerceEvent({
          businessProfileId: businessId,
          eventType: 'purchase_intent',
          productId: item.productId,
          metadata: { surface: 'add_to_cart' },
        });
        window.dispatchEvent(new CustomEvent(PV_CART_EVENT));
        return next;
      });
      // No abrir drawer: el visitante sigue comprando; toast + badge lo confirman.
      setToast(item.title);
    },
    [businessId]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setItems((prev) => {
        const next =
          qty <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
        savePvCart(businessId, next);
        window.dispatchEvent(new CustomEvent(PV_CART_EVENT));
        return next;
      });
    },
    [businessId]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        savePvCart(businessId, next);
        window.dispatchEvent(new CustomEvent(PV_CART_EVENT));
        return next;
      });
    },
    [businessId]
  );

  const clear = useCallback(() => persist([]), [persist]);
  const clearToast = useCallback(() => setToast(null), []);
  const replaceItems = useCallback(
    (next: PvCartItem[]) => {
      persist(next);
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      items,
      count: pvCartCount(items),
      total: pvCartTotal(items),
      open,
      setOpen,
      toast,
      clearToast,
      pendingNote,
      setPendingNote,
      addItem,
      setQty,
      removeItem,
      replaceItems,
      clear,
    }),
    [
      items,
      open,
      toast,
      clearToast,
      pendingNote,
      addItem,
      setQty,
      removeItem,
      replaceItems,
      clear,
    ]
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
