'use client';

import {
  IconShareAlt,
  IconShoppingCart,
  IconWhatsapp,
} from '@/components/Icons';
import type { BusinessProfile } from '@/types/business';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { cn } from '@/lib/utils';

interface CommerceDockProps {
  profile: Partial<BusinessProfile>;
  cartCount?: number;
  onOpenCart?: () => void;
  onShare: () => void;
  onWhatsappClick?: () => void;
  className?: string;
}

export default function CommerceDock({
  profile,
  cartCount = 0,
  onOpenCart,
  onShare,
  onWhatsappClick,
  className,
}: CommerceDockProps) {
  const hasWhatsapp = Boolean(profile.contact_whatsapp);
  const hasCatalog = true;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[100] print:hidden md:hidden',
        'border-t border-[var(--bp-border)] bg-[var(--bp-surface)]/95 backdrop-blur-lg',
        'pb-[env(safe-area-inset-bottom,0px)]',
        className
      )}
    >
      <div className="flex items-center gap-2 p-3 max-w-lg mx-auto">
        {hasWhatsapp && (
          <a
            href={getWhatsappUrl(profile.contact_whatsapp!, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            onClick={onWhatsappClick}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[var(--bp-radius)] bg-[var(--brand-color)] text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-transform"
          >
            <IconWhatsapp size={20} />
            WhatsApp
          </a>
        )}
        {hasCatalog && onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="relative h-12 w-12 shrink-0 rounded-[var(--bp-radius)] bg-[var(--bg-secondary)] text-[var(--bp-text)] flex items-center justify-center active:scale-[0.98] transition-transform"
            aria-label="Carrito"
          >
            <IconShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--brand-color)] text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className="h-12 w-12 shrink-0 rounded-[var(--bp-radius)] bg-[var(--bg-secondary)] text-[var(--bp-text)] flex items-center justify-center active:scale-[0.98] transition-transform"
          aria-label="Compartir"
        >
          <IconShareAlt size={20} />
        </button>
      </div>
    </div>
  );
}
