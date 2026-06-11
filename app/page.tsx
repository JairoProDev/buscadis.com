'use client';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams en Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Adiso, Categoria } from '@/types';
import { getAdisos, getAdisoById, saveAdiso, getAdisosCache } from '@/lib/storage';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getBusquedaUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { UbicacionDetallada } from '@/types';
import { useNavigation } from '@/contexts/NavigationContext';

// Función para calcular distancia entre dos puntos (Haversine)
function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
import { registrarBusqueda } from '@/lib/analytics';
import { onOnlineStatusChange, getOfflineMessage } from '@/lib/offline';
import dynamicImport from 'next/dynamic';
import Header from '@/components/Header';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconShare,
  IconGrid,
  IconFeed,
  IconList
} from '@/components/Icons';
import Buscador from '@/components/Buscador';
import Ordenamiento, { TipoOrdenamiento } from '@/components/Ordenamiento';
import FiltroUbicacion from '@/components/FiltroUbicacion';
import GrillaAdisos from '@/components/GrillaAdisos';
import SkeletonAdisos, { SkeletonToolbar } from '@/components/SkeletonAdisos';
import { ToastContainer } from '@/components/Toast';
import FeedbackButton from '@/components/FeedbackButton';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import PullToRefresh from '@/components/pwa/PullToRefresh';
import { getMarketplacePulse } from '@/lib/social-proof';

// Lazy load componentes pesados
const ModalAdiso = dynamicImport(() => import('@/components/ModalAdiso'), {
  loading: () => <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando adiso...</div>,
  ssr: false,
});

const FormularioPublicar = dynamicImport(() => import('@/components/FormularioPublicar'), {
  loading: () => <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando formulario...</div>,
  ssr: false,
});

const SidebarDesktop = dynamicImport(() => import('@/components/SidebarDesktop').then(mod => ({ default: mod.default })), {
  loading: () => null,
  ssr: false,
});

const ModalNavegacionMobile = dynamicImport(() => import('@/components/ModalNavegacionMobile'), {
  loading: () => null,
  ssr: false,
});

import type { SeccionSidebar } from '@/components/SidebarDesktop';

type SeccionMobile = 'adiso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos';

// Expresión regular profesional para limpiar datos de prueba residuales
const TEST_REGEX = /toyota test|test adiso|test anuncio/i;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile } = useUser();
  const adisoId = searchParams.get('adiso');
  const categoriaUrl = searchParams.get('categoria') as Categoria | null;
  const buscarUrl = searchParams.get('buscar') || '';
  const seccionUrl = searchParams.get('seccion') as SeccionSidebar | null;
  const cargadoInicialmente = useRef(false);

  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [adisosFiltrados, setAdisosFiltrados] = useState<Adiso[]>([]);
  const [busqueda, setBusqueda] = useState(buscarUrl);
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>(categoriaUrl && ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(categoriaUrl) ? categoriaUrl : 'todos');
  const [ordenamiento, setOrdenamiento] = useState<TipoOrdenamiento>('recientes');


  const [filtroUbicacion, setFiltroUbicacion] = useState<{
    departamento?: string;
    provincia?: string;
    distrito?: string;
    radioKm?: number;
  } | undefined>(undefined);
  const [adisoAbierto, setAdisoAbierto] = useState<Adiso | null>(null);
  const [indiceAdisoActual, setIndiceAdisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  // Estados para scroll infinito
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMasAdisos, setHayMasAdisos] = useState(true);
  const ITEMS_POR_PAGINA = 20;
  const [visibleCount, setVisibleCount] = useState(20);
  const [modalMobileAbierto, setModalMobileAbierto] = useState(false);
  const [seccionMobileInicial, setSeccionMobileInicial] = useState<SeccionMobile>('gratuitos');
  const [seccionMobileActiva, setSeccionMobileActiva] = useState<SeccionSidebar | null>(seccionUrl ? seccionUrl : null);
  const [seccionDesktopActiva, setSeccionDesktopActiva] = useState<SeccionSidebar>(seccionUrl ? seccionUrl : 'adiso');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mostrarFiltroUbicacion, setMostrarFiltroUbicacion] = useState(false);

  // Sync state with URL param 'seccion' to support deep linking from other pages
  useEffect(() => {
    if (seccionUrl) {
      if (isDesktop) {
        setSeccionDesktopActiva(seccionUrl);
      } else {
        setSeccionMobileActiva(seccionUrl);
      }
    }
  }, [seccionUrl, isDesktop]);
  const [vista, setVista] = useState<'grid' | 'list' | 'feed'>('grid');
  const [isSidebarMinimizado, setIsSidebarMinimizado] = useState(true);
  const { toasts, removeToast, success, error } = useToast();
  const marketplacePulse = getMarketplacePulse(adisosFiltrados);
  const [isOnlineState, setIsOnlineState] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const cleanup = onOnlineStatusChange((online) => {
      setIsOnlineState(online);
      if (!online) {
        error(getOfflineMessage());
      } else {
        success('Conexión restablecida');
      }
    });
    return cleanup;
  }, [error, success]);

  const handleRefresh = async () => {
    if (!navigator.onLine) {
      error('No puedes actualizar sin conexión a internet.');
      return;
    }
    setPaginaActual(1);
    setVisibleCount(20);
    try {
      const adisosDesdeAPI = await getAdisosFromSupabase({
        limit: ITEMS_POR_PAGINA,
        offset: 0,
        soloActivos: false
      });
      let nuevosFiltrados = adisosDesdeAPI;
      if (nuevosFiltrados.some(a => TEST_REGEX.test(a.titulo || ''))) {
        nuevosFiltrados = nuevosFiltrados.filter(a => !TEST_REGEX.test(a.titulo || ''));
      }
      setAdisos(nuevosFiltrados);
      setHayMasAdisos(adisosDesdeAPI.length === ITEMS_POR_PAGINA);
      success('Buscando anuncios recientes...');
    } catch (e) {
      console.error(e);
      error('Error al actualizar datos.');
    }
  };

  // Carga inicial: mostrar cache primero (instantáneo), luego actualizar desde API
  useEffect(() => {
    if (cargadoInicialmente.current) return;
    cargadoInicialmente.current = true;

    const cargarTodo = async () => {
      // Mostrar cache primero (instantáneo, síncrono)
      let cache = getAdisosCache();

      // LIMPIEZA: Si hay adisos de prueba locales antiguos, filtrarlos (Case Insensitive)

      if (cache.some(a => TEST_REGEX.test(a.titulo || ''))) {
        console.log('🧹 Limpiando adisos de prueba locales...');
        cache = cache.filter(a => !TEST_REGEX.test(a.titulo || ''));
        // Actualizar localStorage para que no vuelvan a aparecer
        if (typeof window !== 'undefined') {
          localStorage.setItem('buscadis_adisos', JSON.stringify(cache));
        }
      }

      if (cache.length > 0) {
        // Solo actualizar adisos - el useEffect de ordenamiento se encargará de adisosFiltrados
        setAdisos(cache);
        setCargando(false);

        // Si hay adisoId, buscarlo en cache
        if (adisoId) {
          const adisoCache = cache.find(a => a.id === adisoId);
          if (adisoCache) {
            setAdisoAbierto(adisoCache);
          } else {
            // Si no está en cache, cargarlo primero
            const adisoEspecifico = await getAdisoById(adisoId);
            if (adisoEspecifico && !TEST_REGEX.test(adisoEspecifico.titulo || '')) {
              setAdisoAbierto(adisoEspecifico);
              setAdisos(prev => [adisoEspecifico, ...prev]);
            }
          }
        }
      }

      // Actualizar desde API en background - cargar primera página
      try {
        let adisosDesdeAPI = await getAdisosFromSupabase({
          limit: ITEMS_POR_PAGINA,
          offset: 0,
          soloActivos: false // Mostrar todos, incluyendo históricos
        });

        // Filtrar también los resultados de la API
        if (adisosDesdeAPI.some(a => TEST_REGEX.test(a.titulo || ''))) {
          console.log('🧹 Filtrando adisos de prueba detectados en API...');
          adisosDesdeAPI = adisosDesdeAPI.filter(a => !TEST_REGEX.test(a.titulo || ''));
        }

        if (adisosDesdeAPI.length > 0 || cache.length === 0) {
          // Si hay menos de ITEMS_POR_PAGINA, no hay más páginas
          setHayMasAdisos(adisosDesdeAPI.length === ITEMS_POR_PAGINA);

          // Merge inteligente usando Map para evitar duplicados
          setAdisos(prev => {
            const adisosMap = new Map<string, Adiso>();
            // Primero agregar adisos desde API
            adisosDesdeAPI.forEach(adiso => {
              adisosMap.set(adiso.id, adiso);
            });
            // Luego agregar adisos locales que no están en API (pueden ser recién publicados)
            prev.forEach(adisoLocal => {
              if (!adisosMap.has(adisoLocal.id) && !TEST_REGEX.test(adisoLocal.titulo || '')) {
                adisosMap.set(adisoLocal.id, adisoLocal);
              }
            });
            return Array.from(adisosMap.values());
          });

          // Si hay adisoId, buscar en la lista actualizada
          if (adisoId) {
            setAdisos(prev => {
              const adisoEncontrado = prev.find(a => a.id === adisoId);
              if (adisoEncontrado) {
                setAdisoAbierto(adisoEncontrado);
              }
              return prev;
            });
          }
        } else {
          setHayMasAdisos(false);
        }
      } catch (error) {
        // Solo mostrar errores en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.error('Error al actualizar desde API:', error);
        }
        setHayMasAdisos(false);
      } finally {
        setCargando(false);
      }
    };

    cargarTodo();
  }, [adisoId]);

  // Manejar cambios en adisoId cuando ya está cargado (solo actualizar modal, no recargar página)
  useEffect(() => {
    if (cargando) return; // Esperar a que termine la carga inicial

    if (!adisoId) {
      setAdisoAbierto(null);
      if (isDesktop) {
        setIsSidebarMinimizado(true);
      }
      return;
    }

    // Buscar en adisos actuales primero (más rápido)
    const adisoLocal = adisos.find(a => a.id === adisoId);
    if (adisoLocal) {
      setAdisoAbierto(adisoLocal);
      if (isDesktop) {
        setIsSidebarMinimizado(false);
      }
      return;
    }

    // Si no está en local, cargarlo en background (sin bloquear UI)
    getAdisoById(adisoId).then(adiso => {
      if (adiso) {
        setAdisoAbierto(adiso);
        if (isDesktop) {
          setIsSidebarMinimizado(false);
        }
        setAdisos(prev => {
          if (!prev.find(a => a.id === adisoId)) {
            return [adiso, ...prev];
          }
          return prev;
        });
      }
    }).catch(console.error);
  }, [adisoId, adisos, cargando, isDesktop]);

  // Filtrado y ordenamiento
  useEffect(() => {
    // Si no hay adisos, no hacer nada
    if (adisos.length === 0) {
      setAdisosFiltrados([]);
      return;
    }

    // Filtrar siempre datos de prueba como salvaguarda final
    let filtrados = adisos.filter(a => !TEST_REGEX.test(a.titulo || ''));

    // Función auxiliar para parsear fechas - DEFINIDA DENTRO del useEffect
    const parsearFecha = (fechaPublicacion: string, horaPublicacion: string): number => {
      if (!fechaPublicacion) return 0;

      try {
        // Formato esperado: "YYYY-MM-DD" y "HH:MM"
        let hora = horaPublicacion || '00:00';

        // Normalizar formato de hora
        if (hora.length === 4) {
          // Si es "HHMM" sin los dos puntos, agregarlos
          hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
        } else if (hora.length !== 5) {
          // Si no tiene el formato correcto, intentar parsearlo
          hora = '00:00';
        }

        // Construir fecha completa en formato ISO
        const fechaStr = `${fechaPublicacion}T${hora}:00`;
        const fecha = new Date(fechaStr);

        // Verificar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
          return 0;
        }

        return fecha.getTime();
      } catch (error) {
        return 0;
      }
    };

    // Filtrar por categoría
    if (categoriaFiltro !== 'todos') {
      filtrados = filtrados.filter(a => a.categoria === categoriaFiltro);
    }

    // Filtrar por búsqueda
    if (busquedaDebounced.trim()) {
      const busquedaLower = busquedaDebounced.toLowerCase();
      filtrados = filtrados.filter(
        a => {
          const tituloMatch = a.titulo.toLowerCase().includes(busquedaLower);
          const descripcionMatch = a.descripcion.toLowerCase().includes(busquedaLower);

          // Buscar en ubicación (string o UbicacionDetallada)
          let ubicacionMatch = false;
          if (typeof a.ubicacion === 'string') {
            ubicacionMatch = a.ubicacion.toLowerCase().includes(busquedaLower);
          } else if (typeof a.ubicacion === 'object' && a.ubicacion !== null) {
            const ubi = a.ubicacion as any;
            ubicacionMatch =
              (ubi.departamento?.toLowerCase().includes(busquedaLower)) ||
              (ubi.provincia?.toLowerCase().includes(busquedaLower)) ||
              (ubi.distrito?.toLowerCase().includes(busquedaLower)) ||
              (ubi.direccion?.toLowerCase().includes(busquedaLower));
          }

          return tituloMatch || descripcionMatch || ubicacionMatch;
        }
      );

      // Registrar búsqueda (solo una vez por término)
      registrarBusqueda(user?.id, busquedaDebounced.trim(), filtrados.length);
    }

    // Filtrar por ubicación
    if (filtroUbicacion) {
      filtrados = filtrados.filter(a => {
        // Si no tiene ubicación, excluir solo si el filtro de ubicación es obligatorio
        if (!a.ubicacion) return false;

        const ubi = typeof a.ubicacion === 'string'
          ? { departamento: a.ubicacion, provincia: '', distrito: '' }
          : a.ubicacion as any;

        // Filtrar por distrito (más específico)
        if (filtroUbicacion.distrito) {
          const matchDistrito = ubi.distrito?.toLowerCase().trim() === filtroUbicacion.distrito.toLowerCase().trim();
          if (matchDistrito) return true;

          // Si hay radio de búsqueda y coordenadas, verificar distancia
          if (filtroUbicacion.radioKm && ubi.latitud && ubi.longitud &&
            profile?.latitud && profile?.longitud) {
            const distancia = calcularDistanciaKm(
              profile.latitud,
              profile.longitud,
              ubi.latitud,
              ubi.longitud
            );
            return distancia <= (filtroUbicacion.radioKm || 5);
          }
          return false;
        }

        // Filtrar por provincia
        if (filtroUbicacion.provincia) {
          const matchProvincia = ubi.provincia?.toLowerCase().trim() === filtroUbicacion.provincia.toLowerCase().trim();
          if (matchProvincia) return true;
          if (!filtroUbicacion.distrito) return false;
        }

        // Filtrar por departamento
        if (filtroUbicacion.departamento) {
          const matchDepartamento = ubi.departamento?.toLowerCase().trim() === filtroUbicacion.departamento.toLowerCase().trim();
          if (matchDepartamento) return true;
          if (!filtroUbicacion.provincia && !filtroUbicacion.distrito) return false;
        }

        return true;
      });
    }

    // Ordenar según el tipo seleccionado
    // IMPORTANTE: Crear una nueva copia del array para que React detecte el cambio
    const filtradosOrdenados = [...filtrados].sort((a, b) => {
      switch (ordenamiento) {
        case 'recientes': {
          const fechaA = parsearFecha(a.fechaPublicacion, a.horaPublicacion);
          const fechaB = parsearFecha(b.fechaPublicacion, b.horaPublicacion);
          // Más recientes primero (fecha mayor primero)
          const comparacion = fechaB - fechaA;
          // Si las fechas son iguales, usar ID como desempate para orden consistente
          return comparacion !== 0 ? comparacion : a.id.localeCompare(b.id);
        }
        case 'antiguos': {
          const fechaA = parsearFecha(a.fechaPublicacion, a.horaPublicacion);
          const fechaB = parsearFecha(b.fechaPublicacion, b.horaPublicacion);
          // Más antiguos primero (fecha menor primero)
          const comparacion = fechaA - fechaB;
          // Si las fechas son iguales, usar ID como desempate para orden consistente
          return comparacion !== 0 ? comparacion : a.id.localeCompare(b.id);
        }
        case 'titulo-asc':
          return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
        case 'titulo-desc':
          return b.titulo.localeCompare(a.titulo, 'es', { sensitivity: 'base' });
        default:
          return 0;
      }
    });


    setAdisosFiltrados(filtradosOrdenados);
  }, [busquedaDebounced, categoriaFiltro, ordenamiento, adisos, filtroUbicacion, profile, user?.id]);

  // Resetear visibilidad local y estado de paginación SOLO cuando cambian los filtros principales
  // (Esto evita resetear la página actual cuando se cargan más adisos en el mismo filtro)
  useEffect(() => {
    setVisibleCount(ITEMS_POR_PAGINA);
    setHayMasAdisos(true);
    setPaginaActual(1);
    // El scroll infinito (hook useInfiniteScroll) se encargará de cargar más
    // automáticamente si el sentinel queda visible después del filtrado inicial.
  }, [busquedaDebounced, categoriaFiltro, filtroUbicacion]);

  // Actualizar índice del adiso abierto cuando cambian los filtrados o el adiso abierto
  useEffect(() => {
    if (adisoAbierto && adisosFiltrados.length > 0) {
      const nuevoIndice = adisosFiltrados.findIndex(a => a.id === adisoAbierto.id);
      if (nuevoIndice >= 0) {
        setIndiceAdisoActual(nuevoIndice);
      }
    }
  }, [adisoAbierto, adisosFiltrados]);

  // Actualizar URL cuando cambian búsqueda o categoría (después del debounce)
  useEffect(() => {
    const params = new URLSearchParams();

    // Agregar categoría si no es "todos"
    if (categoriaFiltro !== 'todos') {
      params.set('categoria', categoriaFiltro);
    }

    // Agregar búsqueda si existe
    if (busquedaDebounced.trim()) {
      params.set('buscar', busquedaDebounced.trim());
    }

    // Mantener adiso si está abierto
    if (adisoId) {
      params.set('adiso', adisoId);
    }

    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    const currentUrl = window.location.search;
    const currentParams = new URLSearchParams(currentUrl);

    // Solo actualizar si hay cambios
    const hasChanges =
      (categoriaFiltro === 'todos' ? currentParams.has('categoria') : currentParams.get('categoria') !== categoriaFiltro) ||
      (busquedaDebounced.trim() ? currentParams.get('buscar') !== busquedaDebounced.trim() : currentParams.has('buscar'));

    if (hasChanges) {
      router.replace(newUrl, { scroll: false });
    }
  }, [busquedaDebounced, categoriaFiltro, adisoId, router]);

  const handlePublicar = (nuevoAdiso: Adiso) => {
    // Optimistic update: mostrar inmediatamente
    // Prevenir duplicados: verificar si el adiso ya existe
    const adisoExiste = adisos.find(a => a.id === nuevoAdiso.id);

    let adisosActualizados: Adiso[];
    if (adisoExiste) {
      // Actualización: reemplazar el adiso existente
      adisosActualizados = adisos.map(a => a.id === nuevoAdiso.id ? nuevoAdiso : a);
    } else {
      // Nuevo adiso: agregar al inicio
      adisosActualizados = [nuevoAdiso, ...adisos];
    }

    setAdisos(adisosActualizados);

    // El useEffect se encargará de recalcular filtrados y ordenamiento (más recientes primero) automáticamente

    // Solo abrir modal si es un adiso nuevo
    if (!adisoExiste) {
      setAdisoAbierto(nuevoAdiso);
      setIndiceAdisoActual(0);
      // En mobile, abrir sección de adiso automáticamente
      /*
      if (!isDesktop) {
        setSeccionMobileActiva('adiso');
      }
      */
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', nuevoAdiso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
      success('¡Adiso publicado exitosamente!');
    } else {
      // Si es una actualización (con imagen), actualizar el modal si está abierto
      if (adisoAbierto?.id === nuevoAdiso.id) {
        setAdisoAbierto(nuevoAdiso);
      }
    }
  };

  const { registrarOpener, desregistrarOpener } = useNavigation();

  const handleAbrirAdiso = useCallback((adiso: Adiso) => {
    const indice = adisosFiltrados.findIndex(a => a.id === adiso.id);
    setIndiceAdisoActual(indice >= 0 ? indice : 0);
    setAdisoAbierto(adiso);

    // Expandir sidebar automáticamente en desktop
    if (isDesktop) {
      setIsSidebarMinimizado(false);
    }

    // En mobile, abrir sección de adiso automáticamente
    /*
    if (!isDesktop) {
      setSeccionMobileActiva('adiso');
    }
    */

    // Actualizar URL sin recargar la página
    const params = new URLSearchParams(searchParams.toString());
    params.set('adiso', adiso.id);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [adisosFiltrados, isDesktop, router, searchParams]);

  // Registrar el manejador de apertura para componentes globales (como el Chatbot)
  useEffect(() => {
    registrarOpener((id: string) => {
      // Intentar encontrar el adiso en memoria primero
      const adisoLocal = adisos.find(a => a.id === id);
      if (adisoLocal) {
        handleAbrirAdiso(adisoLocal);
      } else {
        // En este caso, cambiamos el URL y dejamos que el useEffect de adisoId lo cargue
        // Esto mantiene la UI responsiva mientras carga
        const params = new URLSearchParams(window.location.search); // Usar window.location para asegurar estado actual
        params.set('adiso', id);
        router.replace(`/?${params.toString()}`, { scroll: false });
      }
    });

    return () => {
      desregistrarOpener();
    };
  }, [adisos, registrarOpener, desregistrarOpener, router, handleAbrirAdiso]);

  const handleCambiarSeccionMobile = (seccion: SeccionSidebar) => {
    // Si selecciona la misma sección que está activa, cerrarla (toggle)
    if (seccionMobileActiva === seccion) {
      setSeccionMobileActiva(null);
      return;
    }

    // Si selecciona adiso, cerrar el menú para ver el adiso abierto (slide-up)
    if (seccion === 'adiso') {
      setSeccionMobileActiva(null);
      return;
    }

    // Cambiar a la nueva sección
    setSeccionMobileActiva(seccion);

    // Si selecciona adiso y hay adiso abierto, mantenerlo visible
    // Si selecciona otra sección, el overlay mostrará esa sección
  };

  const handleCerrarSeccionMobile = () => {
    setSeccionMobileActiva(null);
    // No cerrar el adiso, solo cerrar el overlay
    // El adiso puede seguir abierto y el usuario puede volver a verlo tocando "Adiso" en el navbar
  };

  const handleCerrarAdiso = () => {
    setAdisoAbierto(null);
    if (isDesktop) {
      setIsSidebarMinimizado(true);
    }
    router.push('/', { scroll: false });
  };

  const handleAnterior = () => {
    if (indiceAdisoActual > 0) {
      const nuevoIndice = indiceAdisoActual - 1;
      const adiso = adisosFiltrados[nuevoIndice];
      setIndiceAdisoActual(nuevoIndice);
      setAdisoAbierto(adiso);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', adiso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  };

  const handleSiguiente = () => {
    if (indiceAdisoActual < adisosFiltrados.length - 1) {
      const nuevoIndice = indiceAdisoActual + 1;
      const adiso = adisosFiltrados[nuevoIndice];
      setIndiceAdisoActual(nuevoIndice);
      setAdisoAbierto(adiso);
      // Actualizar URL sin recargar la página
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', adiso.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  };

  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // Función optimizada para cargar más anuncios (scroll infinito)
  const cargarMasAdisos = useCallback(async () => {
    // Si ya estamos cargando, no hacer nada
    if (cargandoMas) return;

    // Caso 1: Todavía hay anuncios en memoria que no se están mostrando (Client-side)
    if (visibleCount < adisosFiltrados.length) {
      setCargandoMas(true);
      // Simular un pequeño delay para una mejor UX (opcional)
      await new Promise(resolve => setTimeout(resolve, 300));
      setVisibleCount(prev => Math.min(prev + ITEMS_POR_PAGINA, adisosFiltrados.length));
      setCargandoMas(false);
      return;
    }

    // Caso 2: No hay más en memoria, pero la API dice que hay más (Server-side)
    if (!hayMasAdisos) return;

    setCargandoMas(true);
    try {
      const siguientePagina = paginaActual + 1;

      // Calcular offset real para la categoría/búsqueda actual
      let offsetActual = adisos.length;

      // Si tenemos filtros activos, el offset de la consulta debe ser coherente
      // con lo que ya hemos cargado para esos filtros si la API ahora soporta filtrado.
      if (categoriaFiltro !== 'todos' || busquedaDebounced) {
        // Si estamos filtrando de verdad en el servidor ahora, 
        // el offset debería ser cuántos de "estos" ya tenemos.
        offsetActual = adisos.filter(a => {
          const matchCat = categoriaFiltro === 'todos' || a.categoria === categoriaFiltro;
          const matchBus = !busquedaDebounced || a.titulo.toLowerCase().includes(busquedaDebounced.toLowerCase());
          return matchCat && matchBus;
        }).length;
      }

      const nuevosAdisos = await getAdisosFromSupabase({
        limit: ITEMS_POR_PAGINA,
        offset: offsetActual,
        soloActivos: false,
        categoria: categoriaFiltro,
        busqueda: busquedaDebounced
      });

      if (nuevosAdisos.length > 0) {
        // Filtrar adisos de prueba que puedan venir de la API
        const nuevosFiltrados = nuevosAdisos.filter(a => !TEST_REGEX.test(a.titulo || ''));

        setAdisos(prev => {
          const adisosMap = new Map<string, Adiso>();
          // Agregar adisos existentes
          prev.forEach(adiso => adisosMap.set(adiso.id, adiso));
          // Agregar nuevos adisos filtrados
          nuevosFiltrados.forEach(adiso => adisosMap.set(adiso.id, adiso));
          return Array.from(adisosMap.values());
        });

        // Aumentar visibleCount para mostrar los nuevos
        setVisibleCount(prev => prev + ITEMS_POR_PAGINA);

        // Si hay menos de ITEMS_POR_PAGINA, no hay más páginas
        const tieneMas = nuevosAdisos.length === ITEMS_POR_PAGINA;
        setHayMasAdisos(tieneMas);
        if (tieneMas) {
          setPaginaActual(siguientePagina);
        }
      } else {
        setHayMasAdisos(false);
      }
    } catch (error) {
      console.error('Error al cargar más adisos:', error);
      setHayMasAdisos(false);
    } finally {
      setCargandoMas(false);
    }
  }, [cargandoMas, hayMasAdisos, adisos, paginaActual, visibleCount, adisosFiltrados.length, busquedaDebounced, categoriaFiltro]);

  // Usar hook profesional para infinite scroll
  const { sentinelRef } = useInfiniteScroll({
    hasMore: hayMasAdisos,
    isLoading: cargandoMas,
    onLoadMore: cargarMasAdisos,
    threshold: 200, // Cargar cuando queden 200px para el final
    enabled: !cargando && (hayMasAdisos || visibleCount < adisosFiltrados.length)
  });

  // Prefetch de imágenes de adisos relacionados cuando se abre un adiso
  useEffect(() => {
    if (!adisoAbierto || adisosFiltrados.length === 0) return;

    // Prefetch anterior si existe
    if (indiceAdisoActual > 0) {
      const anterior = adisosFiltrados[indiceAdisoActual - 1];
      if (anterior) {
        // Pre-cargar imágenes del adiso anterior
        if (anterior.imagenesUrls && anterior.imagenesUrls.length > 0) {
          anterior.imagenesUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
          });
        } else if (anterior.imagenUrl) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = anterior.imagenUrl;
          document.head.appendChild(link);
        }
      }
    }

    // Prefetch siguiente si existe
    if (indiceAdisoActual < adisosFiltrados.length - 1) {
      const siguiente = adisosFiltrados[indiceAdisoActual + 1];
      if (siguiente) {
        // Pre-cargar imágenes del adiso siguiente
        if (siguiente.imagenesUrls && siguiente.imagenesUrls.length > 0) {
          siguiente.imagenesUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
          });
        } else if (siguiente.imagenUrl) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = siguiente.imagenUrl;
          document.head.appendChild(link);
        }
      }
    }
  }, [adisoAbierto, indiceAdisoActual, adisosFiltrados]);

  // Structured data para SEO - usar URL base consistente
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Buscadis',
    url: siteUrl,
    description: 'Publica y encuentra adisos clasificados en Perú',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?buscar={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <Header
          onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          ubicacion={filtroUbicacion?.distrito || filtroUbicacion?.departamento || 'Perú'}
          onUbicacionClick={() => setMostrarFiltroUbicacion(true)}
          seccionActiva={seccionDesktopActiva}
          onSeccionChange={(seccion) => {
            setSeccionDesktopActiva(seccion);
            if (seccion !== 'adiso') {
              setIsSidebarMinimizado(false);
            }
          }}
        />
        {/* Category Bar - Horizontal Scroll */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            justifyContent: isDesktop ? 'center' : 'flex-start',
            overflowX: 'auto',
            gap: '1.5rem',
            padding: '1.25rem 1rem',
            backgroundColor: 'transparent',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            alignItems: 'center',
            width: '100%',
            maxWidth: isDesktop
              ? 'calc(100% - var(--sidebar-width, 0px))'
              : '100%',
            margin: '0 auto',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(isDesktop && { marginRight: 'var(--sidebar-width, 0px)' })
          }}
        >
          {[
            { id: 'empleos', label: 'Empleos', Icon: IconEmpleos },
            { id: 'inmuebles', label: 'Inmuebles', Icon: IconInmuebles },
            { id: 'vehiculos', label: 'Vehículos', Icon: IconVehiculos },
            { id: 'servicios', label: 'Servicios', Icon: IconServicios },
            { id: 'productos', label: 'Productos', Icon: IconProductos },
            { id: 'eventos', label: 'Eventos', Icon: IconEventos },
            { id: 'negocios', label: 'Negocios', Icon: IconNegocios },
            { id: 'comunidad', label: 'Comunidad', Icon: IconComunidad },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                const nuevaCategoria = categoriaFiltro === id ? 'todos' : (id as Categoria);
                setCategoriaFiltro(nuevaCategoria);

                // Actualizar URL sin recargar
                const params = new URLSearchParams(searchParams.toString());
                if (nuevaCategoria === 'todos') {
                  params.delete('categoria');
                } else {
                  params.set('categoria', nuevaCategoria);
                }
                // Mantener búsqueda si existe
                if (busqueda.trim()) {
                  params.set('buscar', busqueda.trim());
                } else {
                  params.delete('buscar');
                }
                router.push(`/?${params.toString()}`, { scroll: false });
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                minWidth: '80px',
                flexShrink: 0,
                padding: '4px',
                borderRadius: '12px',
                opacity: categoriaFiltro === id ? 1 : 0.8,
                transform: categoriaFiltro === id ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="group"
            >
              <div style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                backgroundColor: categoriaFiltro === id ? 'var(--brand-blue)' : 'var(--bg-primary)',
                color: categoriaFiltro === id ? 'white' : 'var(--text-secondary)',
                boxShadow: categoriaFiltro === id
                  ? '0 10px 20px -5px rgba(56, 189, 248, 0.4)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
                className="group-hover:shadow-lg group-hover:-translate-y-1"
              >
                <Icon size={24} color={categoriaFiltro === id ? 'white' : undefined} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: categoriaFiltro === id ? 700 : 500,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                color: categoriaFiltro === id ? 'var(--brand-blue)' : 'var(--text-secondary)'
              }}>
                {label}
              </span>
            </button>
          ))}
        </div>
        <main id="main-content" style={{
          flex: 1,
          padding: '1rem',
          paddingBottom: isDesktop ? '1rem' : '5rem', // Espacio para navbar mobile permanente
          maxWidth: isDesktop
            ? 'calc(100% - var(--sidebar-width, 0px))'
            : '1400px',
          margin: '0 auto',
          width: '100%',
          transition: 'max-width 0.3s ease, margin-right 0.3s ease, padding-bottom 0.3s ease',
          ...(isDesktop && { marginRight: 'var(--sidebar-width, 0px)' })
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Buscador
              value={busqueda}
              onChange={(value) => {
                setBusqueda(value);
              }}
              onAudioSearch={() => alert("Próximamente: Búsqueda por voz")}
              onVisualSearch={() => alert("Próximamente: Búsqueda visual con cámara/fotos")}
            />
          </div>

          {/* Modal de Filtro de Ubicación */}
          {mostrarFiltroUbicacion && (
            <FiltroUbicacion
              filtrosActuales={filtroUbicacion}
              onAplicar={(filtros) => {
                setFiltroUbicacion(filtros);
                setMostrarFiltroUbicacion(false);
              }}
              onCerrar={() => setMostrarFiltroUbicacion(false)}
            />
          )}
          {/* ── Toolbar: modern controls ── */}
          <div style={{
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 0.25rem',
            gap: '12px',
            width: '100%',
            flexWrap: 'wrap'
          }}>
            {/* Left: Count pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {cargando ? (
                <div className="skeleton-shimmer" style={{ width: 120, height: 36, borderRadius: '18px' }} />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '4px 12px 4px 6px',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  height: '36px'
                }}>
                  <div style={{
                    backgroundColor: 'var(--brand-blue)',
                    color: 'white',
                    height: '24px',
                    minWidth: '24px',
                    padding: '0 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800
                  }}>
                    {adisosFiltrados.length}
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}>
                    <span className="hidden sm:inline">
                      {adisosFiltrados.length === 1 ? 'adiso encontrado' : 'adisos encontrados'}
                    </span>
                    <span className="sm:hidden inline">
                      adisos
                    </span>
                  </span>

                  {!cargando && (
                    <button
                      onClick={async () => {
                        const url = getBusquedaUrl(categoriaFiltro, busqueda);
                        try {
                          await navigator.clipboard.writeText(url);
                          success('Link de búsqueda copiado');
                        } catch (err) {
                          error('Error al copiar link');
                        }
                      }}
                      style={{
                        marginLeft: '4px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--brand-blue)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      className="hover:bg-sky-500 hover:text-white"
                      title="Compartir búsqueda"
                    >
                      <IconShare size={14} />
                    </button>
                  )}
                </div>
              )}
              {!cargando && marketplacePulse && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    color: 'var(--brand-blue)',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  🔵 {marketplacePulse}
                </div>
              )}
            </div>

            {/* Right: Sort & View Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ordenamiento
                valor={ordenamiento}
                onChange={setOrdenamiento}
              />

              {/* View Mode Switcher */}
              <div style={{
                display: 'flex',
                backgroundColor: 'var(--bg-primary)',
                padding: '4px',
                borderRadius: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                height: '42px',
                alignItems: 'center'
              }}>
                {[
                  { id: 'grid', icon: IconGrid, title: 'Cuadrícula' },
                  { id: 'feed', icon: IconFeed, title: 'Individual' },
                  { id: 'list', icon: IconList, title: 'Lista' }
                ].map((m) => {
                  const Icon = m.icon;
                  const active = vista === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setVista(m.id as any)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: active ? 'var(--brand-blue)' : 'transparent',
                        color: active ? 'white' : 'var(--text-tertiary)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        margin: '0 2px'
                      }}
                      title={m.title}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Cards: skeleton during first load, grid once ready ── */}
          {cargando ? (
            <SkeletonAdisos isDesktop={isDesktop} />
          ) : (
            <>
              <GrillaAdisos
                adisos={adisosFiltrados.slice(0, visibleCount)}
                onAbrirAdiso={handleAbrirAdiso}
                adisoSeleccionadoId={adisoAbierto?.id}
                espacioAdicional={isSidebarMinimizado ? 360 : 0}
                cargandoMas={cargandoMas}
                sentinelRef={sentinelRef}
                vista={vista}
              />
              {adisosFiltrados.length === 0 && !cargando && (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-secondary)'
                }}>
                  {busqueda || categoriaFiltro !== 'todos'
                    ? 'No se encontraron adisos con esos filtros'
                    : 'Aún no hay adisos publicados'}
                </div>
              )}
            </>
          )}
        </main>
        <FeedbackButton />

        {/* Left Sidebar (Desktop/Mobile if requested) */}
        <LeftSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        {/* Modal Adiso Mobile - Standalone Slide Up */}
        {!isDesktop && adisoAbierto && !seccionMobileActiva && (
          <ModalAdiso
            adiso={adisoAbierto}
            onCerrar={handleCerrarAdiso}
            onAnterior={handleAnterior}
            onSiguiente={handleSiguiente}
            puedeAnterior={indiceAdisoActual > 0}
            puedeSiguiente={indiceAdisoActual < adisosFiltrados.length - 1}
            onSuccess={(msg) => success(msg)}
            onError={(msg) => error(msg)}
            dentroSidebar={false}
          />
        )}

        {/* Modal Mobile Overlay - solo cuando hay sección activa (EXCEPTO ADISO que va standalone) */}
        {!isDesktop && seccionMobileActiva && seccionMobileActiva !== 'adiso' && (
          <ModalNavegacionMobile
            abierto={!!seccionMobileActiva}
            onCerrar={handleCerrarSeccionMobile}
            seccionInicial={seccionMobileActiva || undefined}
            adisoAbierto={adisoAbierto}
            onCerrarAdiso={handleCerrarAdiso}
            onAnterior={handleAnterior}
            onSiguiente={handleSiguiente}
            puedeAnterior={indiceAdisoActual > 0}
            puedeSiguiente={indiceAdisoActual < adisosFiltrados.length - 1}
            onPublicar={handlePublicar}
            todosLosAdisos={adisosFiltrados}
            onError={(msg) => error(msg)}
            onSuccess={(msg) => success(msg)}
            onCambiarSeccion={handleCambiarSeccionMobile}
          />
        )}

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </PullToRefresh>
    {isDesktop && (
      <SidebarDesktop
        adisoAbierto={adisoAbierto}
        onCerrarAdiso={handleCerrarAdiso}
        onAnterior={handleAnterior}
        onSiguiente={handleSiguiente}
        puedeAnterior={indiceAdisoActual > 0}
        puedeSiguiente={indiceAdisoActual < adisosFiltrados.length - 1}
        onPublicar={handlePublicar}
        onError={(msg) => error(msg)}
        onSuccess={(msg) => success(msg)}
        seccionActiva={seccionDesktopActiva}
        minimizado={isSidebarMinimizado}
        onMinimizadoChange={setIsSidebarMinimizado}
        todosLosAdisos={adisosFiltrados}
      />
    )}
    {!isDesktop && (
      <NavbarMobile
        seccionActiva={seccionMobileActiva || (adisoAbierto ? 'adiso' : null)}
        onCambiarSeccion={handleCambiarSeccionMobile}
        tieneAdisoAbierto={!!adisoAbierto}
      />
    )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
