import type { ConfigModulo, Negocio, TipoModulo } from '../types';
import { MODULO_META, planSuficiente } from './contrato';
import { ordenArquetipo } from './orden-arquetipo';

export interface ModuloResuelto {
  tipo: TipoModulo;
  titulo: string;
  ancla: string;
  orden: number;
}

function datosDisponibles(negocio: Negocio, tipo: TipoModulo): number {
  const meta = MODULO_META[tipo];
  if (!meta.conteoKey) {
    if (tipo === 'ubicacion') return negocio.ubicacion ? 1 : 0;
    if (tipo === 'canales') {
      const c = negocio.contacto;
      return [c.whatsapp, c.telefono, c.email, c.web].filter(Boolean).length +
        c.redes.filter((r) => r.activa).length;
    }
    return 1;
  }
  return negocio.conteos?.[meta.conteoKey] ?? 0;
}

/**
 * Filtra por visible, plan y minDatos; ordena por arquetipo + orden de config.
 * Módulos fijos siempre entran si visible (aunque minDatos=0).
 * Catálogo vacío (productos < 3) no se renderiza en público.
 */
export function resolverModulos(negocio: Negocio): ModuloResuelto[] {
  const byTipo = new Map<TipoModulo, ConfigModulo>();
  for (const m of negocio.modulos) {
    byTipo.set(m.tipo, m);
  }

  const baseOrder = ordenArquetipo(negocio.arquetipo);
  const resolved: ModuloResuelto[] = [];

  for (const tipo of baseOrder) {
    const cfg = byTipo.get(tipo);
    if (!cfg || !cfg.visible) continue;

    const meta = MODULO_META[tipo];
    if (!planSuficiente(negocio.plan, meta.planMin)) continue;

    if (!meta.fijo) {
      const n = datosDisponibles(negocio, tipo);
      if (n < meta.minDatos) continue;
    }

    resolved.push({
      tipo,
      titulo: cfg.titulo ?? meta.tituloDefault,
      ancla: meta.ancla,
      orden: cfg.orden,
    });
  }

  // Incluir fijos configurados que el arquetipo lista después / métricas en retail
  for (const [tipo, cfg] of byTipo) {
    if (!cfg.visible) continue;
    const meta = MODULO_META[tipo];
    if (!meta.fijo) continue;
    if (resolved.some((r) => r.tipo === tipo)) continue;
    if (!planSuficiente(negocio.plan, meta.planMin)) continue;
    // Insert métricas after hero when present
    const heroIdx = resolved.findIndex((r) => r.tipo === 'hero');
    const item: ModuloResuelto = {
      tipo,
      titulo: cfg.titulo ?? meta.tituloDefault,
      ancla: meta.ancla,
      orden: cfg.orden,
    };
    if (tipo === 'metricas' && heroIdx >= 0) {
      resolved.splice(heroIdx + 1, 0, item);
    } else {
      resolved.push(item);
    }
  }

  return resolved;
}
