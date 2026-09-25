/**
 * Base de Datos Geográfica de Cusco
 * 
 * Incluye provincias, distritos, coordenadas aproximadas y mapeo de variantes ortográficas
 */

export interface DistritoCusco {
  nombre: string; // Nombre canónico
  variantes: string[]; // Nombres alternativos y variantes ortográficas
  provincia: string;
  coordenadas: { lat: number; lng: number }; // Coordenadas aproximadas del centro del distrito
  referencias?: string[]; // Referencias comunes mencionadas en adisos
}

export interface ProvinciaCusco {
  nombre: string;
  distritos: DistritoCusco[];
}

// Base de datos completa de distritos de Cusco
// Provincias principales donde se publican la mayoría de adisos
export const DISTRITOS_CUSCO: DistritoCusco[] = [
  // PROVINCIA DE CUSCO (Principal - 99.99% de los adisos)
  {
    nombre: 'Cusco',
    variantes: ['Cusco', 'Cuzco', 'Cuzco', 'CUSCO', 'cusco', 'Cercado de Cusco', 'Centro de Cusco', 'Plaza de Armas'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5319, lng: -71.9675 },
    referencias: ['Plaza de Armas', 'Centro', 'Cercado', 'Centro Histórico']
  },
  {
    nombre: 'Wanchaq',
    variantes: ['Wanchaq', 'Wánchaq', 'WANCHAQ', 'wanchaq', 'Wanchaq', 'Wanchaq', 'Wanchaq'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5200, lng: -71.9800 },
    referencias: ['Velazco Astete', 'Aeropuerto', 'Ovalito', 'Ministerio de Transportes', 'EsSalud']
  },
  {
    nombre: 'San Sebastián',
    variantes: ['San Sebastián', 'San Sebastian', 'San Sebastián', 'SAN SEBASTIAN', 'san sebastian', 'San Sebastián', 'San Sebastian'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5400, lng: -71.9500 },
    referencias: ['Universidad Andina', 'Larapa', 'Túpac Amaru', 'Puente Túpac Amaru', 'U Andina']
  },
  {
    nombre: 'Santiago',
    variantes: ['Santiago', 'SANTIAGO', 'santiago', 'Santiago de Cusco'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5250, lng: -71.9750 },
    referencias: ['Manzanapata', 'Mercado Central']
  },
  {
    nombre: 'San Jerónimo',
    variantes: ['San Jerónimo', 'San Jeronimo', 'San Jerónimo', 'SAN JERONIMO', 'san jerónimo', 'San Jeronimo', 'San Jerónimo'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5500, lng: -71.9400 },
    referencias: ['Paradero San Juan', 'Banco de la Nación', 'MAESTRO', 'APROVITE', 'Santa Marta']
  },
  {
    nombre: 'Saylla',
    variantes: ['Saylla', 'SAYLLA', 'saylla', 'Saylla'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5600, lng: -71.9200 },
    referencias: []
  },
  {
    nombre: 'Poroy',
    variantes: ['Poroy', 'POROY', 'poroy'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.4800, lng: -72.0000 },
    referencias: []
  },
  {
    nombre: 'Ccorca',
    variantes: ['Ccorca', 'CCORCA', 'ccorca'],
    provincia: 'Cusco',
    coordenadas: { lat: -13.5000, lng: -72.0200 },
    referencias: []
  },
  
  // Otras provincias (menos comunes pero pueden aparecer)
  {
    nombre: 'Urubamba',
    variantes: ['Urubamba', 'URUBAMBA', 'urubamba', 'Valle Sagrado'],
    provincia: 'Urubamba',
    coordenadas: { lat: -13.3053, lng: -72.1156 },
    referencias: ['Valle Sagrado']
  },
  {
    nombre: 'Ollantaytambo',
    variantes: ['Ollantaytambo', 'Ollantaytambo', 'OLLANTAYTAMBO'],
    provincia: 'Urubamba',
    coordenadas: { lat: -13.2581, lng: -72.2633 },
    referencias: []
  },
  {
    nombre: 'Chinchero',
    variantes: ['Chinchero', 'CHINCHERO', 'chinchero'],
    provincia: 'Urubamba',
    coordenadas: { lat: -13.3922, lng: -72.0478 },
    referencias: []
  },
  {
    nombre: 'Machupicchu',
    variantes: ['Machupicchu', 'Machu Picchu', 'Machupicchu', 'Aguas Calientes'],
    provincia: 'Urubamba',
    coordenadas: { lat: -13.1631, lng: -72.5450 },
    referencias: ['Aguas Calientes']
  },
  {
    nombre: 'Calca',
    variantes: ['Calca', 'CALCA', 'calca'],
    provincia: 'Calca',
    coordenadas: { lat: -13.3333, lng: -71.9500 },
    referencias: []
  },
  {
    nombre: 'Sicuani',
    variantes: ['Sicuani', 'SICUANI', 'sicuani'],
    provincia: 'Canchis',
    coordenadas: { lat: -14.2694, lng: -71.2256 },
    referencias: []
  },
  {
    nombre: 'Quillabamba',
    variantes: ['Quillabamba', 'QUILLABAMBA', 'quillabamba'],
    provincia: 'La Convención',
    coordenadas: { lat: -12.8700, lng: -72.6900 },
    referencias: []
  },
  {
    nombre: 'Abancay',
    variantes: ['Abancay', 'ABANCAY', 'abancay'],
    provincia: 'Abancay', // Provincia de Apurímac, pero mencionada en la revista
    coordenadas: { lat: -13.6333, lng: -72.8833 },
    referencias: []
  }
];

// Mapa rápido de variantes a nombre canónico
const MAPA_VARIANTES: Map<string, string> = new Map();

// Construir mapa de variantes
DISTRITOS_CUSCO.forEach(distrito => {
  // Agregar nombre canónico
  MAPA_VARIANTES.set(distrito.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), distrito.nombre);
  
  // Agregar todas las variantes
  distrito.variantes.forEach(variante => {
    const clave = variante.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!MAPA_VARIANTES.has(clave)) {
      MAPA_VARIANTES.set(clave, distrito.nombre);
    }
  });
});

/**
 * Normaliza el nombre de un distrito, mapeando variantes ortográficas al nombre canónico
 * 
 * @param nombre - Nombre del distrito (puede tener variantes ortográficas)
 * @returns Nombre canónico del distrito o null si no se reconoce
 */
export function normalizarNombreDistrito(nombre: string): string | null {
  if (!nombre || typeof nombre !== 'string') {
    return null;
  }
  
  // Normalizar: convertir a minúsculas y eliminar tildes para comparación
  const nombreNormalizado = nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Eliminar tildes
  
  // Buscar en el mapa
  const nombreCanonico = MAPA_VARIANTES.get(nombreNormalizado);
  
  if (nombreCanonico) {
    return nombreCanonico;
  }
  
  // Búsqueda parcial (por si el nombre contiene el distrito)
  for (const [variante, canonico] of MAPA_VARIANTES.entries()) {
    if (nombreNormalizado.includes(variante) || variante.includes(nombreNormalizado)) {
      return canonico;
    }
  }
  
  return null;
}

/**
 * Obtiene información completa de un distrito por su nombre (normalizado)
 * 
 * @param nombre - Nombre del distrito
 * @returns Información del distrito o null si no se encuentra
 */
export function obtenerDistritoCusco(nombre: string): DistritoCusco | null {
  const nombreCanonico = normalizarNombreDistrito(nombre);
  
  if (!nombreCanonico) {
    return null;
  }
  
  return DISTRITOS_CUSCO.find(d => d.nombre === nombreCanonico) || null;
}

/**
 * Obtiene todos los distritos de una provincia
 * 
 * @param provincia - Nombre de la provincia
 * @returns Array de distritos de la provincia
 */
export function obtenerDistritosPorProvincia(provincia: string): DistritoCusco[] {
  return DISTRITOS_CUSCO.filter(d => 
    d.provincia.toLowerCase() === provincia.toLowerCase()
  );
}

/**
 * Busca un distrito en un texto, retornando el distrito encontrado y su posición
 * 
 * @param texto - Texto donde buscar el distrito
 * @returns Distrito encontrado o null
 */
export function buscarDistritoEnTexto(texto: string): DistritoCusco | null {
  if (!texto || typeof texto !== 'string') {
    return null;
  }
  
  const textoLower = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Buscar por nombre canónico y variantes
  for (const distrito of DISTRITOS_CUSCO) {
    // Buscar nombre canónico
    const nombreCanonicoLower = distrito.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (textoLower.includes(nombreCanonicoLower)) {
      return distrito;
    }
    
    // Buscar variantes
    for (const variante of distrito.variantes) {
      const varianteLower = variante.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (textoLower.includes(varianteLower)) {
        return distrito;
      }
    }
  }
  
  return null;
}

/**
 * Obtiene coordenadas aproximadas de un distrito
 * 
 * @param nombreDistrito - Nombre del distrito
 * @returns Coordenadas o null si no se encuentra
 */
export function obtenerCoordenadasDistrito(nombreDistrito: string): { lat: number; lng: number } | null {
  const distrito = obtenerDistritoCusco(nombreDistrito);
  return distrito ? distrito.coordenadas : null;
}

/**
 * Valida si un nombre de distrito es reconocido
 * 
 * @param nombre - Nombre del distrito
 * @returns true si el distrito es reconocido
 */
export function esDistritoValido(nombre: string): boolean {
  return normalizarNombreDistrito(nombre) !== null;
}

/**
 * Obtiene todos los distritos disponibles
 * 
 * @returns Array con todos los distritos
 */
export function obtenerTodosLosDistritos(): DistritoCusco[] {
  return [...DISTRITOS_CUSCO];
}

/**
 * Obtiene las provincias disponibles
 * 
 * @returns Array con nombres de provincias únicas
 */
export function obtenerProvincias(): string[] {
  const provincias = new Set(DISTRITOS_CUSCO.map(d => d.provincia));
  return Array.from(provincias).sort();
}











