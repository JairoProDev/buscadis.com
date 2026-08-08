import type { CSSProperties } from 'react';
import type { Negocio } from '../types';
import { derivarTema, temaToStyle } from '../tema/derivar-tema';
import { RenderizadorModulos } from './RenderizadorModulos';

function modoFromIdentidad(
  tema: Negocio['identidad']['tema']
): 'light' | 'dark' {
  if (tema === 'oscuro') return 'dark';
  return 'light';
}

export function PerfilVivoRoot({ negocio }: { negocio: Negocio }) {
  const modo = modoFromIdentidad(negocio.identidad.tema);
  const vars = derivarTema(negocio.identidad.colorSemilla, modo);
  const style = temaToStyle(vars) as CSSProperties;
  const hasWa = Boolean(negocio.contacto.whatsapp);

  return (
    <div
      className="pv-root"
      data-theme={modo === 'dark' ? 'dark' : 'light'}
      data-arquetipo={negocio.arquetipo}
      style={style}
    >
      <RenderizadorModulos negocio={negocio} />
      <div className="pv-barra-accion">
        <button
          type="button"
          className="pv-barra-accion__primary"
          disabled={!hasWa}
        >
          Escribir por WhatsApp
        </button>
      </div>
    </div>
  );
}
