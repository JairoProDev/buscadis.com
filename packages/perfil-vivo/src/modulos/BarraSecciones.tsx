'use client';

import { useEffect, useState } from 'react';
import { usePerfil } from './PerfilContext';
import { resolverModulos } from './resolver';

/**
 * Barra sticky de secciones (04): aparece cuando el hero sale del viewport.
 */
export function BarraSecciones() {
  const { payload } = usePerfil();
  const modulos = resolverModulos(payload.negocio).filter(
    (m) => !['hero', 'metricas', 'estado', 'acciones'].includes(m.tipo)
  );
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>('');
  const anclas = modulos.map((m) => m.ancla).join('|');

  useEffect(() => {
    const hero = document.getElementById('identidad');
    if (!hero || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-8px 0px 0px 0px' }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const ids = anclas.split('|').filter(Boolean);
    if (!ids.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const on = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (on?.target?.id) setActive(on.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [anclas]);

  if (!visible || modulos.length < 2) return null;

  return (
    <nav
      aria-label="Secciones del perfil"
      className="pv-barra-secciones"
    >
      <div className="pv-barra-secciones__scroller">
        {modulos.map((m) => {
          const isActive = active === m.ancla;
          return (
            <a
              key={m.tipo}
              href={`#${m.ancla}`}
              className={`pv-barra-secciones__chip${isActive ? ' is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(m.ancla)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', `#${m.ancla}`);
              }}
            >
              {m.titulo}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
