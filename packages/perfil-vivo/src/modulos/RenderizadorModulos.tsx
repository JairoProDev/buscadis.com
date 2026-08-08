'use client';

import { getModuloComponent } from './registry';
import { resolverModulos } from './resolver';
import { usePerfil } from './PerfilContext';

export function RenderizadorModulos() {
  const { payload } = usePerfil();
  const modulos = resolverModulos(payload.negocio);

  return (
    <div className="pv-stack">
      {modulos.map((m) => {
        const Comp = getModuloComponent(m.tipo);
        if (!Comp) return null;
        return (
          <Comp key={m.tipo} negocio={payload.negocio} modulo={m} />
        );
      })}
    </div>
  );
}
