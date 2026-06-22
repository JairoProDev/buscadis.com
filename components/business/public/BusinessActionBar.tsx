'use client';

import {
  IconEdit,
  IconShareAlt,
  IconShoppingCart,
  IconWhatsapp,
} from '@/components/Icons';
import type { BusinessProfile } from '@/types/business';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { getPublicadisSiteUrl } from '@/lib/business/publicadis';
import { cn } from '@/lib/utils';

interface BusinessActionBarProps {
  profile: Partial<BusinessProfile>;
  isOwner?: boolean;
  cartCount?: number;
  onShare: () => void;
  onOpenCart?: () => void;
  onEditPart?: (part: string) => void;
  hideMobile?: boolean;
}

export default function BusinessActionBar({
  profile,
  isOwner,
  cartCount = 0,
  onShare,
  onOpenCart,
  onEditPart,
  hideMobile = false,
}: BusinessActionBarProps) {
  const publicadisUrl = getPublicadisSiteUrl(profile);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 md:ml-[220px] -mt-2 mb-4">
      <div className="hidden md:flex items-center gap-3">
        {profile.contact_whatsapp && (
          <a
            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            className="bg-[var(--brand-color)] hover:brightness-110 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[var(--brand-color)]/30 hover:-translate-y-1 transition-all flex items-center gap-2 print:hidden"
          >
            <IconWhatsapp size={20} /> Contáctanos
          </a>
        )}
        {publicadisUrl && (
          <a
            href={publicadisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 print:hidden"
          >
            Sitio web
          </a>
        )}
        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl transition-colors print:hidden flex items-center gap-2 font-bold"
          >
            <IconShoppingCart size={20} />
            Carrito
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--brand-color)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-xl transition-colors print:hidden"
          title="Compartir"
        >
          <IconShareAlt size={20} />
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => onEditPart?.('general')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 print:hidden"
          >
            <IconEdit size={18} />
            <span className="text-sm">Editar página</span>
          </button>
        )}
      </div>

      <div className={cn('md:hidden grid gap-2 mt-4', hideMobile && 'hidden', publicadisUrl ? 'grid-cols-6' : 'grid-cols-5')}>
        {publicadisUrl && (
          <a
            href={publicadisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 bg-slate-900 text-white h-12 rounded-xl font-bold flex items-center justify-center text-xs px-2"
          >
            Sitio web
          </a>
        )}
        {profile.contact_whatsapp && (
          <a
            href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'bg-[var(--brand-color)] text-white h-12 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm',
              publicadisUrl ? 'col-span-2' : 'col-span-2'
            )}
          >
            <IconWhatsapp size={18} /> WhatsApp
          </a>
        )}
        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            className="col-span-1 bg-slate-100 text-slate-700 h-12 rounded-xl flex items-center justify-center relative"
          >
            <IconShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[var(--brand-color)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className="col-span-1 bg-slate-100 text-slate-700 h-12 rounded-xl flex items-center justify-center"
        >
          <IconShareAlt size={20} />
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => onEditPart?.('general')}
            className="col-span-1 bg-slate-200 text-slate-800 h-12 rounded-xl flex items-center justify-center"
          >
            <IconEdit size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
