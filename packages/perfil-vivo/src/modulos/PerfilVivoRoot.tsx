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
        Perfil del negocio
        {fecha ? ` · Actualizado ${fecha}` : ''}
      </p>
    </footer>
  );
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
      ? 'Agendar por WhatsApp'
      : negocio.arquetipo === 'comida'
        ? 'Pedir por WhatsApp'
        : 'Escribir por WhatsApp';

  return (
    <div
      ref={rootRef}
      className="pv-root"
      data-theme={modo === 'dark' ? 'dark' : 'light'}
      data-arquetipo={negocio.arquetipo}
      data-visual="3"
      style={style}
    >
      <PerfilProvider value={{ payload, handoffs }}>
        <ChromeUIProvider>
          <ChromeSuperior />
          <Suspense fallback={null}>
            <BarraSecciones />
          </Suspense>
          <RenderizadorModulos />
          <PieDeConfianza actualizadoEn={negocio.actualizadoEn} />
          <BarraAccion label={primaryLabel} />
        </ChromeUIProvider>
      </PerfilProvider>
    </div>
  );
}
