/**
 * Catálogo - Vista de Tabla con CRUD Completo
 * 
 * Features:
 * - Tabla responsiva (mobile-first)
 * - CRUD: Create, Read, Update, Delete (individual y masivo)
 * - Filtros y búsqueda
 * - Selección múltiple
 * - Acciones en lote
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    IconPlus, IconGrid, IconList, IconSearch, IconFilter,
    IconSparkles, IconPackage, IconUpload, IconArrowLeft,
    IconEdit, IconTrash, IconCheck, IconX, IconDownload,
    IconCopy
} from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { CatalogProduct } from '@/types/catalog';
import Link from 'next/link';
import SimpleCatalogAddButton from '@/components/business/SimpleCatalogAddButton';
import { ProductEditor } from '@/components/business/ProductEditor';

export default function CatalogTablePage() {
    const router = useRouter();
    const { success, error: showError, toasts, removeToast } = useToast();

    // Data state
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessProfileId, setBusinessProfileId] = useState<string>('');
    const [userId, setUserId] = useState<string>('');

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        archived: 0
    });

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data, error: fetchError } = await supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', businessProfileId)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setProducts(data || []);

            // Calculate stats
            const published = data?.filter(p => p.status === 'published').length || 0;
            const draft = data?.filter(p => p.status === 'draft').length || 0;
            const archived = data?.filter(p => p.status === 'archived').length || 0;

            setStats({
                total: data?.length || 0,
                published,
                draft,
                archived
            });

        } catch (err: any) {
            showError('Error al cargar productos: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [businessProfileId, showError]);

    const fetchBusinessProfile = useCallback(async () => {
        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const { data: profile, error: profileError } = await supabase
                .from('business_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError) throw profileError;
            setUserId(user.id);
            setBusinessProfileId(profile.id);
        } catch (err: any) {
            showError('Error al cargar perfil: ' + err.message);
        }
    }, [showError]);

    const filterProducts = useCallback(() => {
        let filtered = [...products];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.sku?.toLowerCase().includes(query) ||
                p.brand?.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        setFilteredProducts(filtered);
    }, [products, searchQuery, statusFilter, categoryFilter]);

    useEffect(() => {
        fetchBusinessProfile();
    }, [fetchBusinessProfile]);

    useEffect(() => {
        if (businessProfileId) {
            fetchProducts();
        }
    }, [businessProfileId, fetchProducts]);

    useEffect(() => {
        filterProducts();
    }, [filterProducts]);


    const handleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleSelectProduct = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('¿Eliminar este producto?')) return;

        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            const { error: deleteError } = await supabase
                .from('catalog_products')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            success('Producto eliminado');
            fetchProducts();
        } catch (err: any) {
            showError('Error al eliminar: ' + err.message);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;
        if (!confirm(`¿Eliminar ${selectedProducts.size} productos seleccionados?`)) return;

        try {
            if (!supabase) throw new Error('Supabase no está configurado');

            const ids = Array.from(selectedProducts);
            const BATCH_SIZE = 50;

            // Process in batches
            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);
                const { error: deleteError } = await supabase
                    .from('catalog_products')
                    .delete()
                    .in('id', batch);

                if (deleteError) throw deleteError;
            }

            success(`${selectedProducts.size} productos eliminados`);
            setSelectedProducts(new Set());
            fetchProducts();
        } catch (err: any) {
            showError('Error al eliminar: ' + err.message);
        }
    };

    const handleBulkStatusChange = async (newStatus: string) => {
        if (selectedProducts.size === 0) return;

        try {
            if (!supabase) throw new Error('Supabase no está configurado');

            const ids = Array.from(selectedProducts);
            const BATCH_SIZE = 50;

            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);
                const { error: updateError } = await supabase
                    .from('catalog_products')
                    .update({ status: newStatus })
                    .in('id', batch);

                if (updateError) throw updateError;
            }

            success(`${selectedProducts.size} productos actualizados a "${newStatus}"`);
            setSelectedProducts(new Set());
            fetchProducts();
        } catch (err: any) {
            showError('Error al actualizar: ' + err.message);
        }
    };


    const handleQuickEdit = async (productId: string, field: string, value: any) => {
        try {
            if (!supabase) throw new Error('Supabase no está configurado');
            const { error: updateError } = await supabase
                .from('catalog_products')
                .update({ [field]: value })
                .eq('id', productId);

            if (updateError) throw updateError;

            // Update local state
            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, [field]: value } : p
            ));

        } catch (err: any) {
            showError('Error al actualizar: ' + err.message);
        }
    };

    // Get unique categories for filter
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 md:mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1 tracking-tight">
                                    📦 Gestión de Catálogo
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Vista de tabla - Edición masiva
                                </p>
                                <Link href="/mi-negocio/catalogo" className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-blue)] hover:opacity-80 mt-2 transition-all">
                                    <IconArrowLeft size={12} />
                                    Volver al Dashboard
                                </Link>
                            </div>

                            <div className="flex gap-2">
                                <SimpleCatalogAddButton
                                    businessProfileId={businessProfileId}
                                    onSuccess={fetchProducts}
                                    variant="secondary"
                                    compact={true}
                                />
                                <button
                                    onClick={() => router.push('/mi-negocio/catalogo')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <IconGrid size={18} />
                                    <span className="hidden sm:inline">Vista Grid</span>
                                </button>
                                <button
                                    onClick={() => router.push('/mi-negocio/catalogo/nuevo')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-blue)] text-white rounded-lg font-bold shadow-md hover:brightness-110 transition-all active:scale-[0.98]"
                                >
                                    <IconPlus size={18} />
                                    <span className="hidden sm:inline">Nuevo Producto</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <div className="text-2xl font-black text-slate-900">{stats.total}</div>
                                <div className="text-xs text-slate-500">Total</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <div className="text-2xl font-black text-green-600">{stats.published}</div>
                                <div className="text-xs text-slate-500">Publicados</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <div className="text-2xl font-black text-yellow-600">{stats.draft}</div>
                                <div className="text-xs text-slate-500">Borradores</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <div className="text-2xl font-black text-slate-400">{stats.archived}</div>
                                <div className="text-xs text-slate-500">Archivados</div>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--brand-blue)] outline-none"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="published">Publicados</option>
                                <option value="draft">Borradores</option>
                                <option value="archived">Archivados</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--brand-blue)] outline-none"
                            >
                                <option value="all">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedProducts.size > 0 && (
                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
                            <div className="font-bold text-[var(--brand-blue)]">
                                {selectedProducts.size} seleccionados
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => handleBulkStatusChange('published')}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:brightness-110 transition-all font-bold"
                                >
                                    Publicar
                                </button>
                                <button
                                    onClick={() => handleBulkStatusChange('draft')}
                                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:brightness-110 transition-all font-bold"
                                >
                                    Borrador
                                </button>
                                <button
                                    onClick={() => handleBulkStatusChange('archived')}
                                    className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-sm hover:brightness-110 transition-all font-bold"
                                >
                                    Archivar
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:brightness-110 transition-all font-bold"
                                >
                                    Eliminar
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedProducts(new Set())}
                                className="ml-auto text-[var(--brand-blue)] hover:underline text-sm font-bold"
                            >
                                Deseleccionar
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--brand-blue)] border-t-transparent" />
                            <p className="mt-2 text-slate-500">Cargando productos...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📦</div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">
                                No hay productos
                            </h3>
                            <p className="text-slate-500 mb-6">
                                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                                    ? 'No se encontraron productos con esos filtros'
                                    : 'Empieza agregando tu primer producto'}
                            </p>
                            <button
                                onClick={() => router.push('/mi-negocio/catalogo/nuevo')}
                                className="px-6 py-3 bg-[var(--brand-blue)] text-white rounded-xl font-bold hover:brightness-110 transition-all"
                            >
                                Agregar Producto
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.size === filteredProducts.length}
                                                        onChange={handleSelectAll}
                                                        className="rounded text-[var(--brand-blue)] focus:ring-[var(--brand-blue)]"
                                                    />
                                                </th>
                                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Producto</th>
                                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">SKU</th>
                                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Categoría</th>
                                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Precio</th>
                                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Estado</th>
                                                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProducts.map((product) => (
                                                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProducts.has(product.id)}
                                                            onChange={() => handleSelectProduct(product.id)}
                                                            className="rounded text-[var(--brand-blue)] focus:ring-[var(--brand-blue)]"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            {product.images?.[0]?.url && (
                                                                <img
                                                                    src={product.images[0].url}
                                                                    alt={product.title}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-slate-800">{product.title}</div>
                                                                <div className="text-xs text-slate-400 line-clamp-1">
                                                                    {product.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-500 font-mono">{product.sku || '-'}</td>
                                                    <td className="p-3 text-sm text-slate-500">{product.category || '-'}</td>
                                                    <td className="p-3 text-sm font-black text-slate-800">
                                                        S/ {product.price?.toFixed(2) || '0.00'}
                                                    </td>
                                                    <td className="p-3">
                                                        <select
                                                            value={product.status}
                                                            onChange={(e) => handleQuickEdit(product.id, 'status', e.target.value)}
                                                            className={`text-xs px-2 py-1 rounded-full font-bold border-none ${product.status === 'published' ? 'bg-green-100 text-green-700' :
                                                                product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}
                                                        >
                                                            <option value="published">Publicado</option>
                                                            <option value="draft">Borrador</option>
                                                            <option value="archived">Archivado</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingProduct(product);
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="p-2 text-[var(--brand-blue)] hover:bg-sky-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <IconEdit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <IconTrash size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                        <div className="flex items-start gap-3 mb-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.has(product.id)}
                                                onChange={() => handleSelectProduct(product.id)}
                                                className="mt-1 rounded text-[var(--brand-blue)] focus:ring-[var(--brand-blue)]"
                                            />
                                            {product.images?.[0]?.url && (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.title}
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 mb-1">{product.title}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                                    {product.description}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs">
                                                    {product.sku && (
                                                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
                                                            {product.sku}
                                                        </span>
                                                    )}
                                                    <span className="font-black text-slate-800 ml-auto">
                                                        S/ {product.price?.toFixed(2) || '0.00'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                            <select
                                                value={product.status}
                                                onChange={(e) => handleQuickEdit(product.id, 'status', e.target.value)}
                                                className={`text-xs px-3 py-1 rounded-full font-bold ${product.status === 'published' ? 'bg-green-100 text-green-700' :
                                                    product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                <option value="published">Publicado</option>
                                                <option value="draft">Borrador</option>
                                                <option value="archived">Archivado</option>
                                            </select>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(product);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-3 text-[var(--brand-blue)] bg-sky-50 rounded-xl"
                                                >
                                                    <IconEdit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="p-3 text-red-500 bg-red-50 rounded-xl"
                                                >
                                                    <IconTrash size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && businessProfileId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ProductEditor
                            product={editingProduct}
                            businessProfileId={businessProfileId}
                            userId={userId}
                            onSave={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                                fetchProducts();
                            }}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingProduct(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
