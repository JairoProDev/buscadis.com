'use client';

import React, { forwardRef, useRef, useState } from 'react';
import Image from 'next/image';
import { Adiso, Categoria, PAQUETES } from '@/types';
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
import { useDarkMode } from '@/hooks/useDarkMode';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
    formatPrecioDisplay,
    formatUbicacionCorta,
    getCardCtaShortLabel,
    sanitizeAdisoDescripcion,
    toDisplayTitle,
} from '@/lib/adiso-display';
import { getWhatsAppUrl } from '@/lib/utils';
import { pickCardSignal } from '@/lib/social-proof';
import AdisoPublisherStrip from '@/components/AdisoPublisherStrip';

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

interface AdisoCardProps {
    adiso: Adiso;
    onClick: () => void;
    estaSeleccionado?: boolean;
    isDesktop?: boolean;
    vista?: 'grid' | 'list' | 'feed';
}

function getSellerDisplayName(adiso: Adiso): string | null {
    const rawName = adiso.vendedor?.nombre?.trim();
    if (!rawName) return null;
    if (rawName.toLowerCase() === 'anunciante') return null;
    return rawName;
}

function getMediaAspectClass(tamaño: string, vista: string): string {
    if (vista === 'list') return 'w-[96px] h-[96px] md:w-[96px] md:h-[96px]';
    if (tamaño === 'miniatura') return 'w-full h-[72px]';
    if (tamaño === 'gigante' || tamaño === 'grande') return 'w-full aspect-video';
    if (vista === 'feed') return 'w-full aspect-square';
    return 'w-full aspect-[4/3]';
}

const AdisoCard = forwardRef<HTMLDivElement, AdisoCardProps>(
    ({ adiso, onClick, estaSeleccionado, isDesktop = true, vista = 'grid' }, ref) => {
        const { isFavorite, isHidden, toggleFav, markNotInterested } = useAdInteraction(adiso.id);
        const isDark = useDarkMode();
        const IconComponent = getCategoriaIcon(adiso.categoria);
        const [showDismiss, setShowDismiss] = useState(false);
        const timerRef = useRef<NodeJS.Timeout | null>(null);
        const themeTokens = getCategoriaThemeTokens(adiso.categoria);
        const placeholderBg = isDark ? themeTokens.placeholderBgDark : themeTokens.placeholderBg;
        const cardCtaLabel = getCardCtaShortLabel(adiso.categoria);
        const canContact = Boolean(adiso.contacto?.trim());

        if (isHidden) return null;

        const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
        const extraFotos = Math.max(0, (adiso.imagenesUrls?.length ?? 0) - 1);
        const tamaño = adiso.tamaño || 'miniatura';
        const paquete = PAQUETES[tamaño];
        const displayTitle = toDisplayTitle(adiso.titulo);
        const displayDescription = sanitizeAdisoDescripcion(adiso.descripcion);
        const locationShort = formatUbicacionCorta(adiso.ubicacion);
        const priceLabel = formatPrecioDisplay(adiso);
        const cardSignal = pickCardSignal(adiso);
        const sellerName = getSellerDisplayName(adiso);

        const gridColumnSpan = paquete.columnas;
        const gridRowSpan = paquete.filas;

        const clearLongPress = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        const handleTouchStart = () => {
            clearLongPress();
            timerRef.current = setTimeout(() => {
                setShowDismiss(true);
                if (navigator.vibrate) navigator.vibrate(50);
            }, 600);
        };

        const handleCardContact = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!canContact) {
                onClick();
                return;
            }
            const url = getWhatsAppUrl(
                adiso.contacto!,
                adiso.titulo,
                adiso.categoria,
                adiso.id,
            );
            window.open(url, '_blank', 'noopener,noreferrer');
        };

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
                className={`
                    group relative flex ${vista === 'list' ? 'flex-row gap-3' : 'flex-col'} items-stretch text-left
                    bg-[var(--bg-primary)] rounded-[var(--card-radius)] border border-[var(--border-color)]
                    transition-shadow duration-300 overflow-hidden outline-none cursor-pointer font-sans
                    motion-reduce:transition-none motion-reduce:transform-none
                    focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2
                    ${estaSeleccionado
                        ? 'ring-2 ring-sky-400 shadow-[var(--card-shadow-hover)] z-10'
                        : 'shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'
                    }
                    ${vista === 'feed' ? 'w-full' : ''}
                `}
                style={{
                    gridColumn: vista === 'list' || vista === 'feed' ? '1 / -1' : `span ${gridColumnSpan}`,
                    gridRow: vista === 'list' || vista === 'feed' ? 'auto' : `span ${gridRowSpan}`,
                    height: '100%',
                    minHeight: vista === 'list' ? (isDesktop ? '96px' : '96px') : 'auto',
                }}
            >
                {vista === 'feed' && (
                    <div className="w-full p-3 flex items-center justify-between border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 relative border border-[var(--border-color)] flex-shrink-0">
                                {adiso.vendedor?.avatarUrl ? (
                                    <Image
                                        src={adiso.vendedor.avatarUrl}
                                        alt={adiso.vendedor.nombre}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                        <IconComponent size={18} />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                {sellerName && (
                                    <span className="text-sm font-semibold text-[var(--text-primary)] leading-none mb-1 truncate">
                                        {sellerName}
                                    </span>
                                )}
                                {locationShort && (
                                    <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium truncate">
                                        <IconLocation size={10} />
                                        <span className="truncate">{locationShort}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute top-1.5 right-1.5 flex items-center gap-0 z-30">
                    <button
                        type="button"
                        onClick={(e) => toggleFav(e)}
                        className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-transparent border-0 transition-transform hover:scale-110 active:scale-95 ${
                            imagenUrl
                                ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]'
                                : 'text-[var(--text-secondary)]'
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

                    {(isDesktop || showDismiss) && (
                        <button
                            type="button"
                            onClick={(e) => {
                                markNotInterested(e);
                                setShowDismiss(false);
                            }}
                            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-transparent border-0 transition-transform hover:scale-110 active:scale-95 ${
                                imagenUrl
                                    ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]'
                                    : 'text-[var(--text-tertiary)]'
                            }`}
                            title="No me interesa (Ocultar)"
                            aria-label="No me interesa"
                        >
                            <IconDismiss size={18} />
                        </button>
                    )}
                </div>

                <div
                    className={`
                        relative flex-shrink-0 overflow-hidden
                        ${getMediaAspectClass(tamaño, vista)}
                    `}
                    style={{ backgroundColor: placeholderBg }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={clearLongPress}
                    onTouchMove={clearLongPress}
                    onTouchCancel={clearLongPress}
                >
                    {imagenUrl ? (
                        <>
                            <Image
                                src={imagenUrl}
                                alt={displayTitle}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                className="object-cover motion-reduce:transition-none"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                        </>
                    ) : (
                        <div
                            className="absolute inset-0 flex items-center justify-center dark:bg-opacity-100"
                            style={{ backgroundColor: placeholderBg }}
                        >
                            <div className="opacity-50" style={{ color: themeTokens.accent }}>
                                <IconComponent size={tamaño === 'miniatura' ? 24 : 32} />
                            </div>
                        </div>
                    )}

                    {vista !== 'feed' && (
                        <AdisoPublisherStrip adiso={adiso} tamaño={tamaño} vista={vista} />
                    )}

                    {extraFotos > 0 && tamaño !== 'miniatura' && (
                        <span className="absolute top-2 right-14 z-10 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/55 text-white border border-white/20">
                            +{extraFotos} {extraFotos === 1 ? 'foto' : 'fotos'}
                        </span>
                    )}

                    {vista !== 'feed' && (locationShort || priceLabel || (!priceLabel && canContact)) && (
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end gap-2 z-10">
                            {locationShort ? (
                                <span className="inline-flex items-center gap-1 max-w-[58%] px-2 py-0.5 rounded-full text-xs font-medium bg-black/55 text-white truncate pointer-events-none">
                                    <IconLocation size={10} className="flex-shrink-0" />
                                    <span className="truncate">{locationShort}</span>
                                </span>
                            ) : (
                                <span className="flex-1" />
                            )}
                            <div className="flex-shrink-0 ml-auto">
                                {priceLabel ? (
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded-full text-sm font-bold shadow-sm ${
                                            imagenUrl
                                                ? 'bg-white/95 text-[var(--brand-blue)]'
                                                : 'bg-black/55 text-white'
                                        }`}
                                    >
                                        {priceLabel}
                                    </span>
                                ) : canContact ? (
                                    <button
                                        type="button"
                                        onClick={handleCardContact}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                                        style={{ backgroundColor: themeTokens.accent }}
                                        title={cardCtaLabel}
                                    >
                                        {cardCtaLabel}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}

                </div>

                <div
                    className={`flex flex-col flex-1 min-w-0 ${
                        vista === 'feed' ? 'p-4' : 'p-3'
                    } ${vista === 'list' ? 'py-2 pr-2' : ''}`}
                >
                    <h3
                        className={`
                            font-semibold text-[var(--text-primary)] leading-tight line-clamp-2 mb-1
                            ${vista === 'list' ? 'text-sm md:text-[15px]' : 'text-sm md:text-[15px]'}
                            ${tamaño === 'miniatura' ? 'text-sm' : ''}
                        `}
                    >
                        {displayTitle}
                    </h3>

                    {displayDescription && (
                        <p
                            className={`
                                text-[13px] text-[var(--text-secondary)] leading-snug mb-2
                                line-clamp-1 md:line-clamp-2
                                ${tamaño === 'miniatura' ? 'hidden md:line-clamp-1' : ''}
                            `}
                        >
                            {displayDescription}
                        </p>
                    )}

                    {vista === 'feed' && priceLabel && (
                        <p className="text-[15px] font-bold text-[var(--brand-blue)] mb-2">{priceLabel}</p>
                    )}

                    {cardSignal && vista === 'feed' && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] font-medium mt-auto pt-2 border-t border-[var(--border-color)]">
                            {cardSignal.type === 'popular' && <IconEye size={12} />}
                            <span>{cardSignal.label}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

AdisoCard.displayName = 'AdisoCard';

export default AdisoCard;
