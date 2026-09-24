/**
 * Inline Catalog Add Component
 * Se expande/colapsa directamente en la interfaz (no modal)
 * Tres modos: Rápido, Completo, IA
 */

'use client';

import { useState, useRef } from 'react';
import { IconCamera, IconSparkles, IconEdit, IconCheck, IconImage, IconX } from '@/components/Icons';
import { supabase } from '@/lib/supabase';
import { findPotentialDuplicate, validatePrice } from '@/lib/business-validation';
import { withNewCatalogProductId } from '@/lib/catalog/product-id';
import { Adiso } from '@/types';
import { catalogUi } from '@/lib/bs-tokens';

type AddMode = 'select' | 'quick' | 'complete' | 'ai';

interface InlineCatalogAddProps {
    businessProfileId: string;
    onSuccess?: () => void;
    onCancel: () => void;
    adisos?: Adiso[]; // Added for duplicate check
}

export default function InlineCatalogAdd({ businessProfileId, onSuccess, onCancel, adisos = [] }: InlineCatalogAddProps) {
    const [mode, setMode] = useState<AddMode>('select');
    const [loading, setLoading] = useState(false);

    // Quick mode state
    const [quickImage, setQuickImage] = useState<File | null>(null);
    const [quickImagePreview, setQuickImagePreview] = useState<string | null>(null);
    const [quickName, setQuickName] = useState('');

    // Complete mode state
    const [completeForm, setCompleteForm] = useState({
        title: '',
        description: '',
        price: '',
        sku: '',
        category: '',
        brand: '',
        stock: '',
        image: null as File | null,
        imagePreview: null as string | null
    });

    // AI mode state
    const [aiFile, setAiFile] = useState<File | null>(null);
    const [aiProcessing, setAiProcessing] = useState(false);

    const quickFileInputRef = useRef<HTMLInputElement>(null);
    const completeFileInputRef = useRef<HTMLInputElement>(null);
    const aiFileInputRef = useRef<HTMLInputElement>(null);

    // Track dirty state
    const isDirty = quickName.trim() !== '' || completeForm.title.trim() !== '' || quickImage !== null || completeForm.image !== null;

    const handleCancel = () => {
        if (isDirty) {
            if (confirm('Tienes cambios sin guardar en el formulario. ¿Estás seguro de que quieres cerrar?')) {
                onCancel();
            }
        } else {
            onCancel();
        }
    };

    const handleQuickImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQuickImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setQuickImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCompleteImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCompleteForm(prev => ({ ...prev, image: file }));
        const reader = new FileReader();
        reader.onloadend = () => setCompleteForm(prev => ({ ...prev, imagePreview: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const handleQuickSubmit = async () => {
        if (!quickName.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        // Accidente: Duplicados
        const potentialDuplicate = findPotentialDuplicate(quickName, adisos);
        if (potentialDuplicate) {
            if (!confirm(`⚠️ Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Estás seguro de que quieres agregar otro igual?`)) {
                return;
            }
        }

        // Accidente: Sin imagen
        if (!quickImage) {
            if (!confirm('📸 No has subido una foto. ¿Quieres publicar el producto sin imagen o prefieres subir una ahora?')) {
                quickFileInputRef.current?.click();
                return;
            }
        }

        try {
            setLoading(true);

            let imageUrl = '';
            if (quickImage) {
                if (!supabase) throw new Error('Supabase no está configurado');
                const fileName = `${Date.now()}-${quickImage.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('catalog-images')
                    .upload(fileName, quickImage);

                if (uploadError) console.error('Upload error:', uploadError);

                if (!supabase) throw new Error('Supabase no está configurado');
                const { data: urlData } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert(
                    withNewCatalogProductId({
                        business_profile_id: businessProfileId,
                        title: quickName,
                        status: 'published',
                        images: imageUrl ? [{ url: imageUrl, alt: quickName }] : [],
                        import_source: 'manual_quick',
                    })
                );

            if (insertError) throw insertError;

            onSuccess?.();
            resetForm();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSubmit = async () => {
        if (!completeForm.title.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        // Accidente: Duplicados
        const potentialDuplicate = findPotentialDuplicate(completeForm.title, adisos);
        if (potentialDuplicate) {
            if (!confirm(`⚠️ Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Estás seguro de que quieres agregar otro igual?`)) {
                return;
            }
        }

        // Accidente: Precio extraño
        if (completeForm.price) {
            const priceValidation = validatePrice(completeForm.price);
            if (!priceValidation.isValid) {
                alert(priceValidation.warning);
                return;
            }
            if (priceValidation.warning) {
                if (!confirm(`💰 ${priceValidation.warning}`)) {
                    return;
                }
            }
        }

        // Accidente: Sin imagen
        if (!completeForm.image) {
            if (!confirm('📸 No has subido una foto. ¿Quieres publicar el producto sin imagen o prefieres subir una ahora?')) {
                completeFileInputRef.current?.click();
                return;
            }
        }

        try {
            setLoading(true);

            let imageUrl = '';
            if (completeForm.image) {
                if (!supabase) throw new Error('Supabase no está configurado');
                const fileName = `${Date.now()}-${completeForm.image.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('catalog-images')
                    .upload(fileName, completeForm.image);

                if (uploadError) console.error('Upload error:', uploadError);

                if (!supabase) throw new Error('Supabase no está configurado');
                const { data: urlData } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert(
                    withNewCatalogProductId({
                        business_profile_id: businessProfileId,
                        title: completeForm.title,
                        description: completeForm.description || null,
                        price: completeForm.price ? parseFloat(completeForm.price) : null,
                        sku: completeForm.sku || null,
                        category: completeForm.category || null,
                        brand: completeForm.brand || null,
                        stock: completeForm.stock ? parseInt(completeForm.stock) : null,
                        status: 'published',
                        images: imageUrl ? [{ url: imageUrl, alt: completeForm.title }] : [],
                        import_source: 'manual_complete',
                    })
                );

            if (insertError) throw insertError;

            onSuccess?.();
            resetForm();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAISubmit = async () => {
        if (!aiFile) {
            alert('Selecciona un archivo');
            return;
        }

        try {
            setAiProcessing(true);

            const formData = new FormData();
            formData.append('file', aiFile);
            formData.append('business_id', businessProfileId);

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                alert('Sesión expirada');
                return;
            }

            const response = await fetch('/api/catalog/import/excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.session.access_token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error al procesar archivo');

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                resetForm();
            } else {
                alert(result.error || 'Error al procesar');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setAiProcessing(false);
        }
    };

    const handleAIFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setAiFile(file);
    };

    const resetForm = () => {
        setMode('select');
        setQuickImage(null);
        setQuickImagePreview(null);
        setQuickName('');
        setCompleteForm({
            title: '',
            description: '',
            price: '',
            sku: '',
            category: '',
            brand: '',
            stock: '',
            image: null,
            imagePreview: null
        });
        setAiFile(null);
        setAiProcessing(false);
        onCancel();
    };

    return (
        <div className="bg-white rounded-2xl border-2 overflow-hidden animate-in slide-in-from-top duration-300" style={{ borderColor: 'var(--border-color)' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {mode === 'select' && 'Agregar al Catálogo'}
                    {mode === 'quick' && '📸 Agregar Rápido'}
                    {mode === 'complete' && '✏️ Agregar Completo'}
                    {mode === 'ai' && '🤖 IA Automática'}
                </h3>
                <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <IconX size={20} color="var(--text-secondary)" />
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Mode Selection */}
                {mode === 'select' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => setMode('quick')}
                            className="p-6 bg-gradient-to-br from-[var(--brand-blue)] to-blue-400 text-white rounded-xl hover:shadow-lg transition-all group text-left"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <IconCamera size={20} />
                                </div>
                                <div className="font-bold">Rápido</div>
                            </div>
                            <div className="text-sm opacity-90">Solo foto + nombre</div>
                        </button>

                        <button
                            onClick={() => setMode('complete')}
                            className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl hover:shadow-lg transition-all group text-left"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <IconEdit size={20} color="var(--brand-blue)" />
                                </div>
                                <div className="font-bold">Completo</div>
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Todos los campos</div>
                        </button>

                        <button
                            onClick={() => setMode('ai')}
                            className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all group text-left"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <IconSparkles size={20} />
                                </div>
                                <div className="font-bold">IA Automática</div>
                            </div>
                            <div className="text-sm opacity-90">Sube archivo y listo</div>
                        </button>
                    </div>
                )}

                {/* Quick Mode */}
                {mode === 'quick' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('select')}
                            className="text-sm font-medium"
                            style={{ color: 'var(--brand-blue)' }}
                        >
                            ← Cambiar modo
                        </button>

                        <div
                            onClick={() => quickFileInputRef.current?.click()}
                            className="relative aspect-video bg-slate-50 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-blue)] transition-all overflow-hidden"
                            style={{ borderColor: quickImagePreview ? 'var(--brand-blue)' : 'var(--border-color)' }}
                        >
                            {quickImagePreview ? (
                                <img src={quickImagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <IconCamera size={48} color="var(--text-tertiary)" />
                                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Tomar foto o subir imagen
                                    </p>
                                </div>
                            )}
                            <input
                                ref={quickFileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleQuickImageSelect}
                                className="hidden"
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Nombre del producto *"
                            value={quickName}
                            onChange={(e) => setQuickName(e.target.value)}
                            className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}
                        />

                        <button
                            onClick={handleQuickSubmit}
                            disabled={loading || !quickName.trim()}
                            className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--brand-blue)' }}
                        >
                            <IconCheck size={20} />
                            {loading ? 'Guardando...' : 'Publicar Ahora'}
                        </button>
                    </div>
                )}

                {/* Complete Mode */}
                {mode === 'complete' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('select')}
                            className="text-sm font-medium"
                            style={{ color: 'var(--brand-blue)' }}
                        >
                            ← Cambiar modo
                        </button>

                        <div
                            onClick={() => completeFileInputRef.current?.click()}
                            className="relative aspect-video bg-slate-50 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-blue)] transition-all overflow-hidden"
                            style={{ borderColor: completeForm.imagePreview ? 'var(--brand-blue)' : 'var(--border-color)' }}
                        >
                            {completeForm.imagePreview ? (
                                <img src={completeForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <IconImage size={48} color="var(--text-tertiary)" />
                                    <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Subir imagen</p>
                                </div>
                            )}
                            <input
                                ref={completeFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCompleteImageSelect}
                                className="hidden"
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="Nombre del producto *"
                            value={completeForm.title}
                            onChange={(e) => setCompleteForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}
                        />

                        <textarea
                            placeholder="Descripción"
                            value={completeForm.description}
                            onChange={(e) => setCompleteForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors resize-none"
                            style={{ borderColor: 'var(--border-color)' }}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Precio"
                                value={completeForm.price}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, price: e.target.value }))}
                                className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />
                            <input
                                type="text"
                                placeholder="SKU/Código"
                                value={completeForm.sku}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, sku: e.target.value }))}
                                className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Categoría"
                                value={completeForm.category}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, category: e.target.value }))}
                                className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />
                            <input
                                type="text"
                                placeholder="Marca"
                                value={completeForm.brand}
                                onChange={(e) => setCompleteForm(prev => ({ ...prev, brand: e.target.value }))}
                                className="px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <input
                            type="number"
                            placeholder="Stock"
                            value={completeForm.stock}
                            onChange={(e) => setCompleteForm(prev => ({ ...prev, stock: e.target.value }))}
                            className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}
                        />

                        <button
                            onClick={handleCompleteSubmit}
                            disabled={loading || !completeForm.title.trim()}
                            className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--brand-blue)' }}
                        >
                            <IconCheck size={20} />
                            {loading ? 'Guardando...' : 'Publicar Producto'}
                        </button>
                    </div>
                )}

                {/* AI Mode */}
                {mode === 'ai' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('select')}
                            className="text-sm font-medium"
                            style={{ color: 'var(--brand-blue)' }}
                        >
                            ← Cambiar modo
                        </button>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                            <div className="flex items-center gap-3 mb-4">
                                <IconSparkles size={24} color={catalogUi.eventosFg} />
                                <div>
                                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>Procesamiento Inteligente</div>
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        La IA analizará y estructurará tus productos automáticamente
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => aiFileInputRef.current?.click()}
                                className="bg-white border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-all"
                            >
                                {aiFile ? (
                                    <div>
                                        <IconCheck size={48} color={catalogUi.eventosFg} className="mx-auto mb-3" />
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{aiFile.name}</p>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            {(aiFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <IconImage size={48} color="var(--text-tertiary)" className="mx-auto mb-3" />
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            Subir Excel, CSV o Imagen
                                        </p>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                            Soporta .xlsx, .xls, .csv, .jpg, .png
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={aiFileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,image/*"
                                    onChange={handleAIFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAISubmit}
                            disabled={aiProcessing || !aiFile}
                            className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                            <IconSparkles size={20} />
                            {aiProcessing ? 'Procesando con IA...' : 'Procesar Automáticamente'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
