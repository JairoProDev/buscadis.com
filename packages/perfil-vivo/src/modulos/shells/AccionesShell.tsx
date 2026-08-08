'use client';

import type { ReactNode } from 'react';
import { usePerfil } from '../PerfilContext';

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16v2H4V7zm0 4h10v2H4v-2zm0 4h16v2H4v-2z" fill="currentColor" />
    </svg>
  );
}

function IconWa() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm0 2a7 7 0 0 1 5.9 10.7l-.3.4.7 2.5-2.5-.7-.4.2A7 7 0 1 1 12 5zm4 8.2c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1-.5-.2-1.5-.9-2.2-1.7-.5-.6-.9-1.3-1-1.5-.1-.2 0-.3.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 2.3.9 2.3.6 2.7.6.4 0 1.3-.5 1.5-1 .2-.5.2-.9.1-1 0-.1-.2-.1-.4-.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function CtaButton({
  href,
  label,
  icon,
  variant,
  disabled,
}: {
  href: string | null;
  label: string;
  icon: ReactNode;
  variant: 'wa' | 'call' | 'ruta';
  disabled?: boolean;
}) {
  const cls = `pv-acciones-cta__btn pv-acciones-cta__btn--${variant}`;
  const body = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );
  if (!href || disabled) {
    return (
      <span className={cls} aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <a href={href} className={cls}>
      {body}
    </a>
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
  const body = (
    <>
      <span className="pv-acciones__icon">{icon}</span>
      <span>{label}</span>
    </>
  );
  if (!href || disabled) {
    return (
      <span className="pv-acciones__item" aria-disabled="true">
        {body}
      </span>
    );
  }
  return (
    <a href={href} className="pv-acciones__item">
      {body}
    </a>
  );
}

export function AccionesShell() {
  const { handoffs, payload } = usePerfil();
  const arq = payload.negocio.arquetipo;
  const esCita = arq === 'cita' || arq === 'profesional';
  const esComida = arq === 'comida';
  const listaHref = esCita ? '#servicios' : '#catalogo';
  const listaLabel = esCita ? 'Servicios' : esComida ? 'Carta' : 'Catálogo';
  const waLabel = esCita ? 'Agendar' : esComida ? 'Pedir' : 'WhatsApp';

  return (
    <section className="pv-modulo" id="acciones" aria-label="Acciones rápidas">
      <div className="pv-acciones-cta">
        <CtaButton
          href={handoffs.whatsappPrimary}
          label={waLabel}
          icon={<IconWa />}
          variant="wa"
          disabled={!handoffs.whatsappPrimary}
        />
        <CtaButton
          href={handoffs.llamada}
          label="Llamar"
          icon={<IconPhone />}
          variant="call"
          disabled={!handoffs.llamada}
        />
        <CtaButton
          href={handoffs.ruta}
          label="Llegar"
          icon={<IconPin />}
          variant="ruta"
          disabled={!handoffs.ruta}
        />
      </div>
      <div className="pv-acciones">
        <QuickAction href={listaHref} label={listaLabel} icon={<IconBag />} />
        <QuickAction
          href={handoffs.whatsappPrimary}
          label={esCita ? 'Cotizar' : 'Escribir'}
          icon={<IconWa />}
          disabled={!handoffs.whatsappPrimary}
        />
      </div>
    </section>
  );
}
