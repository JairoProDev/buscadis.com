import type {
  DiaSemana,
  EtiquetaProducto,
  Horario,
  MetodoPago,
  Negocio,
  PerfilPayload,
  Producto,
} from '../types';
import { safeParseNegocio } from '../schemas';
import { calcularEstadoVivo } from '../estado/calcular-estado';
import { negocioFromBusinessProfile } from './from-business-profile';

const DAY_MAP: Record<string, DiaSemana> = {
  lun: 'lun',
  lunes: 'lun',
  monday: 'lun',
  mon: 'lun',
  mar: 'mar',
  martes: 'mar',
  tuesday: 'mar',
  tue: 'mar',
  mie: 'mie',
  miercoles: 'mie',
  miércoles: 'mie',
  wednesday: 'mie',
  wed: 'mie',
  jue: 'jue',
  jueves: 'jue',
  thursday: 'jue',
  thu: 'jue',
  vie: 'vie',
  viernes: 'vie',
  friday: 'vie',
  fri: 'vie',
  sab: 'sab',
  sabado: 'sab',
  sábado: 'sab',
  saturday: 'sab',
  sat: 'sab',
  dom: 'dom',
  domingo: 'dom',
  sunday: 'dom',
  sun: 'dom',
};

function emptySemana(): Horario['semana'] {
  return {
    lun: [],
    mar: [],
    mie: [],
    jue: [],
    vie: [],
    sab: [],
    dom: [],
  };
}

/** BusinessHours (lunes|monday|…) → Horario Perfil Vivo */
export function horarioFromBusinessHours(raw: unknown): Horario | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const semana = emptySemana();
  let any = false;

  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const dia = DAY_MAP[key.toLowerCase()];
    if (!dia || !val || typeof val !== 'object') continue;
    const h = val as { open?: string; close?: string; closed?: boolean };
    if (h.closed) {
      semana[dia] = [];
      any = true;
      continue;
    }
    if (typeof h.open === 'string' && typeof h.close === 'string' && h.open && h.close) {
      semana[dia] = [{ desde: h.open.slice(0, 5), hasta: h.close.slice(0, 5) }];
      any = true;
    }
  }

  return any ? { zona: 'America/Lima', semana } : undefined;
}

function normalizeImageUrl(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === 'string') {
    try {
      const p = JSON.parse(img);
      if (Array.isArray(p) && p[0]) return normalizeImageUrl(p[0]);
    } catch {
      return img.startsWith('http') || img.startsWith('data:') ? img : null;
    }
  }
  if (typeof img === 'object' && img !== null && 'url' in img) {
    const u = (img as { url?: string }).url;
    return typeof u === 'string' ? u : null;
  }
  return null;
}

function etiquetasFromTags(tags: unknown, featured: boolean): EtiquetaProducto[] {
  const out: EtiquetaProducto[] = [];
  if (featured) out.push('popular');
  const list = Array.isArray(tags) ? tags.map(String) : [];
  for (const t of list) {
    const low = t.toLowerCase();
    if (low.includes('nuevo') || low === 'new') out.push('nuevo');
    else if (low.includes('oferta') || low.includes('sale')) out.push('oferta');
    else if (low.includes('vendido') || low.includes('best')) out.push('mas_vendido');
  }
  return out.slice(0, 1);
}

/** catalog_products row → Producto Perfil Vivo */
export function productoFromCatalogRow(
  row: Record<string, unknown>,
  negocioId: string
): Producto | null {
  const id = typeof row.id === 'string' ? row.id : null;
  const title = typeof row.title === 'string' ? row.title : null;
  if (!id || !title) return null;
  if (row.status && row.status !== 'published') return null;

  const imagesRaw = row.images;
  const urls: string[] = [];
  if (Array.isArray(imagesRaw)) {
    for (const im of imagesRaw) {
      const u = normalizeImageUrl(im);
      if (u) urls.push(u);
    }
  } else {
    const u = normalizeImageUrl(imagesRaw);
    if (u) urls.push(u);
  }

  const placeholder = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="#F1F0F4" width="600" height="600"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6E6B78" font-size="24" font-family="sans-serif">${title.slice(0, 18)}</text></svg>`
  )}`;

  const price = typeof row.price === 'number' ? row.price : undefined;
  const compare =
    typeof row.compare_at_price === 'number' ? row.compare_at_price : undefined;
  const stockStatus = row.stock_status as string | undefined;
  let disponibilidad: Producto['disponibilidad'] = 'disponible';
  if (stockStatus === 'out_of_stock') disponibilidad = 'agotado';
  else if (stockStatus === 'low_stock') disponibilidad = 'ultimas_unidades';

  return {
    id,
    negocioId,
    nombre: title.slice(0, 80),
    descripcion:
      typeof row.description === 'string' ? row.description.slice(0, 600) : undefined,
    precio:
      price != null
        ? {
            valor: price,
            moneda: row.currency === 'USD' ? 'USD' : 'PEN',
            tipo: 'exacto',
          }
        : undefined,
    precioAnterior: compare,
    imagenes: [
      {
        url: urls[0] ?? placeholder,
        ancho: 600,
        alto: 600,
        alt: title,
      },
    ],
    disponibilidad,
    destacado: row.is_featured === true,
    etiquetas: etiquetasFromTags(row.tags, row.is_featured === true),
    activo: true,
  };
}

function redesFromProfile(p: Record<string, unknown>) {
  const links = Array.isArray(p.social_links) ? p.social_links : [];
  return links
    .filter((l): l is { network: string; url: string } => {
      return (
        !!l &&
        typeof l === 'object' &&
        typeof (l as { url?: string }).url === 'string' &&
        typeof (l as { network?: string }).network === 'string'
      );
    })
    .map((l) => ({
      tipo: l.network === 'twitter' ? 'x' : l.network,
      url: l.url,
      activa: true,
    }));
}

const DEFAULT_MODULOS_RETAIL: Negocio['modulos'] = [
  { tipo: 'hero', visible: true, orden: 0 },
  { tipo: 'metricas', visible: true, orden: 1 },
  { tipo: 'estado', visible: true, orden: 2 },
  { tipo: 'acciones', visible: true, orden: 3 },
  { tipo: 'catalogo', visible: true, orden: 4 },
  { tipo: 'ubicacion', visible: true, orden: 5 },
  { tipo: 'horario', visible: true, orden: 6 },
  { tipo: 'pago', visible: true, orden: 7 },
  { tipo: 'canales', visible: true, orden: 8 },
];

/**
 * Enriquece Negocio con horario, redes y conteos; rellena módulos Retail.
 */
export function enrichNegocioFromProfile(
  base: Negocio,
  row: Record<string, unknown>,
  productCount: number
): Negocio {
  const horario = horarioFromBusinessHours(row.business_hours);
  const redes = redesFromProfile(row);
  const metodos: MetodoPago[] = ['efectivo', 'yape', 'plin', 'transferencia'];

  const next: Negocio = {
    ...base,
    horario: horario ?? base.horario,
    metodosPago: base.metodosPago?.length ? base.metodosPago : metodos,
    contacto: {
      ...base.contacto,
      redes: redes.length ? redes : base.contacto.redes,
      web: base.contacto.web,
    },
    modulos: DEFAULT_MODULOS_RETAIL,
    conteos: {
      productos: productCount,
      resenas: base.conteos?.resenas ?? 0,
      fotosGaleria: base.conteos?.fotosGaleria ?? 0,
    },
  };

  const parsed = safeParseNegocio(next);
  return parsed.success ? (parsed.data as Negocio) : next;
}

export function buildPerfilPayloadFromSources(opts: {
  profileRow: unknown;
  catalogRows: unknown[];
  now?: Date;
}): PerfilPayload | null {
  const base = negocioFromBusinessProfile(opts.profileRow);
  if (!base) return null;
  if (!opts.profileRow || typeof opts.profileRow !== 'object') return null;

  const published = (opts.catalogRows || [])
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => productoFromCatalogRow(r, base.id))
    .filter((p): p is Producto => p != null);

  // Featured first; if none featured, take first 12 published
  const featured = published.filter((p) => p.destacado);
  const pool = featured.length >= 3 ? featured : published;
  const productos = pool.slice(0, 12).map((p) => ({ ...p, destacado: true }));

  const negocio = enrichNegocioFromProfile(
    base,
    opts.profileRow as Record<string, unknown>,
    published.length
  );

  return {
    negocio,
    productos,
    totalProductos: published.length,
    metricas: { antiguedadDesde: negocio.creadoEn },
    estadoVivo: calcularEstadoVivo(negocio.horario, opts.now ?? new Date()),
  };
}
