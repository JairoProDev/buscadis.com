'use client';

import React, { useEffect, useRef } from 'react';
import { Adiso } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { registrarClick } from '@/lib/analytics';
import { trackEvent } from '@/lib/events';
import AdisoCard from './AdisoCard';
import { SkeletonCard } from './SkeletonAdisos';

interface GrillaAdisosProps {
  adisos: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
  adisoSeleccionadoId?: string | null;
  espacioAdicional?: number;
  cargandoMas?: boolean;
  sentinelRef?: React.RefObject<HTMLDivElement>;
  vista?: 'grid' | 'list' | 'feed';
  /** Desktop detail panel open (≥1280) → 4 cols instead of 5 */
  withPanel?: boolean;
}

function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 0 && rect.bottom <= vh;
}

/** Primeras 2 filas del home: tarjetas un poco más grandes (4 cols desktop). */
export function marketplaceFeaturedGridClass(withPanel: boolean): string {
  return [
    'grid grid-cols-2 gap-3 min-[480px]:gap-4',
    'md:grid-cols-3 md:gap-4',
    'lg:grid-cols-4 lg:gap-4',
    withPanel ? 'xl:grid-cols-3 xl:gap-4' : 'xl:grid-cols-4 xl:gap-4',
  ].join(' ');
}

/** Resto del feed: densidad habitual (5 cols en desktop ancho). */
export function marketplaceStandardGridClass(withPanel: boolean): string {
  return [
    'grid grid-cols-2 gap-3 min-[480px]:gap-4',
    'md:grid-cols-3 md:gap-4',
    'lg:grid-cols-4',
    withPanel ? 'xl:grid-cols-4 xl:gap-5' : 'xl:grid-cols-5 xl:gap-5',
  ].join(' ');
}

function grillaClassName(vista: 'grid' | 'list' | 'feed', withPanel: boolean): string {
  if (vista === 'list') {
    return 'grid grid-cols-1 gap-4';
  }
  if (vista === 'feed') {
    return 'mx-auto grid max-w-[480px] grid-cols-1 gap-6';
  }
  return marketplaceStandardGridClass(withPanel);
}

const FEATURED_ROWS = 2;

function featuredCountForWidth(isDesktop: boolean, withPanel: boolean): number {
  if (!isDesktop) return 4;
  return withPanel ? FEATURED_ROWS * 3 : FEATURED_ROWS * 4;
}

export default function GrillaAdisos({
  adisos,
  onAbrirAdiso,
  adisoSeleccionadoId,
  espacioAdicional: _espacioAdicional = 0,
  cargandoMas = false,
  sentinelRef,
  vista = 'grid',
  withPanel = false,
}: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const impressedRef = useRef<Set<string>>(new Set());
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();
  const standardClass = grillaClassName(vista, withPanel);
  const featuredClass = marketplaceFeaturedGridClass(withPanel);
  const featuredCount =
    vista === 'grid' ? featuredCountForWidth(isDesktop, withPanel) : 0;
  const featuredAdisos = vista === 'grid' ? adisos.slice(0, featuredCount) : [];
  const restAdisos = vista === 'grid' ? adisos.slice(featuredCount) : adisos;

  const handleClickAdiso = (adiso: Adiso) => {
    registrarClick(user?.id, adiso.id, adiso.categoria);
    onAbrirAdiso(adiso);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute('data-adiso-id');
          if (!id || impressedRef.current.has(id)) continue;
          impressedRef.current.add(id);
          const adiso = adisos.find((a) => a.id === id);
          trackEvent('ad.impression', {
            entityType: 'adiso',
            entityId: id,
            payload: { categoria: adiso?.categoria, vista },
            userId: user?.id,
          });
        }
      },
      { threshold: 0.6, rootMargin: '0px' }
    );

    for (const id of Object.keys(adisoRefs.current)) {
      const el = adisoRefs.current[id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [adisos, user?.id, vista]);

  useEffect(() => {
    if (!adisoSeleccionadoId) return;
    const elemento = adisoRefs.current[adisoSeleccionadoId];
    if (!elemento || isElementInViewport(elemento)) return;

    const timer = setTimeout(() => {
      elemento.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [adisoSeleccionadoId]);

  const renderCard = (adiso: Adiso) => (
    <div
      key={adiso.id}
      ref={(el) => {
        adisoRefs.current[adiso.id] = el;
      }}
      data-adiso-id={adiso.id}
      className={vista === 'grid' ? 'h-full min-w-[156px]' : undefined}
    >
      <AdisoCard
        adiso={adiso}
        onClick={() => handleClickAdiso(adiso)}
        estaSeleccionado={adisoSeleccionadoId === adiso.id}
        vista={vista}
      />
    </div>
  );

  return (
    <>
      {featuredAdisos.length > 0 && (
        <div className={featuredClass}>{featuredAdisos.map(renderCard)}</div>
      )}
      {restAdisos.length > 0 && (
        <div
          className={`${standardClass}${featuredAdisos.length > 0 ? ' mt-3 md:mt-4' : ''}`}
        >
          {restAdisos.map(renderCard)}
        </div>
      )}

      {cargandoMas && (
        <div className={`${standardClass} mt-3`} aria-hidden="true">
          {Array.from({ length: isDesktop ? 4 : 2 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))}
        </div>
      )}

      {sentinelRef && (
        <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />
      )}
    </>
  );
}
