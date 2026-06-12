import { Adiso } from '@/types';

const STORAGE_KEY = 'buscadis_adisos';

// Por defecto usa localStorage. Cambiar a false para usar API/Supabase
const USE_LOCAL_STORAGE = process.env.NEXT_PUBLIC_USE_LOCAL_STORAGE === 'true';

// Funciones que funcionan con localStorage (desarrollo)
const getAdisosLocal = (): Adiso[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer localStorage:', error);
    // Si hay error, limpiar y empezar de nuevo
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar errores al limpiar
    }
    return [];
  }
};

const saveAdisoLocal = (adiso: Adiso): void => {
  if (typeof window === 'undefined') return;
  try {
    const adisos = getAdisosLocal();
    // Prevenir duplicados: verificar si ya existe
    const existe = adisos.find(a => a.id === adiso.id);
    if (!existe) {
      adisos.unshift(adiso);
    } else {
      // Si existe, moverlo al inicio (LRU: más reciente al principio)
      const index = adisos.findIndex(a => a.id === adiso.id);
      if (index >= 0) {
        adisos.splice(index, 1);
        adisos.unshift(adiso); // Mover al inicio
      }
    }

    // LRU Cache: Mantener solo los más recientes y frecuentes
    // Priorizar adisos recientes (fecha de publicación) y mantener un límite inteligente
    const MAX_CACHE_SIZE = 50;

    // Ordenar por fecha de publicación (más recientes primero) y limitar
    const adisosOrdenados = adisos
      .sort((a, b) => {
        const fechaA = new Date(`${a.fechaPublicacion}T${a.horaPublicacion}:00`).getTime();
        const fechaB = new Date(`${b.fechaPublicacion}T${b.horaPublicacion}:00`).getTime();
        return fechaB - fechaA; // Más recientes primero
      })
      .slice(0, MAX_CACHE_SIZE);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(adisosOrdenados));
  } catch (error: any) {
    // Si hay error de cuota, limpiar y guardar solo el nuevo adiso
    if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
      console.warn('LocalStorage lleno, limpiando y guardando solo el nuevo adiso');
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([adiso]));
      } catch (cleanError) {
        console.error('Error al limpiar localStorage:', cleanError);
        // Si aún falla, no hacer nada (el adiso se guardará en Supabase)
      }
    } else {
      console.error('Error al guardar en localStorage:', error);
    }
  }
};

const getAdisoByIdLocal = (id: string): Adiso | null => {
  const adisos = getAdisosLocal();
  return adisos.find(a => a.id === id) || null;
};

// Obtener solo cache (instantáneo)
export const getAdisosCache = (): Adiso[] => {
  return getAdisosLocal();
};

// Funciones públicas que eligen entre localStorage o API
export const getAdisos = async (): Promise<Adiso[]> => {
  if (USE_LOCAL_STORAGE) {
    return getAdisosLocal();
  }

  // Si no usa localStorage, cargar desde API
  if (typeof window !== 'undefined') {
    try {
      const { fetchAdisos } = await import('./api');
      const response = await fetchAdisos();
      const adisosDesdeAPI = response.data;

      // Actualizar cache con datos frescos (LIMITADO para evitar QuotaExceededError)
      if (adisosDesdeAPI && adisosDesdeAPI.length > 0) {
        try {
          // Guardar solo los primeros 50 para no saturar el localStorage
          const cacheLimit = adisosDesdeAPI.slice(0, 50);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheLimit));
        } catch (storageError) {
          console.warn('No se pudo actualizar el cache en localStorage (probablemente lleno):', storageError);
        }
      }

      return adisosDesdeAPI;
    } catch (error) {
      console.error('Error al cargar desde API, usando localStorage:', error);
      return getAdisosLocal();
    }
  }

  return [];
};

export const removeAdisoFromLocalCache = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const adisos = getAdisosLocal().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adisos));
  } catch (error) {
    console.error('Error al quitar adiso del cache local:', error);
  }
};

export const saveAdiso = async (adiso: Adiso): Promise<void> => {
  if (USE_LOCAL_STORAGE) {
    saveAdisoLocal(adiso);
    return;
  }

  // Guardar en Supabase primero; el cache local solo si el servidor confirma
  if (typeof window !== 'undefined') {
    try {
      const { createAdiso, updateAdiso } = await import('./api');
      // Intentar crear, si falla por duplicado, actualizar
      try {
        const resultado = await createAdiso(adiso);
        console.log('✅ Adiso guardado en Supabase:', resultado.id);
        saveAdisoLocal(resultado);
        markAdisoAsOwn(resultado.id);
      } catch (error: any) {
        // Si el error es 409 (conflict) o el adiso ya existe, actualizar
        if (error?.message?.includes('ya existe') || error?.message?.includes('duplicado') || error?.response?.status === 409) {
          const resultado = await updateAdiso(adiso);
          console.log('✅ Adiso actualizado en Supabase:', resultado.id);
          saveAdisoLocal(resultado);
        } else {
          // Re-lanzar el error para que se maneje arriba
          throw error;
        }
      }
    } catch (error: any) {
      // Log detallado del error
      console.error('❌ Error al guardar en API:', error);
      console.error('Detalles del error:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        adisoId: adiso.id,
        adisoTitulo: adiso.titulo
      });

      // Lanzar el error para que el componente pueda manejarlo
      // Esto es importante para que el usuario sepa que hubo un problema
      throw new Error(`Error al guardar adiso en Supabase: ${error?.message || 'Error desconocido'}`);
    }
  }
};

export const getAdisoById = async (id: string): Promise<Adiso | null> => {
  // Primero buscar en cache (instantáneo)
  const cacheAdiso = getAdisoByIdLocal(id);

  if (USE_LOCAL_STORAGE) {
    return cacheAdiso;
  }

  // Si no está en cache, cargar desde API
  if (typeof window !== 'undefined') {
    try {
      const { fetchAdisoById } = await import('./api');
      const adiso = await fetchAdisoById(id);
      if (adiso) {
        saveAdisoLocal(adiso);
        return adiso;
      }
      // No existe en el servidor: quitar entradas fantasma de publicaciones fallidas
      if (cacheAdiso) {
        removeAdisoFromLocalCache(id);
      }
      return null;
    } catch (error) {
      console.error('Error al cargar desde API:', error);
      return cacheAdiso;
    }
  }

  return cacheAdiso;
};

// Funciones para rastrear adisos propios (sin autenticación, basado en localStorage)
const MY_ADISOS_KEY = 'buscadis_mis_adisos';

/**
 * Marca un adiso como propio del usuario actual
 */
export const markAdisoAsOwn = (adisoId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const myAdisos = getMyAdisos();
    if (!myAdisos.includes(adisoId)) {
      myAdisos.push(adisoId);
      localStorage.setItem(MY_ADISOS_KEY, JSON.stringify(myAdisos));
    }
  } catch (error) {
    console.error('Error al marcar adiso como propio:', error);
  }
};

/**
 * Elimina un adiso de la lista de adisos propios
 */
export const unmarkAdisoAsOwn = (adisoId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const myAdisos = getMyAdisos();
    const filtered = myAdisos.filter(id => id !== adisoId);
    localStorage.setItem(MY_ADISOS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error al desmarcar adiso como propio:', error);
  }
};

/**
 * Obtiene la lista de IDs de adisos propios
 */
export const getMyAdisos = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MY_ADISOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer adisos propios:', error);
    return [];
  }
};

/**
 * Verifica si un adiso es propio del usuario actual
 */
export const isMyAdiso = (adisoId: string): boolean => {
  const myAdisos = getMyAdisos();
  return myAdisos.includes(adisoId);
};

// --- FAVORITOS ---
const FAVORITES_KEY = 'buscadis_favoritos';

export const getFavoriteAdisos = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer favoritos:', error);
    return [];
  }
};

export const toggleFavoriteAdiso = (adisoId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const favorites = getFavoriteAdisos();
    const index = favorites.indexOf(adisoId);
    let isFav = false;

    if (index >= 0) {
      favorites.splice(index, 1);
      isFav = false;
    } else {
      favorites.push(adisoId);
      isFav = true;
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return isFav;
  } catch (error) {
    console.error('Error al cambiar favorito:', error);
    return false;
  }
};

export const isFavoriteAdiso = (adisoId: string): boolean => {
  const favorites = getFavoriteAdisos();
  return favorites.includes(adisoId);
};

// --- OCULTOS ---
const HIDDEN_KEY = 'buscadis_ocultos';

export const getHiddenAdisos = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HIDDEN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al leer ocultos:', error);
    return [];
  }
};

export const toggleHiddenAdiso = (adisoId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const hidden = getHiddenAdisos();
    const index = hidden.indexOf(adisoId);
    let isHidden = false;

    if (index >= 0) {
      hidden.splice(index, 1);
      isHidden = false;
    } else {
      hidden.push(adisoId);
      isHidden = true;
    }

    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
    return isHidden;
  } catch (error) {
    console.error('Error al cambiar oculto:', error);
    return false;
  }
};

export const isHiddenAdiso = (adisoId: string): boolean => {
  const hidden = getHiddenAdisos();
  return hidden.includes(adisoId);
};
