'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Adiso } from '@/types';
import { getCategoriaIcon, getCategoriaLabel } from '@/lib/categoria-icons';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
  buildSearchComparisonHint,
  formatPickPrice,
  getAdisoImageUrl,
  getPickRankLabel,
  getPickReason,
  getSearchPicks,
} from '@/lib/chat/search-picks';
import { formatUbicacionCorta } from '@/lib/adiso-display';

interface ChatSearchPicksProps {
  items: Adiso[];
  query?: string;
  onOpen: (adiso: Adiso) => void;
  onRefine?: (text: string) => void;
}

export default function ChatSearchPicks({ items, query, onOpen, onRefine }: ChatSearchPicksProps) {
  const router = useRouter();
  const picks = getSearchPicks(items);
  const remaining = Math.max(0, items.length - picks.length);
  const comparisonHint = buildSearchComparisonHint(picks);

  const openExplorer = () => {
    const params = new URLSearchParams();
    if (query?.trim()) params.set('buscar', query.trim());
    router.push(params.toString() ? `/?${params.toString()}` : '/');
  };

  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      {picks.map((adiso, index) => (
        <PickCard
          key={adiso.id}
          adiso={adiso}
          index={index}
          picks={picks}
          onOpen={() => onOpen(adiso)}
        />
      ))}

      {comparisonHint && (
        <p className="m-0 px-1 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
          {comparisonHint}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {remaining > 0 && (
          <button
            type="button"
            onClick={openExplorer}
            className="rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--bg-secondary)]"
          >
            Ver {remaining} más en explorador
          </button>
        )}
        {query && onRefine && (
          <>
            <RefineChip label="Más baratos" onClick={() => onRefine(`${query} más barato`)} />
            <RefineChip label="Con fotos" onClick={() => onRefine(`${query} con fotos`)} />
          </>
        )}
      </div>
    </div>
  );
}

function PickCard({
  adiso,
  index,
  picks,
  onOpen,
}: {
  adiso: Adiso;
  index: number;
  picks: Adiso[];
  onOpen: () => void;
}) {
  const Icon = getCategoriaIcon(adiso.categoria);
  const theme = getCategoriaThemeTokens(adiso.categoria);
  const imageUrl = getAdisoImageUrl(adiso);
  const location = formatUbicacionCorta(adiso.ubicacion);
  const reason = getPickReason(adiso, index, picks);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 text-left shadow-sm transition-all hover:border-[rgba(var(--brand-primary-rgb),0.35)] hover:shadow-md active:scale-[0.99]"
    >
      <div
        className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundColor: theme.placeholderBg }}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={adiso.titulo} fill className="object-cover" sizes="72px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ color: theme.accent }}>
            <Icon size={28} />
          </div>
        )}
        <span
          className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: index === 0 ? 'var(--brand-blue)' : 'rgba(0,0,0,0.55)' }}
        >
          {index + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
            {getPickRankLabel(index)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">·</span>
          <span className="truncate text-[10px] text-[var(--text-tertiary)]">
            {getCategoriaLabel(adiso.categoria)}
          </span>
        </div>

        <h4 className="m-0 line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--brand-blue)]">
          {adiso.titulo}
        </h4>

        <p className="m-0 mt-1 line-clamp-1 text-[11px] text-[var(--text-tertiary)]">{reason}</p>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-[var(--text-primary)]">{formatPickPrice(adiso)}</span>
          {location && (
            <span className="truncate text-[10px] text-[var(--text-tertiary)]">{location}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function RefineChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-dashed border-[var(--border-color)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
    >
      {label}
    </button>
  );
}
