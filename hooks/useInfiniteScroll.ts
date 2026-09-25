import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void | Promise<void>;
  threshold?: number; // Distancia desde el final en píxeles para cargar más
  rootMargin?: string; // Margen del root para Intersection Observer
  enabled?: boolean; // Habilitar/deshabilitar el scroll infinito
}

/**
 * Hook profesional para infinite scroll usando Intersection Observer
 * Optimizado para rendimiento y UX
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200, // Cargar cuando queden 200px para el final
  rootMargin = '0px',
  enabled = true
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  // Prevenir múltiples cargas simultáneas
  const handleLoadMore = useCallback(async () => {
    const now = Date.now();
    // Throttle: mínimo 500ms entre cargas
    if (isLoadingRef.current || now - lastLoadTimeRef.current < 500) {
      return;
    }

    if (hasMore && !isLoading) {
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;

      try {
        await onLoadMore();
      } catch (error) {
        console.error('Error al cargar más elementos:', error);
      } finally {
        // Pequeño delay antes de permitir otra carga
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 300);
      }
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Configurar Intersection Observer
  useEffect(() => {
    if (!enabled || !hasMore || isLoading) {
      return;
    }

    // Limpiar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Crear nuevo observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingRef.current) {
          handleLoadMore();
        }
      },
      {
        root: null, // Viewport
        rootMargin: rootMargin,
        threshold: 0.1 // Trigger cuando 10% del elemento es visible
      }
    );

    // Observar el elemento sentinel
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, isLoading, handleLoadMore, rootMargin]);

  // Actualizar ref de loading
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Si sigue intersectando después de cargar, volver a intentar (por si no se llenó la pantalla)
  // Esto es crucial para categorías con pocos adisos por página
  useEffect(() => {
    if (isIntersecting && !isLoading && hasMore && enabled) {
      // Usamos un pequeño delay para evitar bucles infinitos agresivos 
      // y dar tiempo al DOM para renderizar los nuevos elementos
      const timer = setTimeout(() => {
        if (isIntersecting && !isLoading && hasMore) {
          handleLoadMore();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isIntersecting, isLoading, hasMore, enabled, handleLoadMore]);

  return {
    sentinelRef,
    isIntersecting
  };
}



