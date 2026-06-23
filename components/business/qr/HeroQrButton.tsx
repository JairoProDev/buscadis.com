'use client';

import { IconQrcode } from '@/components/Icons';
import { cn } from '@/lib/utils';

interface HeroQrButtonProps {
  onClick: () => void;
  className?: string;
}

/** Botón flotante QR — esquina superior derecha del hero */
export default function HeroQrButton({ onClick, className }: HeroQrButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-white/95 hover:bg-white backdrop-blur-md text-slate-800',
        'p-2.5 rounded-full shadow-lg border border-white/60',
        'transition-all hover:scale-105 active:scale-95 print:hidden',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
      title="Código QR"
      aria-label="Ver código QR"
    >
      <IconQrcode size={20} />
    </button>
  );
}
