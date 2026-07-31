import { Categoria } from '@/types';

/**
 * Palabras de relleno que no aportan valor a la búsqueda
 */
const STOP_WORDS = new Set([
    'quiero', 'busco', 'necesito', 'me', 'interesa', 'un', 'una', 'el', 'la',
    'en', 'de', 'para', 'por', 'con', 'sin', 'sobre', 'entre', 'hasta',
    'desde', 'hacia', 'que', 'como', 'donde', 'cuando', 'cual', 'cuales',
    'hay', 'tiene', 'tengo', 'ver', 'dame', 'muestra', 'muéstrame', 'quisiera', 'deseo'
]);

/**
 * Diccionario de sinónimos para mejorar búsquedas
 */
const SINONIMOS: Record<string, string[]> = {
    'casa': ['vivienda', 'hogar', 'residencia', 'inmueble', 'domicilio'],
    'departamento': ['depa', 'flat', 'apartamento', 'piso', 'minidepartamento', 'mini'],
    'habitación': ['cuarto', 'dormitorio', 'pieza', 'recámara', 'habitacion'],
    'barato': ['económico', 'accesible', 'bajo costo', 'módico', 'oferta'],
    'caro': ['costoso', 'elevado', 'alto precio', 'lujo'],
    'nuevo': ['reciente', 'estreno', 'flamante'],
    'usado': ['segunda mano', 'ocasión'],
    'trabajo': ['empleo', 'chamba', 'labor', 'puesto', 'vacante', 'oportunidad'],
    'trabajadora': ['empleada', 'señora', 'asistenta', 'auxiliar'],
    'auto': ['carro', 'vehículo', 'automóvil', 'coche'],
    'moto': ['motocicleta', 'scooter', 'lineal'],
    'local': ['tienda', 'comercio', 'espacio comercial', 'stand', 'puesto'],
    'terreno': ['lote', 'sitio', 'solar', 'predio'],
    'ceviche': ['cevicheria', 'cevichería'],
    'comida': ['restaurante', 'menu', 'menú', 'almuerzo', 'cena'],
};

/**
 * Patrones de ubicación comunes en Cusco (case insensitive)
 */
const UBICACIONES_CUSCO = [
    'Cusco', 'Wanchaq', 'Wánchaq', 'San Sebastián', 'San Jerónimo', 'Santiago',
    'Centro', 'Plaza de Armas', 'Magisterio', 'Larapa', 'Ttio',
    'Lucrepata', 'Marcavalle', 'Huancaro', 'Oropesa', 'Saylla',
    'Poroy', 'Chinchero', 'Urubamba', 'Calca', 'Santa Monica', 'Santa Ana',
    'San Blas', 'Versalles', 'La Cultura', 'Los Incas'
];

/**
 * Mapeo de palabras clave a categorías con PESO
 * Un string = peso 1 (normal)
 * Un objeto {cat, peso} permite priorizar
 */
interface CategoriaPeso {
    cat: Categoria;
    peso: number;
}

const PALABRAS_CATEGORIA: Record<string, CategoriaPeso> = {
    // Empleos (Palabras fuertes)
    'empleo': { cat: 'empleos', peso: 2 },
    'trabajo': { cat: 'empleos', peso: 2 },
    'trabajar': { cat: 'empleos', peso: 2 },
    'chamba': { cat: 'empleos', peso: 2 },
    'vacante': { cat: 'empleos', peso: 2 },
    'puesto': { cat: 'empleos', peso: 1.5 },
    'personal': { cat: 'empleos', peso: 1.5 },
    'contratar': { cat: 'empleos', peso: 2 },
    'solicita': { cat: 'empleos', peso: 2.5 }, // Muy discriminante
    'requiere': { cat: 'empleos', peso: 2.5 }, // Muy discriminante
    'buscamos': { cat: 'empleos', peso: 2 },
    'necesita': { cat: 'empleos', peso: 1.5 },
    'ayudante': { cat: 'empleos', peso: 2 },
    'mozo': { cat: 'empleos', peso: 2 },
    'cocinero': { cat: 'empleos', peso: 2 },
    'chef': { cat: 'empleos', peso: 2 },
    'mesera': { cat: 'empleos', peso: 2 },
    'azafata': { cat: 'empleos', peso: 2 },
    'conductor': { cat: 'empleos', peso: 2 },
    'chofer': { cat: 'empleos', peso: 2 },
    'vendedor': { cat: 'empleos', peso: 2 },
    'asesor': { cat: 'empleos', peso: 1.5 },
    'practicante': { cat: 'empleos', peso: 2 },
    'profesional': { cat: 'empleos', peso: 1 },
    'técnico': { cat: 'empleos', peso: 1.5 },
    'trabajadora': { cat: 'empleos', peso: 2 }, // Corrección específica
    'empleada': { cat: 'empleos', peso: 2 },

    // Inmuebles
    'inmueble': { cat: 'inmuebles', peso: 2 },
    'casa': { cat: 'inmuebles', peso: 1.5 }, // Puede ser "casa de cambios"
    'departamento': { cat: 'inmuebles', peso: 2 },
    'terreno': { cat: 'inmuebles', peso: 2 },
    'lote': { cat: 'inmuebles', peso: 2 },
    'alquiler': { cat: 'inmuebles', peso: 1.5 }, // Puede ser "alquiler de autos"
    'alquilo': { cat: 'inmuebles', peso: 1.5 },
    'arriendo': { cat: 'inmuebles', peso: 2 },
    'anticresis': { cat: 'inmuebles', peso: 3 }, // Exclusivo inmuebles
    'vendo': { cat: 'inmuebles', peso: 1 }, // Ambiguo
    'venta': { cat: 'inmuebles', peso: 0.5 }, // Muy ambiguo
    'local': { cat: 'inmuebles', peso: 1.5 },
    'oficina': { cat: 'inmuebles', peso: 1.5 },
    'habitación': { cat: 'inmuebles', peso: 2 },
    'cuarto': { cat: 'inmuebles', peso: 1.5 },
    'minidepartamento': { cat: 'inmuebles', peso: 2 },
    'garaje': { cat: 'inmuebles', peso: 2 },
    'cochera': { cat: 'inmuebles', peso: 2 },

    // Vehículos
    'vehículo': { cat: 'vehiculos', peso: 3 },
    'vehiculo': { cat: 'vehiculos', peso: 3 },
    'auto': { cat: 'vehiculos', peso: 2 },
    'carro': { cat: 'vehiculos', peso: 2 },
    'moto': { cat: 'vehiculos', peso: 2 },
    'camioneta': { cat: 'vehiculos', peso: 2 },
    'camión': { cat: 'vehiculos', peso: 2 },
    'toyota': { cat: 'vehiculos', peso: 1.5 },
    'nissan': { cat: 'vehiculos', peso: 1.5 },
    'kia': { cat: 'vehiculos', peso: 1.5 },
    'hyundai': { cat: 'vehiculos', peso: 1.5 },

    // Servicios
    'servicio': { cat: 'servicios', peso: 1.5 },
    'reparación': { cat: 'servicios', peso: 2 },
    'mantenimiento': { cat: 'servicios', peso: 2 },
    'limpieza': { cat: 'servicios', peso: 1.5 }, // Ambiguo con empleo
    'plomero': { cat: 'servicios', peso: 2 },
    'electricista': { cat: 'servicios', peso: 2 },
    'gasfitero': { cat: 'servicios', peso: 2 },

    'instalación': { cat: 'servicios', peso: 1.5 },

    // Productos
    'producto': { cat: 'productos', peso: 2 },
    'mueble': { cat: 'productos', peso: 1.5 },
    'electrodoméstico': { cat: 'productos', peso: 2 },
    'celular': { cat: 'productos', peso: 2 },
    'laptop': { cat: 'productos', peso: 2 },
    'ropa': { cat: 'productos', peso: 2 },
    'zapatillas': { cat: 'productos', peso: 2 },

    // Eventos
    'evento': { cat: 'eventos', peso: 2 },
    'fiesta': { cat: 'eventos', peso: 2 },
    'celebración': { cat: 'eventos', peso: 2 },
    'concierto': { cat: 'eventos', peso: 2 },
    'show': { cat: 'eventos', peso: 2 },

    // Negocios
    'negocio': { cat: 'negocios', peso: 2 },
    'empresa': { cat: 'negocios', peso: 1.5 },
    'franquicia': { cat: 'negocios', peso: 2 },
    'socio': { cat: 'negocios', peso: 2 },
    'inversión': { cat: 'negocios', peso: 1.5 },
    'traspaso': { cat: 'negocios', peso: 2 }
};

/**
 * Resultado del análisis de búsqueda
 */
export interface AnalisisBusqueda {
    terminos: string[];
    terminosExpandidos: string[]; // Incluye sinónimos
    categoria?: Categoria;
    categoriaSecundaria?: Categoria; // Alternativa si hay ambigüedad
    ubicacion?: string;
    filtros: {
        precioMin?: number;
        precioMax?: number;
        habitaciones?: number;
    };
    confianza: number; // 0-1
}

/**
 * Normaliza texto
 */
function normalizarTexto(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\sa-ñ]/g, ' ') // Preservar eñe (o normalizar a n)
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Detecta la categoría del mensaje usando sistema de pesos
 */
function detectarCategoria(texto: string): { primaria?: Categoria; secundaria?: Categoria } {
    const textoNorm = normalizarTexto(texto);
    const palabras = textoNorm.split(' ');

    const puntaje: Partial<Record<Categoria, number>> = {};

    for (const palabra of palabras) {
        // Búsqueda exacta
        const match = PALABRAS_CATEGORIA[palabra];
        if (match) {
            puntaje[match.cat] = (puntaje[match.cat] || 0) + match.peso;
            continue;
        }

        // Búsqueda parcial (palabra contenida, menor peso)
        // Solo para palabras largas (>4 letras)
        if (palabra.length > 4) {
            for (const [clave, valor] of Object.entries(PALABRAS_CATEGORIA)) {
                if (clave.length > 4 && palabra.includes(clave)) {
                    puntaje[valor.cat] = (puntaje[valor.cat] || 0) + (valor.peso * 0.5);
                }
            }
        }
    }

    // Reglas especiales de contexto (Heurística)
    // "Busco trabajo" -> Empleo
    if (textoNorm.includes('busco trabajo') || textoNorm.includes('necesito trabajo')) {
        puntaje['empleos'] = (puntaje['empleos'] || 0) + 3;
    }
    // "Alquilo departamento" -> Inmueble
    if (textoNorm.includes('alquilo') || textoNorm.includes('vendo casa') || textoNorm.includes('busco habitacion')) {
        puntaje['inmuebles'] = (puntaje['inmuebles'] || 0) + 3;
    }

    // Convertir a array y ordenar
    const categoriasRankeadas = Object.entries(puntaje).sort((a, b) => b[1] - a[1]);

    if (categoriasRankeadas.length === 0) return {};

    return {
        primaria: categoriasRankeadas[0][0] as Categoria,
        secundaria: categoriasRankeadas.length > 1 ? categoriasRankeadas[1][0] as Categoria : undefined
    };
}

/**
 * Detecta la ubicación en el mensaje
 */
function detectarUbicacion(texto: string): string | undefined {
    const textoNorm = normalizarTexto(texto);

    for (const ubicacion of UBICACIONES_CUSCO) {
        const ubicacionNorm = normalizarTexto(ubicacion);
        if (textoNorm.includes(ubicacionNorm)) {
            return ubicacion;
        }
    }
    return undefined;
}

/**
 * Detecta filtros numéricos
 */
function detectarFiltros(texto: string): AnalisisBusqueda['filtros'] {
    const filtros: AnalisisBusqueda['filtros'] = {};

    const habitacionesMatch = texto.match(/(\d+)\s*(habitacion|dormitorio|cuarto|recamara)/i);
    if (habitacionesMatch) filtros.habitaciones = parseInt(habitacionesMatch[1]);

    const precioMatch = texto.match(/(?:s\/\.?|soles?)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (precioMatch) {
        // Si hay un rango detectado antes, ignorar esto como max único
        const rangoMatch = texto.match(/(?:s\/\.?|soles?)\s*(\d+)\s*(?:a|hasta|-)\s*(\d+)/i);
        if (!rangoMatch) {
            filtros.precioMax = parseFloat(precioMatch[1].replace(/,/g, ''));
        }
    }

    const rangoMatch = texto.match(/(?:s\/\.?|soles?)\s*(\d+)\s*(?:a|hasta|-)\s*(\d+)/i);
    if (rangoMatch) {
        filtros.precioMin = parseInt(rangoMatch[1]);
        filtros.precioMax = parseInt(rangoMatch[2]);
    }

    return filtros;
}

/**
 * Expande términos con sinónimos
 */
function expandirConSinonimos(terminos: string[]): string[] {
    const expandidos = new Set<string>(terminos);

    for (const termino of terminos) {
        for (const [palabra, sinonimos] of Object.entries(SINONIMOS)) {
            if (termino === palabra || sinonimos.includes(termino)) {
                expandidos.add(palabra);
                sinonimos.forEach(s => expandidos.add(s));
            }
        }
    }
    return Array.from(expandidos);
}

/**
 * Extrae términos de búsqueda relevantes
 */
function extraerTerminos(texto: string, categoria?: Categoria): string[] {
    const textoNorm = normalizarTexto(texto);
    const palabras = textoNorm.split(' ');

    const terminos = palabras.filter(palabra =>
        palabra.length > 2 && !STOP_WORDS.has(palabra)
    );

    if (categoria) {
        // Remover palabras exactas de categoría para limpiar la búsqueda
        // PERO mantenerlas si son específicas (ej: "cocinero")
        // Solo eliminamos las genéricas de la categoría
        const palabrasGenericas = Object.entries(PALABRAS_CATEGORIA)
            .filter(([key, val]) => val.cat === categoria && val.peso < 1.6) // Solo borrar genéricas
            .map(([palabra]) => palabra);

        return terminos.filter(t => !palabrasGenericas.includes(t));
    }

    return terminos;
}

/**
 * Analiza un mensaje de búsqueda
 */
export function analizarBusqueda(mensaje: string): AnalisisBusqueda {
    const { primaria, secundaria } = detectarCategoria(mensaje);
    const ubicacion = detectarUbicacion(mensaje);
    const filtros = detectarFiltros(mensaje);
    const terminos = extraerTerminos(mensaje, primaria);
    const terminosExpandidos = expandirConSinonimos(terminos);

    let confianza = 0.5;
    if (primaria) confianza += 0.2;
    if (ubicacion) confianza += 0.15;
    if (terminos.length > 0) confianza += 0.15;

    return {
        terminos,
        terminosExpandidos,
        categoria: primaria,
        categoriaSecundaria: secundaria,
        ubicacion,
        filtros,
        confianza: Math.min(confianza, 1)
    };
}

export function describirAnalisis(analisis: AnalisisBusqueda): string {
    const partes: string[] = [];
    if (analisis.categoria) partes.push(`Categoría: ${analisis.categoria}`);
    if (analisis.ubicacion) partes.push(`Ubicación: ${analisis.ubicacion}`);
    if (analisis.terminos.length > 0) partes.push(`Claves: ${analisis.terminos.join(', ')}`);
    return partes.join(' | ');
}
