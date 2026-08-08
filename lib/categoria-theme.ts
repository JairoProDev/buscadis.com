import { Categoria } from '@/types';

export interface CategoriaThemeTokens {
  accent: string;
  placeholderBg: string;
  placeholderBgDark: string;
}

/**
 * Category accents — synced with packages/tokens/src/semantic/category.json
 * Single runtime source; CSS --bs-cat-* generated from the same values at token build.
 */
export const CATEGORIA_THEME: Record<Categoria, CategoriaThemeTokens> = {
  empleos: {
    accent: '#0F766E',
    placeholderBg: '#F0FDFA',
    placeholderBgDark: '#042F2E',
  },
  inmuebles: {
    accent: '#047857',
    placeholderBg: '#ECFDF5',
    placeholderBgDark: '#022C22',
  },
  vehiculos: {
    accent: '#C2410C',
    placeholderBg: '#FFF7ED',
    placeholderBgDark: '#431407',
  },
  servicios: {
    accent: '#A16207',
    placeholderBg: '#FFFBEB',
    placeholderBgDark: '#422006',
  },
  productos: {
    accent: '#BE123C',
    placeholderBg: '#FFF1F2',
    placeholderBgDark: '#4C0519',
  },
  eventos: {
    accent: '#7E22CE',
    placeholderBg: '#FAF5FF',
    placeholderBgDark: '#3B0764',
  },
  negocios: {
    accent: '#4F46E5',
    placeholderBg: '#EEF2FF',
    placeholderBgDark: '#1E1B4B',
  },
  comunidad: {
    accent: '#A21CAF',
    placeholderBg: '#FDF4FF',
    placeholderBgDark: '#4A044E',
  },
};

export function getCategoriaThemeTokens(categoria: Categoria): CategoriaThemeTokens {
  return CATEGORIA_THEME[categoria] ?? CATEGORIA_THEME.empleos;
}
