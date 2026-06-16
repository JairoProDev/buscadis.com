'use client';

import { IconClose, IconShoppingCart, IconWhatsapp } from '@/components/Icons';
import type { CartItem } from '@/lib/business/cart';
import { getCartWhatsappUrl } from '@/lib/business/public-utils';
import { cartTotal as sumCart } from '@/lib/business/cart';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface BusinessCartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  businessName: string;
  whatsapp?: string;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  slug: string;
}

export default function BusinessCartDrawer({
  open,
  onClose,
  items,
  businessName,
  whatsapp,
  onUpdateQty,
  onRemove,
  slug,
}: BusinessCartDrawerProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { warning: toastWarning } = useToast();
  const total = sumCart(items);

  const checkoutMp = async () => {
    if (items.length === 0 || total <= 0) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.productId,
            title: i.title,
            quantity: i.qty,
            unit_price: i.price || 0,
          })),
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toastWarning(data.error || 'Checkout no disponible. Usa WhatsApp.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex justify-end bg-black/50 backdrop-blur-sm print:hidden"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-[var(--bp-surface)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--bp-border)] flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2 text-[var(--bp-text)]">
            <IconShoppingCart size={22} /> Carrito
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <IconClose size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-[var(--bp-text-muted)] py-12 text-sm">Tu carrito está vacío</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 p-3 rounded-2xl border border-[var(--bp-border)]">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.title}</p>
                  {item.price != null && (
                    <p className="text-sm text-slate-500">S/ {item.price}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.productId, item.qty - 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.productId, item.qty + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.productId)}
                      className="ml-auto text-xs text-red-500 font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between font-bold">
              <span>Total estimado</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
            {whatsapp && (
              <a
                href={getCartWhatsappUrl(
                  whatsapp,
                  businessName,
                  items.map((i) => ({ title: i.title, qty: i.qty, price: i.price }))
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-500 text-white font-bold"
              >
                <IconWhatsapp size={20} /> Pedir por WhatsApp
              </a>
            )}
            {total > 0 && (
              <button
                type="button"
                onClick={checkoutMp}
                disabled={checkoutLoading}
                className={cn(
                  'w-full py-3 rounded-xl font-bold text-white bg-[var(--brand-color)]',
                  checkoutLoading && 'opacity-50'
                )}
              >
                {checkoutLoading ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
