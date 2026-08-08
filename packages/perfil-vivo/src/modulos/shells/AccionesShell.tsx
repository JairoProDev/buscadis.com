'use client';

import type { ReactNode } from 'react';
import { usePerfil } from '../PerfilContext';

function IconPhone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16v2H4V7zm0 4h10v2H4v-2zm0 4h16v2H4v-2z" fill="currentColor" />
    </svg>
  );
}

function GridAction({
  href,
  label,
  icon,
  disabled,
}: {
  href: string | null;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}) {
  const body = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );
  if (!href || disabled) {
    return (
      <span className="pv-acciones-grid__btn" aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <a href={href} className="pv-acciones-grid__btn">
      {body}
    </a>
  );
}

/**
 * Hybrid 3.0 — 3 atajos (Llamar | Lista | Llegar).
 * WhatsApp vive solo en la barra sticky (D2: una primaria).
 */
export function AccionesShell() {
  const { handoffs, payload } = usePerfil();
  const arq = payload.negocio.arquetipo;
  const esCita = arq === 'cita' || arq === 'profesional';
  const esComida = arq === 'comida';
  const listaHref = esCita ? '#servicios' : '#catalogo';
  const listaLabel = esCita ? 'Servicios' : esComida ? 'Carta' : 'Catálogo';

  return (
    <section className="pv-modulo" id="acciones" aria-label="Contactar">
      <div className="pv-acciones-grid pv-acciones-grid--3">
        <GridAction
          href={handoffs.llamada}
          label="Llamar"
          icon={<IconPhone />}
          disabled={!handoffs.llamada}
        />
        <GridAction href={listaHref} label={listaLabel} icon={<IconBag />} />
        <GridAction
          href={handoffs.ruta}
          label="Llegar"
          icon={<IconPin />}
          disabled={!handoffs.ruta}
        />
      </div>
    </section>
  );
}
