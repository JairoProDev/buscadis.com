'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  acceptAllConsent,
  getConsent,
  hasAnalyticsConsent,
  saveConsent,
  type ConsentState,
} from '@/lib/analytics/consent';
import { isBuscadisNativeApp } from '@/lib/mobile-app-bridge';

/**
 * Maximiza aceptación de medición: un CTA principal claro; rechazo solo tras flujo en "Preferencias".
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customizeStep, setCustomizeStep] = useState(1);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [rejectConfirmed, setRejectConfirmed] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isBuscadisNativeApp()) {
      setVisible(false);
      return;
    }
    setVisible(!hasAnalyticsConsent());
    const consent = getConsent();
    if (consent) {
      setAnalytics(Boolean(consent.analytics));
      setMarketing(Boolean(consent.marketing));
    }
  }, []);

  useEffect(() => {
    if (!visible || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    if (visible && !showCustomize) {
      primaryRef.current?.focus();
    }
  }, [visible, showCustomize]);

  const applyConsent = (consent: ConsentState) => {
    if (consent.analytics === true) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setShowCustomize(false);
    setCustomizeStep(1);
    setRejectConfirmed(false);
  };

  const openPreferences = () => {
    setAnalytics(true);
    setMarketing(true);
    setRejectConfirmed(false);
    setCustomizeStep(1);
    setShowCustomize(true);
  };

  const saveCustomPreferences = () => {
    if (analytics) {
      applyConsent(
        saveConsent({
          analytics: true,
          marketing: marketing,
        }),
      );
      return;
    }
    if (!rejectConfirmed) return;
    applyConsent(saveConsent({ analytics: false, marketing: false }));
  };

  if (!visible) return null;

  const primaryBtn =
    'w-full rounded-xl bg-[#00B5C8] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-[#00B5C8]/35 transition hover:bg-[#009aae] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B5C8] focus-visible:ring-offset-2';

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-[1px]"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        className="fixed inset-x-0 bottom-0 z-[9999] border-t border-slate-200 bg-white p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] md:bottom-6 md:left-6 md:right-6 md:mx-auto md:max-w-xl md:rounded-2xl md:border"
      >
        {!showCustomize ? (
          <div className="space-y-4">
            <div>
              <p id="cookie-consent-title" className="text-base font-bold text-slate-900">
                Mejor Buscadis para ti
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Con medición anónima (Google Analytics y rendimiento) entendemos qué buscas, qué
                falla y qué mejorar — sin cambiar cómo usas el sitio. Las cookies esenciales ya
                funcionan; un toque activa la analítica que nos ayuda a darte un producto mejor.{' '}
                <Link href="/privacidad" className="font-medium text-[#007a8a] underline">
                  Privacidad
                </Link>
              </p>
            </div>
            <button
              ref={primaryRef}
              type="button"
              onClick={() => applyConsent(acceptAllConsent())}
              className={primaryBtn}
            >
              Aceptar todo y continuar
            </button>
            <p className="text-center text-[11px] leading-snug text-slate-400">
              <button
                type="button"
                onClick={openPreferences}
                className="underline underline-offset-2 hover:text-slate-600"
              >
                Preferencias de cookies
              </button>
              {' '}
              (desactivar categorías paso a paso)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-900">
              Preferencias · paso {customizeStep} de 3
            </p>

            {customizeStep === 1 && (
              <>
                <p className="text-sm text-slate-600">
                  Usamos datos agregados para mejorar búsquedas, velocidad y funciones. No vendemos
                  tu información personal. Puedes dejar todo activado (recomendado) o seguir para
                  ajustar categorías.
                </p>
                <button type="button" onClick={() => applyConsent(acceptAllConsent())} className={primaryBtn}>
                  Dejar todo activado
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeStep(2)}
                  className="w-full text-center text-xs text-slate-500 underline underline-offset-2"
                >
                  Siguiente: elegir categorías
                </button>
              </>
            )}

            {customizeStep === 2 && (
              <>
                <label className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                  <input type="checkbox" checked disabled className="mt-0.5" />
                  <span>
                    <strong>Esenciales</strong> — sesión, seguridad, login (siempre activas).
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Analítica</strong> — GA4, Vercel Speed Insights, mejora del producto.
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-0.5"
                    disabled={!analytics}
                  />
                  <span>
                    <strong>Marketing</strong> — medir campañas y anuncios (requiere analítica).
                  </span>
                </label>
                {!analytics && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    Sin analítica no podremos ver errores ni uso real para mejorar Buscadis.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!analytics) setMarketing(false);
                    setCustomizeStep(3);
                  }}
                  className={primaryBtn}
                >
                  Revisar y confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeStep(1)}
                  className="w-full text-xs text-slate-500 underline"
                >
                  Atrás
                </button>
              </>
            )}

            {customizeStep === 3 && (
              <>
                {analytics ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Guardarás: esenciales + analítica{marketing ? ' + marketing' : ''}.
                    </p>
                    <button type="button" onClick={saveCustomPreferences} className={primaryBtn}>
                      Guardar preferencias
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Solo quedarán cookies esenciales. El banner volverá en tu próxima visita si
                      quieres activar la medición más adelante.
                    </p>
                    <label className="flex items-start gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={rejectConfirmed}
                        onChange={(e) => setRejectConfirmed(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Entiendo que rechazo analítica y marketing y que Buscadis no podrá usar
                        esos datos para mejorar el servicio.
                      </span>
                    </label>
                    <button
                      type="button"
                      disabled={!rejectConfirmed}
                      onClick={saveCustomPreferences}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-40"
                    >
                      Guardar solo esenciales
                    </button>
                    <button
                      type="button"
                      onClick={() => applyConsent(acceptAllConsent())}
                      className={primaryBtn}
                    >
                      Mejor activo todo — un toque
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setCustomizeStep(2)}
                  className="w-full text-xs text-slate-500 underline"
                >
                  Atrás
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setShowCustomize(false);
                setCustomizeStep(1);
                setRejectConfirmed(false);
              }}
              className="w-full text-center text-[11px] text-slate-400 underline"
            >
              Cerrar preferencias
            </button>
          </div>
        )}
      </div>
    </>
  );
}
