'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@buscadis/ui';
import { Adiso, Categoria } from '@/types';
import {
  IconEye,
  IconLocation,
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconHeart,
  IconHeartOutline,
  IconDismiss,
} from '@/components/Icons';
import { useAdInteraction } from '@/hooks/useAdInteraction';
import DismissedCardPlaceholder from '@/components/DismissedCardPlaceholder';
import { useDarkMode } from '@/hooks/useDarkMode';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
  formatPrecioDisplay,
  shouldShowLocationOnCard,
  formatUbicacionCorta,
  toDisplayTitle,
  formatRelativePublishedAt,
  getJobSalaryLabel,
} from '@/lib/adiso-display';
import { pickCardSignal } from '@/lib/social-proof';
import FlyerCanvas from '@/components/flyer/FlyerCanvas';
import { buildFlyerContentFromAdiso, flyerStateFromPrivateData } from '@/lib/flyer/layout';
import { adisoUsesGeneratedCover, resolveFlyerConfig } from '@/lib/flyer/templates';

const getCategoriaIcon = (categoria: Categoria) => {
  const iconMap = {
    empleos: IconEmpleos,
    inmuebles: IconInmuebles,
    vehiculos: IconVehiculos,
    servicios: IconServicios,
    productos: IconProductos,
    eventos: IconEventos,
    negocios: IconNegocios,
    comunidad: IconComunidad,
  };
  return iconMap[categoria] || IconEmpleos;
};

export type AdisoCardVista = 'grid' | 'list' | 'feed';

interface AdisoCardProps {
  adiso: Adiso;
  onClick: () => void;
  estaSeleccionado?: boolean;
  vista?: AdisoCardVista;
}

function getSellerDisplayName(adiso: Adiso): string | null {
  const rawName = adiso.vendedor?.nombre?.trim();
  if (!rawName) return null;
  if (rawName.toLowerCase() === 'anunciante') return null;
  return rawName;
}

function getMediaAspectClass(vista: AdisoCardVista, isCatalogProduct: boolean): string {
  if (vista === 'list') {
    return isCatalogProduct
      ? 'h-[112px] w-[112px] shrink-0'
      : 'h-24 w-24 shrink-0 md:h-24 md:w-24';
  }
  // Doc 08: imagen 4:3
  return 'aspect-[4/3] w-full';
}

const AdisoCard = forwardRef<HTMLDivElement, AdisoCardProps>(
  ({ adiso, onClick, estaSeleccionado, vista = 'grid' }, ref) => {
    const { isFavorite, isHidden, toggleFav, markNotInterested, giveFeedback, undoHide } =
      useAdInteraction(adiso);
    const isDark = useDarkMode();
    const IconComponent = getCategoriaIcon(adiso.categoria);
    const themeTokens = getCategoriaThemeTokens(adiso.categoria);
    const placeholderBg = isDark ? themeTokens.placeholderBgDark : themeTokens.placeholderBg;
    const categoryAccent = themeTokens.accent;

    const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
    const usesGeneratedCover = adisoUsesGeneratedCover(adiso);
    const showUserPhoto = Boolean(imagenUrl) && !usesGeneratedCover;
    const extraFotos = Math.max(0, (adiso.imagenesUrls?.length ?? 0) - 1);
    const displayTitle = toDisplayTitle(adiso.titulo);
    const locationShort = shouldShowLocationOnCard(adiso)
      ? formatUbicacionCorta(adiso.ubicacion)
      : '';
    const priceLabel = formatPrecioDisplay(adiso);
    const salaryLabel = adiso.categoria === 'empleos' ? getJobSalaryLabel(adiso) : null;
    const priceDisplay = salaryLabel || priceLabel || 'A convenir';
    const priceIsMuted = !salaryLabel && !priceLabel;
    const relativeTime = formatRelativePublishedAt(adiso);
    const cardSignal = pickCardSignal(adiso);
    const sellerName = getSellerDisplayName(adiso);
    const isCatalogProduct = adiso.privateData?.source === 'catalog_product';
    const isPaused = adiso.estaActivo === false;
    const isDestacado =
      adiso.promotionTier === 'destacada' || adiso.promotionTier === 'premium';
    const statusBadge =
      adiso.promotionTier === 'premium'
        ? 'Premium'
        : adiso.promotionTier === 'destacada'
          ? 'Destacado'
          : null;

    const [showRelativeMeta, setShowRelativeMeta] = useState(false);
    useEffect(() => {
      setShowRelativeMeta(true);
    }, []);
    const relativeTimeSafe = showRelativeMeta ? relativeTime : null;

    const gridColumn = vista === 'list' || vista === 'feed' ? '1 / -1' : 'span 1';
    const minHeight = vista === 'list' ? '96px' : undefined;

    const metaParts = [locationShort, relativeTimeSafe].filter(Boolean);
    const metaLine = metaParts.join(' · ');

    if (isHidden) {
      return (
        <DismissedCardPlaceholder
          gridColumn={gridColumn}
          gridRow="auto"
          minHeight={minHeight}
          onUndo={undoHide}
          onFeedback={giveFeedback}
        />
      );
    }

    return (
      <div
        ref={ref}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Ver ${displayTitle}`}
        aria-current={estaSeleccionado ? 'true' : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className={[
          'group relative flex min-w-[156px] cursor-pointer items-stretch overflow-hidden text-left font-sans outline-none',
          vista === 'list' ? 'flex-row gap-3' : 'h-full flex-col',
          vista === 'feed' ? 'w-full' : '',
          'rounded-[var(--bs-radius-lg,var(--card-radius))] border bg-[var(--bs-bg-surface,var(--bg-primary))]',
          isDestacado
            ? 'border-[var(--bs-color-sol-400)]'
            : 'border-[var(--bs-border-default,var(--border-color))]',
          'shadow-[var(--card-shadow)] transition-shadow duration-300',
          'hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]',
          'motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-[var(--bs-action,var(--brand-blue))] focus-visible:ring-offset-2',
          estaSeleccionado
            ? 'z-10 ring-2 ring-[var(--bs-action,var(--brand-blue))] shadow-[var(--card-shadow-hover)]'
            : '',
          isPaused ? 'opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          gridColumn,
          gridRow: 'auto',
          minHeight: minHeight || 'auto',
          alignSelf: vista === 'grid' ? 'stretch' : 'start',
        }}
      >
        {vista === 'feed' && (
          <div className="flex w-full items-center justify-between border-b border-[var(--bs-border-default,var(--border-color))] p-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--bs-border-default,var(--border-color))] bg-[var(--bs-bg-sunken,var(--bg-tertiary))]">
                {adiso.vendedor?.avatarUrl ? (
                  <Image
                    src={adiso.vendedor.avatarUrl}
                    alt={adiso.vendedor.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <IconComponent size={18} />
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                {sellerName && (
                  <span className="mb-1 truncate text-sm font-semibold leading-none text-[var(--bs-fg-default,var(--text-primary))]">
                    {sellerName}
                  </span>
                )}
                {locationShort && (
                  <div className="flex items-center gap-1 truncate text-xs font-medium text-[var(--bs-fg-muted,var(--text-secondary))]">
                    <IconLocation size={10} />
                    <span className="truncate">{locationShort}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fav / dismiss — interaction only, not status badge */}
        <div
          className={`absolute z-30 flex items-center gap-0 ${
            vista === 'list' ? 'right-1 top-1' : 'right-1.5 top-1.5'
          }`}
        >
          <button
            type="button"
            onClick={(e) => toggleFav(e)}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-0 bg-transparent transition-transform hover:scale-110 active:scale-95 ${
              showUserPhoto && vista !== 'list'
                ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]'
                : 'text-[var(--bs-fg-muted,var(--text-secondary))]'
            }`}
            title={isFavorite ? 'Quitar de favoritos' : 'Guardar para más tarde'}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar para más tarde'}
          >
            {isFavorite ? (
              <IconHeart size={18} className="text-red-500 drop-shadow-sm" />
            ) : (
              <IconHeartOutline size={18} />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => markNotInterested(e)}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-0 bg-transparent transition-transform hover:scale-110 active:scale-95 ${
              showUserPhoto && vista !== 'list'
                ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]'
                : 'text-[var(--bs-fg-subtle,var(--text-tertiary))]'
            }`}
            title="No me interesa (Ocultar)"
            aria-label="No me interesa"
          >
            <IconDismiss size={18} />
          </button>
        </div>

        <div
          className={`relative flex-shrink-0 overflow-hidden ${getMediaAspectClass(vista, isCatalogProduct)}`}
          style={{
            backgroundColor: showUserPhoto ? 'var(--bs-bg-sunken, var(--bg-secondary))' : placeholderBg,
          }}
        >
          {/* Category accent — 3px bar, never full fill */}
          <div
            className="absolute inset-x-0 top-0 z-20 h-[3px]"
            style={{ backgroundColor: categoryAccent }}
            aria-hidden
          />

          {showUserPhoto ? (
            <Image
              src={imagenUrl!}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover motion-reduce:transition-none"
              loading="lazy"
            />
          ) : (
            (() => {
              const flyer = flyerStateFromPrivateData(
                adiso.privateData as Record<string, unknown> | undefined,
                { categoria: adiso.categoria, adisoId: adiso.id }
              );
              const content = buildFlyerContentFromAdiso(adiso);
              const cfg = resolveFlyerConfig(adiso.categoria, flyer.templateId, flyer.config);
              return (
                <div className="absolute inset-0">
                  <FlyerCanvas
                    templateId={flyer.templateId}
                    config={cfg}
                    content={content}
                    className="h-full w-full"
                  />
                </div>
              );
            })()
          )}

          {/* Max 1 status badge — top left */}
          {statusBadge && (
            <div className="pointer-events-none absolute left-2 top-2 z-10">
              <Badge
                size="sm"
                variant={adiso.promotionTier === 'premium' ? 'accent' : 'warning'}
                className="uppercase tracking-wide"
              >
                {statusBadge}
              </Badge>
            </div>
          )}

          {extraFotos > 0 && (
            <span className="absolute bottom-2 right-2 z-10 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
              +{extraFotos} {extraFotos === 1 ? 'foto' : 'fotos'}
            </span>
          )}
        </div>

        {/* Body — fixed anatomy: title, price, meta, one signal */}
        <div
          className={`flex min-w-0 flex-col ${
            vista === 'feed' ? 'p-4' : vista === 'list' ? 'flex-1 py-2 pr-2' : 'flex-1 p-3'
          }`}
        >
          <h3 className="min-h-[2.5rem] text-[15px] font-semibold leading-snug line-clamp-2 text-[var(--bs-fg-default,var(--text-primary))]">
            {displayTitle}
          </h3>

          <p
            className={`mt-1 text-base font-bold tabular-nums ${
              priceIsMuted
                ? 'text-[var(--bs-fg-muted,var(--text-secondary))]'
                : 'text-[var(--bs-fg-default,var(--text-primary))]'
            }`}
          >
            {priceDisplay}
          </p>

          {metaLine && (
            <p
              className="mt-1 truncate text-xs font-medium text-[var(--bs-fg-muted,var(--text-secondary))]"
              suppressHydrationWarning
            >
              {metaLine}
            </p>
          )}

          {cardSignal && (
            <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-medium text-[var(--bs-fg-subtle,var(--text-tertiary))]">
              {cardSignal.type === 'popular' && <IconEye size={12} />}
              <span className="truncate">{cardSignal.label}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

AdisoCard.displayName = 'AdisoCard';

export default AdisoCard;
