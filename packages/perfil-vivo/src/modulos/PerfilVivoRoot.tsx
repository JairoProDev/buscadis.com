'use client';

import { lazy, Suspense, useRef, type CSSProperties } from 'react';
import type { PerfilPayload } from '../types';
import { derivarTema, temaToStyle } from '../tema/derivar-tema';
import { usePerfilFonts } from '../tema/load-fonts';
import { PerfilProvider, type HandoffLinks } from './PerfilContext';
import { ChromeUIProvider } from './ChromeUIContext';
import { RenderizadorModulos } from './RenderizadorModulos';
import { BarraAccion } from './BarraAccion';
import { ChromeSuperior } from './ChromeSuperior';
import { PvCartProvider } from '../commerce/CartContext';
import { PvCartDrawer } from '../commerce/CartDrawer';

const BarraSecciones = lazy(() =>
  import('./BarraSecciones').then((m) => ({ default: m.BarraSecciones }))
);

function modoFromIdentidad(
  tema: PerfilPayload['negocio']['identidad']['tema']
): 'light' | 'dark' {
  if (tema === 'oscuro') return 'dark';
  return 'light';
}

function formatActualizado(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function PieDeConfianza({ actualizadoEn }: { actualizadoEn: string }) {
  const fecha = formatActualizado(actualizadoEn);
  return (
    <footer className="pv-pie" id="pie-confianza">
      <p className="pv-pie__brand">Buscadis</p>
      <p className="pv-pie__meta">
        Vitrina del centro comercial digital
        {fecha ? ` · Actualizado ${fecha}` : ''}
      </p>
    </footer>
  );
}

function stickyLabel(arquetipo: PerfilPayload['negocio']['arquetipo']): string {
  switch (arquetipo) {
    case 'cita':
    case 'profesional':
      return 'Agendar por WhatsApp';
    case 'comida':
      return 'Pedir por WhatsApp';
    case 'alto_ticket':
      return 'Cotizar por WhatsApp';
    default:
      return 'Consultar por WhatsApp';
  }
}

export function PerfilVivoRoot({
  payload,
  handoffs,
}: {
  payload: PerfilPayload;
  handoffs: HandoffLinks;
}) {
  const { negocio } = payload;
  const modo = modoFromIdentidad(negocio.identidad.tema);
  const vars = derivarTema(negocio.identidad.colorSemilla, modo);
  const style = temaToStyle(vars) as CSSProperties;
  const rootRef = useRef<HTMLDivElement>(null);
  usePerfilFonts(rootRef);

  return (
    <div
      ref={rootRef}
      className="pv-root"
      data-theme={modo === 'dark' ? 'dark' : 'light'}
      data-arquetipo={negocio.arquetipo}
      data-visual="3"
      data-commerce="1"
      style={style}
    >
      <PerfilProvider value={{ payload, handoffs }}>
        <PvCartProvider businessId={negocio.id}>
          <ChromeUIProvider>
            <ChromeSuperior />
            <Suspense fallback={null}>
              <BarraSecciones />
            </Suspense>
            <RenderizadorModulos />
            <PieDeConfianza actualizadoEn={negocio.actualizadoEn} />
            <BarraAccion label={stickyLabel(negocio.arquetipo)} />
            <PvCartDrawer />
          </ChromeUIProvider>
        </PvCartProvider>
      </PerfilProvider>
    </div>
  );
}
