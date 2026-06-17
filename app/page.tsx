'use client';

// Forzar renderizado dinámico para evitar errores de prerender con useSearchParams en Vercel
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Adiso, Categoria } from '@/types';
import { getAdisos, getAdisoById, saveAdiso, getAdisosCache } from '@/lib/storage';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getBusquedaUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { trackViewHistory } from '@/lib/profile/view-history-client';
import { useUser } from '@/hooks/useUser';
import { UbicacionDetallada } from '@/types';
import { useNavigation } from '@/contexts/NavigationContext';

import { registrarBusqueda } from '@/lib/analytics';
import { getUserInterestProfile, getInteraccionesUsuario, UserInterestProfile } from '@/lib/interactions';
import { persistDemandIntent } from '@/lib/demand-intents/client';
import { trackEvent } from '@/lib/events';
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
  IconList,
  IconEye,
  IconClose,
} from '@/components/Icons';
import { getCategoriaLabel } from '@/lib/adiso-display';
import {
  applyBrowseFilters,
  browseFiltersFromSearchParams,
  browseFiltersToSearchParams,
  DEFAULT_BROWSE_FILTERS,
  BrowseFilterState,
  FilterLayoutMode,
} from '@/lib/filters';
import { countActiveFilters } from '@/lib/filters/types';
import MarketplaceSearchComposer from '@/components/search/MarketplaceSearchComposer';
import StoriesBar from '@/components/StoriesBar';
import BrowseFilters from '@/components/filters/BrowseFilters';
import FilterSidePanel from '@/components/filters/FilterSidePanel';
import FilterControlFields from '@/components/filters/FilterControlFields';
import FilterSortPanel from '@/components/filters/FilterSortPanel';
import FilterPanelFooter from '@/components/filters/FilterPanelFooter';
import { buildFilterInsight } from '@/lib/filters/panel-meta';
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

import { formatLocationShort } from '@/lib/geo/format';
import { getLocationCountryCode } from '@/lib/geo/flags';
import { getCountryByCode, DEFAULT_COUNTRY_CODE } from '@/lib/geo/countries-data';
import BrowseEmptyState from '@/components/BrowseEmptyState';
import ParaTiSection from '@/components/home/ParaTiSection';
const TEST_REGEX = /toyota test|test adiso|test anuncio/i;

function getBrowseCountLabel(
  categoria: Categoria | 'todos',
  filtro?: {
    distrito?: string;
    departamento?: string;
    provincia?: string;
    countryCode?: string;
  },
): string {
  const ubic =
    filtro?.distrito ||
    filtro?.provincia ||
    filtro?.departamento ||
    (filtro?.countryCode ? getCountryByCode(filtro.countryCode)?.name : null) ||
    'Cusco';
  if (categoria !== 'todos') {
    return `· ${getCategoriaLabel(categoria)}`;
  }
  return `en ${ubic}`;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const { profile } = useUser();
  const adisoId = searchParams.get('adiso');
  const categoriaUrl = searchParams.get('categoria') as Categoria | null;
  const buscarUrl = searchParams.get('buscar') || '';
  const seccionUrl = searchParams.get('seccion') as SeccionSidebar | null;
  const cargadoInicialmente = useRef(false);
  const adisosRef = useRef<Adiso[]>([]);
  const ultimoErrorAdisoRef = useRef<string | null>(null);

  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [adisosFiltrados, setAdisosFiltrados] = useState<Adiso[]>([]);
  const [busqueda, setBusqueda] = useState(buscarUrl);
  const [committedQuery, setCommittedQuery] = useState(buscarUrl);
  const [searchResults, setSearchResults] = useState<Adiso[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const initialSearchDone = useRef(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | 'todos'>(categoriaUrl && ['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad'].includes(categoriaUrl) ? categoriaUrl : 'todos');
  const [ordenamiento, setOrdenamiento] = useState<TipoOrdenamiento>('recientes');
  const [interestProfile, setInterestProfile] = useState<UserInterestProfile | null>(null);
  const [hiddenAdIds, setHiddenAdIds] = useState<Set<string>>(new Set());


  const [browseFilters, setBrowseFilters] = useState<BrowseFilterState>(() =>
    browseFiltersFromSearchParams(searchParams),
  );
  const [adisoAbierto, setAdisoAbierto] = useState<Adiso | null>(null);
  const [indiceAdisoActual, setIndiceAdisoActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtrando, setFiltrando] = useState(false);
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
        if (seccionUrl !== 'adiso') {
          setIsSidebarMinimizado(false);
        }
      } else {
        setSeccionMobileActiva(seccionUrl);
      }
    }
  }, [seccionUrl, isDesktop]);

  const handleDesktopSeccionChange = useCallback(
    (seccion: SeccionSidebar) => {
      setSeccionDesktopActiva(seccion);
      setIsSidebarMinimizado(false);
      const params = new URLSearchParams(searchParams.toString());
      if (seccion === 'adiso') {
        params.delete('seccion');
      } else {
        params.set('seccion', seccion);
      }
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  const [vista, setVista] = useState<'grid' | 'list' | 'feed'>('grid');
  const [browseScrolled, setBrowseScrolled] = useState(false);
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(true);
  const [inlineFiltersVisible, setInlineFiltersVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSidebarMinimizado, setIsSidebarMinimizado] = useState(true);
  const { toasts, removeToast, success, error } = useToast();
  const marketplacePulse = getMarketplacePulse(adisosFiltrados);
  const activeFiltersCount = countActiveFilters(browseFilters, categoriaFiltro);
  const browseTotalPool = useMemo(() => {
    if (categoriaFiltro === 'todos') return adisos.length;
    return adisos.filter((a) => a.categoria === categoriaFiltro).length;
  }, [adisos, categoriaFiltro]);
  const [isOnlineState, setIsOnlineState] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const onScroll = () => setBrowseScrolled(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    adisosRef.current = adisos;
  }, [adisos]);

  const prevCategoriaRef = useRef(categoriaFiltro);
  // Al cambiar categoría manualmente, limpiar facetas específicas (conservar precio, ubicación, etc.)
  useEffect(() => {
    if (prevCategoriaRef.current !== categoriaFiltro) {
      setBrowseFilters((prev) => ({ ...prev, facets: {} }));
      prevCategoriaRef.current = categoriaFiltro;
    }
  }, [categoriaFiltro]);

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
    if (cargando) return;

    if (!adisoId) {
      ultimoErrorAdisoRef.current = null;
      setAdisoAbierto(null);
      return;
    }

    let cancelled = false;
    const adisoEnLista = adisosRef.current.find((a) => a.id === adisoId);

    if (adisoEnLista) {
      setAdisoAbierto(adisoEnLista);
      if (isDesktop) {
        setIsSidebarMinimizado(false);
      }
    }

    getAdisoById(adisoId).then((adiso) => {
      if (cancelled) return;

      if (adiso) {
        setAdisoAbierto(adiso);
        if (isDesktop) {
          setIsSidebarMinimizado(false);
        }
        setAdisos((prev) => {
          if (!prev.find((a) => a.id === adisoId)) {
            return [adiso, ...prev];
          }
          return prev.map((a) => (a.id === adisoId ? adiso : a));
        });
        return;
      }

      // Solo cerrar y avisar si el anuncio no estaba en la grilla (enlace directo fantasma)
      if (!adisoEnLista) {
        setAdisoAbierto(null);
        if (isDesktop) {
          setIsSidebarMinimizado(true);
        }
        const params = new URLSearchParams(searchParams.toString());
        params.delete('adiso');
        router.replace(params.toString() ? `/?${params.toString()}` : '/', { scroll: false });
        if (ultimoErrorAdisoRef.current !== adisoId) {
          ultimoErrorAdisoRef.current = adisoId;
          error('Este anuncio no está disponible. Puede que no se haya guardado correctamente.');
        }
      }
    }).catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [adisoId, cargando, isDesktop, error, router, searchParams]);

  // Perfil de intereses del usuario, para personalizar el orden del feed "recientes"
  useEffect(() => {
    if (!user?.id) {
      setInterestProfile(null);
      return;
    }
    let cancelled = false;
    getUserInterestProfile(user.id).then((perfil) => {
      if (!cancelled) setInterestProfile(perfil);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setHiddenAdIds(new Set());
      return;
    }
    getInteraccionesUsuario(user.id, 'not_interested').then(setHiddenAdIds);
  }, [user?.id]);

  const handleSearchSubmit = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setCommittedQuery('');
      setSearchResults(null);
      setHayMasAdisos(true);
      return;
    }

    setSearchLoading(true);
    setCommittedQuery(q);
    setFiltrando(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          category: categoriaFiltro !== 'todos' ? categoriaFiltro : undefined,
          location:
            browseFilters.ubicacion?.distrito ??
            browseFilters.ubicacion?.departamento ??
            undefined,
          userId: user?.id,
          maxResults: 60,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de búsqueda');

      const results = (data.adisos ?? []) as Adiso[];
      setSearchResults(results);
      setHayMasAdisos(false);
      setVisibleCount(ITEMS_POR_PAGINA);
      registrarBusqueda(user?.id, q, results.length);

      if (results.length === 0) {
        void persistDemandIntent({
          queryText: q,
          categoria: categoriaFiltro !== 'todos' ? categoriaFiltro : data.normalized?.category,
          facets: browseFilters.facets as Record<string, unknown>,
          ubicacion: browseFilters.ubicacion as Record<string, unknown> | undefined,
          source: 'empty_search',
          userId: user?.id,
        });
      }

      setAdisos((prev) => {
        const map = new Map(prev.map((a) => [a.id, a]));
        results.forEach((a) => map.set(a.id, a));
        return Array.from(map.values());
      });
    } catch {
      error('No pudimos completar la búsqueda');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      setFiltrando(false);
    }
  }, [browseFilters, categoriaFiltro, error, user?.id]);

  useEffect(() => {
    if (initialSearchDone.current || !buscarUrl || cargando) return;
    initialSearchDone.current = true;
    void handleSearchSubmit(buscarUrl);
  }, [buscarUrl, cargando, handleSearchSubmit]);

  // Filtrado y ordenamiento (sistema unificado)
  useEffect(() => {
    if (adisos.length === 0) {
      setAdisosFiltrados([]);
      return;
    }

    const baseAdisos = searchResults !== null ? searchResults : adisos;

    const filtrados = applyBrowseFilters({
      adisos: baseAdisos,
      categoria: categoriaFiltro,
      busqueda: '',
      filters: browseFilters,
      ordenamiento,
      userLat: profile?.latitud,
      userLng: profile?.longitud,
      interestProfile,
      hiddenAdIds,
    });

    setAdisosFiltrados(filtrados);
  }, [committedQuery, searchResults, categoriaFiltro, ordenamiento, adisos, browseFilters, profile?.latitud, profile?.longitud, interestProfile, hiddenAdIds]);

  // Breve skeleton al cambiar filtros (no en carga inicial)
  useEffect(() => {
    if (cargando) return;
    setFiltrando(true);
    const t = window.setTimeout(() => setFiltrando(false), 280);
    return () => window.clearTimeout(t);
  }, [committedQuery, categoriaFiltro, browseFilters, ordenamiento, cargando]);

  // Sin resultados filtrados: no seguir pidiendo más páginas a la API
  useEffect(() => {
    if (!cargando && adisosFiltrados.length === 0 && adisos.length > 0) {
      setHayMasAdisos(false);
      setCargandoMas(false);
    }
  }, [cargando, adisosFiltrados.length, adisos.length]);

  // Resetear visibilidad local y estado de paginación SOLO cuando cambian los filtros principales
  // (Esto evita resetear la página actual cuando se cargan más adisos en el mismo filtro)
  useEffect(() => {
    setVisibleCount(ITEMS_POR_PAGINA);
    setHayMasAdisos(true);
    setPaginaActual(1);
    // El scroll infinito (hook useInfiniteScroll) se encargará de cargar más
    // automáticamente si el sentinel queda visible después del filtrado inicial.
  }, [committedQuery, categoriaFiltro, browseFilters]);

  useEffect(() => {
    if (categoriaFiltro !== 'todos') {
      trackEvent('category.selected', {
        entityType: 'category',
        entityId: categoriaFiltro,
        payload: { categoria: categoriaFiltro },
        userId: user?.id,
      });
    }
  }, [categoriaFiltro, user?.id]);

  useEffect(() => {
    if (countActiveFilters(browseFilters, categoriaFiltro) > 0) {
      trackEvent('filter.applied', {
        entityType: 'filter',
        payload: { filters: browseFilters, categoria: categoriaFiltro },
        userId: user?.id,
      });
    }
  }, [browseFilters, categoriaFiltro, user?.id]);

  // Actualizar índice del adiso abierto cuando cambian los filtrados o el adiso abierto
  useEffect(() => {
    if (adisoAbierto && adisosFiltrados.length > 0) {
      const nuevoIndice = adisosFiltrados.findIndex(a => a.id === adisoAbierto.id);
      if (nuevoIndice >= 0) {
        setIndiceAdisoActual(nuevoIndice);
      }
    }
  }, [adisoAbierto, adisosFiltrados]);

  // Sincronizar URL: categoría, búsqueda y filtros avanzados
  useEffect(() => {
    let params = new URLSearchParams();

    if (categoriaFiltro !== 'todos') {
      params.set('categoria', categoriaFiltro);
    }
    if (committedQuery.trim()) {
      params.set('buscar', committedQuery.trim());
    }
    if (adisoId) {
      params.set('adiso', adisoId);
    }
    const seccion = searchParams.get('seccion');
    if (seccion) params.set('seccion', seccion);

    params = browseFiltersToSearchParams(browseFilters, params);

    const newQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, '');
    if (newQuery !== currentQuery) {
      router.replace(newQuery ? `/?${newQuery}` : '/', { scroll: false });
    }
  }, [committedQuery, categoriaFiltro, browseFilters, adisoId, router, searchParams]);

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
    } else {
      // Si es una actualización (con imagen), actualizar el modal si está abierto
      if (adisoAbierto?.id === nuevoAdiso.id) {
        setAdisoAbierto(nuevoAdiso);
      }
    }
  };

  const { registrarOpener, desregistrarOpener } = useNavigation();

  const handleAbrirAdiso = useCallback((adiso: Adiso) => {
    trackViewHistory({ adisoId: adiso.id, source: 'feed' }, session?.access_token);
    const indice = adisosFiltrados.findIndex(a => a.id === adiso.id);
    setIndiceAdisoActual(indice >= 0 ? indice : 0);
    setAdisoAbierto(adiso);
    setSeccionDesktopActiva('adiso');

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
  }, [adisosFiltrados, isDesktop, router, searchParams, session?.access_token]);

  const handleAbrirAdisoById = useCallback(
    (id: string) => {
      const local =
        adisos.find((a) => a.id === id) ??
        searchResults?.find((a) => a.id === id) ??
        adisosFiltrados.find((a) => a.id === id);
      if (local) {
        handleAbrirAdiso(local);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set('adiso', id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [adisos, searchResults, adisosFiltrados, handleAbrirAdiso, router, searchParams],
  );

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
    const params = new URLSearchParams(searchParams.toString());
    params.delete('adiso');
    router.replace(params.toString() ? `/?${params.toString()}` : '/', { scroll: false });
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
    if (cargandoMas) return;
    if (searchResults !== null) return;
    if (adisosFiltrados.length === 0) return;

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
      if (categoriaFiltro !== 'todos' || committedQuery) {
        offsetActual = adisos.filter(a => {
          const matchCat = categoriaFiltro === 'todos' || a.categoria === categoriaFiltro;
          return matchCat;
        }).length;
      }

      const nuevosAdisos = await getAdisosFromSupabase({
        limit: ITEMS_POR_PAGINA,
        offset: offsetActual,
        soloActivos: false,
        categoria: categoriaFiltro,
        busqueda: committedQuery
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
  }, [cargandoMas, hayMasAdisos, adisos, paginaActual, visibleCount, adisosFiltrados.length, committedQuery, categoriaFiltro, searchResults]);

  // Usar hook profesional para infinite scroll
  const { sentinelRef } = useInfiniteScroll({
    hasMore: hayMasAdisos,
    isLoading: cargandoMas,
    onLoadMore: cargarMasAdisos,
    threshold: 200, // Cargar cuando queden 200px para el final
    enabled:
      !cargando &&
      adisosFiltrados.length > 0 &&
      (hayMasAdisos || visibleCount < adisosFiltrados.length),
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
        <div className="brand-mesh-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <a href="#main-content" className="skip-link">
            Ir al contenido
          </a>
          <Header
            onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            ubicacion={formatLocationShort(browseFilters.ubicacion)}
            ubicacionCountryCode={getLocationCountryCode(browseFilters.ubicacion)}
            categoria={categoriaFiltro}
            onUbicacionClick={() => setMostrarFiltroUbicacion(true)}
            seccionActiva={seccionDesktopActiva}
            onSeccionChange={(seccion) => {
              handleDesktopSeccionChange(seccion);
              if (seccion === 'adiso' && !adisoAbierto) {
                setIsSidebarMinimizado(false);
              }
            }}
          />
          {/* Layout 3 columnas: filtros | contenido | detalle */}
          <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, width: '100%', minWidth: 0 }}>
            {isDesktop && (
              <FilterSidePanel
                categoria={categoriaFiltro}
                filters={browseFilters}
                onChange={setBrowseFilters}
                adisos={adisos}
                committedQuery={committedQuery}
                collapsed={filterSidebarCollapsed}
                onToggleCollapse={() => setFilterSidebarCollapsed((c) => !c)}
                onOpenUbicacion={() => setMostrarFiltroUbicacion(true)}
                userLat={profile?.latitud}
                userLng={profile?.longitud}
                resultCount={adisosFiltrados.length}
                totalPool={browseTotalPool}
                ordenamiento={ordenamiento}
                onSortChange={(v) => {
                  setOrdenamiento(v);
                  trackEvent('filter.applied', {
                    entityType: 'filter',
                    entityId: 'sort',
                    payload: { sort: v },
                    userId: user?.id,
                  });
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              className="no-scrollbar"
              style={{
                display: 'flex',
                justifyContent:isDesktop ? 'center' : 'flex-start',
                overflowX: 'auto',
                overflowY: 'hidden',
                gap: isDesktop ? '1.125rem' : '0.5rem',
                padding: isDesktop ? '0.875rem 1rem 0.5rem' : '0.625rem 0.75rem 0.375rem',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                alignItems: 'center',
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
                    gap: isDesktop ? '0.45rem' : '0.3rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: isDesktop ? '76px' : '62px',
                    flexShrink: 0,
                    padding: '2px',
                    borderRadius: '12px',
                    opacity: categoriaFiltro === id ? 1 : 0.8,
                    transform: categoriaFiltro === id ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  className="group"
                >
                  <div
                    style={{
                    width: isDesktop ? '52px' : '44px',
                    height: isDesktop ? '52px' : '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: isDesktop ? '16px' : '14px',
                    boxSizing: 'border-box',
                    border: categoriaFiltro === id
                      ? '2px solid var(--brand-yellow)'
                      : '2px solid rgba(var(--brand-yellow-rgb), 0.65)',
                    backgroundColor: categoriaFiltro === id ? 'var(--brand-blue)' : undefined,
                    color: categoriaFiltro === id ? 'white' : 'var(--text-secondary)',
                    boxShadow: categoriaFiltro === id
                      ? '0 10px 20px -5px rgba(var(--brand-primary-rgb), 0.35), 0 0 0 1px rgba(var(--brand-yellow-rgb), 0.35)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                    className={`group-hover:shadow-lg group-hover:-translate-y-1${categoriaFiltro !== id ? ' brand-category-tile' : ''}`}
                  >
                    <Icon size={isDesktop ? 26 : 22} color={categoriaFiltro === id ? 'white' : undefined} />
                  </div>
                  <span style={{
                    fontSize: isDesktop ? '0.8125rem' : '0.6875rem',
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
            <div
              className="no-scrollbar"
              style={{
                overflowX: 'visible',
                padding: isDesktop ? '0 1rem 0.375rem' : '0 0.75rem 0.25rem',
              }}
            >
              <StoriesBar categoria={categoriaFiltro} />
            </div>
            {/* Buscador + filtros: sticky compacto, alineados bajo el mismo ancho */}
            <div
              style={{
                position: 'sticky',
                top: 'var(--header-height, 72px)',
                zIndex: 900,
                paddingBottom: inlineFiltersVisible ? '0.5rem' : '0.25rem',
              }}
            >
              <div className="mx-auto w-full max-w-2xl px-4 md:px-0">
                <div
                  style={{
                    padding: browseScrolled ? '0.5rem 0 0' : '0 0 0.75rem',
                    transition: 'padding 0.3s ease',
                  }}
                >
                  <MarketplaceSearchComposer
                    value={busqueda}
                    onChange={setBusqueda}
                    onSearchSubmit={handleSearchSubmit}
                    onOpenAdiso={handleAbrirAdisoById}
                    searchLoading={searchLoading}
                    compact={browseScrolled}
                    searchOnly
                    showFilterToggle
                    filtersVisible={inlineFiltersVisible}
                    onToggleFilters={() => setInlineFiltersVisible((v) => !v)}
                    activeFiltersCount={activeFiltersCount}
                    onCategoryDetected={(categoria) => {
                      setCategoriaFiltro(categoria);
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('categoria', categoria);
                      router.replace(`/?${params.toString()}`, { scroll: false });
                    }}
                    onNotify={(message, type) => {
                      if (type === 'error') error(message);
                      else if (type === 'success') success(message);
                      else success(message);
                    }}
                  />
                </div>
                <BrowseFilters
                  categoria={categoriaFiltro}
                  filters={browseFilters}
                  onChange={setBrowseFilters}
                  adisos={adisos}
                  busqueda={committedQuery}
                  isDesktop={isDesktop}
                  visible={inlineFiltersVisible}
                  userLat={profile?.latitud}
                  userLng={profile?.longitud}
                  onOpenUbicacion={() => setMostrarFiltroUbicacion(true)}
                  onOpenSidebar={() => setFilterSidebarCollapsed(false)}
                  onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
                />
              </div>
            </div>
            <main id="main-content" style={{
              flex: 1,
              minWidth: 0,
              padding: '1rem',
              paddingTop: browseScrolled ? '0.5rem' : '0.25rem',
              paddingBottom: isDesktop ? '1rem' : '5rem',
              width: '100%',
              transition: 'padding-bottom 0.3s ease, padding-top 0.3s ease',
            }}>

              {/* Drawer de Filtros Mobile */}
              {!isDesktop && isMobileFiltersOpen && (
                <div className="fixed inset-0 z-[1100] flex">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                @keyframes slideIn {
                  from { transform: translateX(-100%); }
                  to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}} />
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
                    onClick={() => setIsMobileFiltersOpen(false)}
                  />
                  {/* Drawer Content */}
                  <div
                    className="relative flex w-full max-w-[320px] flex-col bg-[var(--bg-primary)] h-full shadow-2xl overflow-hidden z-10"
                    style={{
                      animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                      <div>
                        <h2 className="text-base font-bold text-[var(--text-primary)]">Refinar búsqueda</h2>
                        <p className="m-0 mt-0.5 text-[10px] text-[var(--text-tertiary)]">Dónde → Tipo → Presupuesto → Calidad</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setBrowseFilters({ facets: {} })}
                          className="px-2 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--brand-blue)]"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => setIsMobileFiltersOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors"
                        >
                          <IconClose size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar p-4">
                      <FilterSortPanel value={ordenamiento} onChange={setOrdenamiento} />
                      <FilterControlFields
                        categoria={categoriaFiltro}
                        filters={browseFilters}
                        onChange={setBrowseFilters}
                        adisos={adisos}
                        busqueda={committedQuery}
                        userLat={profile?.latitud}
                        userLng={profile?.longitud}
                        onOpenUbicacion={() => {
                          setMostrarFiltroUbicacion(true);
                          setIsMobileFiltersOpen(false);
                        }}
                      />
                    </div>
                    <div className="border-t border-[var(--border-color)]">
                      <FilterPanelFooter
                        resultCount={adisosFiltrados.length}
                        totalPool={browseTotalPool}
                        insight={buildFilterInsight(browseFilters, categoriaFiltro, adisosFiltrados.length, browseTotalPool)}
                      />
                      <div className="px-4 pb-4">
                        <button
                          type="button"
                          onClick={() => setIsMobileFiltersOpen(false)}
                          className="w-full rounded-xl bg-[var(--brand-blue)] py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all"
                        >
                          Ver {adisosFiltrados.length} resultado{adisosFiltrados.length === 1 ? '' : 's'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Filtro de Ubicación */}
              {mostrarFiltroUbicacion && (
                <FiltroUbicacion
                  filtrosActuales={browseFilters.ubicacion}
                  onAplicar={(filtros) => {
                    setBrowseFilters((prev) => ({ ...prev, ubicacion: filtros }));
                    setMostrarFiltroUbicacion(false);
                  }}
                  onCerrar={() => setMostrarFiltroUbicacion(false)}
                />
              )}
              {/* ── Toolbar: una sola línea ── */}
              <div style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.25rem 0',
                gap: '8px',
                width: '100%',
                flexWrap: 'nowrap',
                overflow: 'visible',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                  {cargando ? (
                    <div className="skeleton-shimmer" style={{ width: 100, height: 42, borderRadius: '18px', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px 4px 6px',
                      borderRadius: '14px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      height: '42px',
                      flexShrink: 0,
                    }}
                    className="brand-pill-glass"
                    >
                      <div style={{
                        backgroundColor: 'var(--brand-blue)',
                        color: 'white',
                        height: '28px',
                        minWidth: '28px',
                        padding: '0 8px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        boxShadow: '0 0 0 2px var(--brand-yellow)',
                      }}>
                        {adisosFiltrados.length}
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {getBrowseCountLabel(categoriaFiltro, browseFilters.ubicacion)}
                      </span>

                      {!cargando && (
                        <button
                          className="hidden lg:flex hover:opacity-90"
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
                            backgroundColor: 'rgba(var(--brand-primary-rgb), 0.12)',
                            color: 'var(--brand-blue)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          title="Compartir búsqueda"
                        >
                          <IconShare size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  {!cargando && marketplacePulse && (
                    <div
                      className="hidden xl:flex"
                      style={{
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(var(--brand-yellow-rgb), 0.14)',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(var(--brand-yellow-rgb), 0.28)',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        height: '32px',
                        flexShrink: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <IconEye size={14} aria-hidden="true" color="var(--brand-yellow)" />
                      <span className="truncate">{marketplacePulse}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <Ordenamiento
                    valor={ordenamiento}
                    onChange={(v) => {
                      setOrdenamiento(v);
                      trackEvent('filter.applied', {
                        entityType: 'filter',
                        entityId: 'sort',
                        payload: { sort: v },
                        userId: user?.id,
                      });
                    }}
                  />

                  {/* View Mode Switcher */}
                  <div style={{
                    display: 'flex',
                    padding: '4px',
                    borderRadius: '14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    height: '42px',
                    alignItems: 'center'
                  }}
                  className="brand-pill-glass"
                  >
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

              {/* ── Cards: skeleton breve al filtrar, grilla o estado vacío ── */}
              {cargando || filtrando ? (
                <SkeletonAdisos isDesktop={isDesktop} />
              ) : adisosFiltrados.length === 0 ? (
                <BrowseEmptyState
                  variant={
                    browseFilters.ubicacion?.countryCode &&
                    browseFilters.ubicacion.countryCode !== DEFAULT_COUNTRY_CODE
                      ? 'location'
                      : browseFilters.ubicacion?.departamento ||
                          browseFilters.ubicacion?.distrito ||
                          browseFilters.ubicacion?.provincia
                        ? 'location'
                        : committedQuery.trim()
                          ? 'search'
                          : categoriaFiltro !== 'todos'
                            ? 'category'
                            : countActiveFilters(browseFilters, categoriaFiltro) > 0
                              ? 'filtered'
                              : 'global'
                  }
                  busqueda={committedQuery}
                  categoria={categoriaFiltro}
                  ubicacion={browseFilters.ubicacion}
                  activeFilterCount={countActiveFilters(browseFilters, categoriaFiltro)}
                  onClearFilters={() => {
                    trackEvent('filter.cleared', {
                      entityType: 'filter',
                      payload: { categoria: categoriaFiltro, filters: browseFilters },
                      userId: user?.id,
                    });
                    setBrowseFilters({ facets: {} });
                    setBusqueda('');
                    setCommittedQuery('');
                    setSearchResults(null);
                    setHayMasAdisos(true);
                    setCategoriaFiltro('todos');
                  }}
                  onChangeLocation={() => setMostrarFiltroUbicacion(true)}
                />
              ) : (
                <>
                <ParaTiSection onAbrirAdiso={handleAbrirAdiso} />
                <GrillaAdisos
                  adisos={adisosFiltrados.slice(0, visibleCount)}
                  onAbrirAdiso={handleAbrirAdiso}
                  adisoSeleccionadoId={adisoAbierto?.id}
                  espacioAdicional={0}
                  cargandoMas={cargandoMas}
                  sentinelRef={sentinelRef}
                  vista={vista}
                />
                </>
              )}
            </main>
            </div>
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
                onSeccionChange={handleDesktopSeccionChange}
                minimizado={isSidebarMinimizado}
                onMinimizadoChange={setIsSidebarMinimizado}
                todosLosAdisos={adisosFiltrados}
              />
            )}
          </div>
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
