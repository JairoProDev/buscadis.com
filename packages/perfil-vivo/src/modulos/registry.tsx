import type { ComponentType } from 'react';
import type { Negocio, TipoModulo } from '../types';
import type { ModuloResuelto } from './resolver';
import { AccionesShell } from './shells/AccionesShell';
import { CatalogoShell } from './shells/CatalogoShell';
import { EstadoShell } from './shells/EstadoShell';
import { HeroShell } from './shells/HeroShell';
import { MetricasShell } from './shells/MetricasShell';

type ShellProps = { negocio: Negocio; modulo: ModuloResuelto };

const REGISTRY: Partial<
  Record<TipoModulo, ComponentType<ShellProps>>
> = {
  hero: ({ negocio }) => <HeroShell negocio={negocio} />,
  metricas: ({ negocio }) => <MetricasShell negocio={negocio} />,
  estado: () => <EstadoShell />,
  acciones: ({ negocio }) => <AccionesShell negocio={negocio} />,
  catalogo: ({ modulo }) => <CatalogoShell titulo={modulo.titulo} />,
};

export function getModuloComponent(tipo: TipoModulo) {
  return REGISTRY[tipo] ?? null;
}
