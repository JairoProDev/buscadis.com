import type { ProfileBlock, ProfileBlockType } from '@/types/business';
import type { ProfileThemePreset } from '@/types/business';

export type PageParadigm = 'tabs' | 'scroll';
export type HeroVariant = 'cover_center' | 'split' | 'minimal_logo' | 'bento_header';
export type CatalogPresentation = 'grid' | 'list' | 'feed' | 'pinned_carousel';
export type CtaPlacement = 'sticky_bar' | 'floating' | 'inline_per_block';
export type IndustryPack = 'ferreteria' | 'restaurante' | 'belleza' | 'servicios' | 'general';

export interface PageTemplate {
  id: string;
  label: string;
  description: string;
  paradigm: PageParadigm;
  heroVariant: HeroVariant;
  defaultBlocks: ProfileBlock[];
  catalogPresentation: CatalogPresentation;
  ctaPlacement: CtaPlacement;
  suggestedTheme: ProfileThemePreset;
  industryPack?: IndustryPack;
  thumbnailGradient: string;
  filters: { style?: string; industry?: string };
  /** Plantillas legacy ocultas en el editor hasta rehacerlas */
  deprecated?: boolean;
}

const baseBlocks = (types: ProfileBlockType[]): ProfileBlock[] =>
  types.map((type, i) => ({
    id: `${type}-${i}`,
    type,
    visible: true,
    config: {},
  }));

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'modern_tabs',
    label: 'Moderno con pestañas',
    description: 'El estilo Buscadis mejorado: catálogo, info, deals y reseñas en tabs.',
    paradigm: 'tabs',
    heroVariant: 'cover_center',
    defaultBlocks: baseBlocks(['hero', 'highlights', 'catalog', 'deals', 'links', 'reviews', 'map']),
    catalogPresentation: 'grid',
    ctaPlacement: 'floating',
    suggestedTheme: 'executive',
    thumbnailGradient: 'from-blue-600 to-slate-800',
    filters: { style: 'modern' },
  },
  {
    id: 'bento_scroll',
    label: 'Bento scroll',
    description: 'Página única con bloques apilados, ideal para muchos links y catálogo visual.',
    paradigm: 'scroll',
    heroVariant: 'bento_header',
    defaultBlocks: baseBlocks(['hero', 'highlights', 'links', 'catalog', 'deals', 'reviews', 'map']),
    catalogPresentation: 'feed',
    ctaPlacement: 'sticky_bar',
    suggestedTheme: 'organic',
    thumbnailGradient: 'from-emerald-500 to-teal-800',
    filters: { style: 'bento' },
    deprecated: true,
  },
  {
    id: 'minimal_scroll',
    label: 'Minimal scroll',
    description: 'Logo centrado, sin banner obligatorio. Profesionales y coaches.',
    paradigm: 'scroll',
    heroVariant: 'minimal_logo',
    defaultBlocks: baseBlocks(['hero', 'text', 'links', 'reviews', 'map', 'catalog']),
    catalogPresentation: 'list',
    ctaPlacement: 'inline_per_block',
    suggestedTheme: 'minimal',
    thumbnailGradient: 'from-neutral-700 to-neutral-900',
    filters: { style: 'minimal' },
    deprecated: true,
  },
  {
    id: 'vibrant_tabs',
    label: 'Vibrante con pestañas',
    description: 'Hero dividido, colores fuertes. Retail con deals y promos.',
    paradigm: 'tabs',
    heroVariant: 'split',
    defaultBlocks: baseBlocks(['hero', 'highlights', 'catalog', 'deals', 'reviews', 'links', 'map']),
    catalogPresentation: 'grid',
    ctaPlacement: 'floating',
    suggestedTheme: 'nocturno',
    thumbnailGradient: 'from-purple-600 to-pink-600',
    filters: { style: 'vibrant' },
    deprecated: true,
  },
  {
    id: 'pack_ferreteria',
    label: 'Ferretería',
    description: 'Stock permanente, categorías SKU, mapa y WhatsApp destacado.',
    paradigm: 'tabs',
    heroVariant: 'cover_center',
    defaultBlocks: baseBlocks(['hero', 'highlights', 'catalog', 'map', 'cta', 'reviews']),
    catalogPresentation: 'grid',
    ctaPlacement: 'sticky_bar',
    suggestedTheme: 'executive',
    industryPack: 'ferreteria',
    thumbnailGradient: 'from-orange-600 to-amber-800',
    filters: { industry: 'ferreteria' },
    deprecated: true,
  },
  {
    id: 'pack_restaurante',
    label: 'Restaurante',
    description: 'Horarios, menú en feed y deals del día.',
    paradigm: 'scroll',
    heroVariant: 'split',
    defaultBlocks: baseBlocks(['hero', 'highlights', 'catalog', 'deals', 'map', 'reviews']),
    catalogPresentation: 'feed',
    ctaPlacement: 'sticky_bar',
    suggestedTheme: 'organic',
    industryPack: 'restaurante',
    thumbnailGradient: 'from-red-600 to-orange-700',
    filters: { industry: 'restaurante' },
    deprecated: true,
  },
  {
    id: 'pack_belleza',
    label: 'Belleza',
    description: 'Deals, reseñas y galería de links para reservar.',
    paradigm: 'scroll',
    heroVariant: 'bento_header',
    defaultBlocks: baseBlocks(['hero', 'deals', 'reviews', 'links', 'catalog', 'map']),
    catalogPresentation: 'feed',
    ctaPlacement: 'floating',
    suggestedTheme: 'nocturno',
    industryPack: 'belleza',
    thumbnailGradient: 'from-pink-500 to-purple-700',
    filters: { industry: 'belleza' },
    deprecated: true,
  },
  {
    id: 'pack_servicios',
    label: 'Servicios',
    description: 'Portafolio, testimonios y contacto directo.',
    paradigm: 'scroll',
    heroVariant: 'minimal_logo',
    defaultBlocks: baseBlocks(['hero', 'text', 'reviews', 'links', 'map', 'catalog']),
    catalogPresentation: 'list',
    ctaPlacement: 'inline_per_block',
    suggestedTheme: 'minimal',
    industryPack: 'servicios',
    thumbnailGradient: 'from-slate-600 to-blue-900',
    filters: { industry: 'servicios' },
    deprecated: true,
  },
];

export function getTemplateById(id: string): PageTemplate {
  return PAGE_TEMPLATES.find((t) => t.id === id) ?? PAGE_TEMPLATES[0];
}

export function listTemplates(filters?: {
  paradigm?: PageParadigm;
  industry?: string;
  style?: string;
}): PageTemplate[] {
  return PAGE_TEMPLATES.filter((t) => {
    if (t.deprecated) return false;
    if (filters?.paradigm && t.paradigm !== filters.paradigm) return false;
    if (filters?.industry && t.filters.industry !== filters.industry) return false;
    if (filters?.style && t.filters.style !== filters.style) return false;
    return true;
  });
}
