'use client';

import { usePerfil } from './PerfilContext';
import { useChromeUI } from './ChromeUIContext';

function IconShare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 5l7 7-7 7M21 12H9M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 12C19 16.5 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BarraAccion({ label }: { label: string }) {
  const { handoffs } = usePerfil();
  const { openMas } = useChromeUI();
  const href = handoffs.whatsappPrimary;

  return (
    <div className="pv-barra-accion">
      <button
        type="button"
        className="pv-barra-accion__icon"
        aria-label="Guardar en favoritos"
        onClick={() => {
          /* favoritos: UI feedback only until account hook exists */
        }}
      >
        <IconHeart />
      </button>
      {href ? (
        <a href={href} className="pv-barra-accion__primary">
          {label}
        </a>
      ) : (
        <button type="button" className="pv-barra-accion__primary" disabled>
          {label}
        </button>
      )}
      <button
        type="button"
        className="pv-barra-accion__icon"
        aria-label="Compartir y más opciones"
        onClick={openMas}
      >
        <IconShare />
      </button>
    </div>
  );
}
