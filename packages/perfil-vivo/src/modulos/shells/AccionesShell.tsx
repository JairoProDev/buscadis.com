'use client';

import type { CSSProperties, ReactNode } from 'react';
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
      <path
        d="M4 7h16v2H4V7zm0 4h10v2H4v-2zm0 4h16v2H4v-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconWa() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm0 2a7 7 0 0 1 5.9 10.7l-.3.4.7 2.5-2.5-.7-.4.2A7 7 0 1 1 12 5zm4 8.2c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1-.5-.2-1.5-.9-2.2-1.7-.5-.6-.9-1.3-1-1.5-.1-.2 0-.3.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 2.3.9 2.3.6 2.7.6.4 0 1.3-.5 1.5-1 .2-.5.2-.9.1-1 0-.1-.2-.1-.4-.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function QuickAction({
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
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 44,
    gap: 4,
    textDecoration: 'none',
    color: 'var(--tx-base)',
    font: 'var(--ts-etiqueta)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    opacity: disabled ? 0.45 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  };
  const iconBox: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 'var(--rd-md)',
    border: '1px solid var(--bd-soft)',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--mk-texto)',
    background: 'var(--sf-elev)',
  };
  if (!href || disabled) {
    return (
      <span style={style} aria-disabled>
        <span style={{ ...iconBox, color: 'var(--tx-faint)' }}>{icon}</span>
        {label}
      </span>
    );
  }
  return (
    <a href={href} style={style}>
      <span style={iconBox}>{icon}</span>
      {label}
    </a>
  );
}

export function AccionesShell() {
  const { handoffs, payload } = usePerfil();
  const cerrado = !payload.estadoVivo.abierto;
  const arq = payload.negocio.arquetipo;
  const esCita = arq === 'cita' || arq === 'profesional';
  const esComida = arq === 'comida';
  const listaHref = esCita ? '#servicios' : '#catalogo';
  const listaLabel = esCita ? 'Servicios' : esComida ? 'Carta' : 'Catálogo';
  const waLabel = esCita
    ? 'Agendar'
    : esComida
      ? cerrado
        ? 'Pedir'
        : 'Pedir'
      : cerrado
        ? 'Escribir'
        : 'WhatsApp';

  return (
    <section className="pv-modulo" id="acciones" aria-label="Acciones rápidas">
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <QuickAction
          href={handoffs.llamada}
          label="Llamar"
          icon={<IconPhone />}
          disabled={!handoffs.llamada}
        />
        <QuickAction
          href={handoffs.ruta}
          label="Cómo llegar"
          icon={<IconPin />}
          disabled={!handoffs.ruta}
        />
        <QuickAction href={listaHref} label={listaLabel} icon={<IconBag />} />
        {handoffs.whatsappPrimary ? (
          <QuickAction href={handoffs.whatsappPrimary} label={waLabel} icon={<IconWa />} />
        ) : (
          <QuickAction href={null} label={waLabel} icon={<IconWa />} disabled />
        )}
      </div>
    </section>
  );
}
