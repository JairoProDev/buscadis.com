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

function grillaClassName(vista: 'grid' | 'list' | 'feed', withPanel: boolean): string {
  if (vista === 'list') {
    return 'grid grid-cols-1 gap-4';
  }
  if (vista === 'feed') {
    return 'mx-auto grid max-w-[480px] grid-cols-1 gap-6';
  }
  // Doc 09: 2 → 3 → 4 → 5 (or 4 with panel); gaps 12/16/20
  return [
    'grid grid-cols-2 gap-3 min-[480px]:gap-4',
    'md:grid-cols-3 md:gap-4',
    'lg:grid-cols-4',
    withPanel ? 'xl:grid-cols-4 xl:gap-5' : 'xl:grid-cols-5 xl:gap-5',
  ].join(' ');
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
  const layoutClass = grillaClassName(vista, withPanel);

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

  return (
    <>
      <div className={layoutClass}>
        {adisos.map((adiso) => (
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
        ))}
      </div>

      {cargandoMas && (
        <div className={`${layoutClass} mt-3`} aria-hidden="true">
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
