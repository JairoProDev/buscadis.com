import { supabase } from './supabase';
import { Adiso, Categoria } from '@/types';
import { AnalisisBusqueda } from './chatbot-nlu';

interface ResultadoConScore {
    adiso: Adiso;
    score: number;
}

function diasDesde(fecha: string): number {
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - fechaObj.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula score de relevancia para un aviso
 */
function calcularScore(adiso: Adiso, analisis: AnalisisBusqueda): number {
    let score = 0;
    const tituloLower = adiso.titulo.toLowerCase();
    const descripcionLower = (adiso.descripcion || '').toLowerCase();
    const categoriaLower = adiso.categoria.toLowerCase();
    const textoCompleto = `${tituloLower} ${descripcionLower}`;

    // 1. Coincidencia de términos (CRÍTICO)
    for (const termino of analisis.terminos) {
        if (tituloLower.includes(termino)) score += 20; // Peso muy alto en título
        else if (descripcionLower.includes(termino)) score += 10;
    }

    // 2. Coincidencia de sinónimos
    const terminosOriginales = new Set(analisis.terminos);
    for (const termino of analisis.terminosExpandidos) {
        if (!terminosOriginales.has(termino) && textoCompleto.includes(termino)) {
            score += 5;
        }
    }

    // 3. Categoría (Importante pero no bloqueante en ranking)
    if (analisis.categoria && categoriaLower === analisis.categoria) {
        score += 15;
    }

    // 4. Ubicación
    if (analisis.ubicacion) {
        const ubicacionAdiso = typeof adiso.ubicacion === 'string'
            ? adiso.ubicacion.toLowerCase()
            : `${adiso.ubicacion.distrito || ''} ${adiso.ubicacion.provincia || ''}`.toLowerCase();

        if (ubicacionAdiso.includes(analisis.ubicacion.toLowerCase())) {
            score += 10;
        }
    }

    // 5. Frescura (Muy importante para clasificados)
    const dias = diasDesde(adiso.fechaPublicacion);
    if (dias < 3) score += 10;
    else if (dias < 7) score += 5;
    else if (dias < 30) score += 2;

    // 6. Estado
    if (adiso.estaActivo) score += 5;
    if (adiso.esHistorico) score -= 10; // Penalización fuerte a históricos si hay activos

    return score;
}

/**
 * Función principal de búsqueda inteligente
 */
export async function buscarMejorada(analisis: AnalisisBusqueda, limite: number = 20): Promise<Adiso[]> {
    if (!supabase) throw new Error('Supabase no configurado');

    try {
        // ESTRATEGIA:
        // 1. Buscar coincidencia amplia de texto en BD (full text search o ilike)
        // 2. Traer un conjunto grande de candidatos (ej: 50)
        // 3. Filtrar y rankear en memoria (JavaScript) para máxima flexibilidad
        //    Esto evita que un filtro estricto de SQL oculte resultados buenos.

        // Construir términos para la query SQL
        // Si hay términos específicos, usarlos. Si no, usar categoría.
        const terminosBusqueda = analisis.terminosExpandidos.length > 0
            ? analisis.terminosExpandidos
            : analisis.categoria ? [analisis.categoria] : [];

        let dataCandidatos: any[] = [];

        // CASO 1: Búsqueda por texto (si hay términos)
        if (terminosBusqueda.length > 0) {
            // Usar 'or' para que coincida ALGUNO de los términos
            // Esto maximiza el recall (recuperación)
            const condiciones = terminosBusqueda.slice(0, 5).map(t =>
                `titulo.ilike.%${t}%,descripcion.ilike.%${t}%`
            ).join(',');

            const { data } = await supabase
                .from('adisos')
                .select('*')
                .or(condiciones)
                .limit(50); // Traemos más para filtrar luego

            if (data) dataCandidatos = data;
        }
        // CASO 2: Solo categoría (sin términos de texto)
        else if (analisis.categoria) {
            const { data } = await supabase
                .from('adisos')
                .select('*')
                .eq('categoria', analisis.categoria)
                .limit(30);

            if (data) dataCandidatos = data;
        }
        // CASO 3: Búsqueda global (fallback)
        else {
            const { data } = await supabase
                .from('adisos')
                .select('*')
                .order('fecha_publicacion', { ascending: false })
                .limit(20);

            if (data) dataCandidatos = data;
        }

        // Convertir a objetos Adiso
        const { dbToAdiso } = await import('./supabase');
        const adisosCandidatos = dataCandidatos.map(dbToAdiso);

        // Rankear y Filtrar en Memoria
        const resultadosRankeados = adisosCandidatos.map(adiso => ({
            adiso,
            score: calcularScore(adiso, analisis)
        }));

        // Ordenar por score
        resultadosRankeados.sort((a, b) => b.score - a.score);

        // Filtrar resultados con score muy bajo (ruido)
        // Si el score es muy bajo, probablemente coincidió una palabra común ("de", "la")
        // El umbral depende de cómo sumamos. Mínimo debería coincidir algo relevante.
        const filtrados = resultadosRankeados.filter(r => r.score > 5);

        // Devolver los top N
        return filtrados.slice(0, limite).map(r => r.adiso);

    } catch (error) {
        console.error('Error en búsqueda mejorada:', error);
        // Fallback de emergencia
        return [];
    }
}

export function generarRespuestaBusqueda(resultados: Adiso[], analisis: AnalisisBusqueda): string {
    const term =
        analisis.terminos[0] ||
        (analisis.categoria ? analisis.categoria : 'tu búsqueda');

    if (resultados.length === 0) {
        return `No encontré avisos claros para «${term}». Si me das zona o presupuesto, puedo afinar la búsqueda.`;
    }

    const shown = Math.min(resultados.length, 3);
    if (resultados.length === 1) {
        return `Encontré 1 aviso que encaja con «${term}». Te lo resumo para que decidas rápido:`;
    }

    return `Revisé ${resultados.length} avisos sobre «${term}». Te destaco las ${shown} mejores opciones según relevancia y calidad del anuncio:`;
}
