'use client';

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@buscadis/ui';
import { Adiso, Categoria } from '@/types';
import {
  IconLocation,
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconEllipsisH,
} from '@/components/Icons';
import { useAdInteraction } from '@/hooks/useAdInteraction';
import { useAdisoCardActions, type AdisoCardActionId } from '@/hooks/useAdisoCardActions';
import AdisoCardActionsSheet from '@/components/adiso/AdisoCardActionsSheet';
import AdisoCardLongPressMenu, {
  pickRadialAction,
  mapRadialToCardAction,
  type LongPressRadialAction,
} from '@/components/adiso/AdisoCardLongPressMenu';
import DismissedCardPlaceholder from '@/components/DismissedCardPlaceholder';
import { useDarkMode } from '@/hooks/useDarkMode';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
  formatPrecioDisplay,
  shouldShowLocationOnCard,
  formatUbicacionCorta,
  toDisplayTitle,
  formatRelativePublishedAt,
  formatCatalogUpdatedAt,
  getJobSalaryLabel,
} from '@/lib/adiso-display';
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
  // Marketplace: imagen cuadrada (1:1) en grid y feed
  return 'aspect-square w-full';
}

const AdisoCard = forwardRef<HTMLDivElement, AdisoCardProps>(
  ({ adiso, onClick, estaSeleccionado, vista = 'grid' }, ref) => {
    const { isHidden, markNotInterested, giveFeedback, undoHide } = useAdInteraction(adiso);
    const [menuOpen, setMenuOpen] = useState(false);
    const [longPressActive, setLongPressActive] = useState(false);
    const [longPressPoint, setLongPressPoint] = useState({ x: 0, y: 0 });
    const [radialHighlight, setRadialHighlight] = useState<LongPressRadialAction | null>(null);
    const radialHighlightRef = useRef<LongPressRadialAction | null>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pointerStart = useRef<{ x: number; y: number } | null>(null);
    const suppressClickRef = useRef(false);

    const handleHiddenFromMenu = useCallback(async () => {
      await markNotInterested();
    }, [markNotInterested]);

    const cardActions = useAdisoCardActions(adiso, { onHidden: handleHiddenFromMenu });
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
    const priceDisplay = salaryLabel || priceLabel;
    const isCatalogProduct = adiso.privateData?.source === 'catalog_product';
    const relativeTime = isCatalogProduct
      ? formatCatalogUpdatedAt(adiso) ?? formatRelativePublishedAt(adiso)
      : formatRelativePublishedAt(adiso);
    const sellerName = getSellerDisplayName(adiso);
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

    const clearLongPressTimer = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const handleCardAction = (id: AdisoCardActionId, extra?: { reportReason?: string }) => {
      if (id === 'hide') {
        void cardActions.runAction('hide');
        return;
      }
      void cardActions.runAction(id, extra);
    };

    const onMediaPointerDown = (e: React.PointerEvent) => {
      if (menuOpen) return;
      pointerStart.current = { x: e.clientX, y: e.clientY };
      clearLongPressTimer();
      longPressTimer.current = setTimeout(() => {
        suppressClickRef.current = true;
        setLongPressPoint({ x: e.clientX, y: e.clientY });
        setLongPressActive(true);
        setRadialHighlight(null);
      }, 480);
    };

    const onMediaPointerMove = (e: React.PointerEvent) => {
      if (pointerStart.current && !longPressActive) {
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        if (Math.hypot(dx, dy) > 12) clearLongPressTimer();
      }
    };

    const onMediaPointerUp = () => {
      clearLongPressTimer();
      pointerStart.current = null;
    };

    useEffect(() => {
      if (!longPressActive) return;
      const onMove = (e: PointerEvent) => {
        const picked = pickRadialAction(longPressPoint.x, longPressPoint.y, e.clientX, e.clientY);
        radialHighlightRef.current = picked;
        setRadialHighlight(picked);
      };
      const onUp = () => {
        const picked = radialHighlightRef.current;
        if (picked) commitLongPress(picked);
        else cancelLongPress();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
      return () => {
        window.removeEventListener('pointermove', onMove);
      };
    }, [longPressActive, longPressPoint.x, longPressPoint.y]);

    const commitLongPress = (action: LongPressRadialAction) => {
      void cardActions.runAction(mapRadialToCardAction(action));
      setLongPressActive(false);
      setRadialHighlight(null);
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 400);
    };

    const cancelLongPress = () => {
      setLongPressActive(false);
      setRadialHighlight(null);
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 200);
    };

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
      <>
      <div
        ref={ref}
        onClick={() => {
          if (suppressClickRef.current || menuOpen || longPressActive) return;
          onClick();
        }}
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
          'group relative flex min-w-[156px] cursor-pointer items-stretch text-left font-sans outline-none',
          vista === 'list' ? 'flex-row gap-3' : 'h-full flex-col',
          vista === 'feed' ? 'w-full' : '',
          'bg-transparent',
          'transition-transform duration-300',
          'hover:-translate-y-0.5',
          'motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          'focus-visible:ring-2 focus-visible:ring-[var(--bs-action,var(--brand-blue))] focus-visible:ring-offset-2',
          estaSeleccionado
            ? 'z-10 ring-2 ring-[var(--bs-action,var(--brand-blue))] rounded-[var(--bs-radius-lg,var(--card-radius))]'
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
          <div className="mb-2 flex w-full items-center justify-between pb-2">
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

        <div
          className={`relative flex-shrink-0 overflow-hidden rounded-[var(--bs-radius-lg,var(--card-radius))] ${getMediaAspectClass(vista, isCatalogProduct)} ${
            isDestacado ? 'ring-2 ring-[var(--bs-color-sol-400)]' : ''
          } ${longPressActive ? 'z-[50] scale-[1.02] shadow-2xl ring-2 ring-white/40' : ''}`}
          style={{
            backgroundColor: showUserPhoto ? 'var(--bs-bg-sunken, var(--bg-secondary))' : placeholderBg,
          }}
          onPointerDown={onMediaPointerDown}
          onPointerMove={onMediaPointerMove}
          onPointerUp={onMediaPointerUp}
          onPointerCancel={onMediaPointerUp}
          onPointerLeave={onMediaPointerUp}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setMenuOpen(true);
            }}
            className="absolute right-1 top-1 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center border-0 bg-transparent text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] transition-transform hover:scale-110 active:scale-95"
            title="Más opciones"
            aria-label="Más opciones"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <IconEllipsisH size={18} />
          </button>

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
                    density="compact"
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

        {/* Body suelto — sin caja; estilo marketplace */}
        <div
          className={`flex min-w-0 flex-col bg-transparent ${
            vista === 'feed' ? 'pt-3' : vista === 'list' ? 'flex-1 py-1 pr-1' : 'flex-1 pt-2'
          }`}
        >
          <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-[var(--bs-fg-default,var(--text-primary))]">
            {displayTitle}
          </h3>

          {priceDisplay && (
            <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--bs-fg-default,var(--text-primary))]">
              {priceDisplay}
            </p>
          )}

          {metaLine && (
            <p
              className="mt-0.5 truncate text-xs font-medium text-[var(--bs-fg-muted,var(--text-secondary))]"
              suppressHydrationWarning
            >
              {metaLine}
            </p>
          )}
        </div>
      </div>

      <AdisoCardActionsSheet
        adiso={adiso}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isSaved={cardActions.isSaved}
        canDownloadImage={cardActions.canDownloadImage}
        onAction={handleCardAction}
      />

      <AdisoCardLongPressMenu
        active={longPressActive}
        centerX={longPressPoint.x}
        centerY={longPressPoint.y}
        highlighted={radialHighlight}
        isSaved={cardActions.isSaved}
        onHighlight={setRadialHighlight}
        onCommit={commitLongPress}
        onCancel={cancelLongPress}
      />
      </>
    );
  }
);

AdisoCard.displayName = 'AdisoCard';

export default AdisoCard;
