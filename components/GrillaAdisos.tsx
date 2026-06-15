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
}

function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top >= 0 && rect.bottom <= vh;
}

export default function GrillaAdisos({
  adisos,
  onAbrirAdiso,
  adisoSeleccionadoId,
  espacioAdicional = 0,
  cargandoMas = false,
  sentinelRef,
  vista = 'grid',
}: GrillaAdisosProps) {
  const adisoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const impressedRef = useRef<Set<string>>(new Set());
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user } = useAuth();
  const columnMin = espacioAdicional > 0 ? 240 : 200;

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
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [adisoSeleccionadoId]);

  return (
    <>
      <style jsx>{`
        .grilla-adisos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3, 12px);
          grid-auto-rows: auto;
        }

        .grilla-adisos.vista-list {
          grid-template-columns: 1fr !important;
          gap: var(--space-4, 16px);
        }

        .grilla-adisos.vista-feed {
          grid-template-columns: 1fr !important;
          gap: var(--space-6, 24px);
          max-width: 480px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .grilla-adisos {
            grid-template-columns: repeat(auto-fill, minmax(${columnMin}px, 1fr));
            gap: var(--space-4, 16px);
          }
        }
      `}</style>

      <div className={`grilla-adisos vista-${vista}`}>
        {adisos.map((adiso) => (
          <div
            key={adiso.id}
            ref={(el) => {
              adisoRefs.current[adiso.id] = el;
            }}
            data-adiso-id={adiso.id}
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
        <div
          className={`grilla-adisos vista-${vista}`}
          style={{ marginTop: 'var(--space-3, 12px)' }}
          aria-hidden="true"
        >
          {Array.from({ length: isDesktop ? 4 : 2 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))}
        </div>
      )}

      {sentinelRef && <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />}
    </>
  );
}
