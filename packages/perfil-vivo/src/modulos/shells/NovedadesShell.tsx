'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePerfil } from '../PerfilContext';

const STORY_MS = 4500;

/**
 * Hybrid 3.0 — highlights tempranos + visor tipo story
 * (progress, tap izq/der, CTA WhatsApp). Solo con datos reales.
 */
export function NovedadesShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const items = payload.novedades;
  const [activo, setActivo] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const conFoto = items.filter((n) => n.imagenUrl).slice(0, 8);
  const useRings = conFoto.length >= 2;
  const storyItems = useRings ? conFoto : items.slice(0, 8);
  const current = activo != null ? storyItems[activo] : null;
  const waHref = handoffs.whatsappPrimary;

  const close = useCallback(() => {
    setActivo(null);
    setProgress(0);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      setActivo((i) => {
        if (i == null) return i;
        const next = i + dir;
        if (next < 0 || next >= storyItems.length) {
          setProgress(0);
          return null;
        }
        setProgress(0);
        return next;
      });
    },
    [storyItems.length]
  );

  useEffect(() => {
    if (activo == null) return;
    setProgress(0);
    const start = Date.now();
    const tick = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / STORY_MS);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(tick);
        go(1);
      }
    }, 40);
    return () => window.clearInterval(tick);
  }, [activo, go]);

  useEffect(() => {
    if (activo == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [activo, close, go]);

  if (items.length < 1) return null;

  return (
    <section className="pv-modulo" id="novedades">
      <div className="pv-sec-head">
        <h2 className="pv-sec-head__title">{titulo || 'Novedades'}</h2>
      </div>

      {useRings ? (
        <div className="pv-highlights">
          {conFoto.map((n, i) => {
            const reciente =
              Date.now() - Date.parse(n.publicadaEn) < 72 * 3_600_000;
            return (
              <button
                key={n.id}
                type="button"
                className="pv-highlights__item"
                onClick={() => setActivo(i)}
              >
                <div
                  className={
                    reciente
                      ? 'pv-highlights__ring'
                      : 'pv-highlights__ring pv-highlights__ring--muted'
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.imagenUrl}
                    alt=""
                    width={68}
                    height={68}
                    className="pv-highlights__photo"
                    loading="lazy"
                  />
                </div>
                <p className="pv-highlights__label">{n.titulo}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pv-novedades-rail">
          {items.slice(0, 8).map((n, i) => (
            <button
              key={n.id}
              type="button"
              className="pv-novedades-card"
              onClick={() => setActivo(i)}
            >
              {n.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={n.imagenUrl}
                  alt=""
                  width={204}
                  height={120}
                  loading="lazy"
                  className="pv-novedades-card__img"
                />
              ) : (
                <div className="pv-novedades-card__ph" aria-hidden />
              )}
              <span className="pv-novedades-card__title">{n.titulo}</span>
            </button>
          ))}
        </div>
      )}

      {current && activo != null ? (
        <div className="pv-story" role="dialog" aria-modal="true" aria-label={current.titulo}>
          <div className="pv-story__progress">
            {storyItems.map((_, i) => (
              <div key={i} className="pv-story__bar">
                <div
                  className="pv-story__bar-fill"
                  style={{
                    width:
                      i < activo ? '100%' : i === activo ? `${progress * 100}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          <button type="button" className="pv-story__close" aria-label="Cerrar" onClick={close}>
            ×
          </button>

          <button
            type="button"
            className="pv-story__zone pv-story__zone--prev"
            aria-label="Anterior"
            onClick={() => go(-1)}
          />
          <button
            type="button"
            className="pv-story__zone pv-story__zone--next"
            aria-label="Siguiente"
            onClick={() => go(1)}
          />

          <div className="pv-story__media">
            {current.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.imagenUrl} alt="" className="pv-story__img" />
            ) : (
              <div className="pv-story__ph" />
            )}
          </div>

          <div className="pv-story__footer">
            <p className="pv-story__title">{current.titulo}</p>
            {current.texto ? <p className="pv-story__text">{current.texto}</p> : null}
            {waHref ? (
              <a href={waHref} className="pv-story__cta">
                Escribir por WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
