'use client';

import { DealClip } from '@/types';
import {
  formatDealPrice,
  formatCount,
  dealExpiresLabel,
} from '@/lib/deals/commerce-overlay';
import { getCategoriaLabel } from '@/lib/adiso-display';

interface DealClipOverlayProps {
  clip: DealClip;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onCta: () => void;
  onFollow?: () => void;
}

export default function DealClipOverlay({
  clip,
  expanded,
  onToggleExpand,
  onCta,
  onFollow,
}: DealClipOverlayProps) {
  const authorName = clip.business?.name || clip.author?.nombre || 'Vendedor';
  const avatar = clip.business?.logoUrl || clip.author?.avatarUrl;
  const expires = dealExpiresLabel(clip.deal_expires_at);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end pb-24 pt-16 px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
      <div className="pointer-events-auto space-y-2">
        {clip.promotion_tier !== 'gratis' && (
          <span className="inline-block rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-black">
            Patrocinado
          </span>
        )}

        <div className="flex items-center gap-2">
          {avatar ? (
            <img src={avatar} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              {authorName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{authorName}</p>
            {clip.categoria && (
              <p className="text-xs text-white/70">{getCategoriaLabel(clip.categoria)}</p>
            )}
          </div>
          {onFollow && (
            <button
              type="button"
              onClick={onFollow}
              className="rounded-md border border-white/80 px-3 py-1 text-xs font-bold text-white"
            >
              {clip.following ? 'Siguiendo' : 'Seguir'}
            </button>
          )}
        </div>

        <h2 className="text-base font-bold leading-snug text-white">{clip.title}</h2>

        <div className="flex flex-wrap items-center gap-2">
          {clip.price_display != null && (
            <span className="text-lg font-extrabold text-white">
              {formatDealPrice(clip.price_display, clip.currency)}
            </span>
          )}
          {clip.price_original != null && clip.price_original > (clip.price_display || 0) && (
            <span className="text-sm text-white/60 line-through">
              {formatDealPrice(clip.price_original, clip.currency)}
            </span>
          )}
          {clip.discount_pct != null && clip.discount_pct > 0 && (
            <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              -{clip.discount_pct}%
            </span>
          )}
          {expires && (
            <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs text-white">{expires}</span>
          )}
        </div>

        {clip.caption && (
          <button type="button" onClick={onToggleExpand} className="text-left">
            <p className={`text-sm text-white/90 ${expanded ? '' : 'line-clamp-2'}`}>{clip.caption}</p>
          </button>
        )}

        {clip.hashtags && clip.hashtags.length > 0 && (
          <p className="text-xs text-sky-300">
            {clip.hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}

        <button
          type="button"
          onClick={onCta}
          className="mt-1 w-full rounded-xl bg-[var(--brand-yellow)] py-3 text-center text-sm font-extrabold text-black shadow-lg"
        >
          Ver oferta
        </button>

        <p className="text-center text-[10px] text-white/50">
          {formatCount(clip.view_count)} vistas · {formatCount(clip.like_count)} likes
        </p>
      </div>
    </div>
  );
}
