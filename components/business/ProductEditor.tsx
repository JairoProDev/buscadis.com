'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconTrash, IconCheck, IconX, IconEye, IconSparkles } from '@/components/Icons';
import { uploadProductImage, updateCatalogProduct, createCatalogProduct, deleteCatalogProduct } from '@/lib/business';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { findPotentialDuplicate, validatePrice } from '@/lib/business-validation';
import { Adiso } from '@/types';
import ProductImageGallery from '@/components/catalog/ProductImageGallery';
import { analyzeProductFromImage, enhanceProductFieldFromImage } from '@/lib/catalog/product-ai';
import { listBusinessCategories } from '@/lib/catalog/categories';

const UNITS = ['unidad', 'par', 'caja', 'kg', 'g', 'litro', 'ml', 'metro', 'cm', 'rollo', 'paquete', 'docena', 'servicio'];

type AttributeRow = { key: string; value: string };

function normalizeAttributes(raw: unknown): AttributeRow[] {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.map((item) => {
            if (typeof item === 'object' && item && 'name' in item && 'value' in item) {
                return { key: String((item as { name: string }).name), value: String((item as { value: string }).value) };
            }
            return { key: '', value: '' };
        }).filter((r) => r.key || r.value);
    }
    if (typeof raw === 'object') {
        return Object.entries(raw as Record<string, unknown>).map(([key, value]) => ({
            key,
            value: String(value ?? ''),
        }));
    }
    return [];
}

function attributesToPayload(rows: AttributeRow[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const row of rows) {
        const k = row.key.trim();
        if (k) out[k] = row.value.trim();
    }
    return out;
}

interface ProductEditorProps {
    product?: any;
    businessProfileId: string;
    userId: string;
    onSave: (product: any) => void;
    onCancel: () => void;
    onDelete?: (productId: string) => void; // Callback al eliminar
    adisos?: Adiso[]; // Added for duplicate check
}

const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img?.url || '';
};

function normalizeProductForEditor(product: any) {
    if (!product) return null;
    if (product.titulo !== undefined && product.title === undefined) {
        const urls = product.imagenesUrls?.length
            ? product.imagenesUrls
            : product.imagenUrl
                ? [product.imagenUrl]
                : [];
        return {
            id: product.id,
            title: product.titulo || '',
            description: product.descripcion || '',
            price: product.precio,
            category: product.categoria || '',
            brand: product.brand || '',
            sku: product.sku || '',
            stock: product.stock,
            unit: product.unit || 'unidad',
            tags: product.tags || [],
            status: product.status || 'draft',
            images: urls.map((url: string) => ({ url })),
            attributes: product.attributes || {},
            compare_at_price: product.compare_at_price,
        };
    }
    return product;
}

type FormData = {
    title: string;
    description: string;
    price: string;
    compare_at_price: string;
    category: string;
    brand: string;
    sku: string;
    stock: string;
    unit: string;
    tags: string;
    status: 'published' | 'draft';
    images: any[];
    attributes: AttributeRow[];
};

function buildFormDataFromProduct(product: any): FormData {
    const p = normalizeProductForEditor(product);
    const attrs = normalizeAttributes(p?.attributes);
    const unitFromAttrs = attrs.find((a) => a.key === 'unidad' || a.key === 'unit');
    const attrsWithoutUnit = attrs.filter((a) => a.key !== 'unidad' && a.key !== 'unit');
    return {
        title: p?.title || '',
        description: p?.description || '',
        price: p?.price !== undefined && p?.price !== null ? String(p.price) : '',
        compare_at_price: p?.compare_at_price !== undefined && p?.compare_at_price !== null ? String(p.compare_at_price) : '',
        category: p?.category || '',
        brand: p?.brand || '',
        sku: p?.sku || '',
        stock: p?.stock !== undefined && p?.stock !== null ? String(p.stock) : '',
        unit: p?.unit || unitFromAttrs?.value || 'unidad',
        tags: Array.isArray(p?.tags) ? p.tags.join(', ') : '',
        status: (p?.status || 'draft') as 'published' | 'draft',
        images: p?.images || [],
        attributes: attrsWithoutUnit,
    };
}

function serializeFormData(data: FormData): string {
    return JSON.stringify(data);
}

function buildSavePayload(formData: FormData, businessProfileId: string, isUpdate: boolean) {
    const tagsArr = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const attrs = attributesToPayload(formData.attributes);
    if (formData.unit && formData.unit !== 'unidad') {
        attrs.unidad = formData.unit;
    }

    const productData: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price !== '' ? parseFloat(formData.price) || 0 : null,
        compare_at_price: formData.compare_at_price !== '' ? parseFloat(formData.compare_at_price) || null : null,
        category: formData.category.trim() || null,
        brand: formData.brand.trim() || null,
        sku: formData.sku.trim() || null,
        stock: formData.stock !== '' ? parseInt(formData.stock, 10) || null : null,
        tags: tagsArr,
        status: formData.status,
        images: formData.images,
        attributes: attrs,
    };

    if (!productData.compare_at_price) delete productData.compare_at_price;
    if (!productData.brand) delete productData.brand;
    if (!productData.sku) delete productData.sku;
    if (productData.stock === null) delete productData.stock;
    if (!productData.category) delete productData.category;

    if (!isUpdate) {
        productData.business_profile_id = businessProfileId;
    }

    return productData;
}

export function ProductEditor({ product, businessProfileId, userId, onSave, onCancel, onDelete, adisos = [] }: ProductEditorProps) {
    const [loading, setLoading] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
    const [deleting, setDeleting] = useState(false);
    const [aiLoading, setAiLoading] = useState<'title' | 'description' | 'all' | null>(null);
    const { success, error } = useToast();

    const baselineRef = useRef(serializeFormData(buildFormDataFromProduct(product)));
    const [formData, setFormData] = useState<FormData>(() => buildFormDataFromProduct(product));
    const [enhancingIdx, setEnhancingIdx] = useState<number | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<(File | null)[]>([]);
    const [bgRemovedIdx, setBgRemovedIdx] = useState<Set<number>>(new Set());
    const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (!businessProfileId) return;
        listBusinessCategories(businessProfileId).then((cats) =>
            setCategorySuggestions(cats.map((c) => c.name))
        );
    }, [businessProfileId]);

    const isDirty = serializeFormData(formData) !== baselineRef.current;

    const resetBaseline = useCallback((data: FormData) => {
        baselineRef.current = serializeFormData(data);
    }, []);

    const handleCancel = () => {
        if (isDirty) {
            if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
                onCancel();
            }
        } else {
            onCancel();
        }
    };

    useEffect(() => {
        const next = buildFormDataFromProduct(product);
        setFormData(next);
        resetBaseline(next);
        setUploadedFiles([]);
        setBgRemovedIdx(new Set());
        setDeleteStep('idle');
    }, [product?.id, resetBaseline]);

    const update = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleImageUpload = async (file: File) => {
        setLoading(true);
        try {
            const url = await uploadProductImage(file, userId);
            if (url) {
                const newImage = { url, type: 'uploaded', created_at: new Date().toISOString() };
                const newImages = [...(formData.images || []), newImage];
                update('images', newImages);
                // Track the original File for bg removal
                setUploadedFiles(prev => {
                    const next = [...prev];
                    next[newImages.length - 1] = file;
                    return next;
                });
                success('Imagen subida');
            } else {
                error('Error al subir imagen');
            }
        } catch (e: any) {
            error(e.message || 'Error al subir imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleBgRemoved = async (idx: number, newFile: File, newPreview: string) => {
        // Upload the bg-removed file and replace the image at idx
        setLoading(true);
        try {
            const url = await uploadProductImage(newFile, userId);
            if (url) {
                const updatedImages = [...formData.images];
                updatedImages[idx] = { url, type: 'bg_removed', created_at: new Date().toISOString(), original_url: getImageUrl(formData.images[idx]) };
                update('images', updatedImages);
                setUploadedFiles(prev => { const n = [...prev]; n[idx] = newFile; return n; });
                setBgRemovedIdx(prev => new Set([...prev, idx]));
                success('Fondo eliminado');
            }
        } catch (e: any) {
            error(e.message || 'Error al subir imagen sin fondo');
        } finally {
            setLoading(false);
        }
    };

    const handleBgRestore = (idx: number) => {
        setBgRemovedIdx(prev => { const n = new Set(prev); n.delete(idx); return n; });
    };

    const removeImage = (idx: number) => {
        const next = [...formData.images];
        next.splice(idx, 1);
        update('images', next);
    };

    const enhanceImage = async (idx: number, action: 'remove_bg' | 'upscale') => {
        const img = formData.images[idx];
        const imgUrl = typeof img === 'string' ? img : img?.url;
        if (!imgUrl || !supabase) return;

        setEnhancingIdx(idx);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ imageUrl: imgUrl, actions: [action] })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            const newUrl = data.removedBgUrl || data.upscaledUrl || data.finalUrl;
            if (newUrl) {
                const updatedImages = [...formData.images];
                updatedImages[idx] = {
                    ...(typeof img === 'string' ? { url: img } : img),
                    url: newUrl,
                    ai_enhanced: true,
                    enhancement_type: action === 'remove_bg' ? 'remove_bg' : 'upscale',
                    original_url: imgUrl
                };
                update('images', updatedImages);
                success(action === 'remove_bg' ? 'Fondo eliminado' : 'Imagen mejorada');
            }
        } catch (err: any) {
            error('Error: ' + err.message);
        } finally {
            setEnhancingIdx(null);
        }
    };

    const firstImageUrl = getImageUrl(formData.images[0]);

    const runAiForField = async (field: 'title' | 'description') => {
        if (!firstImageUrl) {
            error('Agrega una foto al producto para usar IA');
            return;
        }
        setAiLoading(field);
        try {
            const value = await enhanceProductFieldFromImage(firstImageUrl, field);
            if (value) {
                update(field, value);
                success(field === 'title' ? 'Título generado con IA' : 'Descripción generada con IA');
            } else {
                error('La IA no pudo mejorar este campo');
            }
        } catch (e: unknown) {
            error(e instanceof Error ? e.message : 'Error de IA');
        } finally {
            setAiLoading(null);
        }
    };

    const runAiFillAll = async () => {
        if (!firstImageUrl) {
            error('Agrega una foto al producto para usar IA');
            return;
        }
        setAiLoading('all');
        try {
            const data = await analyzeProductFromImage(firstImageUrl);
            if (data.title) update('title', data.title);
            if (data.description) update('description', data.description);
            if (data.price !== undefined && data.price !== null) update('price', String(data.price));
            if (data.category) update('category', data.category);
            if (data.brand) update('brand', data.brand);
            if (data.tags?.length) update('tags', data.tags.join(', '));
            success('Datos completados con IA');
        } catch (e: unknown) {
            error(e instanceof Error ? e.message : 'Error de IA');
        } finally {
            setAiLoading(null);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            error('El nombre del producto es obligatorio');
            return;
        }

        // 1. Accidente: Duplicados (Solo si es nuevo)
        if (!product?.id) {
            const potentialDuplicate = findPotentialDuplicate(formData.title, adisos);
            if (potentialDuplicate) {
                if (!confirm(`Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Quieres agregar otro igual?`)) {
                    return;
                }
            }
        }

        // 2. Accidente: Precio extraño
        if (formData.price) {
            const priceValidation = validatePrice(formData.price);
            if (!priceValidation.isValid) {
                error(priceValidation.warning || 'Precio inválido');
                return;
            }
            if (priceValidation.warning) {
                if (!confirm(priceValidation.warning)) {
                    return;
                }
            }
        }

        // 3. Accidente: Sin imagen
        if (formData.images.length === 0) {
            if (!confirm('No has subido ninguna foto. ¿Quieres publicar el producto sin imagen?')) {
                return;
            }
        }

        setLoading(true);
        try {
            const isUpdate = Boolean(product?.id);
            const productData = buildSavePayload(formData, businessProfileId, isUpdate);

            let saved;
            if (isUpdate) {
                saved = await updateCatalogProduct(product.id, productData);
                success('Producto actualizado');
            } else {
                saved = await createCatalogProduct(productData);
                success('Producto creado');
            }

            resetBaseline(formData);
            onSave(saved);
            onCancel();
        } catch (e: any) {
            error(e.message || 'Error al guardar producto');
        } finally {
            setLoading(false);
        }
    };

    const hasDiscount = formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price || '0');

    return (
        <div className="bg-white rounded-2xl border-2 shadow-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {product?.id ? 'Editar producto' : 'Nuevo producto'}
                </h3>
                <div className="flex items-center gap-2">
                    {/* Status toggle */}
                    <button
                        onClick={() => update('status', formData.status === 'published' ? 'draft' : 'published')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                            backgroundColor: formData.status === 'published' ? '#dcfce7' : '#f3f4f6',
                            color: formData.status === 'published' ? '#16a34a' : '#6b7280',
                        }}
                    >
                        <IconEye size={12} />
                        {formData.status === 'published' ? 'Visible' : 'Borrador'}
                    </button>
                    <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <IconX size={18} color="var(--text-secondary)" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">

                {/* ── Images ──────────────────────────────────────────────── */}
                <div>
                    <label className="block text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Fotos del producto
                    </label>
                    <ProductImageGallery
                        images={formData.images}
                        uploadedFiles={uploadedFiles}
                        bgRemovedIdx={bgRemovedIdx}
                        enhancingIdx={enhancingIdx}
                        loading={loading}
                        onReorder={(next) => {
                            update('images', next);
                            setUploadedFiles((prev) => {
                                const old = formData.images;
                                const reordered = next.map((img) => {
                                    const idx = old.indexOf(img);
                                    return idx >= 0 ? prev[idx] ?? null : null;
                                });
                                return reordered;
                            });
                        }}
                        onUpload={handleImageUpload}
                        onRemove={removeImage}
                        onEnhance={enhanceImage}
                        onBgRemoved={handleBgRemoved}
                        onBgRestore={handleBgRestore}
                    />
                    {formData.images.length === 0 && (
                        <p className="text-xs mt-1.5 text-amber-600">
                            Sin foto — los clientes no podrán ver el producto
                        </p>
                    )}
                    {formData.images.length > 0 && (
                        <button
                            type="button"
                            disabled={loading || aiLoading !== null}
                            onClick={runAiFillAll}
                            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[var(--brand-blue,#53acc5)] hover:opacity-80 disabled:opacity-40"
                        >
                            {aiLoading === 'all' ? (
                                <div className="w-3.5 h-3.5 border-2 border-[var(--brand-blue,#53acc5)] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <IconSparkles size={14} />
                            )}
                            Rellenar campos con IA desde la foto
                        </button>
                    )}
                </div>

                {/* ── Name ────────────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                            Nombre del producto *
                        </label>
                        <button
                            type="button"
                            disabled={loading || aiLoading !== null}
                            className="text-[10px] font-bold flex items-center gap-1 text-[var(--brand-blue,#53acc5)] hover:opacity-80 disabled:opacity-40"
                            onClick={() => runAiForField('title')}
                        >
                            {aiLoading === 'title' ? (
                                <div className="w-3 h-3 border-2 border-[var(--brand-blue,#53acc5)] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <IconSparkles size={12} />
                            )}
                            IA
                        </button>
                    </div>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => update('title', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 text-sm font-medium outline-none transition-colors"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        placeholder="Ej. Pintura esmalte blanco 1 galón"
                        disabled={loading}
                    />
                </div>

                {/* ── Brand + Category ─────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Marca
                        </label>
                        <input
                            type="text"
                            value={formData.brand}
                            onChange={e => update('brand', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. Tekno"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Categoría
                        </label>
                        <input
                            type="text"
                            list="product-category-suggestions"
                            value={formData.category}
                            onChange={e => update('category', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. Pinturas"
                            disabled={loading}
                        />
                        <datalist id="product-category-suggestions">
                            {categorySuggestions.map((c) => (
                                <option key={c} value={c} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* ── Price + Compare price ────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Precio *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>S/</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={e => update('price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                                style={{ borderColor: formData.price ? 'var(--border-color)' : 'var(--bs-color-sol-400)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                placeholder="0.00"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Precio antes
                            {hasDiscount && <span className="ml-1 text-green-600">(-{Math.round((1 - parseFloat(formData.price) / parseFloat(formData.compare_at_price)) * 100)}%)</span>}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>S/</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.compare_at_price}
                                onChange={e => update('compare_at_price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                                placeholder="Opcional"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* ── SKU + Stock ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Código (SKU)
                        </label>
                        <input
                            type="text"
                            value={formData.sku}
                            onChange={e => update('sku', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none font-mono transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. PNT-001"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Stock disponible
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.stock}
                            onChange={e => update('stock', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Sin límite"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* ── Unit + Tags ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Unidad de venta
                        </label>
                        <select
                            value={formData.unit}
                            onChange={e => update('unit', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            disabled={loading}
                        >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Etiquetas (tags)
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={e => update('tags', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="ej: oferta, nuevo, popular"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* ── Description ──────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                            Descripción
                        </label>
                        <button
                            type="button"
                            disabled={loading || aiLoading !== null}
                            className="text-[10px] font-bold flex items-center gap-1 text-[var(--brand-blue,#53acc5)] hover:opacity-80 disabled:opacity-40"
                            onClick={() => runAiForField('description')}
                        >
                            {aiLoading === 'description' ? (
                                <div className="w-3 h-3 border-2 border-[var(--brand-blue,#53acc5)] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <IconSparkles size={12} />
                            )}
                            Generar con IA
                        </button>
                    </div>
                    <textarea
                        value={formData.description}
                        onChange={e => update('description', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none resize-none h-24 transition-colors"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        placeholder="Describe el producto: características, usos, especificaciones..."
                        disabled={loading}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                            Características
                        </label>
                        <button
                            type="button"
                            onClick={() => update('attributes', [...formData.attributes, { key: '', value: '' }])}
                            className="text-[10px] font-bold text-[var(--brand-blue,#53acc5)]"
                        >
                            + Agregar
                        </button>
                    </div>
                    <div className="space-y-2">
                        {formData.attributes.map((row: AttributeRow, idx: number) => (
                            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                <input
                                    type="text"
                                    value={row.key}
                                    onChange={(e) => {
                                        const next = [...formData.attributes];
                                        next[idx] = { ...row, key: e.target.value };
                                        update('attributes', next);
                                    }}
                                    placeholder="Ej. Peso"
                                    className="px-3 py-2 rounded-xl border-2 text-sm"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                                />
                                <input
                                    type="text"
                                    value={row.value}
                                    onChange={(e) => {
                                        const next = [...formData.attributes];
                                        next[idx] = { ...row, value: e.target.value };
                                        update('attributes', next);
                                    }}
                                    placeholder="Ej. 50g"
                                    className="px-3 py-2 rounded-xl border-2 text-sm"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => update('attributes', formData.attributes.filter((_: AttributeRow, i: number) => i !== idx))}
                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                    aria-label="Quitar característica"
                                >
                                    <IconTrash size={14} />
                                </button>
                            </div>
                        ))}
                        {formData.attributes.length === 0 && (
                            <p className="text-xs text-slate-400">Ej: Cacao 70%, Origen Cusco, Sin gluten</p>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Footer actions ───────────────────────────────────────────── */}
            <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>

                {/* Zona de eliminar — solo al editar un producto existente */}
                {product?.id && (
                    <div className={`px-4 py-2.5 transition-all duration-200 ${
                        deleteStep === 'confirm'
                            ? 'bg-red-50 border-b border-red-100'
                            : 'border-b border-slate-50'
                    }`}>
                        {deleteStep === 'idle' ? (
                            <button
                                onClick={() => setDeleteStep('confirm')}
                                disabled={loading || deleting}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                            >
                                <IconTrash size={13} />
                                Eliminar este producto
                            </button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                    <IconX size={12} /> ¿Eliminar permanentemente?
                                </span>
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        onClick={() => setDeleteStep('idle')}
                                        disabled={deleting}
                                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setDeleting(true);
                                            try {
                                                const ok = await deleteCatalogProduct(product.id);
                                                if (ok) {
                                                    success('Producto eliminado');
                                                    onDelete?.(product.id);
                                                    onCancel();
                                                } else {
                                                    error('Error al eliminar');
                                                    setDeleteStep('idle');
                                                }
                                            } finally {
                                                setDeleting(false);
                                            }
                                        }}
                                        disabled={deleting}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-70 flex items-center gap-1"
                                    >
                                        {deleting
                                            ? <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                                            : <><IconTrash size={10} /> Sí, eliminar</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-colors"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !formData.title.trim()}
                        className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-blue)' }}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <IconCheck size={16} />
                                {product?.id ? 'Guardar cambios' : 'Crear producto'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
