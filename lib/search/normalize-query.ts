import { analizarBusqueda, type AnalisisBusqueda } from '@/lib/chatbot-nlu';
import { Categoria } from '@/types';

export interface NormalizedQuery {
  raw: string;
  cleaned: string;
  expandedTerms: string[];
  analysis: AnalisisBusqueda;
  category?: Categoria;
  location?: string;
}

const VALID_CATEGORIAS: Categoria[] = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios',
  'productos', 'eventos', 'negocios', 'comunidad',
];

export function normalizeQuery(raw: string): NormalizedQuery {
  const trimmed = raw.trim();
  const analysis = analizarBusqueda(trimmed);

  const expandedTerms = new Set<string>();
  for (const term of analysis.terminos) {
    expandedTerms.add(term);
  }
  for (const syn of analysis.terminosExpandidos ?? []) {
    expandedTerms.add(syn);
  }

  let category: Categoria | undefined;
  if (analysis.categoria && VALID_CATEGORIAS.includes(analysis.categoria as Categoria)) {
    category = analysis.categoria as Categoria;
  }

  const location = analysis.ubicacion?.trim() || undefined;

  const expandedQuery = [
    analysis.terminos.join(' '),
    ...(analysis.terminosExpandidos ?? []),
  ].filter(Boolean).join(' ').trim() || trimmed;

  return {
    raw: trimmed,
    cleaned: expandedQuery,
    expandedTerms: [...expandedTerms],
    analysis,
    category,
    location,
  };
}
