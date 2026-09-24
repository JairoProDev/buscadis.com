import { tokens } from '@buscadis/tokens';
import { Categoria } from '@/types';

export interface CategoriaThemeTokens {
  accent: string;
  placeholderBg: string;
  placeholderBgDark: string;
}

/** Category accents — values from @buscadis/tokens (semantic/category + primitives). */
export const CATEGORIA_THEME: Record<Categoria, CategoriaThemeTokens> = {
  empleos: {
    accent: tokens['--bs-cat-empleos-fg'],
    placeholderBg: tokens['--bs-cat-empleos-bg'],
    placeholderBgDark: tokens['--bs-cat-empleos-bgDark'],
  },
  inmuebles: {
    accent: tokens['--bs-cat-inmuebles-fg'],
    placeholderBg: tokens['--bs-cat-inmuebles-bg'],
    placeholderBgDark: tokens['--bs-cat-inmuebles-bgDark'],
  },
  vehiculos: {
    accent: tokens['--bs-cat-vehiculos-fg'],
    placeholderBg: tokens['--bs-cat-vehiculos-bg'],
    placeholderBgDark: tokens['--bs-cat-vehiculos-bgDark'],
  },
  servicios: {
    accent: tokens['--bs-cat-servicios-fg'],
    placeholderBg: tokens['--bs-cat-servicios-bg'],
    placeholderBgDark: tokens['--bs-cat-servicios-bgDark'],
  },
  productos: {
    accent: tokens['--bs-cat-productos-fg'],
    placeholderBg: tokens['--bs-cat-productos-bg'],
    placeholderBgDark: tokens['--bs-cat-productos-bgDark'],
  },
  eventos: {
    accent: tokens['--bs-cat-eventos-fg'],
    placeholderBg: tokens['--bs-cat-eventos-bg'],
    placeholderBgDark: tokens['--bs-cat-eventos-bgDark'],
  },
  negocios: {
    accent: tokens['--bs-cat-negocios-fg'],
    placeholderBg: tokens['--bs-cat-negocios-bg'],
    placeholderBgDark: tokens['--bs-cat-negocios-bgDark'],
  },
  comunidad: {
    accent: tokens['--bs-cat-comunidad-fg'],
    placeholderBg: tokens['--bs-cat-comunidad-bg'],
    placeholderBgDark: tokens['--bs-cat-comunidad-bgDark'],
  },
};

export function getCategoriaThemeTokens(categoria: Categoria): CategoriaThemeTokens {
  return CATEGORIA_THEME[categoria] ?? CATEGORIA_THEME.empleos;
}
