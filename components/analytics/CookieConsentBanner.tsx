'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  acceptAllConsent,
  acceptEssentialOnly,
  getConsent,
  saveConsent,
  type ConsentState,
} from '@/lib/analytics/consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  const applyConsent = (consent: ConsentState) => {
    setVisible(false);
    setShowCustomize(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border"
    >
      {!showCustomize ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Usamos cookies esenciales para el funcionamiento del sitio y, con tu permiso, herramientas de
            analítica para mejorar Buscadis.{' '}
            <Link href="/privacidad" className="font-medium text-blue-700 underline">
              Política de privacidad
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyConsent(acceptAllConsent())}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Aceptar todo
            </button>
            <button
              type="button"
              onClick={() => applyConsent(acceptEssentialOnly())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Solo esenciales
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 underline"
            >
              Personalizar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Personalizar cookies</p>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked disabled className="mt-1" />
            <span>
              <strong>Esenciales</strong> — sesión, seguridad y funcionamiento (siempre activas).
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
              <strong>Analítica</strong> — Google Analytics, Microsoft Clarity (métricas de uso y rendimiento).
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
              <strong>Marketing</strong> — medición de campañas y atribución (futuros píxeles publicitarios).
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyConsent(saveConsent({ analytics, marketing }))}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Guardar preferencias
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize(false)}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 underline"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
