import type { Categoria } from '@/types';
import type { Adiso } from '@/types';
import { MARKETPLACE_CATEGORIES } from '@/lib/seo/category-metadata';

export const CUSCO_HUB_REGION_SLUG = 'cusco';
export const CUSCO_HUB_MIN_ADISOS_INDEX = 5;

const CUSCO_HUB_COPY: Record<
  Categoria,
  { title: string; description: string; intro: string; faq: { q: string; a: string }[] }
> = {
  empleos: {
    title: 'Empleos en Cusco — Vacantes y ofertas laborales',
    description:
      'Encuentra trabajo en Cusco: restaurantes, turismo, retail y más. Publica o postula gratis en Buscadis.',
    intro:
      'Buscadis concentra avisos de empleo publicados en Cusco y la provincia. Cada vacante tiene su página para compartir y postular.',
    faq: [
      {
        q: '¿Cómo publico una vacante en Cusco?',
        a: 'Entra a Publicar en Buscadis, elige Empleos y completa el aviso. Es gratis para empezar.',
      },
      {
        q: '¿Los avisos son solo de Cusco?',
        a: 'Esta página prioriza anuncios con ubicación en Cusco; también hay ofertas en todo el Perú en la categoría nacional.',
      },
    ],
  },
  inmuebles: {
    title: 'Inmuebles en Cusco — Alquiler y venta',
    description:
      'Casas, departamentos y terrenos en Cusco. Compra, vende o alquila con avisos clasificados en Buscadis.',
    intro:
      'Explora propiedades publicadas por particulares y negocios locales en Cusco. Cada aviso incluye ubicación y contacto.',
    faq: [
      {
        q: '¿Puedo publicar un inmueble en Cusco gratis?',
        a: 'Sí, puedes publicar tu aviso desde la sección Publicar y elegir Inmuebles.',
      },
    ],
  },
  vehiculos: {
    title: 'Vehículos en Cusco — Autos y motos',
    description: 'Compra y vende autos, motos y repuestos en Cusco. Clasificados verificables en Buscadis.',
    intro: 'Avisos de vehículos con precio y ubicación en Cusco y alrededores.',
    faq: [],
  },
  servicios: {
    title: 'Servicios en Cusco — Profesionales y locales',
    description: 'Encuentra servicios cerca de ti en Cusco: técnicos, belleza, salud y más en Buscadis.',
    intro: 'Directorio de servicios publicados por negocios y profesionales en la región Cusco.',
    faq: [],
  },
  productos: {
    title: 'Productos en Cusco — Compra y vende cerca',
    description: 'Productos nuevos y usados en Cusco. Catálogos de negocios locales en Buscadis.',
    intro: 'Ofertas de productos con entrega o retiro en Cusco.',
    faq: [],
  },
  eventos: {
    title: 'Eventos en Cusco — Actividades y convocatorias',
    description: 'Eventos, talleres y actividades publicadas en Cusco en Buscadis.',
    intro: 'Convocatorias y eventos locales en un solo feed.',
    faq: [],
  },
  negocios: {
    title: 'Negocios en Cusco — Oportunidades y avisos',
    description: 'Avisos de negocios, franquicias y oportunidades en Cusco.',
    intro: 'Publicaciones orientadas a emprendedores y negocios en Cusco.',
    faq: [],
  },
  comunidad: {
    title: 'Comunidad en Cusco — Avisos locales',
    description: 'Avisos de comunidad y clasificados locales en Cusco.',
    intro: 'Espacio para avisos vecinales y de interés local en Cusco.',
    faq: [],
  },
};

export function isCuscoHubCategory(value: string): value is Categoria {
  return (MARKETPLACE_CATEGORIES as string[]).includes(value);
}

export function getCuscoHubPath(categoria: Categoria): string {
  return `/l/${CUSCO_HUB_REGION_SLUG}/${categoria}`;
}

export function listCuscoHubPaths(): string[] {
  return MARKETPLACE_CATEGORIES.map((c) => getCuscoHubPath(c));
}

export function getCuscoHubCopy(categoria: Categoria) {
  return CUSCO_HUB_COPY[categoria];
}

/** Coincide con avisos cuya ubicación menciona Cusco (departamento/provincia/distrito o texto libre). */
export function matchesCuscoMarket(adiso: Adiso): boolean {
  const u = adiso.ubicacion;
  if (typeof u === 'string' && u.trim()) {
    return /cusco/i.test(u);
  }
  if (u && typeof u === 'object') {
    const blob = [u.departamento, u.provincia, u.distrito, u.direccion]
      .filter(Boolean)
      .join(' ');
    return /cusco/i.test(blob);
  }
  return false;
}

export function filterAdisosForCusco(adisos: Adiso[]): Adiso[] {
  return adisos.filter(matchesCuscoMarket);
}
