import { supabase } from './supabase';
import { Adiso } from '@/types';

/**
 * Busca adisos usando datos TOON para búsquedas semánticas
 */
export async function buscarEnTOON(
  consulta: string,
  limite: number = 10
): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  try {
    // Buscar en datos TOON usando búsqueda de similitud (pg_trgm)
    // La consulta se busca en el contenido TOON
    const { data: resultadosToon, error } = await supabase
      .from('datos_toon_anuncios')
      .select('adiso_id, contenido_toon')
      .textSearch('contenido_toon', consulta, {
        type: 'websearch',
        config: 'spanish'
      })
      .limit(limite);
    
    if (error) {
      // Si falla textSearch, intentar búsqueda simple con LIKE
      const { data: resultadosLike, error: errorLike } = await supabase
        .from('datos_toon_anuncios')
        .select('adiso_id')
        .ilike('contenido_toon', `%${consulta}%`)
        .limit(limite);
      
      if (errorLike || !resultadosLike) {
        throw errorLike || error;
      }
      
      // Obtener adisos correspondientes
      const adisoIds = resultadosLike.map(r => r.adiso_id);
      const { data: adisosData, error: adisosError } = await supabase
        .from('adisos')
        .select('*')
        .in('id', adisoIds);
      
      if (adisosError || !adisosData) {
        throw adisosError || new Error('Error al obtener adisos');
      }
      
      const { dbToAdiso } = await import('./supabase');
      return adisosData.map(dbToAdiso);
    }
    
    if (!resultadosToon || resultadosToon.length === 0) {
      return [];
    }
    
    // Obtener adisos correspondientes
    const adisoIds = resultadosToon.map(r => r.adiso_id);
    const { data: adisosData, error: adisosError } = await supabase
      .from('adisos')
      .select('*')
      .in('id', adisoIds);
    
    if (adisosError || !adisosData) {
      throw adisosError || new Error('Error al obtener adisos');
    }
    
    const { dbToAdiso } = await import('./supabase');
    return adisosData.map(dbToAdiso);
  } catch (error: any) {
    console.error('Error en búsqueda TOON:', error);
    throw error;
  }
}

/**
 * Busca adisos usando múltiples términos en TOON
 */
export async function buscarMultiplesTerminos(
  terminos: string[],
  limite: number = 10
): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  try {
    // Buscar cada término y combinar resultados
    const resultadosPorTermino: Map<string, number> = new Map();
    
    for (const termino of terminos) {
      const resultados = await buscarEnTOON(termino, limite * 2);
      resultados.forEach(adiso => {
        const count = resultadosPorTermino.get(adiso.id) || 0;
        resultadosPorTermino.set(adiso.id, count + 1);
      });
    }
    
    // Ordenar por relevancia (más coincidencias primero)
    const adisoIdsOrdenados = Array.from(resultadosPorTermino.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite)
      .map(([id]) => id);
    
    // Obtener adisos en orden de relevancia
    const { data: adisosData, error } = await supabase
      .from('adisos')
      .select('*')
      .in('id', adisoIdsOrdenados);
    
    if (error || !adisosData) {
      throw error || new Error('Error al obtener adisos');
    }
    
    // Ordenar según el orden de relevancia
    const adisosOrdenados = adisoIdsOrdenados
      .map(id => adisosData.find(a => a.id === id))
      .filter((a): a is any => a !== undefined);
    
    const { dbToAdiso } = await import('./supabase');
    return adisosOrdenados.map(dbToAdiso);
  } catch (error: any) {
    console.error('Error en búsqueda múltiple TOON:', error);
    throw error;
  }
}











