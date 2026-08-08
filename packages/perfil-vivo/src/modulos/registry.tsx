'use client';

import type { ComponentType } from 'react';
import type { Negocio, TipoModulo } from '../types';
import type { ModuloResuelto } from './resolver';
import { AccionesShell } from './shells/AccionesShell';
import { CatalogoShell } from './shells/CatalogoShell';
import { CategoriasShell } from './shells/CategoriasShell';
import { EstadoShell } from './shells/EstadoShell';
import { HeroShell } from './shells/HeroShell';
import { MetricasShell } from './shells/MetricasShell';
import { NovedadesShell } from './shells/NovedadesShell';
import { ServiciosShell } from './shells/ServiciosShell';

export type ShellProps = {
  negocio: Negocio;
  modulo: ModuloResuelto;
};

/** Solo módulos above-the-fold (ruta crítica JS). El resto va lazy en RenderizadorModulos. */
const REGISTRY: Partial<Record<TipoModulo, ComponentType<ShellProps>>> = {
  hero: ({ negocio }) => <HeroShell negocio={negocio} />,
  metricas: () => <MetricasShell />,
  estado: () => <EstadoShell />,
  acciones: () => <AccionesShell />,
  novedades: ({ modulo }) => <NovedadesShell titulo={modulo.titulo} />,
  catalogo: ({ modulo }) => <CatalogoShell titulo={modulo.titulo} />,
  categorias: ({ modulo }) => <CategoriasShell titulo={modulo.titulo} />,
  servicios: ({ modulo }) => <ServiciosShell titulo={modulo.titulo} />,
};

export function getModuloComponent(tipo: TipoModulo) {
  return REGISTRY[tipo] ?? null;
}
