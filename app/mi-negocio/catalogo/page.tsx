'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    IconPlus, IconGrid, IconList, IconSearch, IconFilter, IconSparkles,
    IconPackage, IconArrowLeft, IconEye, IconEdit, IconTrash,
    IconCheck, IconX, IconRefresh, IconTag, IconZap, IconChevronRight,
    IconChevronDown, IconLightbulb
} from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { CatalogProduct } from '@/types/catalog';
import AddProductModal from '@/components/catalog/AddProductModal';
import { SectorSelectorModal } from '@/components/catalog/SectorSelectorModal';
import { groupProducts, getFilterOptions, type GroupedProduct } from '@/lib/catalog/product-grouping';
import { ProductEditor } from '@/components/business/ProductEditor';
import { listBusinessProfilesForUser } from '@/lib/business';
import SortableProductList from '@/components/catalog/SortableProductList';
import CatalogTrashPanel from '@/components/catalog/CatalogTrashPanel';
import { reorderCatalogProducts } from '@/lib/catalog/reorder';
import type { Adiso } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuickFilter = 'all' | 'published' | 'draft' | 'no-image' | 'no-price' | 'incomplete';

interface ProductHealth {
    missingImage: boolean;
    missingPrice: boolean;
    missingCategory: boolean;
    isDraft: boolean;
    isIncomplete: boolean;
    score: number; // 0-100
}

interface AISuggestion {
    category: string;
    products: { id: string; title: string; currentCategory: string | null }[];
}

// ─── Health calculation ────────────────────────────────────────────────────────

function getProductHealth(product: CatalogProduct): ProductHealth {
    const missingImage = !product.images || product.images.length === 0;
    const missingPrice = !product.price || product.price <= 0;
    const missingCategory = !product.category || product.category.trim() === '';
    const isDraft = product.status === 'draft';
    const isIncomplete = missingImage || missingPrice || missingCategory;

    let score = 100;
    if (missingImage) score -= 35;
    if (missingPrice) score -= 30;
    if (missingCategory) score -= 20;
    if (isDraft) score -= 15;

    return { missingImage, missingPrice, missingCategory, isDraft, isIncomplete, score };
}

function getFirstImageUrl(product: CatalogProduct | GroupedProduct): string {
    if ('allProducts' in product) {
        // GroupedProduct
        const first = product.allProducts[0];
        if (first?.images && first.images.length > 0) {
            const img = first.images[0];
            return typeof img === 'string' ? img : img.url || '';
        }
        return product.baseImage || '';
    }
    // CatalogProduct
    if (product.images && product.images.length > 0) {
        const img = product.images[0];
        return typeof img === 'string' ? img : img.url || '';
    }
    return '';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function CatalogPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const businessParam = searchParams.get('business');
    const { success, error: showError, toasts, removeToast } = useToast();

    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'order'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [businessProfileId, setBusinessProfileId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [filterOptions, setFilterOptions] = useState<{ categories: string[]; brands: string[] }>({ categories: [], brands: [] });
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Batch selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [showBulkCategoryInput, setShowBulkCategoryInput] = useState(false);
    const [bulkCategory, setBulkCategory] = useState('');

    // AI organize
    const [showAIOrganize, setShowAIOrganize] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
    const [aiSelectedCategories, setAiSelectedCategories] = useState<Set<string>>(new Set());
    const [aiApplying, setAiApplying] = useState(false);
    const [aiTotal, setAiTotal] = useState(0);
    const [reorderBusy, setReorderBusy] = useState(false);

    // Guided fix mode
    const [fixModeIdx, setFixModeIdx] = useState(0);
    const [showFixMode, setShowFixMode] = useState(false);

    // Business Sector
    const [showSectorSelector, setShowSectorSelector] = useState(false);
    const [businessSector, setBusinessSector] = useState<string | null>(null);
    const [businessPickList, setBusinessPickList] = useState<{ id: string; name: string }[]>([]);

    // ── computed stats ──────────────────────────────────────────────────────

    const stats = useMemo(() => {
        const total = products.length;
        const published = products.filter(p => p.status === 'published').length;
        const draft = products.filter(p => p.status === 'draft').length;
        const noImage = products.filter(p => !p.images || p.images.length === 0).length;
        const incomplete = products.filter(p => getProductHealth(p).isIncomplete).length;
        return { total, published, draft, noImage, incomplete };
    }, [products]);

    // ── filtered products ───────────────────────────────────────────────────

    const filteredProducts = useMemo(() => {
        let list = products;

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }

        // Category / brand
        if (selectedCategory !== 'all') list = list.filter(p => p.category === selectedCategory);
        if (selectedBrand !== 'all') list = list.filter(p => p.brand === selectedBrand);

        // Quick filter
        switch (quickFilter) {
            case 'published': list = list.filter(p => p.status === 'published'); break;
            case 'draft': list = list.filter(p => p.status === 'draft'); break;
            case 'no-image': list = list.filter(p => !p.images || p.images.length === 0); break;
            case 'no-price': list = list.filter(p => !p.price || p.price <= 0); break;
            case 'incomplete': list = list.filter(p => getProductHealth(p).isIncomplete); break;
        }

        return list;
    }, [products, searchQuery, selectedCategory, selectedBrand, quickFilter]);

    const groupedProducts = useMemo(() => groupProducts(filteredProducts), [filteredProducts]);

    // ── data loading ────────────────────────────────────────────────────────


    const loadProducts = useCallback(async (profileId?: string) => {
        const pid = profileId || businessProfileId;
        if (!pid || !supabase) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', pid)
                .is('deleted_at', null)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);

            const opts = getFilterOptions(data || []);
            setFilterOptions(opts as any);
        } catch (err: any) {
            showError('Error al cargar productos: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [businessProfileId, showError]);

    const loadBusinessProfile = useCallback(async () => {
        try {
            if (!supabase) throw new Error('Supabase no configurado');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }

            const memberships = await listBusinessProfilesForUser(user.id);
            if (!memberships.length) { router.push('/mi-negocio'); return; }

            setBusinessPickList(
                memberships.map((m) => ({
                    id: m.profile.id,
                    name: m.profile.name || m.profile.slug || m.profile.id,
                }))
            );

            const pick = businessParam ? memberships.find((m) => m.profile.id === businessParam) : null;
            const chosen = pick ?? memberships[0];

            setUserId(user.id);
            setBusinessProfileId(chosen.profile.id);
            await loadProducts(chosen.profile.id);
        } catch (err: any) {
            showError('Error al cargar perfil: ' + err.message);
        }
    }, [router, showError, loadProducts, businessParam]);

    useEffect(() => { loadBusinessProfile(); }, [loadBusinessProfile]);

    useEffect(() => {
        if (filterOptions.categories.length === 0 && products.length > 0) {
            const opts = getFilterOptions(products);
            setFilterOptions(opts as any);
        }
    }, [products, filterOptions.categories.length]);

    // ── batch operations ────────────────────────────────────────────────────

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const bulkPublish = async (status: 'published' | 'draft') => {
        if (!supabase || selectedIds.size === 0) return;
        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            const { error } = await supabase
                .from('catalog_products')
                .update({ status, updated_at: new Date().toISOString() })
                .in('id', ids);
            if (error) throw error;
            success(`${ids.length} productos ${status === 'published' ? 'publicados' : 'guardados como borrador'}`);
            setSelectedIds(new Set());
            setIsSelecting(false);
            await loadProducts();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setBulkLoading(false);
        }
    };

    const bulkDelete = async () => {
        if (!supabase || selectedIds.size === 0) return;
        if (!confirm(`¿Eliminar ${selectedIds.size} productos? Quedarán 30 días en la papelera.`)) return;
        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            const { error } = await supabase
                .from('catalog_products')
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids)
                .is('deleted_at', null);
            if (error) throw error;
            success(`${ids.length} productos enviados a la papelera`);
            setSelectedIds(new Set());
            setIsSelecting(false);
            await loadProducts();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setBulkLoading(false);
        }
    };

    const quickPublishToggle = async (product: CatalogProduct) => {
        if (!supabase) return;
        const newStatus = product.status === 'published' ? 'draft' : 'published';
        try {
            const { error } = await supabase
                .from('catalog_products')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', product.id);
            if (error) throw error;
            // Optimistic update
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
        } catch (err: any) {
            showError('Error: ' + err.message);
        }
    };

    // ── AI organize ─────────────────────────────────────────────────────────

    const runAIOrganize = async (all = false, sectorOverride?: string) => {
        if (!supabase) return;

        // If we don't know the sector, ask first
        const sectorToUse = sectorOverride || businessSector;
        if (!sectorToUse) {
            setShowSectorSelector(true);
            return;
        }

        setAiLoading(true);
        setAiSuggestions(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/catalog/ai-categorize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    all,
                    sector: sectorToUse,
                    business_id: businessProfileId,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error de IA');
            setAiSuggestions(data.suggestions);
            setAiTotal(data.total);
            // Select all by default
            setAiSelectedCategories(new Set(data.suggestions.map((s: AISuggestion) => s.category)));
        } catch (err: any) {
            showError('Error: ' + err.message);
            setShowAIOrganize(false);
        } finally {
            setAiLoading(false);
        }
    };

    const applyAISuggestions = async () => {
        if (!supabase || !aiSuggestions) return;
        setAiApplying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const assignments = aiSuggestions
                .filter(s => aiSelectedCategories.has(s.category))
                .flatMap(s => s.products.map(p => ({ productId: p.id, category: s.category })));

            const res = await fetch('/api/catalog/ai-categorize', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ assignments, business_id: businessProfileId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            success(`✓ ${data.applied} productos organizados`);
            setShowAIOrganize(false);
            setAiSuggestions(null);
            await loadProducts();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setAiApplying(false);
        }
    };

    const bulkChangeCategory = async () => {
        if (!supabase || selectedIds.size === 0 || !bulkCategory.trim()) return;
        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            const { error } = await supabase
                .from('catalog_products')
                .update({ category: bulkCategory.trim(), updated_at: new Date().toISOString() })
                .in('id', ids);
            if (error) throw error;
            success(`Categoría "${bulkCategory}" aplicada a ${ids.length} productos`);
            setSelectedIds(new Set());
            setIsSelecting(false);
            setShowBulkCategoryInput(false);
            setBulkCategory('');
            await loadProducts();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setBulkLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!supabase) return;
        if (!confirm('¿Eliminar este producto? Quedará 30 días en la papelera.')) return;
        try {
            const { data, error } = await supabase
                .from('catalog_products')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .is('deleted_at', null)
                .select('id');
            if (error) throw error;
            if (!data?.length) throw new Error('No se encontró el producto o no tienes permiso');
            setProducts(prev => prev.filter(p => p.id !== id));
            success('Producto enviado a la papelera');
        } catch (err: any) {
            showError('Error: ' + err.message);
        }
    };

    // ── render ──────────────────────────────────────────────────────────────

    const quickFilters: { id: QuickFilter; label: string; count?: number; color?: string }[] = [
        { id: 'all', label: 'Todos', count: stats.total },
        { id: 'published', label: 'Publicados', count: stats.published, color: 'green' },
        { id: 'draft', label: 'Borradores', count: stats.draft, color: 'yellow' },
        { id: 'incomplete', label: 'Incompletos', count: stats.incomplete, color: 'red' },
        { id: 'no-image', label: 'Sin imagen', count: stats.noImage, color: 'orange' },
        { id: 'no-price', label: 'Sin precio' },
    ];

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 px-3 py-4 md:px-6 md:py-6">
                <div className="max-w-7xl mx-auto">

                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div className="mb-5">
                        <Link
                            href="/mi-negocio"
                            className="inline-flex items-center gap-1.5 text-xs font-bold mb-3 opacity-70 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--brand-blue)' }}
                        >
                            <IconArrowLeft size={12} />
                            Mi negocio
                        </Link>

                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    Mi Catálogo
                                </h1>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                    {stats.total} productos
                                    {stats.incomplete > 0 && (
                                        <span className="ml-2 text-amber-600 font-semibold">
                                            · {stats.incomplete} necesitan atención
                                        </span>
                                    )}
                                </p>
                                {businessPickList.length > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                                            Negocio
                                        </span>
                                        <select
                                            className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white max-w-[220px]"
                                            value={businessProfileId || ''}
                                            onChange={(e) =>
                                                router.push(`/mi-negocio/catalogo?business=${e.target.value}`)
                                            }
                                        >
                                            {businessPickList.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => setShowTrash(true)}
                                    disabled={!businessProfileId}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40"
                                    title="Papelera (30 días)"
                                >
                                    <IconTrash size={15} />
                                    <span className="hidden sm:inline">Papelera</span>
                                </button>
                                <Link
                                    href={
                                        businessProfileId
                                            ? `/mi-negocio/catalogo/importar?business=${businessProfileId}`
                                            : '/mi-negocio/catalogo/importar'
                                    }
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:shadow-sm"
                                    style={{
                                        borderColor: 'var(--brand-blue)',
                                        color: 'var(--brand-blue)',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    <IconSparkles size={15} />
                                    Importar
                                </Link>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                                    style={{ backgroundColor: 'var(--brand-blue)' }}
                                >
                                    <IconPlus size={16} />
                                    <span className="hidden sm:inline">Agregar</span>
                                    <span className="sm:hidden">+</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Smart action banners ─────────────────────────────── */}
                    {(() => {
                        const noCategory = products.filter(p => !p.category).length;
                        const showAIBanner = noCategory > 0;
                        const showFixBanner = stats.incomplete > 0 && quickFilter !== 'incomplete';

                        return (
                            <div className="space-y-2 mb-4">
                                {/* AI organize banner */}
                                {showAIBanner && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-purple-100 bg-purple-50">
                                        <span className="text-xl flex-shrink-0">✨</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-purple-800 text-sm">
                                                {noCategory} productos sin categoría
                                            </p>
                                            <p className="text-purple-600 text-xs truncate">
                                                La IA puede organizarlos en segundos
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setShowAIOrganize(true); runAIOrganize(false); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors flex-shrink-0"
                                        >
                                            <IconZap size={11} />
                                            Organizar
                                        </button>
                                    </div>
                                )}

                                {/* Incomplete banner */}
                                {showFixBanner && (
                                    <button
                                        onClick={() => { setQuickFilter('incomplete'); setShowFixMode(true); setFixModeIdx(0); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-left hover:border-amber-300 transition-colors"
                                    >
                                        <span className="text-xl">⚠️</span>
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-800 text-sm">
                                                {stats.incomplete} productos incompletos
                                            </p>
                                            <p className="text-amber-600 text-xs">
                                                Sin imagen, precio o categoría — toca para revisar uno a uno
                                            </p>
                                        </div>
                                        <span className="text-amber-500 text-xs font-bold flex-shrink-0">Revisar →</span>
                                    </button>
                                )}
                            </div>
                        );
                    })()}

                    {/* ── Quick filter chips ───────────────────────────────── */}
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
                        {quickFilters.map(f => {
                            const isActive = quickFilter === f.id;
                            const colorMap: Record<string, string> = {
                                green: isActive ? '#16a34a' : '#16a34a22',
                                yellow: isActive ? '#ca8a04' : '#ca8a0422',
                                red: isActive ? '#dc2626' : '#dc262622',
                                orange: isActive ? '#ea580c' : '#ea580c22',
                            };
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setQuickFilter(f.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
                                    style={{
                                        backgroundColor: isActive
                                            ? (f.color ? colorMap[f.color] : 'var(--brand-blue)')
                                            : (f.color ? colorMap[f.color] : 'var(--bg-primary)'),
                                        color: isActive
                                            ? (f.color ? '#fff' : '#fff')
                                            : 'var(--text-secondary)',
                                        border: `2px solid ${isActive
                                            ? (f.color ? colorMap[f.color] : 'var(--brand-blue)')
                                            : 'var(--border-color)'}`,
                                    }}
                                >
                                    {f.label}
                                    {f.count !== undefined && (
                                        <span className="opacity-80">({f.count})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Search + Controls ────────────────────────────────── */}
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color="var(--text-tertiary)" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-all bg-white"
                                style={{ borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all bg-white"
                            style={{
                                borderColor: showFilters ? 'var(--brand-blue)' : 'var(--border-color)',
                                color: showFilters ? 'var(--brand-blue)' : 'var(--text-secondary)'
                            }}
                        >
                            <IconFilter size={15} />
                            <span className="hidden sm:inline">Filtros</span>
                        </button>

                        <div className="flex bg-white border-2 rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className="px-2.5 py-2 transition-colors"
                                style={{ backgroundColor: viewMode === 'grid' ? 'var(--brand-blue)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)' }}
                            >
                                <IconGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-2.5 py-2 transition-colors"
                                style={{ backgroundColor: viewMode === 'list' ? 'var(--brand-blue)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)' }}
                            >
                                <IconList size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('order')}
                                className="px-2.5 py-2 transition-colors text-xs font-bold"
                                title="Ordenar catálogo"
                                style={{ backgroundColor: viewMode === 'order' ? 'var(--brand-blue)' : 'transparent', color: viewMode === 'order' ? '#fff' : 'var(--text-secondary)' }}
                            >
                                ⠿
                            </button>
                        </div>
                    </div>

                    {/* ── Expanded Filters ─────────────────────────────────── */}
                    {showFilters && (
                        <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 rounded-xl bg-white border-2" style={{ borderColor: 'var(--border-color)' }}>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <option value="all">Todas las categorías</option>
                                {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <option value="all">Todas las marcas</option>
                                {filterOptions.brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    )}

                    {/* ── Batch controls ───────────────────────────────────── */}
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={() => {
                                setIsSelecting(!isSelecting);
                                if (isSelecting) setSelectedIds(new Set());
                            }}
                            className="text-xs font-bold transition-colors"
                            style={{ color: isSelecting ? 'var(--error)' : 'var(--brand-blue)' }}
                        >
                            {isSelecting ? 'Cancelar selección' : 'Seleccionar varios'}
                        </button>
                    </div>

                    {/* ── Products ─────────────────────────────────────────── */}
                    {loading ? (
                        <LoadingGrid />
                    ) : groupedProducts.length === 0 ? (
                        <EmptyState
                            hasProducts={products.length > 0}
                            quickFilter={quickFilter}
                            onAddClick={() => setShowAddModal(true)}
                            onClearFilter={() => { setQuickFilter('all'); setSearchQuery(''); }}
                        />
                    ) : viewMode === 'order' ? (
                        searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || quickFilter !== 'all' ? (
                            <div className="p-6 text-center rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                                Limpia búsqueda y filtros para reordenar el catálogo completo.
                            </div>
                        ) : (
                            <SortableProductList
                                items={filteredProducts.map((p) => ({
                                    id: p.id,
                                    titulo: p.title,
                                    precio: p.price ?? undefined,
                                    imagenUrl: getFirstImageUrl(p),
                                    imagenesUrls: p.images?.map((img) => typeof img === 'string' ? img : img.url).filter(Boolean) as string[],
                                })) as Adiso[]}
                                disabled={reorderBusy || !businessProfileId}
                                className="space-y-2"
                                onReorder={async (orderedIds) => {
                                    if (!businessProfileId) return;
                                    setReorderBusy(true);
                                    const result = await reorderCatalogProducts(businessProfileId, orderedIds);
                                    setReorderBusy(false);
                                    if (!result.success) {
                                        showError(result.error || 'Error al reordenar');
                                        return;
                                    }
                                    success('Orden guardado');
                                    void loadProducts();
                                }}
                                renderItem={(adiso, handle) => {
                                    const product = filteredProducts.find((p) => p.id === adiso.id);
                                    if (!product) return null;
                                    return (
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border-2" style={{ borderColor: 'var(--border-color)' }}>
                                            {handle}
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                                {getFirstImageUrl(product) ? (
                                                    <img src={getFirstImageUrl(product)} alt={product.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <IconPackage size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{product.title}</p>
                                                {product.price != null && (
                                                    <p className="text-xs text-slate-500">S/ {product.price}</p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setEditingProduct(product); setShowEditModal(true); }}
                                                className="p-2 rounded-lg hover:bg-slate-50"
                                            >
                                                <IconEdit size={16} />
                                            </button>
                                        </div>
                                    );
                                }}
                            />
                        )
                    ) : (
                        <div className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                                : 'space-y-2'
                        }>
                            {groupedProducts.map(group => (
                                <ProductCard
                                    key={group.baseId}
                                    group={group}
                                    viewMode={viewMode === 'grid' ? 'grid' : 'list'}
                                    isSelecting={isSelecting}
                                    isSelected={group.allProducts.some(p => selectedIds.has(p.id))}
                                    onToggleSelect={() => {
                                        group.allProducts.forEach(p => toggleSelect(p.id));
                                    }}
                                    onEdit={(product) => {
                                        setEditingProduct(product);
                                        setShowEditModal(true);
                                    }}
                                    onDelete={(id) => deleteProduct(id)}
                                    onTogglePublish={(product) => quickPublishToggle(product)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Floating batch actions bar ───────────────────────────────── */}
            {isSelecting && selectedIds.size > 0 && (
                <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50">
                    <div
                        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                    >
                        <div className="flex items-center gap-2 px-4 py-3">
                            <span className="text-sm font-bold flex-shrink-0">{selectedIds.size} sel.</span>
                            <button
                                onClick={() => bulkPublish('published')}
                                disabled={bulkLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                <IconEye size={13} />
                                Publicar
                            </button>
                            <button
                                onClick={() => bulkPublish('draft')}
                                disabled={bulkLoading}
                                className="flex items-center gap-1 px-2 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50"
                            >
                                Borrador
                            </button>
                            <button
                                onClick={() => setShowBulkCategoryInput(!showBulkCategoryInput)}
                                disabled={bulkLoading}
                                className="flex items-center gap-1 px-2 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors disabled:opacity-50"
                            >
                                Categoría
                            </button>
                            <button
                                onClick={bulkDelete}
                                disabled={bulkLoading}
                                className="flex items-center gap-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                <IconTrash size={13} />
                            </button>
                            <button
                                onClick={toggleSelectAll}
                                className="text-[10px] opacity-60 hover:opacity-100 transition-opacity ml-auto flex-shrink-0"
                            >
                                {selectedIds.size === filteredProducts.length ? 'Desel. todo' : 'Todo'}
                            </button>
                        </div>

                        {/* Category input row */}
                        {showBulkCategoryInput && (
                            <div className="flex items-center gap-2 px-4 pb-3 border-t border-white/20 pt-2">
                                <input
                                    type="text"
                                    value={bulkCategory}
                                    onChange={e => setBulkCategory(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && bulkChangeCategory()}
                                    placeholder="Nueva categoría para los seleccionados..."
                                    className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white placeholder:text-white/50 outline-none border border-white/20"
                                    autoFocus
                                />
                                <button
                                    onClick={bulkChangeCategory}
                                    disabled={!bulkCategory.trim() || bulkLoading}
                                    className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-purple-600 transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {businessProfileId && (
                <AddProductModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    businessProfileId={businessProfileId}
                    onSuccess={loadProducts}
                />
            )}

            {businessProfileId && (
                <CatalogTrashPanel
                    businessProfileId={businessProfileId}
                    open={showTrash}
                    onClose={() => setShowTrash(false)}
                    onChanged={loadProducts}
                />
            )}

            {showEditModal && editingProduct && businessProfileId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ProductEditor
                            product={editingProduct}
                            businessProfileId={businessProfileId}
                            userId={userId || ''}
                            onSave={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                                loadProducts();
                            }}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ── AI Organize Modal ─────────────────────────────────────────── */}
            {showAIOrganize && (
                <AIOrganizeModal
                    loading={aiLoading}
                    suggestions={aiSuggestions}
                    total={aiTotal}
                    selectedCategories={aiSelectedCategories}
                    applying={aiApplying}
                    onToggleCategory={(cat) => {
                        setAiSelectedCategories(prev => {
                            const next = new Set(prev);
                            if (next.has(cat)) next.delete(cat); else next.add(cat);
                            return next;
                        });
                    }}
                    onToggleAll={() => {
                        if (aiSuggestions) {
                            const allCats = new Set(aiSuggestions.map(s => s.category));
                            setAiSelectedCategories(
                                aiSelectedCategories.size === allCats.size ? new Set() : allCats
                            );
                        }
                    }}
                    onApply={applyAISuggestions}
                    onRerun={() => { setAiSuggestions(null); runAIOrganize(true); }}
                    onClose={() => { setShowAIOrganize(false); setAiSuggestions(null); }}
                />
            )}

            {/* ── Sector Selector Modal ─────────────────────────────────────── */}
            {showSectorSelector && (
                <SectorSelectorModal
                    onSelect={(sector) => {
                        setBusinessSector(sector);
                        setShowSectorSelector(false);
                        // Continue with AI organize
                        setShowAIOrganize(true);
                        runAIOrganize(false, sector);
                    }}
                    onClose={() => setShowSectorSelector(false)}
                />
            )}

            {/* ── Guided Fix Mode ───────────────────────────────────────────── */}
            {showFixMode && businessProfileId && userId && (() => {
                const incompleteProducts = filteredProducts.filter(p => getProductHealth(p).isIncomplete);
                if (incompleteProducts.length === 0) {
                    setShowFixMode(false);
                    return null;
                }
                const current = incompleteProducts[fixModeIdx];
                if (!current) return null;

                return (
                    <FixModeModal
                        product={current}
                        current={fixModeIdx}
                        total={incompleteProducts.length}
                        businessProfileId={businessProfileId}
                        userId={userId}
                        onSave={() => {
                            loadProducts();
                            if (fixModeIdx < incompleteProducts.length - 1) {
                                setFixModeIdx(prev => prev + 1);
                            } else {
                                setShowFixMode(false);
                                setFixModeIdx(0);
                                success('¡Todos los productos revisados!');
                            }
                        }}
                        onSkip={() => {
                            if (fixModeIdx < incompleteProducts.length - 1) {
                                setFixModeIdx(prev => prev + 1);
                            } else {
                                setShowFixMode(false);
                                setFixModeIdx(0);
                            }
                        }}
                        onClose={() => { setShowFixMode(false); setFixModeIdx(0); }}
                    />
                );
            })()}
        </div>
    );
}

export default function CatalogPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="w-10 h-10 border-2 rounded-full animate-spin border-blue-500 border-t-transparent" />
                </div>
            }
        >
            <CatalogPageContent />
        </Suspense>
    );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
    group: GroupedProduct;
    viewMode: 'grid' | 'list';
    isSelecting: boolean;
    isSelected: boolean;
    onToggleSelect: () => void;
    onEdit: (p: CatalogProduct) => void;
    onDelete: (id: string) => void;
    onTogglePublish: (p: CatalogProduct) => void;
}

function ProductCard({ group, viewMode, isSelecting, isSelected, onToggleSelect, onEdit, onDelete, onTogglePublish }: ProductCardProps) {
    const [variantIdx, setVariantIdx] = useState(0);
    const currentProduct = group.allProducts[variantIdx] || group.allProducts[0];
    const health = getProductHealth(currentProduct);
    const imageUrl = getFirstImageUrl(group);
    const price = group.variants[variantIdx]?.price || currentProduct.price;
    const isPublished = currentProduct.status === 'published';

    if (viewMode === 'list') {
        return (
            <div
                className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-3 border-2 hover:shadow-sm transition-all"
                style={{ borderColor: isSelected ? 'var(--brand-blue)' : 'var(--border-color)' }}
            >
                {isSelecting && (
                    <button
                        onClick={onToggleSelect}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                            borderColor: isSelected ? 'var(--brand-blue)' : 'var(--border-color)',
                            backgroundColor: isSelected ? 'var(--brand-blue)' : 'transparent'
                        }}
                    >
                        {isSelected && <IconCheck size={10} color="#fff" />}
                    </button>
                )}

                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    {imageUrl ? (
                        <img src={imageUrl} alt={group.baseName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <IconPackage size={20} color="var(--text-tertiary)" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {group.baseName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {group.category && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {group.category}
                            </span>
                        )}
                        {health.missingImage && <HealthTag label="Sin foto" color="orange" />}
                        {health.missingPrice && <HealthTag label="Sin precio" color="red" />}
                        {health.missingCategory && <HealthTag label="Sin cat." color="yellow" />}
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {(price || 0) > 0 && (
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            S/{(price || 0).toFixed(2)}
                        </span>
                    )}
                    <button
                        onClick={() => onTogglePublish(currentProduct)}
                        className="text-xs px-2 py-1 rounded-lg font-bold transition-colors"
                        style={{
                            backgroundColor: isPublished ? '#dcfce7' : '#fef9c3',
                            color: isPublished ? '#16a34a' : '#92400e'
                        }}
                    >
                        {isPublished ? 'Visible' : 'Borrador'}
                    </button>
                    <button
                        onClick={() => onEdit(currentProduct)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-sky-50"
                        style={{ color: 'var(--brand-blue)' }}
                    >
                        <IconEdit size={15} />
                    </button>
                    <button
                        onClick={() => onDelete(currentProduct.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: '#ef4444' }}
                    >
                        <IconTrash size={15} />
                    </button>
                </div>
            </div>
        );
    }

    // Grid mode
    return (
        <div
            className="bg-white rounded-xl overflow-hidden border-2 hover:shadow-md transition-all flex flex-col"
            style={{ borderColor: isSelected ? 'var(--brand-blue)' : health.isIncomplete ? '#fcd34d' : 'var(--border-color)' }}
        >
            {/* Image area */}
            <div className="relative aspect-square bg-slate-100">
                {imageUrl ? (
                    <img src={imageUrl} alt={group.baseName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <IconPackage size={32} color="var(--text-tertiary)" />
                        <span className="text-xs font-semibold text-amber-600">Sin foto</span>
                    </div>
                )}

                {/* Select checkbox */}
                {isSelecting && (
                    <button
                        onClick={onToggleSelect}
                        className="absolute top-2 left-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center shadow-sm transition-colors"
                        style={{
                            borderColor: isSelected ? 'var(--brand-blue)' : '#fff',
                            backgroundColor: isSelected ? 'var(--brand-blue)' : 'rgba(255,255,255,0.9)'
                        }}
                    >
                        {isSelected && <IconCheck size={12} color="#fff" />}
                    </button>
                )}

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                    <button
                        onClick={() => onTogglePublish(currentProduct)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm transition-all hover:scale-105"
                        style={{
                            backgroundColor: isPublished ? '#16a34a' : '#6b7280',
                            color: '#fff'
                        }}
                    >
                        {isPublished ? '✓ Visible' : 'Borrador'}
                    </button>
                </div>

                {/* Variants badge */}
                {group.variants.length > 1 && (
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ color: 'var(--brand-blue)' }}>
                        {group.variants.length} variantes
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                <h3 className="font-semibold text-xs leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {group.baseName}
                </h3>

                {/* Category */}
                {group.category && (
                    <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-tertiary)' }}>
                        {group.category}
                        {group.brand && ` · ${group.brand}`}
                    </span>
                )}

                {/* Health tags */}
                {health.isIncomplete && (
                    <div className="flex flex-wrap gap-1">
                        {health.missingImage && <HealthTag label="Sin foto" color="orange" />}
                        {health.missingPrice && <HealthTag label="Sin precio" color="red" />}
                        {health.missingCategory && <HealthTag label="Sin categoría" color="yellow" />}
                    </div>
                )}

                {/* Price */}
                <div className="mt-auto pt-1.5 flex items-center justify-between border-t border-slate-50">
                    {(price || 0) > 0 ? (
                        <span className="text-sm font-black" style={{ color: 'var(--brand-blue)' }}>
                            S/ {(price || 0).toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-xs text-red-400 font-semibold">Sin precio</span>
                    )}
                    <button
                        onClick={() => onEdit(currentProduct)}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--brand-blue)' }}
                    >
                        <IconEdit size={11} />
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Health Tag ───────────────────────────────────────────────────────────────

function HealthTag({ label, color }: { label: string; color: 'red' | 'orange' | 'yellow' }) {
    const colorMap = {
        red: { bg: '#fee2e2', text: '#dc2626' },
        orange: { bg: '#ffedd5', text: '#ea580c' },
        yellow: { bg: '#fef9c3', text: '#92400e' },
    };
    const c = colorMap[color];
    return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: c.bg, color: c.text }}>
            {label}
        </span>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border-2 border-slate-100 animate-pulse">
                    <div className="aspect-square bg-slate-200" />
                    <div className="p-2.5 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasProducts, quickFilter, onAddClick, onClearFilter }: {
    hasProducts: boolean;
    quickFilter: QuickFilter;
    onAddClick: () => void;
    onClearFilter: () => void;
}) {
    if (hasProducts && quickFilter !== 'all') {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <IconFilter size={28} color="var(--text-tertiary)" />
                </div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                    Ningún producto aquí
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    No hay productos que coincidan con este filtro.
                </p>
                <button
                    onClick={onClearFilter}
                    className="px-4 py-2 rounded-xl font-bold text-sm text-white"
                    style={{ backgroundColor: 'var(--brand-blue)' }}
                >
                    Ver todos los productos
                </button>
            </div>
        );
    }

    return (
        <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-blue-50 flex items-center justify-center">
                <IconPackage size={36} color="var(--brand-blue)" />
            </div>
            <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                Tu catálogo está vacío
            </h3>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Importa tus productos desde Excel, toma una foto o agrégalos uno a uno.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                    href="/mi-negocio/catalogo/importar"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
                    style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}
                >
                    <IconSparkles size={16} />
                    Importar desde Excel
                </Link>
                <button
                    onClick={onAddClick}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                    style={{ backgroundColor: 'var(--brand-blue)' }}
                >
                    <IconPlus size={16} />
                    Agregar producto
                </button>
            </div>
        </div>
    );
}

// ─── AI Organize Modal ────────────────────────────────────────────────────────

interface AIOrganizeModalProps {
    loading: boolean;
    suggestions: AISuggestion[] | null;
    total: number;
    selectedCategories: Set<string>;
    applying: boolean;
    onToggleCategory: (cat: string) => void;
    onToggleAll: () => void;
    onApply: () => void;
    onRerun: () => void;
    onClose: () => void;
}

function AIOrganizeModal({
    loading, suggestions, total, selectedCategories,
    applying, onToggleCategory, onToggleAll, onApply, onRerun, onClose
}: AIOrganizeModalProps) {
    const selectedCount = suggestions
        ? suggestions.filter(s => selectedCategories.has(s.category)).reduce((n, s) => n + s.products.length, 0)
        : 0;
    const allSelected = suggestions ? selectedCategories.size === suggestions.length : false;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconZap size={16} color="#7c3aed" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                            Organizar con IA
                        </h2>
                        {!loading && suggestions && (
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {total} productos → {suggestions.length} categorías sugeridas
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <IconX size={18} color="var(--text-secondary)" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-14 h-14 mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                                Analizando {total} productos...
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                La IA está creando la estructura perfecta para tu catálogo
                            </p>
                        </div>
                    ) : suggestions && suggestions.length === 0 ? (
                        <div className="flex flex-col items-center py-12 px-6 text-center">
                            <p className="text-4xl mb-3">🎉</p>
                            <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                                ¡Todos los productos ya tienen categoría!
                            </p>
                            <button
                                onClick={onRerun}
                                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                            >
                                <IconRefresh size={14} />
                                Re-organizar todo el catálogo
                            </button>
                        </div>
                    ) : suggestions ? (
                        <div className="p-4">
                            {/* Select all toggle */}
                            <button
                                onClick={onToggleAll}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-sm font-bold transition-colors"
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                            >
                                <div
                                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                                    style={{
                                        borderColor: allSelected ? 'var(--brand-blue)' : 'var(--border-color)',
                                        backgroundColor: allSelected ? 'var(--brand-blue)' : 'transparent'
                                    }}
                                >
                                    {allSelected && <IconCheck size={9} color="#fff" />}
                                </div>
                                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                            </button>

                            <div className="space-y-2">
                                {suggestions.map(s => {
                                    const isSelected = selectedCategories.has(s.category);
                                    return (
                                        <button
                                            key={s.category}
                                            onClick={() => onToggleCategory(s.category)}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all"
                                            style={{
                                                borderColor: isSelected ? 'var(--brand-blue)' : 'var(--border-color)',
                                                backgroundColor: isSelected ? '#eff6ff' : 'white',
                                            }}
                                        >
                                            <div
                                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    borderColor: isSelected ? 'var(--brand-blue)' : 'var(--border-color)',
                                                    backgroundColor: isSelected ? 'var(--brand-blue)' : 'transparent'
                                                }}
                                            >
                                                {isSelected && <IconCheck size={10} color="#fff" />}
                                            </div>
                                            <IconTag size={13} color={isSelected ? 'var(--brand-blue)' : 'var(--text-tertiary)'} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {s.category}
                                                </p>
                                                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                                                    {s.products.slice(0, 3).map(p => p.title).join(', ')}
                                                    {s.products.length > 3 && ` +${s.products.length - 3} más`}
                                                </p>
                                            </div>
                                            <span
                                                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: isSelected ? 'var(--brand-blue)' : 'var(--bg-secondary)',
                                                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                                                }}
                                            >
                                                {s.products.length}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <button
                                    onClick={onRerun}
                                    className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    <IconRefresh size={11} />
                                    Re-analizar todo el catálogo
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                {!loading && suggestions && suggestions.length > 0 && (
                    <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-colors"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onApply}
                            disabled={selectedCount === 0 || applying}
                            className="flex-2 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white transition-all disabled:opacity-40"
                            style={{ backgroundColor: '#7c3aed', flex: 2 }}
                        >
                            {applying ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconCheck size={15} />
                                    Aplicar {selectedCount} productos
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Fix Mode Modal ───────────────────────────────────────────────────────────

interface FixModeModalProps {
    product: CatalogProduct;
    current: number;
    total: number;
    businessProfileId: string;
    userId: string;
    onSave: () => void;
    onSkip: () => void;
    onClose: () => void;
}

function FixModeModal({ product, current, total, businessProfileId, userId, onSave, onSkip, onClose }: FixModeModalProps) {
    const health = getProductHealth(product);

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                {/* Progress header */}
                <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                            Revisando productos incompletos
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--brand-blue)' }}>
                                {current + 1} / {total}
                            </span>
                            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                                <IconX size={16} color="var(--text-tertiary)" />
                            </button>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${((current + 1) / total) * 100}%`, backgroundColor: 'var(--brand-blue)' }}
                        />
                    </div>
                </div>

                {/* What needs fixing */}
                <div className="px-5 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                        {health.missingImage && (
                            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}>
                                📷 Falta foto
                            </span>
                        )}
                        {health.missingPrice && (
                            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                💰 Falta precio
                            </span>
                        )}
                        {health.missingCategory && (
                            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: '#fef9c3', color: '#92400e' }}>
                                🏷️ Falta categoría
                            </span>
                        )}
                    </div>
                </div>

                {/* Product editor inline */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <ProductEditor
                        product={product}
                        businessProfileId={businessProfileId}
                        userId={userId}
                        onSave={onSave}
                        onCancel={onSkip}
                    />
                </div>

                {/* Skip action */}
                <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                        onClick={onSkip}
                        className="w-full py-2 text-sm font-semibold transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Saltar este producto ({total - current - 1} restantes)
                    </button>
                </div>
            </div>
        </div>
    );
}
