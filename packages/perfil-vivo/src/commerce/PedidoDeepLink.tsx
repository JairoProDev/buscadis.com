'use client';

import { useEffect, useRef } from 'react';
import { usePerfil } from '../modulos/PerfilContext';
import { usePvCart } from './CartContext';
import {
  decodePedidoCart,
  isPedidoOrderId,
} from './pedido-link';
import type { PvCartItem } from './cart';

/**
 * Lee `?pedido=` al montar: UUID → pedido guardado; token → carrito compartido.
 * Abre el drawer y limpia el query sin recargar.
 */
export function PedidoDeepLink() {
  const { payload } = usePerfil();
  const { replaceItems, setOpen, setPendingNote } = usePvCart();
  const ran = useRef(false);
  const slug = payload.negocio.slug;

  useEffect(() => {
    if (ran.current || typeof window === 'undefined') return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('pedido')?.trim();
    if (!token) return;

    const stripParam = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('pedido');
      const next = url.pathname + url.search + url.hash;
      window.history.replaceState({}, '', next);
    };

    const apply = (items: PvCartItem[], note?: string) => {
      if (!items.length) return;
      replaceItems(items);
      if (note) setPendingNote(note);
      setOpen(true);
      stripParam();
    };

    void (async () => {
      try {
        if (isPedidoOrderId(token)) {
          const res = await fetch(
            `/api/business/${encodeURIComponent(slug)}/orders/${encodeURIComponent(token)}/public`
          );
          const data = (await res.json()) as {
            ok?: boolean;
            items?: PvCartItem[];
            note?: string;
          };
          if (res.ok && data.ok && data.items?.length) {
            apply(
              data.items.filter((i) => i.productId && i.title),
              data.note
            );
            return;
          }
        } else {
          const decoded = decodePedidoCart(token);
          if (decoded?.items.length) {
            apply(decoded.items, decoded.note);
            return;
          }
        }
      } catch {
        // silencioso: el visitante sigue viendo el perfil
      }
      stripParam();
    })();
  }, [slug, replaceItems, setOpen, setPendingNote]);

  return null;
}
