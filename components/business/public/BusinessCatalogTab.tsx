'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import {
    IconStore, IconWhatsapp, IconSearch, IconEdit, IconBox, IconX, IconTrash,
    IconGrid, IconList, IconFeed, IconFileAlt,
} from '@/components/Icons';
import { deleteCatalogProduct } from '@/lib/business';
import { useCatalogPDF } from '@/hooks/useCatalogPDF';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getProductWhatsappUrl } from '@/lib/business/public-utils';
import { getAdisoUrl } from '@/lib/url';
import type { CartItem } from '@/lib/business/cart';
import ProductSortControl from '@/components/catalog/ProductSortControl';
import SortableProductList from '@/components/catalog/SortableProductList';
import { reorderCatalogProducts } from '@/lib/catalog/reorder';
import {
  getStoredVisitorSort,
  sortCatalogItems,
  type VisitorSortOption,
} from '@/lib/catalog/sort-products';
import { getCategoryIconDataUrl } from '@/lib/catalog/category-icons';
import { listBusinessCategories, type BusinessCategory } from '@/lib/catalog/categories';
import CategoryManagerModal from '@/components/business/editor/CategoryManagerModal';
import { useToast } from '@/hooks/useToast';

function enrichAdisosForSort(
  items: Adiso[],
  catalogProducts: any[]
): Array<Adiso & { sort_order?: number; is_featured?: boolean; created_at?: string }> {
  const catalogRows = catalogProducts.length > 0 ? catalogProducts : items;
  return items.map((a) => {
    const row = catalogRows.find((p: { id: string }) => p.id === a.id);
    return { ...a, ...(row || {}) };
  });
}

function isPublishedCatalogAdiso(a: Adiso): boolean {
  const status = (a as Adiso & { status?: string }).status;
  return status !== 'draft' && status !== 'archived';
}

interface BusinessCatalogTabProps {
    profile: Partial<BusinessProfile>;
    adisos: Adiso[];
    catalogProducts?: any[];
    showEditControls: boolean;
    onEditProduct?: (product: Adiso) => void;
    onEditPart?: (part: string) => void;
    addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
    defaultViewMode?: 'grid' | 'list' | 'feed';
    showPinnedCarousel?: boolean;
    visible?: boolean;
    onFilteredAdisosChange?: (adisos: Adiso[]) => void;
    onCatalogReorder?: () => void;
}

export default function BusinessCatalogTab({
    profile,
    adisos,
    catalogProducts = [],
    showEditControls,
    onEditProduct,
    onEditPart,
    addItem,
    defaultViewMode = 'grid',
    showPinnedCarousel = false,
    visible = true,
    onFilteredAdisosChange,
    onCatalogReorder,
}: BusinessCatalogTabProps) {
    const router = useRouter();
    const { isOnline } = useNetworkStatus();
    const { success: toastSuccess, error: toastError } = useToast();
    const showEntireCatalogOffline = !isOnline;
    const catalogImgLoading = showEntireCatalogOffline ? ('eager' as const) : ('lazy' as const);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'feed'>(defaultViewMode);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches && defaultViewMode === 'grid') {
            setViewMode('feed');
        }
    }, [defaultViewMode]);

    useEffect(() => {
        if (!showEditControls) {
            setVisitorSort(getStoredVisitorSort());
        }
    }, [showEditControls]);
    const [filteredAdisos, setFilteredAdisos] = useState(adisos);
    const [visitorSort, setVisitorSort] = useState<VisitorSortOption>('owner');
    const [reorderBusy, setReorderBusy] = useState(false);
    const [visibleCount, setVisibleCount] = useState(24);
    const [confirmDeleteAdiso, setConfirmDeleteAdiso] = useState<Adiso | null>(null);
    const [deletingAdisoId, setDeletingAdisoId] = useState<string | null>(null);

    const { openCatalogPdf, generating: generatingPDF, progress: pdfProgress } = useCatalogPDF();

    const [storedCategories, setStoredCategories] = useState<BusinessCategory[]>([]);
    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

    const productCategories = useMemo(
        () => Array.from(new Set(adisos.map(a => a.categoria || 'Otros').filter(Boolean))),
        [adisos]
    );

    const categoryCounts = useMemo(() => {
        const map = new Map<string, number>();
        for (const a of adisos) {
            const cat = a.categoria || 'Otros';
            map.set(cat, (map.get(cat) || 0) + 1);
        }
        return map;
    }, [adisos]);

    const loadStoredCategories = useCallback(() => {
        if (!profile.id) return;
        listBusinessCategories(profile.id).then(setStoredCategories);
    }, [profile.id]);

    useEffect(() => {
        loadStoredCategories();
    }, [loadStoredCategories]);

    // Ordered category names: stored (by sort_order) first, then product-derived not stored.
    const categories = useMemo(() => {
        const ordered: string[] = [];
        const seen = new Set<string>();
        for (const sc of storedCategories) {
            if (!seen.has(sc.name)) {
                ordered.push(sc.name);
                seen.add(sc.name);
            }
        }
        for (const name of productCategories) {
            if (!seen.has(name)) {
                ordered.push(name);
                seen.add(name);
            }
        }
        // Visitors don't see empty categories.
        return showEditControls ? ordered : ordered.filter((c) => (categoryCounts.get(c) || 0) > 0);
    }, [storedCategories, productCategories, showEditControls, categoryCounts]);

    const categoryThumbs = useMemo(() => {
        const map = new Map<string, string>();
        for (const sc of storedCategories) {
            if (sc.image_url) map.set(sc.name, sc.image_url);
        }
        for (const a of adisos) {
            const cat = a.categoria || 'Otros';
            if (!map.has(cat)) {
                const url = a.imagenesUrls?.[0] || a.imagenUrl;
                if (url) map.set(cat, url);
            }
        }
        for (const cat of categories) {
            if (!map.has(cat)) {
                const icon = getCategoryIconDataUrl(cat);
                if (icon) map.set(cat, icon);
            }
        }
        return map;
    }, [adisos, categories, storedCategories]);

    useEffect(() => {
        let result = adisos;

        if (!showEditControls) {
            result = result.filter(isPublishedCatalogAdiso);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.titulo.toLowerCase().includes(query) ||
                a.descripcion.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(a => (a.categoria || 'Otros') === selectedCategory);
        }

        const sortKey = showEditControls ? 'owner' : visitorSort;
        result = sortCatalogItems(enrichAdisosForSort(result, catalogProducts), sortKey);

        setFilteredAdisos(result);
        setVisibleCount(24);
    }, [searchQuery, selectedCategory, adisos, catalogProducts, showEditControls, visitorSort]);

    useEffect(() => {
        onFilteredAdisosChange?.(filteredAdisos);
    }, [filteredAdisos, onFilteredAdisosChange]);

    const canReorder =
        showEditControls &&
        Boolean(profile.id) &&
        !searchQuery &&
        !selectedCategory;

    const displayedAdisos = useMemo(
        () =>
            canReorder || showEntireCatalogOffline
                ? filteredAdisos
                : filteredAdisos.slice(0, visibleCount),
        [canReorder, showEntireCatalogOffline, filteredAdisos, visibleCount]
    );
    const hasMore = !canReorder && !showEntireCatalogOffline && visibleCount < filteredAdisos.length;

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setVisibleCount((prev) => prev + 24);
                }
            },
            { rootMargin: '400px' }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasMore, visibleCount]);

    const handleReorder = async (orderedIds: string[]) => {
        if (!profile.id || reorderBusy) return;
        setReorderBusy(true);
        const prev = filteredAdisos;
        const map = new Map(prev.map((a) => [a.id, a]));
        const next = orderedIds.map((id) => map.get(id)).filter(Boolean) as Adiso[];
        if (next.length !== orderedIds.length) {
            setReorderBusy(false);
            toastError('No se pudo reordenar: productos no encontrados');
            return;
        }
        setFilteredAdisos(next);
        const result = await reorderCatalogProducts(profile.id, orderedIds);
        if (!result.success) {
            setReorderBusy(false);
            setFilteredAdisos(prev);
            toastError(result.error || 'No se pudo guardar el orden');
            return;
        }
        setReorderBusy(false);
        toastSuccess('Orden del catálogo actualizado');
        onCatalogReorder?.();
    };

    const openProduct = (adiso: Adiso) => {
        if (canReorder) return;
        router.push(getAdisoUrl(adiso));
    };

    const renderEditActions = (adiso: Adiso, dragHandle?: React.ReactNode, className?: string) => (
        <div className={cn('flex items-center gap-1 shrink-0', className)}>
            {dragHandle}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onEditProduct) onEditProduct(adiso);
                    else onEditPart?.('catalog');
                }}
                className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-100 hover:bg-[var(--brand-color)] hover:text-white text-slate-600 transition-colors"
                title="Editar producto"
                aria-label="Editar producto"
            >
                <IconEdit size={14} />
            </button>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteAdiso(adiso);
                }}
                disabled={deletingAdisoId === adiso.id}
                className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                title="Eliminar producto"
                aria-label="Eliminar producto"
            >
                {deletingAdisoId === adiso.id
                    ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                    : <IconTrash size={12} />}
            </button>
        </div>
    );

    const renderCatalogCard = (adiso: Adiso, dragHandle?: React.ReactNode) => {
        if (viewMode === 'feed') {
            return (
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col">
                    <div className="p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 relative shrink-0">
                                {profile.logo_url ? (
                                    <img src={profile.logo_url} alt={profile.name || 'Logo'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                                        {profile.name?.substring(0, 1) || 'N'}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-bold text-slate-900 truncate">{profile.name}</span>
                        </div>
                        {showEditControls && renderEditActions(adiso, dragHandle)}
                    </div>

                    <div
                        className={cn(
                            'relative w-full aspect-square bg-slate-50 overflow-hidden',
                            !canReorder && 'cursor-pointer'
                        )}
                        onClick={() => openProduct(adiso)}
                    >
                        {adiso.imagenUrl || adiso.imagenesUrls?.[0] ? (
                            <img
                                src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                                alt={adiso.titulo}
                                className="w-full h-full object-contain"
                                loading={catalogImgLoading}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <IconBox size={48} />
                            </div>
                        )}
                        {adiso.precio && (
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/50">
                                <span className="font-black text-slate-900">S/ {adiso.precio}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 flex flex-col gap-1">
                        <h3
                            className={cn('font-bold text-base text-slate-900 leading-tight', !canReorder && 'cursor-pointer')}
                            onClick={() => openProduct(adiso)}
                        >
                            {adiso.titulo}
                        </h3>
                        {adiso.descripcion && (
                            <p className="text-sm text-slate-600 leading-relaxed mt-1">
                                {adiso.descripcion.replace('Precio:', '').trim()}
                            </p>
                        )}
                        {profile.contact_whatsapp && (
                            <a
                                href={`https://wa.me/${profile.contact_whatsapp}?text=${encodeURIComponent(`Hola! Me interesa: ${adiso.titulo}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2"
                            >
                                <IconWhatsapp size={18} /> Pedir ahora
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div
                    role={canReorder ? undefined : 'button'}
                    tabIndex={canReorder ? undefined : 0}
                    onClick={() => openProduct(adiso)}
                    onKeyDown={canReorder ? undefined : (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openProduct(adiso);
                        }
                    }}
                    className={cn(
                        'group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 text-left flex flex-col',
                        canReorder ? 'cursor-default' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                    )}
                >
                    <div className="relative w-full bg-slate-50 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        {adiso.imagenUrl || adiso.imagenesUrls?.[0] ? (
                            <img
                                src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                                alt={adiso.titulo}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                loading={catalogImgLoading}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-200">
                                <IconBox size={40} />
                            </div>
                        )}
                        {adiso.categoria && (
                            <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--brand-color)] shadow-sm">
                                {adiso.categoria}
                            </span>
                        )}
                        {showEditControls && (
                            <div className="absolute top-2 right-2 z-10">
                                {renderEditActions(adiso, dragHandle)}
                            </div>
                        )}
                    </div>
                    <div className="p-3 flex flex-col gap-1 flex-1">
                        <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug">
                            {adiso.titulo}
                        </h3>
                        {adiso.descripcion && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
                                {adiso.descripcion.replace('Precio:', '').trim()}
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50 gap-2">
                            <span className="font-black text-base text-slate-900">
                                {adiso.precio ? `S/ ${adiso.precio}` : <span className="text-sm font-semibold text-slate-400">Consultar</span>}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addItem({
                                            productId: adiso.id,
                                            title: adiso.titulo,
                                            price: adiso.precio,
                                            imageUrl: adiso.imagenesUrls?.[0] || adiso.imagenUrl,
                                        });
                                    }}
                                    className="text-[10px] font-bold px-2 py-1 bg-[var(--brand-color)]/10 text-[var(--brand-color)] rounded-lg hover:bg-[var(--brand-color)] hover:text-white transition-colors"
                                >
                                    + Carrito
                                </button>
                                {profile.contact_whatsapp && (
                                    <a
                                        href={getProductWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio', adiso)}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                                    >
                                        <IconWhatsapp size={11} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div
                className={cn(
                    'bg-white rounded-2xl border border-slate-100 shadow-sm transition-all flex gap-3 items-start relative group p-3',
                    canReorder ? 'cursor-default' : 'hover:shadow-md cursor-pointer'
                )}
                onClick={() => openProduct(adiso)}
            >
                {showEditControls && dragHandle && (
                    <div className="flex items-start pt-1 shrink-0">{dragHandle}</div>
                )}
                <div className="w-20 h-20 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden">
                    {adiso.imagenUrl || adiso.imagenesUrls?.[0] ? (
                        <img
                            src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                            alt={adiso.titulo || 'Producto'}
                            className="w-full h-full object-contain"
                            loading={catalogImgLoading}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <IconBox size={28} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <span className="text-[10px] font-bold text-[var(--brand-color)] uppercase tracking-wide block mb-0.5">{adiso.categoria || ''}</span>
                    <h3 className="font-bold text-sm text-slate-800 mb-1 leading-snug line-clamp-2">{adiso.titulo}</h3>
                    {adiso.descripcion && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{adiso.descripcion.replace('Precio:', '').trim()}</p>
                    )}
                    <div className="mt-2 font-black text-lg text-slate-900">
                        {adiso.precio ? `S/ ${adiso.precio}` : <span className="text-sm font-semibold text-slate-400">Consultar</span>}
                    </div>
                </div>
                {showEditControls && (
                    <div className="absolute top-2 right-2">
                        {renderEditActions(adiso, viewMode === 'list' ? undefined : dragHandle)}
                    </div>
                )}
            </div>
        );
    };

    const catalogGridClassName = cn(
        'grid gap-3 md:gap-4',
        viewMode === 'grid'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : viewMode === 'feed'
                ? 'grid-cols-1 max-w-xl mx-auto'
                : 'grid-cols-1'
    );

    const handleDeleteAdiso = async (adiso: Adiso) => {
        setDeletingAdisoId(adiso.id);
        try {
            await deleteCatalogProduct(adiso.id);
            setFilteredAdisos(prev => prev.filter(a => a.id !== adiso.id));
        } finally {
            setDeletingAdisoId(null);
            setConfirmDeleteAdiso(null);
        }
    };

    const handlePDFDownload = async () => {
        try {
            const rows =
                catalogProducts.length > 0
                    ? catalogProducts
                    : filteredAdisos.map((a) => ({ id: a.id, images: a.imagenesUrls }));
            await openCatalogPdf(profile, filteredAdisos, rows);
        } catch (e) {
            console.error('Error al generar PDF:', e);
        }
    };

    return (
        <>
            {visible && (
                <motion.div
                    key="catalogo"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="max-w-7xl mx-auto space-y-12"
                >
                    <div className="flex flex-col gap-6 print:hidden">

                        {/* Row 1: Search Bar — full width */}
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--brand-color)] transition-colors">
                                <IconSearch size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color)]/10 transition-all font-medium text-slate-700 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 rounded-full p-1 hover:bg-slate-300"
                                >
                                    <IconX size={14} />
                                </button>
                            )}
                        </div>

                        {showPinnedCarousel && filteredAdisos.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                {filteredAdisos
                                    .filter((a) => a.imagenUrl || a.imagenesUrls?.[0])
                                    .slice(0, 10)
                                    .map((adiso) => (
                                        <button
                                            key={adiso.id}
                                            type="button"
                                            onClick={() => router.push(getAdisoUrl(adiso))}
                                            className="shrink-0 w-28 rounded-[var(--bp-radius)] overflow-hidden border border-[var(--bp-border)] bg-[var(--bp-surface)] active:scale-[0.98] transition-transform"
                                        >
                                            <div className="aspect-square bg-[var(--bg-secondary)]">
                                                <img
                                                    src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                                                    alt={adiso.titulo}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold p-1.5 truncate text-[var(--bp-text)]">
                                                {adiso.titulo}
                                            </p>
                                        </button>
                                    ))}
                            </div>
                        )}

                        {/* Toolbar: count + sort + view modes + PDF — one line */}
                        <div className="flex items-center gap-2 flex-nowrap min-w-0">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 min-w-0 shrink">
                                <IconBox size={14} className="shrink-0" />
                                <span className="truncate">{filteredAdisos.length} productos</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                {!showEditControls && (
                                    <ProductSortControl
                                        value={visitorSort}
                                        onChange={setVisitorSort}
                                    />
                                )}

                                <div className="flex items-center gap-1 bg-white border border-slate-100 p-1 rounded-2xl shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={cn('p-2.5 rounded-xl transition-all', viewMode === 'grid' ? 'bg-[var(--brand-color)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600')}
                                        title="Cuadrícula"
                                    >
                                        <IconGrid size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('feed')}
                                        className={cn('p-2.5 rounded-xl transition-all', viewMode === 'feed' ? 'bg-[var(--brand-color)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600')}
                                        title="Feed"
                                    >
                                        <IconFeed size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={cn('p-2.5 rounded-xl transition-all', viewMode === 'list' ? 'bg-[var(--brand-color)] text-white shadow-md' : 'text-slate-400 hover:text-slate-600')}
                                        title="Lista"
                                    >
                                        <IconList size={18} />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handlePDFDownload}
                                    disabled={generatingPDF}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 transition-colors relative disabled:cursor-wait shrink-0"
                                    title="Descargar catálogo en PDF"
                                >
                                    {generatingPDF ? (
                                        <div className="relative">
                                            <div className="w-[18px] h-[18px] border-2 border-slate-200 border-t-[var(--brand-color)] rounded-full animate-spin" />
                                            {pdfProgress > 0 && (
                                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[var(--brand-color)] whitespace-nowrap">
                                                    {pdfProgress}%
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <IconFileAlt size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Categories — IG highlights style (squircle) */}
                        {(categories.length > 0 || showEditControls) && (
                            <div className="overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
                                <div className="flex gap-4 snap-x snap-mandatory items-start">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCategory(null)}
                                        className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
                                    >
                                        <div
                                            className={cn(
                                                'w-[4.25rem] h-[4.25rem] p-[2px] rounded-[28%] transition-all',
                                                !selectedCategory
                                                    ? 'bg-gradient-to-tr from-[var(--brand-color)] to-[var(--brand-accent,#ec4899)]'
                                                    : 'bg-slate-200'
                                            )}
                                        >
                                            <div className="w-full h-full rounded-[26%] border-2 border-white overflow-hidden bg-slate-50 flex items-center justify-center">
                                                <IconStore size={22} className={!selectedCategory ? 'text-[var(--brand-color)]' : 'text-slate-400'} />
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'text-[11px] font-medium truncate max-w-[4.5rem] text-center leading-tight',
                                            !selectedCategory ? 'text-[var(--brand-color)]' : 'text-slate-500'
                                        )}>
                                            Todos
                                        </span>
                                    </button>
                                    {categories.map((cat) => {
                                        const thumb = categoryThumbs.get(cat);
                                        const selected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
                                            >
                                                <div
                                                    className={cn(
                                                        'w-[4.25rem] h-[4.25rem] p-[2px] rounded-[28%] transition-all',
                                                        selected
                                                            ? 'bg-gradient-to-tr from-[var(--brand-color)] to-[var(--brand-accent,#ec4899)]'
                                                            : 'bg-slate-200'
                                                    )}
                                                >
                                                    <div className="w-full h-full rounded-[26%] border-2 border-white overflow-hidden bg-slate-50">
                                                        {thumb ? (
                                                            <img src={thumb} alt={cat} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-base font-bold text-[var(--brand-color)] bg-[var(--brand-color)]/10">
                                                                {cat.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    'text-[11px] font-medium truncate max-w-[4.5rem] text-center leading-tight',
                                                    selected ? 'text-[var(--brand-color)]' : 'text-slate-500'
                                                )}>
                                                    {cat}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {showEditControls && (
                                        <button
                                            type="button"
                                            onClick={() => setCategoryManagerOpen(true)}
                                            className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
                                            title="Gestionar categorías"
                                        >
                                            <div className="w-[4.25rem] h-[4.25rem] rounded-[26%] border-2 border-dashed border-[var(--brand-color)]/40 flex items-center justify-center text-[var(--brand-color)] bg-[var(--brand-color)]/5">
                                                <IconEdit size={22} />
                                            </div>
                                            <span className="text-[11px] font-medium truncate max-w-[4.5rem] text-center leading-tight text-[var(--brand-color)]">
                                                Editar
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {showEditControls && (searchQuery || selectedCategory) && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                Limpia la búsqueda y categoría para reordenar productos arrastrando.
                            </p>
                        )}
                        {canReorder && (
                            <p className="text-xs text-[var(--brand-color)] bg-[var(--brand-color)]/5 border border-[var(--brand-color)]/15 rounded-xl px-3 py-2">
                                Arrastra los productos para cambiar el orden que ven tus clientes.
                            </p>
                        )}
                    </div>

                    {displayedAdisos.length > 0 ? (
                        <>
                            {canReorder ? (
                                <SortableProductList
                                    items={displayedAdisos}
                                    onReorder={handleReorder}
                                    disabled={reorderBusy}
                                    className={catalogGridClassName}
                                    strategy={viewMode === 'grid' ? 'grid' : 'list'}
                                    renderItem={(adiso, handle) => renderCatalogCard(adiso, handle)}
                                />
                            ) : (
                                <div className={catalogGridClassName}>
                                    {displayedAdisos.map((adiso) => (
                                        <React.Fragment key={adiso.id}>
                                            {renderCatalogCard(adiso)}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}

                            {hasMore && (
                                <div
                                    ref={loadMoreRef}
                                    className="h-20 flex items-center justify-center p-4"
                                >
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-zinc-700">
                                <IconSearch size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400">Sin resultados</h3>
                            <p className="text-slate-300">Intenta con otros términos</p>
                        </div>
                    )}
                </motion.div>
            )}

            {categoryManagerOpen && profile.id && (
                <CategoryManagerModal
                    businessProfileId={profile.id}
                    productCategories={productCategories}
                    autoThumbs={categoryThumbs}
                    onClose={() => setCategoryManagerOpen(false)}
                    onChanged={loadStoredCategories}
                />
            )}

            {confirmDeleteAdiso && (
                <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 flex items-center gap-4 border-b border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                {confirmDeleteAdiso.imagenesUrls?.[0] || confirmDeleteAdiso.imagenUrl ? (
                                    <img
                                        src={confirmDeleteAdiso.imagenesUrls?.[0] || confirmDeleteAdiso.imagenUrl || ''}
                                        className="w-full h-full object-cover"
                                        alt={confirmDeleteAdiso.titulo || "Producto"}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <IconBox size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-0.5">Eliminar del catálogo</p>
                                <h3 className="font-bold text-slate-800 truncate text-base">{confirmDeleteAdiso.titulo}</h3>
                                {confirmDeleteAdiso.precio && (
                                    <p className="text-sm font-semibold text-slate-500">S/ {confirmDeleteAdiso.precio}</p>
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-4">
                            <div className="flex items-start gap-3 bg-red-50 rounded-2xl p-4 mb-4 border border-red-100">
                                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <IconTrash size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-800 mb-1">Esta acción no se puede deshacer</p>
                                    <p className="text-xs text-red-600 leading-relaxed">
                                        El producto desaparecerá del catálogo inmediatamente.
                                        Los clientes ya no podrán verlo ni contactarte por él.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDeleteAdiso(null)}
                                    disabled={deletingAdisoId !== null}
                                    className="flex-1 py-3 text-sm font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteAdiso(confirmDeleteAdiso)}
                                    disabled={deletingAdisoId !== null}
                                    className="flex-1 py-3 text-sm font-bold rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                                >
                                    {deletingAdisoId ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <IconTrash size={16} />
                                            Sí, eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export function PrintableCatalog({ profile, adisos }: { profile: Partial<BusinessProfile>, adisos: Adiso[] }) {
    return (
        <div className="w-full text-black bg-white">
            <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
                <div className="flex items-center gap-6">
                    {profile.logo_url && (
                        <img src={profile.logo_url} alt={profile.name || "Logo"} className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    )}
                    <div>
                        <h1 className="text-4xl font-black mb-2">{profile.name}</h1>
                        <div className="text-sm font-medium space-y-1 text-gray-600">
                            {profile.contact_address && <p className="flex items-center gap-2">📍 {profile.contact_address}</p>}
                            {profile.contact_phone && <p className="flex items-center gap-2">📞 {profile.contact_phone}</p>}
                            {profile.contact_email && <p className="flex items-center gap-2">✉️ {profile.contact_email}</p>}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded mb-2 inline-block">CATÁLOGO</div>
                    <p className="text-xs text-gray-500">Generado el {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {adisos.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 break-inside-avoid page-break-inside-avoid">
                        <div className="w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden relative">
                            {product.imagenUrl ? (
                                <img src={product.imagenUrl} className="w-full h-full object-cover" alt={product.titulo || "Producto"} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xs uppercase">Sin Foto</div>
                            )}
                        </div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-2 h-10">{product.titulo}</h3>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">{product.descripcion}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase">{product.categoria || 'Producto'}</span>
                            <span className="font-black text-lg">{product.precio ? `S/ ${product.precio}` : '-'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Catálogo generado por {profile.name} - Precios sujetos a cambios.</p>
            </div>
        </div>
    );
}
