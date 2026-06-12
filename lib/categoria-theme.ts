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
    placeholderBgDark: '#1e293b',
  },
  inmuebles: {
    accent: '#059669',
    placeholderBg: '#ecfdf5',
    placeholderBgDark: '#064e3b',
  },
  vehiculos: {
    accent: '#0284c7',
    placeholderBg: '#f0f9ff',
    placeholderBgDark: '#0c4a6e',
  },
  servicios: {
    accent: '#d97706',
    placeholderBg: '#fffbeb',
    placeholderBgDark: '#78350f',
  },
  productos: {
    accent: '#e11d48',
    placeholderBg: '#fff1f2',
    placeholderBgDark: '#881337',
  },
  eventos: {
    accent: '#7c3aed',
    placeholderBg: '#f5f3ff',
    placeholderBgDark: '#4c1d95',
  },
  negocios: {
    accent: '#475569',
    placeholderBg: '#f8fafc',
    placeholderBgDark: '#1e293b',
  },
  comunidad: {
    accent: '#0891b2',
    placeholderBg: '#ecfeff',
    placeholderBgDark: '#164e63',
  },
};

export function getCategoriaThemeTokens(categoria: Categoria): CategoriaThemeTokens {
  return CATEGORIA_THEME[categoria] ?? CATEGORIA_THEME.empleos;
}
