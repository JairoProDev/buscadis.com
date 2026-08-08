'use client';

import { Suspense, lazy, type ComponentType } from 'react';
import type { Negocio, TipoModulo } from '../types';
import type { ModuloResuelto } from './resolver';
import { getModuloComponent } from './registry';
import { resolverModulos } from './resolver';
import { usePerfil } from './PerfilContext';

/** Encima del pliegue: bundle eager. Resto: lazy + content-visibility. */
const EAGER: ReadonlySet<TipoModulo> = new Set([
  'hero',
  'metricas',
  'estado',
  'acciones',
  'catalogo',
  'servicios',
  'categorias',
]);

const LAZY_LOADERS: Partial<
  Record<TipoModulo, () => Promise<{ default: ComponentType<{ negocio: Negocio; modulo: ModuloResuelto }> }>>
> = {
  promocion: () =>
    import('./shells/PromocionShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.PromocionShell titulo={modulo.titulo} />
      ),
    })),
  novedades: () =>
    import('./shells/NovedadesShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.NovedadesShell titulo={modulo.titulo} />
      ),
    })),
  resenas: () =>
    import('./shells/ResenasShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.ResenasShell titulo={modulo.titulo} />
      ),
    })),
  ubicacion: () =>
    import('./shells/UbicacionHorarioShell').then((m) => ({
      default: () => <m.UbicacionHorarioShell />,
    })),
  horario: () =>
    import('./shells/UbicacionHorarioShell').then((m) => ({
      default: () => <m.UbicacionHorarioShell />,
    })),
  pago: () =>
    import('./shells/PagoShell').then((m) => ({
      default: () => <m.PagoShell />,
    })),
  canales: () =>
    import('./shells/CanalesShell').then((m) => ({
      default: () => <m.CanalesShell />,
    })),
  galeria: () =>
    import('./shells/GaleriaShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.GaleriaShell titulo={modulo.titulo} />
      ),
    })),
  nosotros: () =>
    import('./shells/NosotrosShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.NosotrosShell titulo={modulo.titulo} />
      ),
    })),
  faq: () =>
    import('./shells/FaqShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.FaqShell titulo={modulo.titulo} />
      ),
    })),
  equipo: () =>
    import('./shells/EquipoShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.EquipoShell titulo={modulo.titulo} />
      ),
    })),
  certificaciones: () =>
    import('./shells/CertificacionesShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.CertificacionesShell titulo={modulo.titulo} />
      ),
    })),
  publicaciones: () =>
    import('./shells/PublicacionesShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.PublicacionesShell titulo={modulo.titulo} />
      ),
    })),
  documentos: () =>
    import('./shells/DocumentosShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.DocumentosShell titulo={modulo.titulo} />
      ),
    })),
  ia: () =>
    import('./shells/IaShell').then((m) => ({
      default: ({ modulo }: { negocio: Negocio; modulo: ModuloResuelto }) => (
        <m.IaShell titulo={modulo.titulo} />
      ),
    })),
};

const lazyCache = new Map<
  TipoModulo,
  ComponentType<{ negocio: Negocio; modulo: ModuloResuelto }>
>();

function getLazyComp(tipo: TipoModulo) {
  const loader = LAZY_LOADERS[tipo];
  if (!loader) return null;
  let Comp = lazyCache.get(tipo);
  if (!Comp) {
    Comp = lazy(loader);
    lazyCache.set(tipo, Comp);
  }
  return Comp;
}

export function RenderizadorModulos() {
  const { payload } = usePerfil();
  const modulos = resolverModulos(payload.negocio);

  return (
    <div className="pv-stack">
      {modulos.map((m) => {
        const eager = EAGER.has(m.tipo);
        if (eager) {
          const Comp = getModuloComponent(m.tipo);
          if (!Comp) return null;
          return <Comp key={m.tipo} negocio={payload.negocio} modulo={m} />;
        }

        const LazyComp = getLazyComp(m.tipo);
        if (!LazyComp) {
          const Comp = getModuloComponent(m.tipo);
          if (!Comp) return null;
          return (
            <div key={m.tipo} className="pv-modulo--defer">
              <Comp negocio={payload.negocio} modulo={m} />
            </div>
          );
        }

        return (
          <div key={m.tipo} className="pv-modulo--defer">
            <Suspense fallback={<div style={{ minHeight: 80 }} aria-hidden />}>
              <LazyComp negocio={payload.negocio} modulo={m} />
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
