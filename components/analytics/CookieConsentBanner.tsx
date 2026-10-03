'use client';

import { useEffect, useState } from 'react';
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
 * Banner persistente hasta "Aceptar todo" (analytics on).
 * "Solo esenciales" guarda preferencia pero el banner vuelve en la siguiente visita.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

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

  const applyConsent = (consent: ConsentState) => {
    if (consent.analytics === true) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setShowCustomize(false);
  };

  if (!visible) return null;

  const primaryBtn =
    'w-full sm:w-auto rounded-xl bg-[#00B5C8] px-6 py-3 text-base font-bold text-white shadow-md shadow-[#00B5C8]/30 transition hover:bg-[#009aae] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B5C8] focus-visible:ring-offset-2';

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-slate-200/80 bg-white/98 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md md:bottom-4 md:left-4 md:right-auto md:max-w-lg md:rounded-2xl md:border"
    >
      {!showCustomize ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Cookies y medición</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Ayúdanos a mejorar Buscadis permitiendo analítica anónima (GA4, rendimiento). Las
              esenciales siempre están activas.{' '}
              <Link href="/privacidad" className="font-medium text-[#007a8a] underline">
                Privacidad
              </Link>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={() => applyConsent(acceptAllConsent())} className={primaryBtn}>
              Aceptar y continuar
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="text-center text-xs text-slate-500 underline underline-offset-2 sm:ml-2"
            >
              Configurar o rechazar analítica
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Configuración detallada</p>
          <p className="text-xs text-slate-500">
            Desmarca analítica y marketing si no deseas medición. Tendrás que confirmar abajo.
          </p>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked disabled className="mt-1" />
            <span>
              <strong>Esenciales</strong> — sesión, seguridad (obligatorias).
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>Analítica</strong> — Google Analytics, Clarity.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>Marketing</strong> — atribución de campañas / píxeles de negocio.
            </span>
          </label>
          <div className="flex flex-col gap-2 pt-1">
            {analytics ? (
              <button
                type="button"
                onClick={() => applyConsent(acceptAllConsent())}
                className={primaryBtn}
              >
                Guardar y aceptar medición
              </button>
            ) : (
              <button
                type="button"
                onClick={() => applyConsent(saveConsent({ analytics: false, marketing: false }))}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                Solo esenciales (sin analítica)
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCustomize(false)}
              className="text-xs text-slate-500 underline"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
