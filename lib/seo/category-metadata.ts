import type { Metadata } from 'next';
import type { Categoria } from '@/types';
import {
  getSiteUrl,
  getDefaultOgImageUrl,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_OG_IMAGE_HEIGHT,
} from '@/lib/seo/og-image';

export const MARKETPLACE_CATEGORIES: Categoria[] = [
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad',
];

export function isMarketplaceCategory(value: string): value is Categoria {
  return (MARKETPLACE_CATEGORIES as string[]).includes(value);
}

/** Ruta del asset OG por categoría (subir a public/og/categories/). */
export function getCategoryOgImagePath(categoria: Categoria): string {
  return `/og/categories/${categoria}.png`;
}

export function getCategoryOgImageUrl(categoria: Categoria): string {
  return `${getSiteUrl()}${getCategoryOgImagePath(categoria)}`;
}

type CategoryShareCopy = {
  label: string;
  title: string;
  description: string;
  imageAlt: string;
};

export const CATEGORY_SHARE_COPY: Record<Categoria, CategoryShareCopy> = {
  empleos: {
    label: 'Empleos',
    title: 'Empleos en Perú — Ofertas y oportunidades laborales',
    description:
      'Encuentra trabajo, prácticas y vacantes en Cusco, Lima y todo el Perú. Publica o postula gratis en Buscadis.',
    imageAlt: 'Empleos en Buscadis Perú',
  },
  inmuebles: {
    label: 'Inmuebles',
    title: 'Inmuebles en Perú — Casas, departamentos y terrenos',
    description:
      'Compra, vende o alquila propiedades. Anuncios de inmuebles en Cusco, Lima y regiones. Rápido y gratis.',
    imageAlt: 'Inmuebles en Buscadis Perú',
  },
  vehiculos: {
    label: 'Vehículos',
    title: 'Vehículos en Perú — Autos, motos y más',
    description:
      'Compra y vende autos, motos, camionetas y repuestos. Clasificados de vehículos en todo el Perú.',
    imageAlt: 'Vehículos en Buscadis Perú',
  },
  servicios: {
    label: 'Servicios',
    title: 'Servicios en Perú — Profesionales y locales',
    description:
      'Encuentra servicios cerca de ti: técnicos, belleza, salud, educación y más. Publica tu servicio gratis.',
    imageAlt: 'Servicios en Buscadis Perú',
  },
  productos: {
    label: 'Productos',
    title: 'Productos en Perú — Compra y vende cerca de ti',
    description:
      'Productos nuevos y usados, catálogos de negocios locales y ofertas. Desde artesanías hasta tecnología.',
    imageAlt: 'Productos en Buscadis Perú',
  },
  eventos: {
    label: 'Eventos',
    title: 'Eventos en Perú — Actividades y convocatorias',
    description:
      'Descubre ferias, talleres, conciertos y eventos en tu ciudad. Publica el tuyo y llega a más personas.',
    imageAlt: 'Eventos en Buscadis Perú',
  },
  negocios: {
    label: 'Negocios',
    title: 'Negocios en Perú — Emprende y haz crecer tu marca',
    description:
      'Perfiles de negocio, franquicias y oportunidades B2B. Tu tarjeta digital y catálogo en un solo link.',
    imageAlt: 'Negocios en Buscadis Perú',
  },
  comunidad: {
    label: 'Comunidad',
    title: 'Comunidad — Avisos y clasificados locales',
    description:
      'Anuncios de la comunidad, trueques, avisos vecinales y clasificados generales en Perú.',
    imageAlt: 'Comunidad en Buscadis Perú',
  },
};

type BuildCategoryOptions = {
  /** Ruta canónica relativa, p. ej. `/?categoria=productos` o `/categoria/productos` */
  urlPath: string;
  /** Si el PNG de categoría aún no existe, usar banner genérico de marca */
  fallbackToDefaultImage?: boolean;
};

export function buildCategoryShareMetadata(
  categoria: Categoria,
  options: BuildCategoryOptions
): Metadata {
  const copy = CATEGORY_SHARE_COPY[categoria];
  const path = options.urlPath.startsWith('/') ? options.urlPath : `/${options.urlPath}`;
  const url = `${getSiteUrl()}${path}`;
  const categoryImage = getCategoryOgImageUrl(categoria);
  const imageUrl = options.fallbackToDefaultImage ? getDefaultOgImageUrl() : categoryImage;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      siteName: 'Buscadis',
      locale: 'es_PE',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: copy.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [imageUrl],
    },
  };
}
