'use client';

import type { ComponentType } from 'react';
import type { Negocio, TipoModulo } from '../types';
import type { ModuloResuelto } from './resolver';
import { AccionesShell } from './shells/AccionesShell';
import { CanalesShell } from './shells/CanalesShell';
import { CatalogoShell } from './shells/CatalogoShell';
import { EquipoShell } from './shells/EquipoShell';
import { EstadoShell } from './shells/EstadoShell';
import { FaqShell } from './shells/FaqShell';
import { GaleriaShell } from './shells/GaleriaShell';
import { HeroShell } from './shells/HeroShell';
import { MetricasShell } from './shells/MetricasShell';
import { NosotrosShell } from './shells/NosotrosShell';
import { NovedadesShell } from './shells/NovedadesShell';
import { PagoShell } from './shells/PagoShell';
import { PromocionShell } from './shells/PromocionShell';
import { ResenasShell } from './shells/ResenasShell';
import { ServiciosShell } from './shells/ServiciosShell';
import { CategoriasShell } from './shells/CategoriasShell';
import { UbicacionHorarioShell } from './shells/UbicacionHorarioShell';

export type ShellProps = {
  negocio: Negocio;
  modulo: ModuloResuelto;
};

const REGISTRY: Partial<Record<TipoModulo, ComponentType<ShellProps>>> = {
  hero: ({ negocio }) => <HeroShell negocio={negocio} />,
  metricas: () => <MetricasShell />,
  estado: () => <EstadoShell />,
  acciones: () => <AccionesShell />,
  catalogo: ({ modulo }) => <CatalogoShell titulo={modulo.titulo} />,
  categorias: ({ modulo }) => <CategoriasShell titulo={modulo.titulo} />,
  servicios: ({ modulo }) => <ServiciosShell titulo={modulo.titulo} />,
  promocion: ({ modulo }) => <PromocionShell titulo={modulo.titulo} />,
  novedades: ({ modulo }) => <NovedadesShell titulo={modulo.titulo} />,
  resenas: ({ modulo }) => <ResenasShell titulo={modulo.titulo} />,
  ubicacion: () => <UbicacionHorarioShell />,
  horario: () => <UbicacionHorarioShell />,
  pago: () => <PagoShell />,
  canales: () => <CanalesShell />,
  galeria: ({ modulo }) => <GaleriaShell titulo={modulo.titulo} />,
  nosotros: ({ modulo }) => <NosotrosShell titulo={modulo.titulo} />,
  faq: ({ modulo }) => <FaqShell titulo={modulo.titulo} />,
  equipo: ({ modulo }) => <EquipoShell titulo={modulo.titulo} />,
};

export function getModuloComponent(tipo: TipoModulo) {
  return REGISTRY[tipo] ?? null;
}
