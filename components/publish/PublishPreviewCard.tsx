'use client';

import Image from 'next/image';
import { PublishDraft, draftToAdisoPreview } from '@/lib/publish/publish-draft-types';
import { FREE_TIER_LIMITS } from '@/lib/publish/tiers';
import { IconHeartOutline, IconDismiss, IconLocation } from '@/components/Icons';

export type PreviewVariant = 'live' | 'free' | 'paid';

export interface PublisherPreview {
  name?: string;
  logoUrl?: string;
}

interface PublishPreviewCardProps {
  draft: PublishDraft;
  variant?: PreviewVariant;
  label?: string;
  compact?: boolean;
  publisher?: PublisherPreview | null;
}

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function locationLabel(ubicacion: PublishDraft['ubicacion']): string | null {
  if (!ubicacion) return null;
  if (typeof ubicacion === 'string') return ubicacion.trim() || null;
  return (
    ubicacion.distrito ||
    ubicacion.provincia ||
    ubicacion.departamento ||
    null
  );
}

/**
 * Vista previa fiel al AdisoCard del feed (no copy de marketing).
 * Gratis: imagen opacada, sin descripción.
 * Promocionado: badge Destacado bajo la foto, descripción 2 líneas.
 */
export default function PublishPreviewCard({
  draft,
  variant = 'live',
  label,
  compact = false,
  publisher,
}: PublishPreviewCardProps) {
  const preview = draftToAdisoPreview(draft);
  const isFree = variant === 'free';
  const isPaid = variant === 'paid';

  const title = isFree
    ? truncate(preview.titulo, FREE_TIER_LIMITS.maxTitleChars)
    : preview.titulo;
  const description = isFree
    ? ''
    : truncate(preview.descripcion || '', 160);
  const images = isFree ? preview.imagenesUrls?.slice(0, 1) : preview.imagenesUrls;
  const imageUrl = images?.[0] || preview.imagenUrl;
  const sellerName = publisher?.name || 'Tu negocio';
  const logoUrl = publisher?.logoUrl;
  const location = locationLabel(draft.ubicacion);

  return (
    <div className={`${compact ? '' : 'w-full'}`}>
      {label && (
        <p
          className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 m-0 ${
            isPaid ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'
          }`}
        >
          {label}
        </p>
      )}

      <div
        className={`overflow-hidden rounded-2xl bg-[var(--bg-primary)] flex flex-col ${
          compact ? 'max-w-[200px] mx-auto' : 'max-w-[260px] mx-auto'
        } ${
          isPaid
            ? 'ring-2 ring-[var(--brand-blue)] shadow-[0_6px_20px_-8px_rgba(var(--brand-primary-rgb),0.4)]'
            : 'ring-1 ring-[var(--border-color)] shadow-[var(--card-shadow)]'
        }`}
      >
        {/* Header — como AdisoCard feed */}
        <div className="w-full px-2.5 py-2 flex items-center gap-2 border-b border-[var(--border-color)] min-w-0">
          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-color)] shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt={sellerName} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[var(--text-tertiary)]">
                {sellerName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight truncate">
              {sellerName}
            </span>
            {location && (
              <span className="flex items-center gap-0.5 text-[9px] text-[var(--text-secondary)] truncate mt-0.5">
                <IconLocation size={8} />
                <span className="truncate">{location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="relative w-full aspect-square bg-[var(--bg-secondary)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={`object-cover ${isFree ? 'opacity-55' : ''}`}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-tertiary)]">
              Sin foto
            </div>
          )}
          {/* Fav / dismiss like real card */}
          <div className="absolute top-1 right-1 flex z-10 pointer-events-none">
            <span className="w-7 h-7 flex items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              <IconHeartOutline size={14} />
            </span>
            <span className="w-7 h-7 flex items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              <IconDismiss size={14} />
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 min-w-0 p-2.5">
          {isPaid && (
            <span className="inline-flex items-center self-start mb-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[rgba(var(--brand-yellow-rgb),0.18)] text-[#b8860b]">
              Destacado
            </span>
          )}
          <h3 className="font-semibold text-[var(--text-primary)] leading-tight line-clamp-2 m-0 text-[12px]">
            {title}
          </h3>
          {!isFree && description ? (
            <p className="m-0 mt-1 text-[10px] text-[var(--text-secondary)] leading-snug line-clamp-2">
              {description}
            </p>
          ) : null}
          {preview.precio != null && (
            <p className="m-0 mt-1.5 text-[11px] font-bold text-[var(--brand-blue)]">
              S/ {preview.precio}
            </p>
          )}
        </div>
      </div>

      {isFree && (
        <p className="text-[9px] text-center text-[var(--text-tertiary)] mt-1.5 m-0">
          Plan gratis · 24h · 1 foto
        </p>
      )}
      {isPaid && (
        <p className="text-[9px] text-center text-[var(--brand-blue)] font-semibold mt-1.5 m-0">
          Plan promocionado
        </p>
      )}
    </div>
  );
}
