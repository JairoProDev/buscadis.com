import { nanoid } from 'nanoid';
import { Adiso, Categoria } from '@/types';
import { getAdisoAbsoluteUrl } from '@/lib/url';
import { getSiteUrl } from '@/lib/seo/og-image';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatFecha = (fecha: string, hora: string): string => {
  const date = new Date(`${fecha}T${hora}`);

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/** URL para compartir: SEO si hay objeto Adiso; legacy /{categoria}/{id} si solo hay id */
export function resolveAdisoShareUrl(
  adisoOrCategoria: Adiso | string,
  id?: string
): string {
  if (typeof adisoOrCategoria === 'string' && id) {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : getSiteUrl();
    return `${origin}/${adisoOrCategoria}/${id}`;
  }
  return getAdisoAbsoluteUrl(adisoOrCategoria as Adiso);
}

export const getWhatsAppUrl = (
  contacto: string,
  titulo: string,
  adisoOrCategoria: Adiso | string,
  id?: string
): string => {
  const url = resolveAdisoShareUrl(adisoOrCategoria, id);
  const categoria =
    typeof adisoOrCategoria === 'string'
      ? adisoOrCategoria
      : adisoOrCategoria.categoria;
  const mensajeBase = `Hola, vi tu adiso de ${categoria} "${titulo}" en ${url} y me interesa. ¿Podrías brindarme más información, por favor?`;
  const mensaje = encodeURIComponent(mensajeBase);
  const numero = contacto.replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${mensaje}`;
};

export const copiarLink = (adisoOrCategoria: Adiso | string, id?: string): Promise<void> => {
  const url = resolveAdisoShareUrl(adisoOrCategoria, id);
  return navigator.clipboard.writeText(url);
};

export const compartirNativo = async (
  adisoOrCategoria: Adiso | string,
  idOrTitulo?: string,
  titulo?: string
): Promise<void> => {
  const url = resolveAdisoShareUrl(
    adisoOrCategoria,
    typeof adisoOrCategoria === 'string' ? idOrTitulo : undefined
  );
  const shareTitle =
    typeof adisoOrCategoria === 'string'
      ? (titulo ?? 'Adiso en Buscadis')
      : adisoOrCategoria.titulo;

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `Mira este adiso: ${shareTitle}`,
        url,
      });
    } catch (err) {
      console.log('Error al compartir:', err);
    }
  } else {
    await copiarLink(adisoOrCategoria, idOrTitulo);
  }
};

// Generar URL para compartir búsqueda
export const getBusquedaUrl = (categoria?: Categoria | 'todos', buscar?: string): string => {
  const params = new URLSearchParams();
  if (categoria && categoria !== 'todos') {
    params.set('categoria', categoria);
  }
  if (buscar && buscar.trim()) {
    params.set('buscar', buscar.trim());
  }
  const query = params.toString();
  return `${typeof window !== 'undefined' ? window.location.origin : ''}${query ? `/?${query}` : '/'}`;
};

// Validación y formateo de teléfono
export const formatPhoneNumber = (value: string): string => {
  // Remover todo excepto números, + y espacios
  const cleaned = value.replace(/[^\d+\s]/g, '');

  // Si empieza con +, mantenerlo
  if (cleaned.startsWith('+')) {
    // Formato: +XX XXX XXX XXX
    const numbers = cleaned.replace(/\D/g, '').slice(1); // Quitar el +
    if (numbers.length <= 3) {
      return `+${numbers}`;
    } else if (numbers.length <= 6) {
      return `+${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `+${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    } else {
      return `+${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)} ${numbers.slice(9, 12)}`;
    }
  } else {
    // Formato sin +: XXX XXX XXX
    const numbers = cleaned.replace(/\D/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)} ${numbers.slice(9, 12)}`;
    }
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Remover espacios y validar
  const cleaned = phone.replace(/\s/g, '');
  // Debe tener al menos 8 dígitos (con o sin código de país)
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

// Límites de caracteres
export const LIMITS = {
  TITULO_MAX: 100,
  DESCRIPCION_MAX: 1000,
  UBICACION_MAX: 100,
};

// Generar ID único y amigable usando NanoID
export const generarIdUnico = (): string => {
  // NanoID con 10 caracteres (64 caracteres posibles: A-Z, a-z, 0-9, _, -)
  // URL-safe y corto: "V1StGXR8_Z" vs UUID "d9e7063d-be4a-45d0-ab03-bde870306c8d"
  return nanoid(10);
};

