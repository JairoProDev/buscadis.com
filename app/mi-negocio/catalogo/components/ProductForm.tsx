/**
 * Formulario de Producto Completo
 * Soporta creación y edición, gestión de imágenes, variantes y atributos
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { withNewCatalogProductId } from '@/lib/catalog/product-id';
import {
    IconArrowLeft, IconCheck, IconX, IconUpload, IconTrash,
    IconPlus, IconImage, IconSparkles, IconBox, IconGrid
} from '@/components/Icons';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

interface ProductFormProps {
    initialData?: any;
    mode: 'create' | 'edit';
}

export default function ProductForm({ initialData, mode }: ProductFormProps) {
    const router = useRouter();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        sku: initialData?.sku || '',
        barcode: initialData?.barcode || '',
        price: initialData?.price || '',
        compare_at_price: initialData?.compare_at_price || '',
        cost: initialData?.cost || '',
        stock_quantity: initialData?.stock_quantity || 0,
        track_stock: initialData?.track_stock ?? true,
        category: initialData?.category || '',
        brand: initialData?.brand || '',
        status: initialData?.status || 'published',
        images: initialData?.images || []
    });

    const [images, setImages] = useState<any[]>(initialData?.images || []);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Categories (Mock for now, could fetch from DB)
    const [categories, setCategories] = useState<string[]>([
        'Herramientas', 'Electricidad', 'Gasfitería', 'Pinturas',
        'Materiales de Construcción', 'Hogar', 'Jardín'
    ]);

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        try {
            const newImages = [...images];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

                if (!supabase) throw new Error('Supabase no está configurado');
                const { error: uploadError } = await supabase.storage
                    .from('catalog-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                if (!supabase) throw new Error('Supabase no está configurado');
                const { data } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                newImages.push({
                    url: data.publicUrl,
                    alt: file.name
                });
            }

            setImages(newImages);
            setFormData(prev => ({ ...prev, images: newImages }));

        } catch (err: any) {
            showError('Error al subir imagen: ' + err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return showError('El nombre del producto es obligatorio');

        setLoading(true);
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                compare_at_price: parseFloat(formData.compare_at_price) || null,
                cost: parseFloat(formData.cost) || null,
                stock_quantity: parseInt(String(formData.stock_quantity)) || 0,
                updated_at: new Date().toISOString()
            };

            if (!supabase) throw new Error('Supabase no está configurado');
            if (mode === 'create') {
                const { error } = await supabase
                    .from('catalog_products')
                    .insert(withNewCatalogProductId(productData));
                if (error) throw error;
                success('Producto creado correctamente');
            } else {
                const { error } = await supabase
                    .from('catalog_products')
                    .update(productData)
                    .eq('id', initialData.id);
                if (error) throw error;
                success('Producto actualizado correctamente');
            }

            router.push('/mi-negocio/catalogo/tabla');
            router.refresh();

        } catch (err: any) {
            showError('Error al guardar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-20">
            {/* Header Actions - Sticky */}
            <div className="sticky top-0 z-20 bg-[var(--bg-secondary)]/80 backdrop-blur-md py-4 flex items-center justify-between mb-6 border-b border-slate-200">
                <Link
                    href="/mi-negocio/catalogo/tabla"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-blue)] hover:opacity-80 transition-all"
                >
                    <IconArrowLeft size={14} />
                    Cancelar
                </Link>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-[var(--brand-blue)] text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <IconCheck size={20} />
                    )}
                    <span className="text-sm md:text-base">{mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}</span>
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Información Básica</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Nombre del Producto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent outline-none transition-all outline-none"
                                    placeholder="Ej. Taladro Percutor Inalámbrico"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Describe las características principales..."
                                />
                                <div className="text-right mt-1">
                                    <button
                                        type="button"
                                        className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 ml-auto"
                                    >
                                        <IconSparkles size={12} />
                                        Mejorar con IA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Imágenes</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <IconTrash size={14} />
                                    </button>
                                    {idx === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center font-bold">
                                            Principal
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500"
                            >
                                {uploadingImage ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                                ) : (
                                    <>
                                        <IconImage size={24} className="mb-2" />
                                        <span className="text-xs font-bold">Subir Imagen</span>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    {/* Inventory */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <IconBox size={18} />
                            Inventario
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">SKU (Código)</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Código de Barras</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {formData.track_stock && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Stock Disponible</label>
                                    <input
                                        type="number"
                                        value={formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="track_stock"
                                checked={formData.track_stock}
                                onChange={e => setFormData({ ...formData, track_stock: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <label htmlFor="track_stock" className="text-sm text-slate-700 font-medium cursor-pointer">
                                Rastrear cantidad de inventario
                            </label>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* Status */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Estado</h3>
                        <div className="space-y-2">
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                            >
                                <option value="published">🟢 Publicado</option>
                                <option value="draft">🟡 Borrador</option>
                                <option value="archived">⚫ Archivado</option>
                            </select>
                            <p className="text-xs text-slate-500">
                                Los productos publicados son visibles en tu catálogo.
                            </p>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Precios</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Precio (S/)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Precio Comparación
                                    <span className="text-xs font-normal text-slate-400 ml-1">(Opcional)</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.compare_at_price}
                                    onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                                {formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price) && parseFloat(formData.compare_at_price) > 0 && (
                                    <p className="text-xs text-green-600 font-bold mt-1">
                                        -{Math.round(((parseFloat(formData.compare_at_price) - parseFloat(formData.price)) / parseFloat(formData.compare_at_price)) * 100)}% de descuento
                                    </p>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Costo por artículo
                                    <span className="text-xs font-normal text-slate-400 ml-1">(Privado)</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.cost}
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                                {formData.price && formData.cost && parseFloat(formData.price) > 0 && (
                                    <div className="flex justify-between text-xs mt-2 text-slate-500">
                                        <span>Margen: {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(0)}%</span>
                                        <span>Ganancia: S/ {(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Organización</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                                <input
                                    type="text"
                                    list="categories"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Buscar o crear..."
                                />
                                <datalist id="categories">
                                    {categories.map((cat, i) => (
                                        <option key={i} value={cat} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Marca</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. Bosch, Stanley"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </form>
    );
}
