import { Categoria } from '@/types';

export interface CategoriaThemeTokens {
  accent: string;
  placeholderBg: string;
  placeholderBgDark: string;
}

/** Acento 3px + fondos placeholder neutros (spec §2.2) */
export const CATEGORIA_THEME: Record<Categoria, CategoriaThemeTokens> = {
  empleos: {
    accent: '#64748b',
    placeholderBg: '#f8fafc',
    placeholderBgDark: '#283038',
  },
  inmuebles: {
    accent: '#059669',
    placeholderBg: '#ecfdf5',
    placeholderBgDark: '#283038',
  },
  vehiculos: {
    accent: '#0284c7',
    placeholderBg: '#f0f9ff',
    placeholderBgDark: '#283038',
  },
  servicios: {
    accent: '#d97706',
    placeholderBg: '#fffbeb',
    placeholderBgDark: '#283038',
  },
  productos: {
    accent: '#e11d48',
    placeholderBg: '#fff1f2',
    placeholderBgDark: '#283038',
  },
  eventos: {
    accent: '#7c3aed',
    placeholderBg: '#f5f3ff',
    placeholderBgDark: '#283038',
  },
  negocios: {
    accent: '#475569',
    placeholderBg: '#f8fafc',
    placeholderBgDark: '#283038',
  },
  comunidad: {
    accent: '#0891b2',
    placeholderBg: '#ecfeff',
    placeholderBgDark: '#283038',
  },
};

export function getCategoriaThemeTokens(categoria: Categoria): CategoriaThemeTokens {
  return CATEGORIA_THEME[categoria] ?? CATEGORIA_THEME.empleos;
}
