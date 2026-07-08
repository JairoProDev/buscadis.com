
'use client';

import { useState, useEffect } from 'react';
import { IconBox, IconImage, IconTrash, IconCheck, IconX, IconEye, IconSparkles, IconZap } from '@/components/Icons';
import { uploadProductImage, updateCatalogProduct, createCatalogProduct, deleteCatalogProduct } from '@/lib/business';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

import { findPotentialDuplicate, validatePrice } from '@/lib/business-validation';
import { Adiso } from '@/types';
import ImageWithBgRemoval from './ImageWithBgRemoval';
import MagicEditorPanel from './MagicEditorPanel';
import ProductImageGallery from '@/components/catalog/ProductImageGallery';

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

export function ProductEditor({ product, businessProfileId, userId, onSave, onCancel, onDelete, adisos = [] }: ProductEditorProps) {
    const [loading, setLoading] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle'); // 2-step delete
    const [deleting, setDeleting] = useState(false);
    const { success, error } = useToast();

    const initialFormData = {
        title: product?.title || '',
        description: product?.description || '',
        price: product?.price !== undefined && product.price !== null ? String(product.price) : '',
        compare_at_price: product?.compare_at_price !== undefined && product.compare_at_price !== null ? String(product.compare_at_price) : '',
        category: product?.category || '',
        brand: product?.brand || '',
        sku: product?.sku || '',
        stock: product?.stock !== undefined && product.stock !== null ? String(product.stock) : '',
        unit: product?.unit || 'unidad',
        tags: Array.isArray(product?.tags) ? product.tags.join(', ') : '',
        status: (product?.status || 'draft') as 'published' | 'draft',
        images: product?.images || [],
        attributes: normalizeAttributes(product?.attributes),
    };

    const [formData, setFormData] = useState(initialFormData);
    const [enhancingIdx, setEnhancingIdx] = useState<number | null>(null);
    // Track original File objects per image index (for bg removal)
    const [uploadedFiles, setUploadedFiles] = useState<(File | null)[]>([]);
    // Track which images have bg removed
    const [bgRemovedIdx, setBgRemovedIdx] = useState<Set<number>>(new Set());

    // Track if form is dirty
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);

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
        if (product) {
            setFormData({
                title: product.title || '',
                description: product.description || '',
                price: product.price !== undefined && product.price !== null ? String(product.price) : '',
                compare_at_price: product.compare_at_price !== undefined && product.compare_at_price !== null ? String(product.compare_at_price) : '',
                category: product.category || '',
                brand: product.brand || '',
                sku: product.sku || '',
                stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : '',
                unit: product.unit || 'unidad',
                tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
                status: product.status || 'draft',
                images: product.images || [],
                attributes: normalizeAttributes(product.attributes),
            });
        }
    }, [product]);

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
                success('¡Fondo eliminado! 🎉');
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

    const handleSave = async () => {
        if (!formData.title.trim()) {
            error('El nombre del producto es obligatorio');
            return;
        }

        // 1. Accidente: Duplicados (Solo si es nuevo)
        if (!product?.id) {
            const potentialDuplicate = findPotentialDuplicate(formData.title, adisos);
            if (potentialDuplicate) {
                if (!confirm(`⚠️ Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Estás seguro de que quieres agregar otro igual?`)) {
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
                if (!confirm(`💰 ${priceValidation.warning}`)) {
                    return;
                }
            }
        }

        // 3. Accidente: Sin imagen
        if (formData.images.length === 0) {
            if (!confirm('📸 No has subido ninguna foto. ¿Quieres publicar el producto sin imagen?')) {
                return;
            }
        }

        setLoading(true);
        try {
            const tagsArr = formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            const productData: any = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: formData.price !== '' ? parseFloat(formData.price) || 0 : null,
                compare_at_price: formData.compare_at_price !== '' ? parseFloat(formData.compare_at_price) || null : null,
                category: formData.category.trim(),
                brand: formData.brand.trim(),
                sku: formData.sku.trim(),
                stock: formData.stock !== '' ? parseInt(formData.stock) || null : null,
                unit: formData.unit || 'unidad',
                tags: tagsArr,
                status: formData.status,
                images: formData.images,
                attributes: attributesToPayload(formData.attributes),
                business_profile_id: businessProfileId,
            };

            // Remove nulls for cleanliness (optional)
            if (!productData.compare_at_price) delete productData.compare_at_price;
            if (!productData.brand) delete productData.brand;
            if (!productData.sku) delete productData.sku;
            if (productData.stock === null) delete productData.stock;

            let saved;
            if (product?.id) {
                saved = await updateCatalogProduct(product.id, productData);
                if (!saved) throw new Error('No se pudo actualizar el producto');
                success('Producto actualizado');
            } else {
                saved = await createCatalogProduct(productData);
                if (!saved) throw new Error('No se pudo crear el producto');
                success('Producto creado');
            }

            onSave(saved);
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
                </div>

                {/* ── Magic AI Editor ───────────────────────────────────── */}
                <MagicEditorPanel
                    currentImages={formData.images}
                    currentTitle={formData.title}
                    currentDescription={formData.description}
                    onFillAll={(data) => {
                        if (data.title) update('title', data.title);
                        if (data.description) update('description', data.description);
                        if (data.price !== undefined && data.price !== null) update('price', String(data.price));
                        if (data.category) update('category', data.category);
                        if (data.brand) update('brand', data.brand);
                        if (data.tags && data.tags.length > 0) update('tags', data.tags.join(', '));
                    }}
                    onFillField={(field, value) => update(field, value)}
                />

                {/* ── Name ────────────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                            Nombre del producto *
                        </label>
                        <button
                            type="button"
                            className="text-[10px] font-bold text-purple-600 flex items-center gap-1"
                            onClick={() => {
                                if (formData.title.trim()) return;
                                const firstImg = getImageUrl(formData.images[0]);
                                if (firstImg) {
                                    fetch('/api/analyze-product', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ imageUrl: firstImg }),
                                    })
                                        .then((r) => r.json())
                                        .then((data) => {
                                            if (data.title) update('title', data.title);
                                        })
                                        .catch(() => {});
                                }
                            }}
                        >
                            <IconSparkles size={12} /> IA
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
                            value={formData.category}
                            onChange={e => update('category', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            placeholder="Ej. Pinturas"
                            disabled={loading}
                        />
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
                                style={{ borderColor: formData.price ? 'var(--border-color)' : '#fbbf24', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                            className="text-[10px] font-bold text-purple-600 flex items-center gap-1"
                            onClick={() => {
                                const firstImg = getImageUrl(formData.images[0]);
                                if (!firstImg) return;
                                fetch('/api/analyze-product', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ imageUrl: firstImg }),
                                })
                                    .then((r) => r.json())
                                    .then((data) => {
                                        if (data.description) update('description', data.description);
                                        if (!formData.title && data.title) update('title', data.title);
                                    })
                                    .catch(() => {});
                            }}
                        >
                            <IconSparkles size={12} /> Generar con IA
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
