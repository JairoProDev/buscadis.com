'use client';

import type { CSSProperties } from 'react';
import type { PerfilPayload } from '../types';
import { derivarTema, temaToStyle } from '../tema/derivar-tema';
import { PerfilProvider, type HandoffLinks } from './PerfilContext';
import { RenderizadorModulos } from './RenderizadorModulos';
import { BarraAccion } from './BarraAccion';
import { BarraSecciones } from './BarraSecciones';

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
      className="pv-root"
      data-theme={modo === 'dark' ? 'dark' : 'light'}
      data-arquetipo={negocio.arquetipo}
      style={style}
    >
      <PerfilProvider value={{ payload, handoffs }}>
        <BarraSecciones />
        <RenderizadorModulos />
        <BarraAccion label={primaryLabel} />
      </PerfilProvider>
    </div>
  );
}
