import type { Categoria } from '@/types';
import { classifyAdisoCategory } from '@/lib/adiso/classify-category';

/** Clasificación para avisos Rueda / texto libre (8 categorías). */
export function classifyRuedaListing(titulo: string, descripcion: string): Categoria {
  return classifyAdisoCategory(titulo, descripcion).categoria;
}
