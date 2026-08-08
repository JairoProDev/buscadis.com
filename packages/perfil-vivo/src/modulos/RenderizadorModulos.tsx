import type { Negocio } from '../types';
import { getModuloComponent } from './registry';
import { resolverModulos } from './resolver';

export function RenderizadorModulos({ negocio }: { negocio: Negocio }) {
  const modulos = resolverModulos(negocio);

  return (
    <div className="pv-stack">
      {modulos.map((m) => {
        const Comp = getModuloComponent(m.tipo);
        if (!Comp) return null;
        return <Comp key={m.tipo} negocio={negocio} modulo={m} />;
      })}
    </div>
  );
}
