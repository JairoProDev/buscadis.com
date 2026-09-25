/**
 * Algoritmo de Detección Automática de Tamaño Visual de Adisos
 * 
 * Detecta el tamaño basado en cantidad de texto, estructura y contenido
 */

import { TamañoPaquete } from '@/types';

/**
 * Cuenta las líneas efectivas de texto (ignorando líneas vacías)
 * 
 * @param texto - Texto a analizar
 * @returns Número de líneas efectivas
 */
function contarLineasEfectivas(texto: string): number {
  if (!texto || typeof texto !== 'string') {
    return 0;
  }
  
  const lineas = texto.split('\n').filter(linea => linea.trim().length > 0);
  return lineas.length;
}

/**
 * Detecta si el texto tiene estructura compleja (listas, secciones, etc.)
 * 
 * @param texto - Texto a analizar
 * @returns true si tiene estructura compleja
 */
function tieneEstructuraCompleja(texto: string): boolean {
  if (!texto) {
    return false;
  }
  
  // Detectar listas (viñetas, números, guiones)
  const tieneListas = /^[\s]*[-•*]\s|^\d+[\.\)]\s/m.test(texto);
  
  // Detectar múltiples secciones (títulos en mayúsculas seguidos de texto)
  const tieneSecciones = /^[A-ZÁÉÍÓÚÑ\s]{5,}$/m.test(texto);
  
  // Detectar múltiples párrafos (saltos de línea dobles)
  const tieneParrafos = /\n\s*\n/.test(texto);
  
  // Detectar formato estructurado (dos puntos seguidos de información)
  const tieneFormatoEstructurado = /:\s*[A-Z]/.test(texto);
  
  return tieneListas || tieneSecciones || tieneParrafos || tieneFormatoEstructurado;
}

/**
 * Detecta si el adiso tiene títulos destacados
 * 
 * @param texto - Texto a analizar
 * @returns true si tiene títulos destacados
 */
function tieneTitulosDestacados(texto: string): boolean {
  if (!texto) {
    return false;
  }
  
  // Títulos en mayúsculas al inicio
  const tituloMayusculas = /^[A-ZÁÉÍÓÚÑ\s]{10,}/m.test(texto);
  
  // Títulos con formato especial (subrayado, etc.)
  const tituloFormato = /^[A-ZÁÉÍÓÚÑ\s]+\n[-=]+/m.test(texto);
  
  return tituloMayusculas || tituloFormato;
}

/**
 * Cuenta menciones de precios en el texto
 * 
 * @param texto - Texto a analizar
 * @returns Número de menciones de precio
 */
function contarMencionesPrecio(texto: string): number {
  if (!texto) {
    return 0;
  }
  
  // Patrones de precios: S/., $, soles
  const patronesPrecio = [
    /S\/\.?\s*\d+/g,
    /\$\s*\d+/g,
    /\d+\s*soles?/gi,
    /precio\s*:?\s*S?\/?\.?\s*\d+/gi,
  ];
  
  let contador = 0;
  patronesPrecio.forEach(patron => {
    const matches = texto.match(patron);
    if (matches) {
      contador += matches.length;
    }
  });
  
  return contador;
}

/**
 * Detecta el tamaño visual de un adiso basado en su contenido
 * 
 * @param texto - Texto completo del adiso (antes de limpiar contactos)
 * @param titulo - Título del adiso (opcional)
 * @returns Tamaño detectado
 */
export function detectarTamañoVisual(texto: string, titulo?: string): TamañoPaquete {
  if (!texto || typeof texto !== 'string') {
    return 'pequeño'; // Default
  }
  
  // Limpiar texto de espacios múltiples y normalizar
  const textoLimpio = texto.replace(/\s+/g, ' ').trim();
  const textoCompleto = titulo ? `${titulo} ${textoLimpio}` : textoLimpio;
  
  // Contar líneas efectivas (sin contar títulos muy largos)
  const lineas = contarLineasEfectivas(texto);
  const caracteres = textoCompleto.length;
  const palabras = textoCompleto.split(/\s+/).length;
  const tieneEstructura = tieneEstructuraCompleja(texto);
  const tieneTitulos = tieneTitulosDestacados(texto);
  const mencionesPrecio = contarMencionesPrecio(textoCompleto);
  
  // Criterios de detección (ajustados para reflejar la realidad de adisos clasificados)
  // La mayoría de adisos clasificados son pequeños o miniatura
  
  // MINIATURA: 1-3 líneas, muy compacto, sin estructura
  if (lineas <= 3 && caracteres < 150 && palabras < 25) {
    return 'miniatura';
  }
  
  // PEQUEÑO: 4-8 líneas, estructura básica
  // La mayoría de adisos clasificados caen aquí
  if (lineas <= 8 && caracteres < 400 && palabras < 60) {
    return 'pequeño';
  }
  
  // MEDIANO: 9-15 líneas, múltiples párrafos
  if (lineas <= 15 && caracteres < 700 && palabras < 120) {
    // Si tiene estructura compleja, puede ser grande
    if (tieneEstructura && lineas > 12 && mencionesPrecio > 2) {
      return 'grande';
    }
    return 'mediano';
  }
  
  // GRANDE: 16-25 líneas, múltiples secciones
  if (lineas <= 25 && caracteres < 1200 && palabras < 200) {
    // Solo si tiene estructura muy compleja y muchos detalles, puede ser gigante
    if (tieneEstructura && tieneTitulos && mencionesPrecio > 4 && lineas > 22 && palabras > 180) {
      return 'gigante';
    }
    return 'grande';
  }
  
  // GIGANTE: +25 líneas, muy detallado, múltiples secciones
  // Solo para adisos realmente extensos (pocos casos)
  if (lineas > 25 && caracteres > 1200 && palabras > 200) {
    return 'gigante';
  }
  
  // Default conservador: si está en el límite, usar grande
  return 'grande';
}

/**
 * Detecta el tamaño visual basado solo en cantidad de caracteres
 * (Método alternativo más simple)
 * 
 * @param caracteres - Número de caracteres del texto
 * @returns Tamaño estimado
 */
export function detectarTamañoPorCaracteres(caracteres: number): TamañoPaquete {
  if (caracteres < 100) {
    return 'miniatura';
  } else if (caracteres < 300) {
    return 'pequeño';
  } else if (caracteres < 700) {
    return 'mediano';
  } else if (caracteres < 1200) {
    return 'grande';
  } else {
    return 'gigante';
  }
}

/**
 * Detecta el tamaño visual basado solo en cantidad de líneas
 * (Método alternativo)
 * 
 * @param lineas - Número de líneas del texto
 * @returns Tamaño estimado
 */
export function detectarTamañoPorLineas(lineas: number): TamañoPaquete {
  if (lineas <= 3) {
    return 'miniatura';
  } else if (lineas <= 8) {
    return 'pequeño';
  } else if (lineas <= 15) {
    return 'mediano';
  } else if (lineas <= 25) {
    return 'grande';
  } else {
    return 'gigante';
  }
}

