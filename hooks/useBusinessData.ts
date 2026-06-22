/**
 * 🏬 useBusinessData - Hook con caché offline para datos de negocio
 *
 * Stale-While-Revalidate + IndexedDB para catálogo grande.
 * Nunca vacía el catálogo si falla la red (revalidación offline).
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { supabase } from '@/lib/supabase';
import { getBusinessProfileBySlug } from '@/lib/business';
import {
  cacheSet,
  cacheGet,
  CacheKeys,
  CACHE_TTL,
} from '@/lib/offline-cache';
import { idbGetCatalog, idbSetCatalog } from '@/lib/offline-catalog-store';
import { idbClearCatalogPdf } from '@/lib/catalog-pdf';
import { prefetchCatalogProductImages } from '@/lib/catalog-image-prefetch';
import { useNetworkStatus } from './useNetworkStatus';
import { normalizeBusinessProfile } from '@/lib/business/normalize-profile';

function enrichBusinessProfile(profile: BusinessProfile): BusinessProfile {
  const normalized = normalizeBusinessProfile(profile);
  return {
    ...normalized,
    template_id: normalized.template_id || 'modern_tabs',
    theme_preset: normalized.theme_preset || 'executive',
  } as BusinessProfile;
}

interface BusinessDataState {
  business: BusinessProfile | null;
  adisos: Adiso[];
  catalogProducts: any[];
  loading: boolean;
  revalidating: boolean;
  fromCache: boolean;
  isStale: boolean;
  error: string | null;
}

async function readCachedCatalog(businessId: string): Promise<any[]> {
  const fromIdb = await idbGetCatalog(businessId);
  if (fromIdb && fromIdb.length > 0) return fromIdb;
  return cacheGet<any[]>(CacheKeys.businessCatalog(businessId), true) || [];
}

async function persistCatalog(businessId: string, publishedOnly: any[]): Promise<void> {
  cacheSet(CacheKeys.businessCatalog(businessId), publishedOnly, CACHE_TTL.CATALOG_PRODUCTS);
  await idbSetCatalog(businessId, publishedOnly);
}

export function useBusinessData(slug: string, isOwner: boolean) {
  const { isOnline, justCameOnline } = useNetworkStatus();
  const revalidatingRef = useRef(false);
  const businessRef = useRef<BusinessProfile | null>(null);

  const [state, setState] = useState<BusinessDataState>({
    business: null,
    adisos: [],
    catalogProducts: [],
    loading: true,
    revalidating: false,
    fromCache: false,
    isStale: false,
    error: null,
  });

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cachedBusiness = cacheGet<BusinessProfile>(CacheKeys.businessProfile(slug), true);
      if (!cachedBusiness) {
        if (!cancelled) {
          setHydrated(true);
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: 'Sin conexión y sin datos previos',
            }));
          }
        }
        return;
      }

      const enrichedCache = enrichBusinessProfile(cachedBusiness);
      const cachedProducts = await readCachedCatalog(enrichedCache.id);
      const mappedAdisos = mapProductsToAdisos(cachedProducts, enrichedCache);

      if (!cancelled) {
        businessRef.current = enrichedCache;
        setState({
          business: enrichedCache,
          adisos: mappedAdisos,
          catalogProducts: cachedProducts,
          loading: false,
          revalidating: false,
          fromCache: true,
          isStale: true,
          error: null,
        });
        setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fetchBusinessProfile = useCallback(async (): Promise<BusinessProfile | null | 'skip'> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'skip';
    }
    try {
      const profileData = await getBusinessProfileBySlug(slug);
      if (profileData) {
        cacheSet(CacheKeys.businessProfile(slug), profileData, CACHE_TTL.BUSINESS_PROFILE);
        if (profileData.logo_url) {
          queueMicrotask(() => {
            const im = new Image();
            im.decoding = 'async';
            im.src = profileData.logo_url as string;
          });
        }
      }
      return profileData;
    } catch (e) {
      console.error('[useBusinessData] Error fetching profile:', e);
      return 'skip';
    }
  }, [slug]);

  /** null = error/offline, no sobrescribir catálogo en pantalla */
  const fetchCatalog = useCallback(
    async (businessId: string, ownerMode: boolean): Promise<any[] | null> => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return null;
      }
      if (!supabase) return null;
      try {
        let query = supabase
          .from('catalog_products')
          .select('*')
          .eq('business_profile_id', businessId)
          .order('created_at', { ascending: false });

        if (!ownerMode) {
          query = query.eq('status', 'published');
        }

        const { data, error } = await query;
        if (error) {
          console.error('[useBusinessData] catalog error:', error);
          return null;
        }

        const products = data || [];
        const publishedOnly = products.filter((p: any) => p.status === 'published');
        await persistCatalog(businessId, publishedOnly);
        await idbClearCatalogPdf(businessId);

        queueMicrotask(() => prefetchCatalogProductImages(publishedOnly));

        return products;
      } catch (e) {
        console.error('[useBusinessData] Error fetching catalog:', e);
        return null;
      }
    },
    []
  );

  const applyCatalogToState = useCallback(
    (profileData: BusinessProfile, catalogData: any[]) => {
      const enriched = enrichBusinessProfile(profileData);
      const mappedAdisos = mapProductsToAdisos(catalogData, enriched);
      businessRef.current = enriched;
      setState((prev) => ({
        ...prev,
        business: enriched,
        adisos: mappedAdisos,
        catalogProducts: catalogData,
        loading: false,
        revalidating: false,
        fromCache: false,
        isStale: false,
        error: null,
      }));
    },
    []
  );

  const loadData = useCallback(
    async (isRevalidation = false) => {
      if (revalidatingRef.current && isRevalidation) return;

      if (isRevalidation) {
        revalidatingRef.current = true;
        setState((prev) => ({ ...prev, revalidating: true }));
      }

      try {
        const profileResult = await fetchBusinessProfile();

        let profileData: BusinessProfile | null =
          businessRef.current || cacheGet<BusinessProfile>(CacheKeys.businessProfile(slug), true);

        if (profileResult === 'skip') {
          // Mantener perfil en caché
        } else if (profileResult) {
          profileData = profileResult;
        } else if (!isRevalidation) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: prev.business ? null : 'Negocio no encontrado',
          }));
          return;
        } else {
          setState((prev) => ({ ...prev, revalidating: false }));
          return;
        }

        if (!profileData) {
          setState((prev) => ({ ...prev, loading: false, revalidating: false }));
          return;
        }

        const enrichedProfile = enrichBusinessProfile(profileData);
        const catalogResult = await fetchCatalog(enrichedProfile.id, isOwner);

        if (catalogResult !== null) {
          applyCatalogToState(enrichedProfile, catalogResult);
        } else {
          const fallback = await readCachedCatalog(enrichedProfile.id);
          const mapped = mapProductsToAdisos(fallback, enrichedProfile);
          businessRef.current = enrichedProfile;
          setState((prev) => ({
            ...prev,
            business: enrichedProfile,
            adisos: mapped.length > 0 ? mapped : prev.adisos,
            catalogProducts: fallback.length > 0 ? fallback : prev.catalogProducts,
            loading: false,
            revalidating: false,
            fromCache: true,
            isStale: true,
            error: null,
          }));
        }
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          revalidating: false,
          error: prev.business ? null : 'Error al cargar el negocio',
        }));
      } finally {
        revalidatingRef.current = false;
      }
    },
    [fetchBusinessProfile, fetchCatalog, isOwner, slug, applyCatalogToState]
  );

  const reloadCatalog = useCallback(
    async (businessId: string) => {
      if (!isOnline) return;
      const currentBusiness = businessRef.current;
      const catalogData = await fetchCatalog(businessId, isOwner);
      if (catalogData !== null && currentBusiness) {
        applyCatalogToState(currentBusiness, catalogData);
      }
    },
    [isOnline, fetchCatalog, isOwner, applyCatalogToState]
  );

  useEffect(() => {
    if (!hydrated || !slug) return;

    if (state.business) {
      if (isOnline) {
        loadData(true);
      }
    } else if (isOnline) {
      loadData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, slug]);

  useEffect(() => {
    if (justCameOnline && slug && hydrated) {
      loadData(true);
    }
  }, [justCameOnline, slug, hydrated, loadData]);

  useEffect(() => {
    if (!state.business?.id || !isOnline) return;
    fetchCatalog(state.business.id, isOwner).then((catalogData) => {
      if (catalogData !== null && state.business) {
        applyCatalogToState(state.business, catalogData);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, state.business?.id]);

  const updateBusiness = useCallback(
    (updater: (prev: BusinessProfile) => BusinessProfile) => {
      setState((prev) => {
        if (!prev.business) return prev;
        const updated = updater(prev.business);
        businessRef.current = updated;
        cacheSet(CacheKeys.businessProfile(slug), updated, CACHE_TTL.BUSINESS_PROFILE);
        return { ...prev, business: updated };
      });
    },
    [slug]
  );

  useEffect(() => {
    if (state.business) {
      businessRef.current = state.business;
    }
  }, [state.business]);

  return {
    ...state,
    loading: !hydrated || state.loading,
    isOnline,
    reloadCatalog,
    updateBusiness,
    refetch: () => loadData(false),
  };
}

function normalizeProductImages(raw: unknown): any[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

function mapProductsToAdisos(products: any[], business: BusinessProfile | null): Adiso[] {
  return products.map((p: any) => {
    const imgs = normalizeProductImages(p.images);
    return {
      id: p.id,
      titulo: p.title || '',
      descripcion: p.description || '',
      precio: p.price,
      imagenesUrls: imgs
        .map((img: any) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean),
      imagenUrl: imgs.length > 0
        ? (typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url || '')
        : '',
      slug: p.id,
      categoria: p.category || 'productos',
      user_id: business?.user_id || p.business_profile_id,
      contacto: business?.contact_phone || '',
      ubicacion: business?.contact_address || '',
      fechaPublicacion: p.created_at
        ? new Date(p.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      horaPublicacion: p.created_at
        ? new Date(p.created_at).toLocaleTimeString()
        : new Date().toLocaleTimeString(),
      status: p.status,
    };
  });
}
