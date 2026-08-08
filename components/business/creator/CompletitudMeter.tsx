'use client';

import Link from 'next/link';
import { evaluarCompletitudVivo } from '@/lib/business/completitud-vivo';
import type { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';

interface CompletitudMeterProps {
  profile: Partial<BusinessProfile>;
  productCount?: number;
  className?: string;
  compact?: boolean;
  /** Slug para enlazar catálogo / editor */
  slug?: string;
  onAction?: (destino: string) => void;
}

export default function CompletitudMeter({
  profile,
  productCount = 0,
  className,
  compact = false,
  slug,
  onAction,
}: CompletitudMeterProps) {
  const { score, siguiente } = evaluarCompletitudVivo(profile, productCount);

  const hrefForDestino = (destino: string) => {
    if (!slug) return undefined;
    if (destino === 'catalogo') return '/mi-negocio/catalogo';
    return `/@${slug}?edit=true&hub=${destino === 'appearance' ? 'appearance' : destino === 'trust' ? 'trust' : destino === 'content' ? 'content' : 'identity'}`;
  };

  const actionHref = siguiente ? hrefForDestino(siguiente.destino) : undefined;

  if (compact) {
    return (
      <div className={cn('min-w-0', className)} title={siguiente?.beneficio}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-semibold text-slate-500 truncate">Tu perfil</span>
          <span className="text-[10px] font-black text-teal-700 tabular-nums">{score}%</span>
        </div>
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[17px] font-bold text-slate-800">Tu perfil</span>
        <span className="text-[17px] font-black text-teal-700 tabular-nums">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      {siguiente ? (
        <div className="mt-3">
          <p className="text-[15px] leading-snug text-slate-700">{siguiente.beneficio}</p>
          {actionHref ? (
            <Link
              href={actionHref}
              className="mt-3 flex items-center justify-center min-h-[56px] w-full rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-[17px] font-bold px-4"
              onClick={() => onAction?.(siguiente.destino)}
            >
              Hacerlo ahora
            </Link>
          ) : (
            <button
              type="button"
              className="mt-3 flex items-center justify-center min-h-[56px] w-full rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-[17px] font-bold px-4"
              onClick={() => onAction?.(siguiente.destino)}
            >
              Hacerlo ahora
            </button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-[15px] font-semibold text-emerald-700">
          Listo para compartir con tus clientes
        </p>
      )}
    </div>
  );
}
