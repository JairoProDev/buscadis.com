'use client';

import { lazy, Suspense, useRef, type CSSProperties } from 'react';
import type { PerfilPayload } from '../types';
import { derivarTema, temaToStyle } from '../tema/derivar-tema';
import { usePerfilFonts } from '../tema/load-fonts';
import { PerfilProvider, type HandoffLinks } from './PerfilContext';
import { RenderizadorModulos } from './RenderizadorModulos';
import { BarraAccion } from './BarraAccion';

const BarraSecciones = lazy(() =>
  import('./BarraSecciones').then((m) => ({ default: m.BarraSecciones }))
);

function modoFromIdentidad(
  tema: PerfilPayload['negocio']['identidad']['tema']
): 'light' | 'dark' {
  if (tema === 'oscuro') return 'dark';
  return 'light';
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

  const primaryLabel =
    negocio.arquetipo === 'cita' || negocio.arquetipo === 'profesional'
      ? payload.estadoVivo.abierto
        ? 'Agendar por WhatsApp'
        : 'Agendar (responden al abrir)'
      : negocio.arquetipo === 'comida'
        ? payload.estadoVivo.abierto
          ? 'Pedir por WhatsApp'
          : 'Pedir (responden al abrir)'
        : payload.estadoVivo.abierto
          ? 'Escribir por WhatsApp'
          : 'Escribir (responden al abrir)';

  return (
    <div
      ref={rootRef}
      className="pv-root"
      data-theme={modo === 'dark' ? 'dark' : 'light'}
      data-arquetipo={negocio.arquetipo}
      data-visual="2"
      style={style}
    >
      <PerfilProvider value={{ payload, handoffs }}>
        <Suspense fallback={null}>
          <BarraSecciones />
        </Suspense>
        <RenderizadorModulos />
        <BarraAccion label={primaryLabel} />
      </PerfilProvider>
    </div>
  );
}
