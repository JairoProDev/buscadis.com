import type { MetodoPago, PerfilPayload, TipoModulo } from '../types';
import type { ModuloResuelto } from './resolver';

export const NEGOCIOS_FALLBACK = '/categoria/negocios';

export function perfilPublicPath(slug: string): string {
  return `/@${slug}`;
}

export function perfilPublicUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${perfilPublicPath(slug)}`;
  }
  return `https://buscadis.com${perfilPublicPath(slug)}`;
}

/** Atrás dentro de Buscadis, o listado de negocios. */
export function navegarAtrasBuscadis(slug: string): void {
  if (typeof window === 'undefined') return;
  const fallback = NEGOCIOS_FALLBACK;
  const ref = document.referrer;
  try {
    if (ref) {
      const u = new URL(ref);
      if (u.origin === window.location.origin) {
        const path = u.pathname.replace(/\/$/, '') || '/';
        const selfPaths = [
          `/@${slug}`,
          `/v/${slug}`,
          `/negocio/${slug}`,
          `/p/${slug}`,
        ];
        const isSelf = selfPaths.some(
          (p) => path === p || path.startsWith(`${p}/`)
        );
        if (!isSelf) {
          window.history.back();
          return;
        }
      }
    }
  } catch {
    /* ignore */
  }
  window.location.assign(fallback);
}

export function scrollToAncla(ancla: string): void {
  const el = document.getElementById(ancla);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    history.replaceState(null, '', `#${ancla}`);
  } catch {
    /* ignore */
  }
}

export type SubitemMenu = { id: string; label: string };

const PAGO_LABEL: Partial<Record<MetodoPago, string>> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  cripto: 'Cripto',
  bcp: 'BCP',
  interbank: 'Interbank',
  bbva: 'BBVA',
  scotiabank: 'Scotiabank',
  banbif: 'BanBif',
};

/** Subítems comprimidos por sección (máx. 8). */
export function subitemsDeSeccion(
  tipo: TipoModulo,
  payload: PerfilPayload
): SubitemMenu[] {
  const max = 8;
  switch (tipo) {
    case 'catalogo':
    case 'servicios':
      return payload.productos
        .filter((p) => p.activo)
        .slice(0, max)
        .map((p) => ({ id: p.id, label: p.nombre }));
    case 'categorias': {
      const grupos = Array.from(
        new Set(
          payload.productos
            .filter((p) => p.activo && p.grupo)
            .map((p) => p.grupo as string)
        )
      ).slice(0, max);
      return grupos.map((g) => ({ id: g, label: g }));
    }
    case 'faq':
      return payload.faqs.slice(0, max).map((f) => ({
        id: f.id,
        label: f.pregunta,
      }));
    case 'novedades':
      return payload.novedades.slice(0, max).map((n) => ({
        id: n.id,
        label: n.titulo,
      }));
    case 'promocion':
      return payload.promocion
        ? [{ id: payload.promocion.id, label: payload.promocion.titulo }]
        : [];
    case 'equipo':
      return payload.equipo.slice(0, max).map((m) => ({
        id: m.id,
        label: m.nombre,
      }));
    case 'canales': {
      const redes = (payload.negocio.contacto.redes ?? [])
        .filter((r) => r.activa)
        .slice(0, max)
        .map((r, i) => ({
          id: `red-${i}`,
          label: r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1),
        }));
      const out: SubitemMenu[] = [{ id: 'web', label: 'Web' }];
      if (payload.negocio.contacto.whatsapp) {
        out.push({ id: 'wa', label: 'WhatsApp' });
      }
      return [...out, ...redes].slice(0, max);
    }
    case 'pago':
      return (payload.negocio.metodosPago ?? []).slice(0, max).map((m) => ({
        id: m,
        label: PAGO_LABEL[m] ?? m,
      }));
    case 'galeria':
      return payload.galeria.length
        ? [{ id: 'fotos', label: `${payload.galeria.length} fotos` }]
        : [];
    case 'resenas': {
      const n = payload.resenas.length;
      if (!n) return [];
      const avg = (
        payload.resenas.reduce((s, r) => s + r.estrellas, 0) / n
      ).toFixed(1);
      return [
        {
          id: 'resumen',
          label: `${n} reseñas · ${avg}★`,
        },
      ];
    }
    case 'ubicacion': {
      const u = payload.negocio.ubicacion;
      if (!u) return [];
      const bits = [u.distrito, u.provincia].filter(Boolean);
      return bits.length
        ? [{ id: 'dir', label: bits.join(', ') }]
        : u.direccion
          ? [{ id: 'dir', label: u.direccion }]
          : [];
    }
    case 'publicaciones':
      return payload.publicaciones.slice(0, max).map((p) => ({
        id: p.id,
        label: p.titulo,
      }));
    case 'certificaciones':
      return payload.certificaciones.slice(0, max).map((c) => ({
        id: c.id,
        label: c.titulo,
      }));
    case 'documentos':
      return payload.documentos.slice(0, max).map((d) => ({
        id: d.id,
        label: d.titulo,
      }));
    default:
      return [];
  }
}

export function resumenSubitems(items: SubitemMenu[]): string {
  if (!items.length) return '';
  return items
    .map((i) => i.label)
    .join(' · ')
    .slice(0, 72);
}

export type SeccionMenu = ModuloResuelto & {
  subitems: SubitemMenu[];
  resumen: string;
};

export function construirMenuSecciones(
  modulos: ModuloResuelto[],
  payload: PerfilPayload
): SeccionMenu[] {
  return modulos.map((m) => {
    const subitems = subitemsDeSeccion(m.tipo, payload);
    return {
      ...m,
      subitems,
      resumen: resumenSubitems(subitems),
    };
  });
}

const FOLLOW_PREFIX = 'pv:follow:';

export function followStorageKey(slug: string): string {
  return `${FOLLOW_PREFIX}${slug}`;
}

export function isFollowingNegocio(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(followStorageKey(slug)) === '1';
  } catch {
    return false;
  }
}

export function setFollowingNegocio(slug: string, on: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (on) localStorage.setItem(followStorageKey(slug), '1');
    else localStorage.removeItem(followStorageKey(slug));
  } catch {
    /* ignore */
  }
}
